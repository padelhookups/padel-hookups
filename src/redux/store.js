import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // uses localStorage
// For larger data, consider IndexedDB:
// import createIdbStorage from 'redux-persist-indexeddb-storage';
// const storage = createIdbStorage('MyAppDB');

import benefitsReducer from './slices/benefitsSlice';
import eventsReducer from './slices/eventsSlice';

// 1️⃣ Combine reducers
const rootReducer = combineReducers({
  benefits: benefitsReducer,
  events: eventsReducer,
});

// 2️⃣ Persist configuration
const persistConfig = {
  key: 'root',            // key for localStorage/IndexedDB
  storage,                // which storage engine to use
  whitelist: ['benefits', 'events'], // persist only benefits (optional)
  // blacklist: ['events'], // if you ever want to exclude something
};

// 3️⃣ Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// 4️⃣ Create store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // disable strict checks for redux-persist internal actions
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/PAUSE',
          'persist/FLUSH',
          'persist/PURGE',
          'persist/REGISTER',
          'benefits/setBenefits',
          'benefits/fetchBenefits/fulfilled',
        ],
        ignoredPaths: ['benefits.items', 'benefits.items.ModifiedAt'],
      },
    }),
});

// 5️⃣ Persistor for PersistGate
export const persistor = persistStore(store);

// 6️⃣ Default export (optional)
export default store;
