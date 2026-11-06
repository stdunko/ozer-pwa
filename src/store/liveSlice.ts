import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Chat } from "../types/chat";
import type { Order } from "../types/order";

type LiveState = {
  orders: Order[];
  chats: Chat[];
  ordersLoading: boolean;
  chatsLoading: boolean;
};

const initialState: LiveState = {
  orders: [],
  chats: [],
  ordersLoading: true,
  chatsLoading: true,
};

const liveSlice = createSlice({
  name: "live",
  initialState,
  reducers: {
    setOrders: (state, action: PayloadAction<Order[]>) => {
      state.orders = action.payload;
      state.ordersLoading = false;
    },
    setChats: (state, action: PayloadAction<Chat[]>) => {
      state.chats = action.payload;
      state.chatsLoading = false;
    },
    setOrdersLoading: (state, action: PayloadAction<boolean>) => {
      state.ordersLoading = action.payload;
    },
    setChatsLoading: (state, action: PayloadAction<boolean>) => {
      state.chatsLoading = action.payload;
    },
    removeOrder: (state, action: PayloadAction<number>) => {
      state.orders = state.orders.filter((order) => order.id !== action.payload);
    },
    resetLive: () => initialState,
  },
});

export const { setOrders, setChats, setOrdersLoading, setChatsLoading, removeOrder, resetLive } =
  liveSlice.actions;
export default liveSlice.reducer;
