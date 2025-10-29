// FirestoreAdapter.js
import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  deleteDoc as deleteDocument,
} from "firebase/firestore";

export class FirestoreAdapter {
  constructor(firestore, baseDocPath, tournamentId) {
    this.db = firestore;
    this.baseDocPath = baseDocPath; // must be a DOCUMENT path, e.g. Events/{eventId}/TournamentData/{tournamentId}
    this.tournamentId = tournamentId;
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

    if (this.tournamentId && Object.keys(filters).includes('tournament_id') && filters.tournament_id === undefined) {
      filters.tournament_id = this.tournamentId;
    }

    // ✅ If filters is a string, treat it as document ID
    if (typeof filters === "string") {
      const docRef = doc(this.db, `${this.baseDocPath}/${this.getCollectionName(table)}/${filters}`);
      const snapshot = await getDoc(docRef);
      return snapshot.exists() ? [{ id: snapshot.id, ...snapshot.data() }] : [];
    }

    // ✅ If filters contains an ID, just fetch that doc
    if (filters[0]?.id) {
      const docRef = doc(this.db, `${this.baseDocPath}/${this.getCollectionName(table)}/${filters[0]?.id}`);
      const snapshot = await getDoc(docRef);
      return snapshot.exists() ? [{ id: snapshot.id, ...snapshot.data() }] : [];
    }

    if (filters.stage_id) {
      let docRef;
      if (table === 'stage') {
        const docRef = doc(this.db, `${this.baseDocPath}/${this.getCollectionName(table)}/${filters.stage_id}`);
        const snapshot = await getDoc(docRef);
        return snapshot.exists() ? [{ id: snapshot.id, ...snapshot.data() }] : [];
      } else {
        const snapshot = await getDocs(colRef, where('stage_id', '==', filters.stage_id));
        return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      }

    }

    if (filters.tournament_id) {
      const snapshot = await getDocs(colRef, where('tournament_id', '==', filters.tournament_id));
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    }

    // Normal filters (flat key-value pairs only)
    let q = query(colRef);
    if (filters && Object.keys(filters).length > 0) {
      const safeFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => typeof value !== "object")
      );

      const conditions = Object.entries(safeFilters).map(([key, value]) => where(key, "==", value));
      if (conditions.length > 0) q = query(colRef, ...conditions);
    }

    const snapshot = await getDocs(q);
    if (snapshot.docs.length === 1) {
      return [{ id: snapshot.docs[0].id, ...snapshot.docs[0].data() }];
    } else if (snapshot.docs.length > 1) {
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    } else {
      return [];
    }
  }


  // Get a document directly by ID
  async getById(table, id) {
    const docRef = doc(this.db, `${this.baseDocPath}/${table}/${id}`);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() };
  }

  async update(table, data, filters) {
    if (!data && filters && typeof filters === "object" && filters[0].id) {
      // Extract only fields that should be saved
      const allowedKeys = [
        "opponent1",
        "opponent2",
        "scoreTeam1",
        "scoreTeam2",
        "status",
        "score",
        "number",
        "group_id",
        "round_id",
        "stage_id",
        "child_count"
      ];

      data = {};
      for (const key of allowedKeys) {
        if (filters[key] !== undefined) {
          data[key] = filters[key];
        }
      }

      data.opponent1 = { ...filters[0].opponent1, ...data.opponent1, id: filters[0].opponent1.id };
      data.opponent2 = { ...filters[0].opponent2, ...data.opponent2, id: filters[0].opponent2.id };
      filters = { id: filters[0].id }; // Now filters just identifies the doc
    }

    // If filters is a simple string treat as id
    if (typeof filters === 'string') {
      const docRef = doc(this.db, `${this.baseDocPath}/${this.getCollectionName(table)}/${filters}`);
      await updateDoc(docRef, data, { merge: true });
      return { ...data };
    }

    // If filters is an object and contains id, use direct doc update
    if (filters && typeof filters === 'object' && filters.id) {
      const docRef = doc(this.db, `${this.baseDocPath}/${this.getCollectionName(table)}/${filters.id}`);
      await updateDoc(docRef, data, { merge: true });
      return { ...data };
    }

    // otherwise select and update all matches
    const docs = await this.select(table, filters);
    const updatedDocs = await Promise.all(
      docs.map(async (d) => {
        const docRef = doc(this.db, `${this.baseDocPath}/${this.getCollectionName(table)}/${d.id}`);
        await updateDoc(docRef, data);
        // return the updated doc object
        return { id: d.id, ...d, ...data };
      })
    );
    return updatedDocs.length === 1 ? updatedDocs[0] : updatedDocs;
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
