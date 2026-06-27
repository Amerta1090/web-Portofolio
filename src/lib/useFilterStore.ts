import { create } from "zustand";

interface FilterState {
  activeCategory: string;
  searchQuery: string;
  setActiveCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>()((set) => ({
  activeCategory: "",
  searchQuery: "",
  setActiveCategory: (category) => set({ activeCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  resetFilters: () => set({ activeCategory: "", searchQuery: "" }),
}));
