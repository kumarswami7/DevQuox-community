import { create } from "zustand";

const storedUserStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
const storedToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
let parsedUser = null;
if (storedUserStr) {
  try {
    parsedUser = JSON.parse(storedUserStr);
  } catch {
    parsedUser = null;
  }
}
const hasValidToken = Boolean(storedToken && storedToken.trim() !== "" && storedToken !== "mock-jwt-token-active");

export const useAuthStore = create((set, get) => ({
  user: parsedUser || null,
  isAuthenticated: Boolean(parsedUser && hasValidToken),
  token: hasValidToken ? storedToken : null,
  isInitialized: false,
  isLoading: false,
  login: (user, token) => {
    localStorage.setItem("user", JSON.stringify(user));
    if (token) localStorage.setItem("token", token);
    set({ user, token: token || get().token, isAuthenticated: true, isInitialized: true });
  },
  logout: () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    set({ user: null, token: null, isAuthenticated: false, isInitialized: true });
  },
  updateUser: (updatedUser) => {
    const currentUser = get().user || {};
    const merged = { ...currentUser, ...updatedUser };
    localStorage.setItem("user", JSON.stringify(merged));
    set({ user: merged });
  },
  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const { authService } = await import("../services/authService");
      const res = await authService.getMe();
      const user = res.data?.data?.user || res.data?.user;
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
        set({ user, isAuthenticated: true, isInitialized: true, isLoading: false });
        return user;
      }
    } catch {
      // If token expired or invalid
      if (localStorage.getItem("token")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        set({ user: null, token: null, isAuthenticated: false, isInitialized: true, isLoading: false });
      } else {
        set({ isInitialized: true, isLoading: false });
      }
    }
  }
}));
// Devquox operates in Pure White Luxury Theme
localStorage.setItem("theme", "light");
document.documentElement.classList.remove("dark");

export const useThemeStore = create((set) => ({
  theme: "light",
  toggleTheme: () => set({ theme: "light" })
}));
export const useUIStore = create((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  activeModal: null,
  openModal: (modalId) => set({ activeModal: modalId }),
  closeModal: () => set({ activeModal: null })
}));

export * from "./useProjectStore";
