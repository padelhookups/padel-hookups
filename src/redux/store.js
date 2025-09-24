import { configureStore } from '@reduxjs/toolkit'
import counterReducer from '../redux/features/counter/counterSlice'
import benefitsReducer from './slices/benefitsSlice'

export default configureStore({
  reducer: {
    counter: counterReducer,
    benefits: benefitsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['benefits/setBenefits', 'benefits/fetchBenefits/fulfilled'],
        ignoredPaths: ['benefits.items', 'benefits.items.ModifiedAt'],
      },
    }),
})