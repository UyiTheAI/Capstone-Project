import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(() => {
    try { const s = localStorage.getItem("shiftup_user"); return s ? JSON.parse(s) : null; }
    catch { return null; }
  });
  const [loading,   setLoading]   = useState(true);
  const [showTrial, setShowTrial] = useState(false);
  const popupRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("shiftup_token");
    if (token) {
      api.get("/auth/me")
        .then(res => { _persist(token, res.data.user); _checkTrial(res.data.user); })
        .catch(() => { localStorage.removeItem("shiftup_token"); localStorage.removeItem("shiftup_user"); setUser(null); })
        .finally(() => setLoading(false));
    } else { setLoading(false); }
  }, []);

  // Show trial prompt once per session for owner/manager with no subscription
  const _checkTrial = (u) => {
    if (!u) return;
    if (!["owner","manager"].includes(u.role)) return;
    if (u.subscriptionStatus === "active") return;
    const key = `shiftup_trial_shown_${u.id || u._id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    setTimeout(() => setShowTrial(true), 800); // slight delay after login
  };

  useEffect(() => {
    const handler = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "OAUTH_SUCCESS") {
        _persist(event.data.token, event.data.user);
        _checkTrial(event.data.user);
        if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const _persist = (token, userData) => {
    localStorage.setItem("shiftup_token", token);
    localStorage.setItem("shiftup_user", JSON.stringify(userData));
    setUser(userData);
  };

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    _persist(res.data.token, res.data.user);
    _checkTrial(res.data.user);
    return res.data.user;
  };

  const register = async (data) => {
    const res = await api.post("/auth/register", data);
    _persist(res.data.token, res.data.user);
    _checkTrial(res.data.user);
    return res.data.user;
  };

  const loginWithPopup = (url) => {
    const w = 520, h = 620;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top  = window.screenY + (window.outerHeight - h) / 2;
    popupRef.current = window.open(url, "shiftup_oauth",
      `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no`);
  };

  const loginWithOAuthData = (token, userData) => { _persist(token, userData); _checkTrial(userData); };
  const logout       = () => { localStorage.removeItem("shiftup_token"); localStorage.removeItem("shiftup_user"); setUser(null); setShowTrial(false); };
  const updateUser   = (u) => { setUser(u); localStorage.setItem("shiftup_user", JSON.stringify(u)); };
  const dismissTrial = () => setShowTrial(false);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, loginWithPopup, loginWithOAuthData, updateUser, showTrial, dismissTrial }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);