import api from "./api";

export async function login(email, senha) {
  const response = await api.post("/api/usuarios/login", { email, senha });
  const { token, nome, email: userEmail, perfil } = response.data;

  localStorage.setItem("token", token);
  localStorage.setItem("usuario", JSON.stringify({ nome, email: userEmail, perfil }));

  return response.data;
}

export async function cadastrar(dados) {
  // dados = { nome, email, senha, perfil }
  const response = await api.post("/api/usuarios/cadastro", dados);
  return response.data;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
}

export function getUsuarioLogado() {
  const usuario = localStorage.getItem("usuario");
  return usuario ? JSON.parse(usuario) : null;
}