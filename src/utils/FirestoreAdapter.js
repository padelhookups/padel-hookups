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

  async insert(table, data) {
    console.warn("insert table", table);
    console.log("insert data", data);

    const colRef = this.getCollection(table);

    if (Array.isArray(data)) {
      // Handle array of objects (manager might pass seeding array)
      return Promise.all(
        data.map(async (item) => {
          if (typeof item !== "object" || item === null) {
            throw new Error("FirestoreAdapter: data item must be an object");
          }
          const docRef = doc(colRef, item.id.toString() || undefined);

          const sanitizedItem = this.sanitize(item);
          await setDoc(docRef, sanitizedItem);
          return { id: docRef.id, ...sanitizedItem };
        })
      );
    }

    if (typeof data !== "object" || data === null) {
      throw new Error("FirestoreAdapter: data must be an object");
    }

    if (data.round_id?.id) {
      data.round_id = data.round_id.id;
    }
    if (data.group_id?.id) {
      data.group_id = data.group_id.id;
    }
    if (data.stage_id?.id) {
      data.stage_id = data.stage_id.id;
    }

    if (data.opponent1?.position === undefined) {
      //data.opponent1.position = data.round_id * data.number;
    }

    if (data.opponent2?.position === undefined) {
      
    }

    if (data.id) {
      const docRef = doc(colRef, data.id.toString());
      await setDoc(docRef, this.sanitize(data));
      return { id: data.id, ...this.sanitize(data) };
    } else {
      const docRef = await addDoc(colRef, this.sanitize(data));
      return { id: docRef.id, ...this.sanitize(data) };
    }
  }

  sanitize(data) {
    const removedUndefined = JSON.parse(
      JSON.stringify(data, (key, value) => (value === undefined ? null : value))
    );
    // remove nested objects
    const sanitized = this.flattenIds(removedUndefined);
    return sanitized;
    /* return removedUndefined; */
  }

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

  async select(table, filters = {}) {
    const colRef = this.getCollection(table);
    if (
      this.tournamentId &&
      Object.keys(filters).includes("tournament_id") &&
      filters.tournament_id === undefined
    ) {
      filters.tournament_id = this.tournamentId;
    }

    // ✅ If filters is a string, treat it as document ID
    if (typeof filters === "string") {
      const docRef = doc(
        this.db,
        `${this.baseDocPath}/${this.getCollectionName(table)}/${filters}`
      );
      const snapshot = await getDoc(docRef);
      return snapshot.exists()
        ?
        {
          id: snapshot.id,
          ...snapshot.data(),
          /* round_id: snapshot.data()?.round_id?.id,
          group_id: snapshot.data()?.group_id?.id,
          stage_id: snapshot.data()?.stage_id?.id, */
        }

        : null;
    }

    // ✅ If filters contains an ID, just fetch that doc
    if (filters[0]?.id) {
      const docRef = doc(
        this.db,
        `${this.baseDocPath}/${this.getCollectionName(table)}/${filters[0]?.id}`
      );
      const snapshot = await getDoc(docRef);
      return snapshot.exists() ? [{ id: snapshot.id, ...snapshot.data() }] : [];
    }

    if (filters.stage_id) {
      let docRef;
      if (table === "stage") {
        const docRef = doc(
          this.db,
          `${this.baseDocPath}/${this.getCollectionName(table)}/${filters.stage_id
          }`
        );
        const snapshot = await getDoc(docRef);
        return snapshot.exists()
          ? [{ id: snapshot.id, ...snapshot.data() }]
          : [];
      } else {
        const snapshot = await getDocs(
          colRef,
          where("stage_id", "==", filters.stage_id)
        );
        return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
    }

    if (filters.tournament_id) {
      const snapshot = await getDocs(
        colRef,
        where("tournament_id", "==", filters.tournament_id)
      );
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    }

    // Normal filters (flat key-value pairs only)
    let q = query(colRef);
    if (filters && Object.keys(filters).length > 0) {
      const safeFilters = Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => typeof value !== "object"
        )
      );

      const conditions = Object.entries(safeFilters).map(([key, value]) =>
        where(key, "==", value)
      );
      if (conditions.length > 0) q = query(colRef, ...conditions);
    }

    const snapshot = await getDocs(q);
    if (snapshot.docs.length === 1) {
      return [{
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data(),
      }];
    } else if (snapshot.docs.length > 1) {
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    } else {
      return [];
    }
  }

  // Get a document directly by ID
  // replace your getById with this
  async getById(table, id) {
    const collectionName = this.getCollectionName(table);
    const docRef = doc(this.db, `${this.baseDocPath}/${collectionName}/${id}`);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() };
  }

  // replace your update() with this (keeps most of your logic, but normalizes returns)
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
            score: filters.scoreTeam1 ?? filters.opponent1.score,
          };
        }
        if (filters[0].opponent2) {
          data.opponent2 = {
            ...filters[0].opponent2,
            id: filters[0].opponent2.id,
            score: filters.scoreTeam2 ?? filters.opponent2.score,
          };
        }
      }
      // reduce filters to simple id doc reference for update below
      filters = { id: filters[0].id };
    }

    // If filters is a string = id
    if (typeof filters === "string") {
      const docRef = doc(
        this.db,
        `${this.baseDocPath}/${collectionName}/${filters}`
      );
      await updateDoc(docRef, this.sanitize(data), { merge: true });

      // re-fetch full updated doc and return full object
      const updatedSnapshot = await getDoc(docRef);
      return { id: updatedSnapshot.id, ...updatedSnapshot.data() };
    }

    // If filters is object with id
    if (filters && typeof filters === "object" && filters.id) {
      const docRef = doc(
        this.db,
        `${this.baseDocPath}/${collectionName}/${filters.id}`
      );
      if (typeof data === 'object') {
        await updateDoc(docRef, this.sanitize(data), { merge: true });
      } else {
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
          const docRef = doc(
            this.db,
            `${this.baseDocPath}/${collectionName}/${d.id}`
          );
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
        deleteDocument(
          doc(
            this.db,
            `${this.baseDocPath}/${this.getCollectionName(table)}/${d.id}`
          )
        )
      )
    );
  }
}
