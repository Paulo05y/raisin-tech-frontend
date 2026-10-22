import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8081",
});

// Antes de cada requisição, anexa o token salvo (se existir)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Se o backend responder 401 (token inválido/expirado), limpa a sessão e volta pro login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const ehLogin = error.config?.url?.includes("/api/usuarios/login");

    if (error.response?.status === 401 && !ehLogin) {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default api;