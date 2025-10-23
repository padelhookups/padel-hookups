import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

// Helper function to convert Firestore Timestamp to milliseconds
const convertTimestampToMillis = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp.toMillis) return timestamp.toMillis();
  if (timestamp.seconds) return timestamp.seconds * 1000 + Math.floor(timestamp.nanoseconds / 1000000);
  return timestamp;
};

// Helper function to serialize user data
const serializeUser = (user) => ({
  ...user,
  LastModifiedAt: user.LastModifiedAt ? convertTimestampToMillis(user.LastModifiedAt) : null
});

// Async thunk to fetch users from Firestore
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async ({ db, forceRefresh = false }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { items, lastModified } = state.users;

      console.log(!forceRefresh, items.length);
      
      // If we have cached data and not forcing refresh, check if we need to update
      if (!forceRefresh && items.length > 0) {
        console.log('Checking if cached users data is still valid');
        
        // Get the latest LastModifiedAt timestamp from Firestore to compare
        const usersCollection = collection(db, "Users");
        const latestQuery = query(
          usersCollection,
          orderBy("LastModifiedAt", "desc"),
          limit(1)
        );
        
        const latestSnapshot = await getDocs(latestQuery);
        
        if (!latestSnapshot.empty) {
          const latestDoc = latestSnapshot.docs[0];
          const latestModifiedTimestamp = latestDoc.data().LastModifiedAt;
          const latestModified = convertTimestampToMillis(latestModifiedTimestamp);
          
          // If our cached data is still current, return it
          if (lastModified && latestModified && latestModified <= lastModified) {
            console.log('Using cached users data');
            return { users: items, fromCache: true };
          }
        }
      }

      // Fetch fresh data from Firestore
      console.log('Fetching fresh users data from Firestore');
      const usersCollection = collection(db, "Users");
      const usersSnapshot = await getDocs(usersCollection);

      if (usersSnapshot.empty) {
        return { users: [], fromCache: false };
      }

      const usersData = usersSnapshot.docs.map((doc) => 
        serializeUser({
          ...doc.data(),
          id: doc.id
        })
      );

      // Find the latest LastModifiedAt timestamp
      const modifiedTimes = usersData
        .map(user => user.LastModifiedAt)
        .filter(time => time && time > 0);
      
      const latestModified = modifiedTimes.length > 0 ? Math.max(...modifiedTimes) : Date.now();

      return { 
        users: usersData, 
        lastModified: latestModified,
        fromCache: false 
      };
    } catch (error) {
      console.error("Error fetching users:", error);
      return rejectWithValue(error.message);
    }
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    items: [],
    lastModified: null,
    loading: false,
    error: null,
    lastFetched: null,
  },
  reducers: {
    clearBenefits: (state) => {
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
      .addCase(fetchUsers.pending, (state, action) => {
        // Only set loading to true if we're actually going to fetch fresh data
        const { forceRefresh = false } = action.meta.arg;
        const { items } = state;
        
        // Set loading only if we don't have cached data or we're forcing refresh
        if (forceRefresh || items.length === 0) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        const { users, lastModified, fromCache } = action.payload;

        // Always update items regardless of fromCache flag
        state.items = users;

        // Only update timestamps if it's fresh data
        if (!fromCache && lastModified) {
          state.lastModified = lastModified;
          state.lastFetched = Date.now();
        }
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearUsers, invalidateCache } = usersSlice.actions;

// Selectors
export const selectUsers = (state) => state.users.items;
export const selectUsersLoading = (state) => state.users.loading;
export const selectUsersError = (state) => state.users.error;
export const selectUsersLastFetched = (state) => state.users.lastFetched;

export default usersSlice.reducer;
