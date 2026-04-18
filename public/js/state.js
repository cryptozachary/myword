export const UI_STATES = {
  EMPTY: "empty",
  IDLE: "idle",
  DRAGGING: "dragging",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error"
};

const initialState = {
  currentFile: null,
  renderedHtml: "",
  stats: null,
  isLoading: false,
  isDragging: false,
  isDirty: false,
  error: null,
  uiState: UI_STATES.EMPTY
};

const state = { ...initialState };
const listeners = new Set();

export function getState() {
  return { ...state };
}

export function setState(updates) {
  Object.assign(state, updates);
  listeners.forEach((listener) => listener(getState()));
}

export function subscribe(listener) {
  listeners.add(listener);
  listener(getState());

  return () => {
    listeners.delete(listener);
  };
}
