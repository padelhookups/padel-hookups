// FirestoreAdapter.js
import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  deleteDoc as deleteDocument,
  writeBatch,
} from "firebase/firestore";

export class FirestoreAdapter {
  constructor(firestore, baseDocPath, tournamentId) {
    this.db = firestore;
    this.baseDocPath = baseDocPath; // DOCUMENT path: Events/{eventId}/TournamentData/{tournamentId}
    this.tournamentId = tournamentId;
  }

  // Map singular -> plural collection names
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

  // Return collection ref for e.g. Events/{eventId}/TournamentData/{tournamentId}/matches
  getCollection(table) {
    const colName = this.getCollectionName(table);
    return collection(this.db, `${this.baseDocPath}/${colName}`);
  }

  /* ---------------------------
     INSERT
     - Handles single object or array (bulk).
     - For arrays we use a writeBatch to avoid partial writes & race conditions.
  --------------------------- */
  async insert(table, data) {
    const colRef = this.getCollection(table);

    // Bulk array insert: use a batch to make writes atomic-ish and to avoid races.
    if (Array.isArray(data)) {
      if (data.length === 0) return [];

      const batch = writeBatch(this.db);
      const results = [];

      for (const item of data) {
        if (typeof item !== "object" || item === null) {
          throw new Error("FirestoreAdapter: each item in array must be an object");
        }

        const sanitizedItem = this.sanitize(item);
        // If caller provided ID, use it; otherwise generate a new doc ref to get deterministic id
        const providedId =
          item.id !== undefined && item.id !== null && String(item.id).length > 0
            ? String(item.id)
            : null;

        const docRef = providedId ? doc(colRef, providedId) : doc(colRef);
        batch.set(docRef, sanitizedItem);
        // Keep original shape for return but attach the final id
        results.push({ id: docRef.id, ...item });
      }

      await batch.commit();
      return results;
    }

    // Single insert
    if (typeof data !== "object" || data === null) {
      throw new Error("FirestoreAdapter: data must be an object");
    }

    const sanitized = this.sanitize(data);

    if (data.id) {
      const docRef = doc(this.getCollection(table), String(data.id));
      await setDoc(docRef, sanitized);
      return { id: docRef.id, ...data };
    } else {
      const docRef = await addDoc(this.getCollection(table), sanitized);
      return { id: docRef.id, ...data };
    }
  }

  /* ---------------------------
     SANITIZE
     - Convert undefined -> null for primitives.
     - Flatten stage_id/group_id/round_id ONLY if they are objects with { id }.
     - Preserve nested opponent objects shape (BM depends on it).
  --------------------------- */
  sanitize(data) {
    // Replace undefined with null (deep)
    const replacer = (key, value) => (value === undefined ? null : value);
    const copy = JSON.parse(JSON.stringify(data, replacer));

    // Flatten certain id objects to raw id strings (if they are objects with { id })
    const flattenKeys = ["stage_id", "group_id", "round_id"];
    for (const k of flattenKeys) {
      if (
        Object.prototype.hasOwnProperty.call(copy, k) &&
        copy[k] &&
        typeof copy[k] === "object" &&
        !Array.isArray(copy[k]) &&
        Object.prototype.hasOwnProperty.call(copy[k], "id")
      ) {
        copy[k] = copy[k].id;
      }
    }

    return copy;
  }

  /* ---------------------------
     SELECT
     - Accepts: id string, array with first.id, filters object
     - Normalizes nested filter objects like { stage_id: { id: '...' } }
  --------------------------- */
  async select(table, filters = {}) {
    const colRef = this.getCollection(table);
    const collectionName = this.getCollectionName(table);

    // If filters is a string -> fetch by doc id
    if (typeof filters === "string") {
      const docRef = doc(this.db, `${this.baseDocPath}/${collectionName}/${filters}`);
      const snapshot = await getDoc(docRef);
      return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
    }

    // If filters is an array with first element having id -> fetch that doc
    if (Array.isArray(filters) && filters[0]?.id) {
      const docRef = doc(this.db, `${this.baseDocPath}/${collectionName}/${filters[0].id}`);
      const snapshot = await getDoc(docRef);
      return snapshot.exists() ? [{ id: snapshot.id, ...snapshot.data() }] : [];
    }

    // Normalize nested stage_id/group_id/round_id objects
    const idKeys = ["stage_id", "group_id", "round_id", "tournament_id"];
    for (const k of idKeys) {
      if (filters[k] && typeof filters[k] === "object" && filters[k].id) {
        filters[k] = filters[k].id;
      }
    }

    // Shortcut: if caller explicitly requests a stage by id and table === "stage"
    if (filters.stage_id && table === "stage") {
      const docRef = doc(this.db, `${this.baseDocPath}/${this.getCollectionName(table)}/${filters.stage_id}`);
      const snapshot = await getDoc(docRef);
      return snapshot.exists() ? [{ id: snapshot.id, ...snapshot.data() }] : [];
    }

    // tournament_id filter
    if (filters.tournament_id) {
      const q = query(colRef, where("tournament_id", "==", filters.tournament_id));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    }

    // stage_id filter for generic tables (matches, rounds, groups)
    if (filters.stage_id) {
      const q = query(colRef, where("stage_id", "==", filters.stage_id));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    }

    // Clean filters: keep only primitive equality filters (no objects)
    const cleaned = Object.fromEntries(
      Object.entries(filters || {}).filter(([_, v]) => v !== undefined && v !== null && typeof v !== "object")
    );

    if (Object.keys(cleaned).length === 0) {
      // Return all documents in the collection
      const snapshot = await getDocs(colRef);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    }

    // Build query from cleaned filters
    const conditions = Object.entries(cleaned).map(([k, v]) => where(k, "==", v));
    const q = query(colRef, ...conditions);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  // Convenience: get by id
  async getById(table, id) {
    if (!id) return null;
    const collectionName = this.getCollectionName(table);
    const docRef = doc(this.db, `${this.baseDocPath}/${collectionName}/${id}`);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
  }

  /* ---------------------------
     UPDATE
     - Accepts: string id, { id } object, array-of-filters (first.id), or generic filter object.
     - Uses setDoc(..., { merge: true }) to safely merge fields.
  --------------------------- */
  async update(table, data, filters) {
    const collectionName = this.getCollectionName(table);

    // If caller passed array with object (common pattern in some libs)
    if (Array.isArray(filters) && filters[0] && filters[0].id) {
      // If data is missing or not an object, attempt to construct data from filters[0] (legacy support)
      if (!data || typeof data !== "object") {
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
          "child_count",
        ];
        const constructed = {};
        for (const key of allowedKeys) {
          if (filters[0][key] !== undefined) constructed[key] = filters[0][key];
        }
        // Ensure opponent score/result consistency if present
        if (filters[0].opponent1) {
          constructed.opponent1 = {
            ...filters[0].opponent1,
            id: filters[0].opponent1.id,
            score: filters[0].opponent1.score ?? (filters.scoreTeam1 ?? null),
          };
        }
        if (filters[0].opponent2) {
          constructed.opponent2 = {
            ...filters[0].opponent2,
            id: filters[0].opponent2.id,
            score: filters[0].opponent2.score ?? (filters.scoreTeam2 ?? null),
          };
        }
        data = constructed;
      }

      // Reduce to single id filter
      filters = { id: filters[0].id };
    }

    // If filters is a simple string (id)
    if (typeof filters === "string") {
      const docRef = doc(this.db, `${this.baseDocPath}/${collectionName}/${filters}`);
      await setDoc(docRef, this.sanitize(data), { merge: true });
      const updatedSnapshot = await getDoc(docRef);
      return { id: updatedSnapshot.id, ...updatedSnapshot.data() };
    }

    // If filters is object with .id
    if (filters && typeof filters === "object" && filters.id) {
      const docRef = doc(this.db, `${this.baseDocPath}/${collectionName}/${filters.id}`);

      // If data is simple primitive or not an object, merge filters into db
      if (typeof data === "object") {
        await setDoc(docRef, this.sanitize(data), { merge: true });
      } else {
        // fallback: merge filters shape
        await setDoc(docRef, this.sanitize(filters), { merge: true });
      }

      const updatedSnapshot = await getDoc(docRef);
      return { id: updatedSnapshot.id, ...updatedSnapshot.data() };
    }

    // Generic multi-doc update: find docs via select and update each (use Promise.all)
    if (data) {
      const docs = await this.select(table, filters);
      if (!docs || docs.length === 0) return [];

      const updatedDocs = await Promise.all(
        docs.map(async (d) => {
          const docRef = doc(this.db, `${this.baseDocPath}/${collectionName}/${d.id}`);
          await setDoc(docRef, this.sanitize(data), { merge: true });
          const refreshed = await getDoc(docRef);
          return { id: refreshed.id, ...refreshed.data() };
        })
      );

      return updatedDocs.length === 1 ? updatedDocs[0] : updatedDocs;
    }

    return null;
  }

  /* ---------------------------
     DELETE
     - Deletes docs returned by select(filters).
     - Returns number of deleted docs.
  --------------------------- */
  async delete(table, filters) {
    const docs = await this.select(table, filters);
    if (!docs || docs.length === 0) return 0;

    await Promise.all(
      docs.map((d) =>
        deleteDocument(doc(this.db, `${this.baseDocPath}/${this.getCollectionName(table)}/${d.id}`))
      )
    );
    return docs.length;
  }
}
