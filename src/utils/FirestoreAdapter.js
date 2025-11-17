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
    this.baseDocPath = baseDocPath;
    this.tournamentId = tournamentId;
  }

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
    return collection(this.db, `${this.baseDocPath}/${colName}`);
  }

  /* ---------------------------------------------------
     INSERT — safe + atomic batch for arrays
  --------------------------------------------------- */
  async insert(table, data) {
    const colRef = this.getCollection(table);

    // Bulk: use batch
    if (Array.isArray(data)) {
      if (data.length === 0) return [];

      const batch = writeBatch(this.db);
      const results = [];

      for (const item of data) {
        if (typeof item !== "object" || item === null) {
          throw new Error("FirestoreAdapter: each item in array must be an object");
        }

        const sanitized = this.sanitize(item);
        const providedId =
          item.id !== undefined && item.id !== null && String(item.id).length > 0
            ? String(item.id)
            : null;

        const docRef = providedId ? doc(colRef, providedId) : doc(colRef);
        batch.set(docRef, sanitized);

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
      const docRef = doc(colRef, String(data.id));
      await setDoc(docRef, sanitized);
      return { id: docRef.id, ...data };
    } else {
      const docRef = await addDoc(colRef, sanitized);
      return { id: docRef.id, ...data };
    }
  }

  /* ---------------------------------------------------
     SANITIZE — flatten only stage_id/group_id/round_id
  --------------------------------------------------- */
  sanitize(data) {
    const replacer = (key, value) => (value === undefined ? null : value);
    const copy = JSON.parse(JSON.stringify(data, replacer));

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

  /* ---------------------------------------------------
     SELECT — normalized filters
  --------------------------------------------------- */
  async select(table, filters = {}) {
    const colRef = this.getCollection(table);
    const collectionName = this.getCollectionName(table);

    // select("id")
    if (typeof filters === "string") {
      const docRef = doc(this.db, `${this.baseDocPath}/${collectionName}/${filters}`);
      const snap = await getDoc(docRef);
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    }

    // select([{id:X}])
    if (Array.isArray(filters) && filters[0]?.id) {
      const docRef = doc(this.db, `${this.baseDocPath}/${collectionName}/${filters[0].id}`);
      const snap = await getDoc(docRef);
      return snap.exists() ? [{ id: snap.id, ...snap.data() }] : [];
    }

    // Normalize nested ID objects
    const idKeys = ["stage_id", "group_id", "round_id", "tournament_id"];
    for (const k of idKeys) {
      if (filters[k] && typeof filters[k] === "object" && filters[k].id) {
        filters[k] = filters[k].id;
      }
    }

    // Stage by ID
    if (filters.stage_id && table === "stage") {
      const docRef = doc(this.db, `${this.baseDocPath}/${collectionName}/${filters.stage_id}`);
      const snap = await getDoc(docRef);
      return snap.exists() ? [{ id: snap.id, ...snap.data() }] : [];
    }

    // tournament_id
    if (filters.tournament_id) {
      const q = query(colRef, where("tournament_id", "==", filters.tournament_id));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    }

    // stage_id (matches, rounds, groups)
    if (filters.stage_id) {
      const q = query(colRef, where("stage_id", "==", filters.stage_id));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    }

    // Primitive filters only
    const cleaned = Object.fromEntries(
      Object.entries(filters).filter(
        ([_, v]) => v !== undefined && v !== null && typeof v !== "object"
      )
    );

    // No filters → get all
    if (Object.keys(cleaned).length === 0) {
      const snap = await getDocs(colRef);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    }

    // Build query
    const conditions = Object.entries(cleaned).map(([k, v]) => where(k, "==", v));
    const q = query(colRef, ...conditions);
    const snap = await getDocs(q);

    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  /* ---------------------------------------------------
     GET BY ID
  --------------------------------------------------- */
  async getById(table, id) {
    if (!id) return null;
    const collectionName = this.getCollectionName(table);
    const docRef = doc(this.db, `${this.baseDocPath}/${collectionName}/${id}`);
    const snap = await getDoc(docRef);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  }

  /* ---------------------------------------------------
     UPDATE — consistent setDoc({merge:true})
  --------------------------------------------------- */
  async update(table, data, filters) {
    const collectionName = this.getCollectionName(table);

    // Array with first.id
    if (Array.isArray(filters) && filters[0]?.id) {
      if (!data || typeof data !== "object") {
        data = { ...filters[0] };
      }
      filters = { id: filters[0].id };
    }

    // string id
    if (typeof filters === "string") {
      const docRef = doc(this.db, `${this.baseDocPath}/${collectionName}/${filters}`);
      await setDoc(docRef, this.sanitize(data), { merge: true });
      const snap = await getDoc(docRef);
      return { id: snap.id, ...snap.data() };
    }

    // object with .id
    if (filters?.id) {
      const docRef = doc(this.db, `${this.baseDocPath}/${collectionName}/${filters.id}`);
      if (typeof data === "object") {
        await setDoc(docRef, this.sanitize(data), { merge: true });
      } else {
        await setDoc(docRef, this.sanitize(filters), { merge: true });
      }
      const snap = await getDoc(docRef);
      return { id: snap.id, ...snap.data() };
    }

    // multi-update
    const docs = await this.select(table, filters);
    if (!docs?.length) return [];

    const updated = await Promise.all(
      docs.map(async (d) => {
        const dr = doc(this.db, `${this.baseDocPath}/${collectionName}/${d.id}`);
        await setDoc(dr, this.sanitize(data), { merge: true });
        const snap = await getDoc(dr);
        return { id: snap.id, ...snap.data() };
      })
    );

    return updated.length === 1 ? updated[0] : updated;
  }

  /* ---------------------------------------------------
     DELETE
  --------------------------------------------------- */
  async delete(table, filters) {
    const docs = await this.select(table, filters);
    if (!docs?.length) return 0;

    await Promise.all(
      docs.map((d) =>
        deleteDocument(
          doc(this.db, `${this.baseDocPath}/${this.getCollectionName(table)}/${d.id}`)
        )
      )
    );

    return docs.length;
  }
}
