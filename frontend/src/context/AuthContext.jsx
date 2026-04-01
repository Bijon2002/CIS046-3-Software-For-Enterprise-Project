import { createContext, useEffect, useState } from "react";
import { getMe } from "../api/game";

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
        localStorage.setItem("token", token);
        getMe()
          .then(res => setUser(res.data))
          .catch(err => console.error("Failed to load global user", err));
    } else {
        localStorage.removeItem("token");
        setUser(null);
    }
  }, [token]);

  const logout = () => {
      setToken("");
      setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, setToken, logout, user }}>
      {children}
    </AuthContext.Provider>
  );
}