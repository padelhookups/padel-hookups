import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, getDocs, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';

// Helper function to convert Firestore Timestamp to milliseconds
const convertTimestampToMillis = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp.toMillis) return timestamp.toMillis();
  if (timestamp.seconds) return timestamp.seconds * 1000 + Math.floor(timestamp.nanoseconds / 1000000);
  return timestamp;
};

// Add: generic helpers to serialize all Firestore Timestamps
const isFirestoreTimestamp = (val) =>
  val && (typeof val.toMillis === 'function' || (typeof val.seconds === 'number' && typeof val.nanoseconds === 'number'));

const deepConvertTimestamps = (value, seen = new WeakSet()) => {
  if (Array.isArray(value)) return value.map(v => deepConvertTimestamps(v, seen));
  if (value && typeof value === 'object') {
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
// Helper function to serialize event data
const serializeEvent = (event) => {
  const converted = deepConvertTimestamps(event);
  return {
    ...converted,
    // ensure field exists and is millis if present
    ModifiedAt: converted?.ModifiedAt ?? (event?.ModifiedAt ? convertTimestampToMillis(event.ModifiedAt) : null),
    
  };
};

// Async thunk to fetch events from Firestore
export const fetchEvents = createAsyncThunk(
  'events/fetchEvents',
  async ({ db, forceRefresh = false }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      // Fallback to benefits slice while store registration is updated
      const sliceState = state.events ?? state.benefits ?? { items: [], lastModified: null };
      const { items, lastModified } = sliceState;

      /* console.log(!forceRefresh, items.length); */

      // If we have cached data and not forcing refresh, check if we need to update
      if (!forceRefresh && items.length > 0) {
        /* console.log('Checking if cached events data is still valid'); */

        // Get the latest ModifiedAt timestamp from Firestore to compare
        const eventsCollection = collection(db, "Events");
        const latestQuery = query(
          eventsCollection,
          orderBy("ModifiedAt", "desc"),
          limit(1)
        );

        const latestSnapshot = await getDocs(latestQuery);

        if (!latestSnapshot.empty) {
          const latestDoc = latestSnapshot.docs[0];
          const latestModifiedTimestamp = latestDoc.data().ModifiedAt;
          const latestModified = convertTimestampToMillis(latestModifiedTimestamp);

          /* console.log('lastModified from cache', new Date(lastModified).toISOString());
          console.log('latestModified from server', new Date(latestModified).toISOString());
          console.log(latestModified <= lastModified); */


          // If our cached data is still current, return it
          if (lastModified && latestModified && latestModified <= lastModified) {
            /* console.log('Using cached events data'); */
            return { events: items, fromCache: true };
          }
        }
      }

      // Decide whether to perform a delta fetch (only new/updated docs) or full fetch
      const canDeltaFetch = !forceRefresh && !!lastModified;
      /* console.log('Delta fetch?', canDeltaFetch, 'lastModified:', lastModified); */

      let eventsQuery;
      if (canDeltaFetch) {
        // Fetch only events with ModifiedAt strictly greater than stored lastModified
        // Firestore inequality requires orderBy on the same field for compound queries
        eventsQuery = query(
          collection(db, 'Events'),
          where('ModifiedAt', '>', Timestamp.fromMillis(lastModified)),
          orderBy('ModifiedAt', 'asc')
        );
      } else {
        // Full fetch (initial load or forced refresh)
        eventsQuery = collection(db, 'Events');
      }

      /* console.log('Fetching events (delta? ', canDeltaFetch, ') from Firestore'); */
      const eventsSnapshot = await getDocs(eventsQuery);
      /* console.log('eventsSnapshot.docs.length', eventsSnapshot.docs.length); */

      if (eventsSnapshot.empty) {
        if (canDeltaFetch) {
          // No new events; reuse cache
          return { events: items.slice(), lastModified, fromCache: true };
        }
        return { events: [], fromCache: false };
      }

      const fetchedEvents = eventsSnapshot.docs.map((doc) => {
        /* console.log(doc.data()); */

        let finalDoc = { ...doc.data(), PlayersIds: doc.data().PlayersIds?.map(r => r?.id ?? r) ?? [] };

        return serializeEvent({
          ...finalDoc,
          id: doc.id,
        });
      });

      let mergedEvents;
      if (canDeltaFetch) {
        // Merge new events into existing cache (by id) without losing prior ones
        const mapById = new Map(items.map(e => [e.id, e]));
        for (const ev of fetchedEvents) {
          mapById.set(ev.id, ev);
        }
        mergedEvents = Array.from(mapById.values());
      } else {
        mergedEvents = fetchedEvents;
      }

      // Recompute latestModified across merged list
      const modifiedTimes = mergedEvents
        .map(e => e.ModifiedAt)
        .filter(t => t && t > 0);
      const newLatestModified = modifiedTimes.length ? Math.max(...modifiedTimes) : lastModified || Date.now();

      return {
        events: mergedEvents,
        lastModified: newLatestModified,
        fromCache: false,
        delta: canDeltaFetch,
      };
    } catch (error) {
      console.error("Error fetching events:", error);
      return rejectWithValue(error.message);
    }
  }
);

const eventsSlice = createSlice({
  name: 'events',
  initialState: {
    items: [],
    lastModified: null,
    loading: false,
    error: null,
    lastFetched: null,
  },
  reducers: {
    clearEvents: (state) => {
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
      .addCase(fetchEvents.pending, (state, action) => {
        // Only set loading to true if we're actually going to fetch fresh data
        const { forceRefresh = false } = action.meta.arg;
        const { items } = state;

        // Set loading only if we don't have cached data or we're forcing refresh
        if (forceRefresh || items.length === 0) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        const { events, lastModified, fromCache } = action.payload;

        // Always update items; ensure new array reference
        state.items = Array.isArray(events) ? [...events] : [];

        // Only update timestamps if it's fresh data
        if (!fromCache && lastModified) {
          state.lastModified = lastModified;
          state.lastFetched = Date.now();
        }
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearEvents, invalidateCache } = eventsSlice.actions;

// Selectors (safe fallback while migrating store key)
const selectEventsState = (state) =>
  state.events ?? state.benefits ?? { items: [], loading: false, error: null, lastFetched: null };

export const selectEvents = (state) => selectEventsState(state).items;
export const selectEventsLoading = (state) => selectEventsState(state).loading;
export const selectEventsError = (state) => selectEventsState(state).error;
export const selectEventsLastFetched = (state) => selectEventsState(state).lastFetched;

export default eventsSlice.reducer;
