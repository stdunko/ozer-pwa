import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface UserState {
  id: number;
  name?: string | null;
  email?: string | null;
  phone: string;
  photo?: string | null;
  pushSubscription?: string | null;
  status?: number;
}

const initialState: UserState = {
  id: 0,
  name: null,
  email: null,
  phone: "",
  photo: null,
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
      state.photo =
        action.payload.photo !== undefined ? action.payload.photo : (state.photo ?? null);
      state.status = action.payload.status;
    },
    setUserPhoto: (state, action: PayloadAction<string | null>) => {
      state.photo = action.payload;
    },
  },
});

export const { setUser, setUserPhoto } = userSlice.actions;
export default userSlice.reducer;
