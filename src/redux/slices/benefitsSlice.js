import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

// Helper function to convert Firestore Timestamp to milliseconds
const convertTimestampToMillis = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp.toMillis) return timestamp.toMillis();
  if (timestamp.seconds) return timestamp.seconds * 1000 + Math.floor(timestamp.nanoseconds / 1000000);
  return timestamp;
};

// Helper function to serialize benefit data
const serializeBenefit = (benefit) => ({
  ...benefit,
  ModifiedAt: benefit.ModifiedAt ? convertTimestampToMillis(benefit.ModifiedAt) : null
});

// Async thunk to fetch benefits from Firestore
export const fetchBenefits = createAsyncThunk(
  'benefits/fetchBenefits',
  async ({ db, forceRefresh = false }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { items, lastModified } = state.benefits;
      
      console.log(!forceRefresh, items.length);
      
      // If we have cached data and not forcing refresh, check if we need to update
      if (!forceRefresh && items.length > 0) {
        console.log('Checking if cached benefits data is still valid');
        
        // Get the latest ModifiedAt timestamp from Firestore to compare
        const benefitsCollection = collection(db, "Benefits");
        const latestQuery = query(
          benefitsCollection,
          orderBy("ModifiedAt", "desc"),
          limit(1)
        );
        
        const latestSnapshot = await getDocs(latestQuery);
        
        if (!latestSnapshot.empty) {
          const latestDoc = latestSnapshot.docs[0];
          const latestModifiedTimestamp = latestDoc.data().ModifiedAt;
          const latestModified = convertTimestampToMillis(latestModifiedTimestamp);
          
          // If our cached data is still current, return it
          if (lastModified && latestModified && latestModified <= lastModified) {
            console.log('Using cached benefits data');
            return { benefits: items, fromCache: true };
          }
        }
      }

      // Fetch fresh data from Firestore
      console.log('Fetching fresh benefits data from Firestore');
      const benefitsCollection = collection(db, "Benefits");
      const benefitsSnapshot = await getDocs(benefitsCollection);
      
      if (benefitsSnapshot.empty) {
        return { benefits: [], fromCache: false };
      }

      const benefitsData = benefitsSnapshot.docs.map((doc) => 
        serializeBenefit({
          ...doc.data(),
          id: doc.id
        })
      );

      // Find the latest ModifiedAt timestamp
      const modifiedTimes = benefitsData
        .map(benefit => benefit.ModifiedAt)
        .filter(time => time && time > 0);
      
      const latestModified = modifiedTimes.length > 0 ? Math.max(...modifiedTimes) : Date.now();

      return { 
        benefits: benefitsData, 
        lastModified: latestModified,
        fromCache: false 
      };
    } catch (error) {
      console.error("Error fetching benefits:", error);
      return rejectWithValue(error.message);
    }
  }
);

const benefitsSlice = createSlice({
  name: 'benefits',
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
      .addCase(fetchBenefits.pending, (state, action) => {
        // Only set loading to true if we're actually going to fetch fresh data
        const { forceRefresh = false } = action.meta.arg;
        const { items } = state;
        
        // Set loading only if we don't have cached data or we're forcing refresh
        if (forceRefresh || items.length === 0) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchBenefits.fulfilled, (state, action) => {
        state.loading = false;
        const { benefits, lastModified, fromCache } = action.payload;
        
        // Always update items regardless of fromCache flag
        state.items = benefits;
        
        // Only update timestamps if it's fresh data
        if (!fromCache && lastModified) {
          state.lastModified = lastModified;
          state.lastFetched = Date.now();
        }
      })
      .addCase(fetchBenefits.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearBenefits, invalidateCache } = benefitsSlice.actions;

// Selectors
export const selectBenefits = (state) => state.benefits.items;
export const selectBenefitsLoading = (state) => state.benefits.loading;
export const selectBenefitsError = (state) => state.benefits.error;
export const selectBenefitsLastFetched = (state) => state.benefits.lastFetched;

export default benefitsSlice.reducer;
