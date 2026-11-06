import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface UserState {
  id: number;
  name?: string | null;
  email?: string | null;
  phone: string;
  status?: number;
}

const initialState: UserState = {
  id: 0,
  name: null,
  email: null,
  phone: "",
  status: 0,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserState>) => {
      state.id = action.payload.id;
      state.name = action.payload.name;
      state.email = action.payload.email;
      state.phone = action.payload.phone;
      state.status = action.payload.status;
    },
  },
});

export const { setUser } = userSlice.actions;
export default userSlice.reducer;
