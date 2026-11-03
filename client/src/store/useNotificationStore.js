import { create } from "zustand";
export const useNotificationStore = create((set) => ({
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(
      (n) => n.id === id || n._id === id ? { ...n, read: true } : n
    )
  }))
}));
