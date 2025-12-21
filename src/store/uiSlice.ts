import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  network: string;
  advancedMetricsExpanded: boolean;
  tooltips: Record<string, boolean>;
}

const initialState: UiState = {
  network: "main",
  advancedMetricsExpanded: false,
  tooltips: {},
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setNetwork(state, action: PayloadAction<string>) {
      state.network = action.payload;
    },
    toggleAdvancedMetrics(state) {
      state.advancedMetricsExpanded = !state.advancedMetricsExpanded;
    },
    setAdvancedMetrics(state, action: PayloadAction<boolean>) {
      state.advancedMetricsExpanded = action.payload;
    },
    showTooltip(state, action: PayloadAction<string>) {
      state.tooltips[action.payload] = true;
    },
    hideTooltip(state, action: PayloadAction<string>) {
      state.tooltips[action.payload] = false;
    },
  },
});

export const {
  setNetwork,
  toggleAdvancedMetrics,
  setAdvancedMetrics,
  showTooltip,
  hideTooltip,
} = uiSlice.actions;

export default uiSlice.reducer;
