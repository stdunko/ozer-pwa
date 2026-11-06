import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { storage } from "../utils/storage";

interface AuthState {
  token: string;
}

const initialState: AuthState = {
  token: storage.get("token") || "",
};

const authSlice = createSlice({
  name: "authorization",
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
  },
});

export const { setToken } = authSlice.actions;
export default authSlice.reducer;
