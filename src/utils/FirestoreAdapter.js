// FirestoreAdapter.js
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  doc,
  deleteDoc as deleteDocument,
} from "firebase/firestore";

export class FirestoreAdapter {
  constructor(firestore, baseDocPath) {
    this.db = firestore;
    this.baseDocPath = baseDocPath; // must be a DOCUMENT path, e.g. Events/{eventId}/TournamentData/{tournamentId}
  }

  // Map singular table names to plural Firestore collection names
  getCollectionName(table) {
    const mapping = {
      tournament: "tournaments",
      tournaments: "tournaments",
      stage: "stages",
      stages: "stages",
      group: "groups",
      groups: "groups",
      round: "rounds",
      rounds: "rounds",
      match: "matches",
      matches: "matches",
      participant: "participants",
      participants: "participants",
    };
    return mapping[table] || (table.endsWith("s") ? table : `${table}s`);
  }

  getCollection(table) {
    const colName = this.getCollectionName(table);
    // e.g. this.baseDocPath = Events/{eventId}/TournamentData/{tournamentId}
    // collection path -> Events/{eventId}/TournamentData/{tournamentId}/{colName}
    return collection(this.db, `${this.baseDocPath}/${colName}`);
  }

  async insert(table, data) {
    const colRef = this.getCollection(table);

    if (Array.isArray(data)) {
      // Handle array of objects (manager might pass seeding array)
      return Promise.all(
        data.map(item => {
          if (typeof item !== 'object' || item === null) {
            throw new Error('FirestoreAdapter: data item must be an object');
          }
          return addDoc(colRef, item).then(docRef => ({ id: docRef.id }));
        })
      );
    }

    if (typeof data !== 'object' || data === null) {
      throw new Error('FirestoreAdapter: data must be an object');
    }

    const docRef = await addDoc(colRef, data);
    return { id: docRef.id };
  }

  async select(table, filters = {}) {
    const colRef = this.getCollection(table);
    let q = query(colRef);

    Object.entries(filters || {}).forEach(([key, value]) => {
      q = query(q, where(key, "==", value));
    });

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async update(table, data, filters) {
    const docs = await this.select(table, filters);
    await Promise.all(
      docs.map((d) =>
        updateDoc(doc(this.db, `${this.baseDocPath}/${this.getCollectionName(table)}/${d.id}`), data)
      )
    );
  }

  async delete(table, filters) {
    const docs = await this.select(table, filters);
    await Promise.all(
      docs.map((d) =>
        deleteDocument(doc(this.db, `${this.baseDocPath}/${this.getCollectionName(table)}/${d.id}`))
      )
    );
  }
}
