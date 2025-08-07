import { configureStore } from '@reduxjs/toolkit'
import counterReducer from '../redux/features/counter/counterSlice'

export default configureStore({
  reducer: {
    counter: counterReducer
  }
})