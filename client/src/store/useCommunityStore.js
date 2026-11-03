import { create } from "zustand";
export const useCommunityStore = create((set) => ({
  communities: [],
  setCommunities: (communities) => set({ communities }),
  toggleJoinCommunity: (id) => set((state) => ({
    communities: state.communities.map(
      (c) => c.id === id || c._id === id ? { ...c, isJoined: !c.isJoined } : c
    )
  }))
}));
