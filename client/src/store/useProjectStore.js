import { create } from "zustand";

export const useProjectStore = create((set, get) => ({
  projects: [],
  setProjects: (projects) => set({ projects }),
  bookmarkedProjectIds: [],
  setBookmarkedProjectIds: (ids) => set({ bookmarkedProjectIds: ids }),
  toggleBookmark: (id) =>
    set((state) => ({
      bookmarkedProjectIds: state.bookmarkedProjectIds.includes(id)
        ? state.bookmarkedProjectIds.filter((bId) => bId !== id)
        : [...state.bookmarkedProjectIds, id],
    })),
  isBookmarked: (id) => get().bookmarkedProjectIds.includes(id),
  stats: null,
  setStats: (stats) => set({ stats }),
}));

