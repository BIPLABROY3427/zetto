import axios from "axios";

// Create Axios Instance
const api = axios.create({
  baseURL: import.meta.env.VITE_SERVER || "http://localhost:5872",
  headers: {
    "Content-Type": "application/json",
  },
});

// ==============================
// REQUEST INTERCEPTOR
// ==============================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ==============================
// RESPONSE INTERCEPTOR
// ==============================
api.interceptors.response.use(
  (response) => {
    // ✅ AUTO TOKEN REPLACE
    const replaceToken = response?.data?.replaceToken;

    if (replaceToken) {
      localStorage.setItem("token", replaceToken);
      console.log("Token replaced automatically ✅");
    }

    // ✅ AUTO LOGOUT
    if (response?.data?.logout) {
      handleLogout();
    }

    return response;
  },
  (error) => {
    const status = error.response?.status;

    // ✅ 404 GLOBAL HANDLER
    if (status === 404) {
      window.location.replace("/404");
    }

    // ✅ 401 UNAUTHORIZED → AUTO LOGOUT
    if (status === 401) {
      handleLogout();
    }

    return Promise.reject(error);
  }
);

// ==============================
// LOGOUT FUNCTION
// ==============================
function handleLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  window.location.replace("/login");
}

export default api;
