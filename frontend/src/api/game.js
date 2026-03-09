import api from "./axios";

export const getMe = () => api.get("/game/me");
export const getPuzzle = () => api.get("/game/puzzle");
export const submitAnswer = (puzzleId, answer) =>
  api.post("/game/submit", { puzzleId, answer });
export const saveGameSession = (data) =>
  api.post("/game/session", data);
export const getProfile = () => api.get("/game/profile");
export const getLeaderboard = () => api.get("/game/leaderboard");
export const getHistory = () => api.get("/game/history");

// Cherry & Profile
export const useCherry = () => api.post("/game/use-cherry");
export const buyCherry = () => api.post("/game/buy-cherry");
export const updateProfilePic = (profilePic) =>
  api.patch("/game/profile-pic", { profilePic });

// Admin APIs
export const getAdminDashboard = () => api.get("/admin/dashboard");
export const getAdminUsers = () => api.get("/admin/users");
export const deleteAdminUser = (userId) => api.delete(`/admin/users/${userId}`);
export const updateUserRole = (userId, role) =>
  api.patch(`/admin/users/${userId}/role`, { role });