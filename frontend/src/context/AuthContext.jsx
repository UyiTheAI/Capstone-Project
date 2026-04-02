import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(() => { try { const s = localStorage.getItem("shiftup_user"); return s ? JSON.parse(s) : null; } catch { return null; } });
  const [loading, setLoading] = useState(true);
  const popupRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("shiftup_token");
    if (token) {
      api.get("/auth/me")
        .then((res) => { setUser(res.data.user); localStorage.setItem("shiftup_user", JSON.stringify(res.data.user)); })
        .catch(() => { localStorage.removeItem("shiftup_token"); localStorage.removeItem("shiftup_user"); setUser(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Listen for postMessage from OAuth popup
  useEffect(() => {
    const handler = (event) => {
      // Only accept messages from same origin
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === "OAUTH_SUCCESS") {
        const { token, user: userData } = event.data;
        if (token && userData) {
          _persist(token, userData);
        }
        if (popupRef.current && !popupRef.current.closed) {
          popupRef.current.close();
        }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const _persist = (token, user) => {
    localStorage.setItem("shiftup_token", token);
    localStorage.setItem("shiftup_user", JSON.stringify(user));
    setUser(user);
  };

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    _persist(res.data.token, res.data.user);
    return res.data.user;
  };

  const register = async (formData) => {
    const res = await api.post("/auth/register", formData);
    _persist(res.data.token, res.data.user);
    return res.data.user;
  };

  // Open OAuth in a centered popup — avoids leaving the React app
  const loginWithPopup = (url) => {
    const w = 520, h = 620;
    const left = window.screenX + (window.outerWidth  - w) / 2;
    const top  = window.screenY + (window.outerHeight - h) / 2;
    const popup = window.open(
      url,
      "shiftup_oauth",
      `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`
    );
    popupRef.current = popup;
  };

  // Fallback for OAuthCallback in redirect mode
  const loginWithOAuthData = (token, userData) => {
    _persist(token, userData);
  };

  const logout = () => {
    localStorage.removeItem("shiftup_token");
    localStorage.removeItem("shiftup_user");
    setUser(null);
  };

  const updateUser = (updated) => {
    setUser(updated);
    localStorage.setItem("shiftup_user", JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, loginWithPopup, loginWithOAuthData, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);