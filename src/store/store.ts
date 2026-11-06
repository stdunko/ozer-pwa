import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import liveReducer from "./liveSlice";
import userReducer from "./userSlice";

export const store = configureStore({
  reducer: {
    authorization: authReducer,
    user: userReducer,
    live: liveReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
