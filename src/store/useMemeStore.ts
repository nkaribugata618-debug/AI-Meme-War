import { create } from "zustand";

export interface CaptionStyle {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fontSize: number;
  color: string;
  outlineColor: string;
  outlineWidth: number;
  shadow: boolean;
  align: "left" | "center" | "right";
  fontFamily: string;
}

interface HistoryState {
  image: string | null;
  captions: CaptionStyle[];
}

export interface MemeStore {
  // Current State
  image: string | null;
  captions: CaptionStyle[];
  selectedCaptionId: string | null;
  
  // History State (Undo/Redo)
  history: HistoryState[];
  historyIndex: number;

  // Status
  isGenerating: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;
  
  // Actions
  setImage: (url: string) => void;
  addCaption: (caption?: Partial<CaptionStyle>) => void;
  updateCaption: (id: string, updates: Partial<CaptionStyle>) => void;
  removeCaption: (id: string) => void;
  setSelectedCaption: (id: string | null) => void;
  
  setGenerating: (status: boolean) => void;
  setSaving: (status: boolean) => void;
  setLastSavedAt: (date: Date) => void;

  // History Actions
  undo: () => void;
  redo: () => void;
  saveHistory: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const defaultCaption: Omit<CaptionStyle, "id"> = {
  text: "NEW CAPTION",
  x: 50,
  y: 50,
  width: 250,
  height: 60,
  rotation: 0,
  fontSize: 32,
  color: "#FFFFFF",
  outlineColor: "#000000",
  outlineWidth: 2,
  shadow: true,
  align: "center",
  fontFamily: "Impact, sans-serif",
};

export const useMemeStore = create<MemeStore>((set, get) => ({
  image: null,
  captions: [],
  selectedCaptionId: null,
  
  history: [{ image: null, captions: [] }],
  historyIndex: 0,

  isGenerating: false,
  isSaving: false,
  lastSavedAt: null,

  saveHistory: () => {
    const { image, captions, history, historyIndex } = get();
    // Slice history up to current index (removes forward history if we mutated after undo)
    const newHistory = history.slice(0, historyIndex + 1);
    
    // Only save if it actually changed
    const currentState = { image, captions: JSON.parse(JSON.stringify(captions)) };
    newHistory.push(currentState);

    // Keep history bounded to 20 to prevent memory leak
    if (newHistory.length > 20) newHistory.shift();

    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  setImage: (url) => {
    set({ image: url });
    get().saveHistory();
  },

  addCaption: (overrides) => {
    const newCaption = { id: generateId(), ...defaultCaption, ...overrides };
    set((state) => ({ captions: [...state.captions, newCaption], selectedCaptionId: newCaption.id }));
    get().saveHistory();
  },

  updateCaption: (id, updates) => {
    set((state) => ({
      captions: state.captions.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
    // We do NOT save history on every drag/update frame here. 
    // The component dragging should call saveHistory() specifically on dragEnd.
  },

  removeCaption: (id) => {
    set((state) => ({
      captions: state.captions.filter((c) => c.id !== id),
      selectedCaptionId: state.selectedCaptionId === id ? null : state.selectedCaptionId
    }));
    get().saveHistory();
  },

  setSelectedCaption: (id) => set({ selectedCaptionId: id }),
  setGenerating: (status) => set({ isGenerating: status }),
  setSaving: (status) => set({ isSaving: status }),
  setLastSavedAt: (date) => set({ lastSavedAt: date }),

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prevState = history[prevIndex];
      set({
        historyIndex: prevIndex,
        image: prevState.image,
        captions: JSON.parse(JSON.stringify(prevState.captions)),
        selectedCaptionId: null
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextState = history[nextIndex];
      set({
        historyIndex: nextIndex,
        image: nextState.image,
        captions: JSON.parse(JSON.stringify(nextState.captions)),
        selectedCaptionId: null
      });
    }
  }
}));
