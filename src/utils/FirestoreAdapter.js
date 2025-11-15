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
  setDoc,
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

  /* ---------------------------
     INSERT
     - when BM creates a stage it inserts MANY matches (array),
       we must return the full object for each match (with id and nested opponent positions),
       and store a sanitized copy in Firestore.
  --------------------------- */
  async insert(table, data) {
    console.warn("insert table", table);
    console.log("insert data", data);

    const colRef = this.getCollection(table);

    // Array insertion (bulk inserts from manager.create.stage)
    if (Array.isArray(data)) {
      return Promise.all(
        data.map(async (item) => {
          if (typeof item !== "object" || item === null) {
            throw new Error("FirestoreAdapter: data item must be an object");
          }

          // If the manager provided a numeric id, ensure it's string for doc path
          const providedId = item.id !== undefined && item.id !== null ? item.id.toString() : null;

          // Prepare the sanitized item for storage (but we will return the original item to BM)
          const sanitizedItem = this.sanitize(item);

          // Write to Firestore using setDoc when providedId exists, otherwise addDoc
          if (providedId) {
            const docRef = doc(colRef, providedId);
            await setDoc(docRef, sanitizedItem);
            // Return the original item shape (not the sanitized one) plus the id so BM can use positions
            return { id: docRef.id, ...item };
          } else {
            const addedRef = await addDoc(colRef, sanitizedItem);
            return { id: addedRef.id, ...item };
          }
        })
      );
    }

    // Single object insert
    if (typeof data !== "object" || data === null) {
      throw new Error("FirestoreAdapter: data must be an object");
    }

    // If manager passed nested id objects (like round_id: { id: '...' }), do NOT flatten them here;
    // instead store a sanitized copy and return the original shape back to the manager.
    const sanitized = this.sanitize(data);

    if (data.id) {
      const docRef = doc(colRef, data.id.toString());
      await setDoc(docRef, sanitized);
      return { id: docRef.id, ...data };
    } else {
      const docRef = await addDoc(colRef, sanitized);
      return { id: docRef.id, ...data };
    }
  }

  /* ---------------------------
     SANITIZE
     - Only convert undefined -> null (so Firestore stores explicit nulls)
     - Do NOT mutate nested opponent objects or nested id objects.
     - This keeps the exact shape BM expects when it reads from the adapter return value.
  --------------------------- */
  sanitize(data) {
    // We want to preserve nested objects (opponent1/opponent2 and stage_id/round_id/group_id)
    // but replace undefined with null for primitive values so Firestore stores them.
    // Important: do NOT flatten stage_id/round_id/group_id here.
    const removedUndefined = JSON.parse(
      JSON.stringify(data, (key, value) => (value === undefined ? null : value))
    );
    const flattened = this.flattenIds(removedUndefined);
    return flattened;
  }

  /* kept for reference but NOT used by sanitize above.
     If you later want to store IDs as raw strings, you can use this.
  */
  flattenIds(obj) {
    const allowedKeys = ["stage_id", "group_id", "round_id"];
    const result = { ...obj }; // shallow copy

    for (const key in result) {
      if (
        allowedKeys.includes(key) &&
        result[key] &&
        typeof result[key] === "object" &&
        !Array.isArray(result[key]) &&
        "id" in result[key]
      ) {
        result[key] = result[key].id;
      }
    }

    return result;
  }

  /* ---------------------------
     SELECT
     - Accepts string id, array with 0.id, filters objects
     - Clean filters: ignore undefined/null values
     - Convert nested filter objects like { stage_id: { id: '...' } } to raw id
  --------------------------- */
  async select(table, filters = {}) {
    const colRef = this.getCollection(table);

    // If caller expects tournamentId injected
    if (
      this.tournamentId &&
      Object.prototype.hasOwnProperty.call(filters, "tournament_id") &&
      filters.tournament_id === undefined
    ) {
      filters.tournament_id = this.tournamentId;
    }

    // String = doc id
    if (typeof filters === "string") {
      const docRef = doc(this.db, `${this.baseDocPath}/${this.getCollectionName(table)}/${filters}`);
      const snapshot = await getDoc(docRef);
      return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
    }

    // If filters is an array of objects and first has id -> fetch that doc
    if (Array.isArray(filters) && filters[0]?.id) {
      const docRef = doc(this.db, `${this.baseDocPath}/${this.getCollectionName(table)}/${filters[0].id}`);
      const snapshot = await getDoc(docRef);
      return snapshot.exists() ? [{ id: snapshot.id, ...snapshot.data() }] : [];
    }

    // If stage_id is an object like { id: '...' }, normalize it
    if (filters.stage_id && typeof filters.stage_id === "object" && filters.stage_id.id) {
      filters.stage_id = filters.stage_id.id;
    }

    // Stage by id
    if (filters.stage_id) {
      if (table === "stage") {
        const docRef = doc(this.db, `${this.baseDocPath}/${this.getCollectionName(table)}/${filters.stage_id}`);
        const snapshot = await getDoc(docRef);
        return snapshot.exists() ? [{ id: snapshot.id, ...snapshot.data() }] : [];
      } else {
        const q = query(colRef, where("stage_id", "==", filters.stage_id));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
    }

    // tournament_id explicit filter
    if (filters.tournament_id) {
      const snapshot = await getDocs(colRef, query(where("tournament_id", "==", filters.tournament_id)));
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    }

    // Generic: ignore undefined/null/object filters, only use flat primitives
    const cleaned = Object.fromEntries(
      Object.entries(filters || {}).filter(([_, v]) => v !== undefined && v !== null && typeof v !== "object")
    );

    if (Object.keys(cleaned).length === 0) {
      // Return everything in the collection (BM expects this when it passes undefined filters)
      const snapshot = await getDocs(colRef);
      if (snapshot.docs.length === 0) return [];
      if (snapshot.docs.length === 1) return [{ id: snapshot.docs[0].id, ...snapshot.docs[0].data() }];
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    }

    // Build query from cleaned filters
    let q = query(colRef);
    const conditions = Object.entries(cleaned).map(([k, v]) => where(k, "==", v));
    if (conditions.length > 0) q = query(colRef, ...conditions);
    const snapshot = await getDocs(q);
    if (snapshot.docs.length === 0) return [];
    if (snapshot.docs.length === 1) return [{ id: snapshot.docs[0].id, ...snapshot.docs[0].data() }];
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  // Get a document directly by ID
  async getById(table, id) {
    const collectionName = this.getCollectionName(table);
    const docRef = doc(this.db, `${this.baseDocPath}/${collectionName}/${id}`);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() };
  }

  /* ---------------------------
     UPDATE
     - Keep your existing logic where you accept [matchObject] as filters
     - Normalize filters to { id } and use updateDoc with sanitized data
  --------------------------- */
  async update(table, data, filters) {
    console.log("update table", table);
    console.log("update data", data);
    console.log("update filters", filters);

    const collectionName = this.getCollectionName(table);

    // Normalize filters that come as [{ id, ... }] to { id }
    if (Array.isArray(filters) && filters[0] && filters[0].id) {
      // If caller passed the full match object as filters (some clients do)
      // we will extract allowed keys when data is missing (keep old behavior but clearer)
      if (!data || typeof data === "string") {
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

        data = {};
        for (const key of allowedKeys) {
          if (filters[0][key] !== undefined) data[key] = filters[0][key];
        }

        // patch opponent score objects if present
        if (filters[0].opponent1) {
          data.opponent1 = {
            ...filters[0].opponent1,
            id: filters[0].opponent1.id,
            score: filters.scoreTeam1 ?? filters.opponent1?.score,
          };
        }
        if (filters[0].opponent2) {
          data.opponent2 = {
            ...filters[0].opponent2,
            id: filters[0].opponent2.id,
            score: filters.scoreTeam2 ?? filters.opponent2?.score,
          };
        }
      }
      // reduce filters to simple id doc reference for update below
      filters = { id: filters[0].id };
    }

    // If filters is a string = id
    if (typeof filters === "string") {
      const docRef = doc(this.db, `${this.baseDocPath}/${collectionName}/${filters}`);
      await updateDoc(docRef, this.sanitize(data), { merge: true });

      // re-fetch full updated doc and return full object
      const updatedSnapshot = await getDoc(docRef);
      return { id: updatedSnapshot.id, ...updatedSnapshot.data() };
    }

    // If filters is object with id
    if (filters && typeof filters === "object" && filters.id) {
      const docRef = doc(this.db, `${this.baseDocPath}/${collectionName}/${filters.id}`);
      if (typeof data === "object") {
        await updateDoc(docRef, this.sanitize(data), { merge: true });
      } else {
        if (filters.scoreTeam1 && !filters.opponent1.score) {
          filters.opponent1.score = filters.scoreTeam1;
          filters.opponent1.result = filters.scoreTeam1 > (filters.scoreTeam2 || 0) ? 'win' : (filters.scoreTeam1 < (filters.scoreTeam2 || 0) ? 'loss' : 'draw');
        }
        if (filters.scoreTeam2 && !filters.opponent2.score) {
          filters.opponent2.score = filters.scoreTeam2;
          filters.opponent2.result = filters.scoreTeam2 > (filters.scoreTeam1 || 0) ? 'win' : (filters.scoreTeam2 < (filters.scoreTeam1 || 0) ? 'loss' : 'draw');
        }
        await updateDoc(docRef, this.sanitize(filters), { merge: true });
      }

      const updatedSnapshot = await getDoc(docRef);
      return { id: updatedSnapshot.id, ...updatedSnapshot.data() };
    }

    // Generic multi-doc update (e.g. update by stage_id or tournament_id)
    if (data) {
      const docs = await this.select(table, filters);
      const updatedDocs = await Promise.all(
        docs.map(async (d) => {
          const docRef = doc(this.db, `${this.baseDocPath}/${collectionName}/${d.id}`);
          await updateDoc(docRef, this.sanitize(data), { merge: true });
          const refreshed = await getDoc(docRef);
          return { id: refreshed.id, ...refreshed.data() };
        })
      );

      return updatedDocs.length === 1 ? updatedDocs[0] : updatedDocs;
    } else {
      return null;
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
