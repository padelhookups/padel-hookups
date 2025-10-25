// FirestoreAdapter.js
import {
  collection,
  addDoc,
  getDoc,
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
    let conditions = [];

    if (typeof filters === "string") {
      conditions = [where("id", "==", filters)];
    } else if (filters && Object.keys(filters).length > 0) {
      conditions = Object.entries(filters).map(([key, value]) => where(key, "==", value));
      console.log(colRef.path);
      console.log(conditions);

      q = query(colRef, ...conditions); // <-- spread conditions into a single query
    }

    const snapshot = await getDocs(q);
    console.log(snapshot.docs.length);

    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  // Get a document directly by ID
  async getById(table, id) {
    const docRef = doc(this.db, `${this.baseDocPath}/${table}/${id}`);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() };
  }

  async update(table, data, filters) {
    if (typeof filters === "string") {
      // treat filters as a document ID
      const docRef = doc(this.db, `${this.baseDocPath}/${table}/${filters}`);
      await updateDoc(docRef, data);
    } else {
      const docs = await this.select(table, filters);
      await Promise.all(
        docs.map(d =>
          updateDoc(doc(this.db, `${this.baseDocPath}/${table}/${d.id}`), data)
        )
      );
    }
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
