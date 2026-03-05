import api from "./axios";


export const getMe = () => api.get("/game/me");
export const getPuzzle = () => api.get("/game/puzzle");
export const submitAnswer = (puzzleId, answer) =>
  api.post("/game/submit", { puzzleId, answer });
export const getLeaderboard = () => api.get("/game/leaderboard");