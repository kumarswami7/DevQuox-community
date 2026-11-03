import axios from "axios";
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  withCredentials: true,
  timeout: 1e4
});
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && token.trim() !== "" && token !== "mock-jwt-token-active") {
      config.headers.set("Authorization", `Bearer ${token}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const token = localStorage.getItem("token");
      if (token && token !== "mock-jwt-token-active") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    return Promise.reject(error);
  }
);
export default apiClient;
