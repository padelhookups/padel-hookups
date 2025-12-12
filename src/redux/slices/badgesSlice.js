import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  Timestamp,
} from "firebase/firestore";

const initialState = {
  items: [],
  lastModified: null,
  loading: false,
  error: null,
  lastFetched: null,
};

// Helper function to convert Firestore Timestamp to milliseconds
const convertTimestampToMillis = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp.toMillis) return timestamp.toMillis();
  if (timestamp.seconds)
    return (
      timestamp.seconds * 1000 + Math.floor(timestamp.nanoseconds / 1000000)
    );
  return timestamp;
};

const isFirestoreTimestamp = (val) =>
  val &&
  (typeof val.toMillis === "function" ||
    (typeof val.seconds === "number" && typeof val.nanoseconds === "number"));

const deepConvertTimestamps = (value, seen = new WeakSet()) => {
  if (Array.isArray(value))
    return value.map((v) => deepConvertTimestamps(v, seen));
  if (value && typeof value === "object") {
    if (seen.has(value)) return value; // avoid infinite recursion
    seen.add(value);

    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = isFirestoreTimestamp(v)
        ? convertTimestampToMillis(v)
        : deepConvertTimestamps(v, seen);
    }
    return out;
  }
  return value;
};

const serializeBadge = (badge) => {
  const converted = deepConvertTimestamps(badge);
  return {
    ...converted,
    // ensure field exists and is millis if present
    ModifiedAt:
      converted?.ModifiedAt ??
      (badge?.ModifiedAt ? convertTimestampToMillis(badge.ModifiedAt) : null),
  };
};

// Async thunk to fetch badges from Firestore
export const fetchBadges = createAsyncThunk(
  "badges/fetchBadges",
  async ({ db, forceRefresh = false }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      // Fallback to benefits slice while store registration is updated
      const sliceState = state.badges ??
        state.benefits ?? { items: [], lastModified: null };
      const { items, lastModified } = sliceState;

      console.log(!forceRefresh, items.length);

      // If we have cached data and not forcing refresh, check if we need to update
      if (!forceRefresh && items.length > 0) {
        console.log('Checking if cached badges data is still valid');

        // Get the latest ModifiedAt timestamp from Firestore to compare
        const badgesCollection = collection(db, "Badges");
        const latestQuery = query(
          badgesCollection,
          orderBy("ModifiedAt", "desc"),
          limit(1)
        );

        const latestSnapshot = await getDocs(latestQuery);

        if (!latestSnapshot.empty) {
          const latestDoc = latestSnapshot.docs[0];
          const latestModifiedTimestamp = latestDoc.data().ModifiedAt;
          const latestModified = convertTimestampToMillis(
            latestModifiedTimestamp
          );

          console.log('lastModified from cache', new Date(lastModified).toISOString());
          console.log('latestModified from server', new Date(latestModified).toISOString());
          console.log(latestModified <= lastModified);

          // If our cached data is still current, return it
          if (
            lastModified &&
            latestModified &&
            latestModified <= lastModified
          ) {
            console.log('Using cached badges data');
            return { badges: items, fromCache: true };
          }
        }
      }

      // Decide whether to perform a delta fetch (only new/updated docs) or full fetch
      const canDeltaFetch = !forceRefresh && !!lastModified;
      console.log('Delta fetch?', canDeltaFetch, 'lastModified:', lastModified);

      let badgesQuery;
      if (canDeltaFetch) {
        // Fetch only badges with ModifiedAt strictly greater than stored lastModified
        // Firestore inequality requires orderBy on the same field for compound queries
        badgesQuery = query(
          collection(db, "Badges"),
          where("ModifiedAt", ">", Timestamp.fromMillis(lastModified)),
          orderBy("ModifiedAt", "asc")
        );
      } else {
        // Full fetch (initial load or forced refresh)
        badgesQuery = collection(db, "Badges");
      }

        
      const badgesSnapshot = await getDocs(badgesQuery);
      console.log('badgesSnapshot.docs.length', badgesSnapshot.docs.length);

      if (badgesSnapshot.empty) {
        if (canDeltaFetch) {
          // No new badges; reuse cache
          return { badges: items.slice(), lastModified, fromCache: true };
        }
        return { badges: [], fromCache: false };
      }

      const fetchedBadges = badgesSnapshot.docs.map((doc) => {
        /* console.log(doc.data()); */

        let finalDoc = {
          ...doc.data(),
        };

        return serializeBadge({
          ...finalDoc,
          id: doc.id,
        });
      });

      let mergedBadges;
      if (canDeltaFetch) {
        // Merge new badges into existing cache (by id) without losing prior ones
        const mapById = new Map(items.map((e) => [e.id, e]));
        for (const ev of fetchedBadges) {
          mapById.set(ev.id, ev);
        }
        mergedBadges = Array.from(mapById.values());
      } else {
        mergedBadges = fetchedBadges;
      }

      // Recompute latestModified across merged list
      const modifiedTimes = mergedBadges
        .map((e) => e.ModifiedAt)
        .filter((t) => t && t > 0);
      const newLatestModified = modifiedTimes.length
        ? Math.max(...modifiedTimes)
        : lastModified || Date.now();

      return {
        badges: mergedBadges,
        lastModified: newLatestModified,
        fromCache: false,
        delta: canDeltaFetch,
      };
    } catch (error) {
      console.error("Error fetching badges:", error);
      return rejectWithValue(error.message);
    }
  }
);

const badgesSlice = createSlice({
  name: "badges",
  initialState,
  reducers: {
    clearBadges: (state) => {
      state.items = [];
      state.lastModified = null;
      state.lastFetched = null;
    },
    invalidateCache: (state) => {
      state.lastModified = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBadges.pending, (state, action) => {
        // Only set loading to true if we're actually going to fetch fresh data
        const { forceRefresh = false } = action.meta.arg;
        const { items } = state;

        // Set loading only if we don't have cached data or we're forcing refresh
        if (forceRefresh || items.length === 0) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchBadges.fulfilled, (state, action) => {
        state.loading = false;
        const { badges, lastModified, fromCache } = action.payload;

        // Always update items; ensure new array reference
        state.items = Array.isArray(badges) ? [...badges] : [];

        // Only update timestamps if it's fresh data
        if (!fromCache && lastModified) {
          state.lastModified = lastModified;
          state.lastFetched = Date.now();
        }
      })
      .addCase(fetchBadges.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearBadges, invalidateCache } = badgesSlice.actions;

const selectBadgesState = (state) =>
  state.badges ?? state.benefits ?? { items: [], loading: false, error: null, lastFetched: null };

export const selectBadges = (state) => selectBadgesState(state).items;
export const selectBadgesLoading = (state) => selectBadgesState(state).loading;
export const selectBadgesError = (state) => selectBadgesState(state).error;
export const selectBadgesLastFetched = (state) => selectBadgesState(state).lastFetched;

export default badgesSlice.reducer;
