import axios from "axios";

/**
 * Resolves the backend API base URL.
 * Automatically switches to production Vercel backend if deployed on a non-localhost domain.
 */
export const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  // If explicitly configured with a non-localhost URL, use it
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    return envUrl;
  }
  // When running deployed in production (e.g. *.vercel.app) and envUrl is missing or points to localhost
  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    return "https://dev-quox-community-bb6g.vercel.app/api/v1";
  }
  return envUrl || "http://localhost:5000/api/v1";
};

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  timeout: 15000,
});

apiClient.interceptors.request.use(
  (config) => {
    // Ensure deployed frontend never hits localhost
    if (
      typeof window !== "undefined" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      if (!config.baseURL || config.baseURL.includes("localhost") || config.baseURL.includes("127.0.0.1")) {
        config.baseURL = getApiBaseUrl();
      }
    }
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
