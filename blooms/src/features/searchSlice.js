import { createSlice } from "@reduxjs/toolkit";

const searchSlice = createSlice({
  name: "search",
  initialState: { topicQuery: "" },
  reducers: {
    setTopicQuery: (state, action) => { state.topicQuery = action.payload; },
    clearTopicQuery: (state) => { state.topicQuery = ""; },
  },
});

export const { setTopicQuery, clearTopicQuery } = searchSlice.actions;
export default searchSlice.reducer;