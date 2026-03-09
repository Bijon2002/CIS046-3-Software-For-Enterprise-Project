import api from "./axios";

export const registerUser = (nickname, email, password) =>
  api.post("/auth/register", { nickname, email, password });

export const loginUser = (email, password) =>
  api.post("/auth/login", { email, password });