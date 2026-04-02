import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

/**
 * OAuthCallback — handles BOTH modes:
 *
 * 1. Popup mode (window.opener exists):
 *    Posts the data back to the parent window then closes itself.
 *
 * 2. Redirect mode (opened directly):
 *    Reads ?data= param, stores token, redirects to portal.
 */
export default function OAuthCallback() {
  const { loginWithOAuthData } = useAuth();
  const [status, setStatus] = useState("processing");

  useEffect(() => {
    const params  = new URLSearchParams(window.location.search);
    const raw     = params.get("data");
    const errParam = params.get("error");

    if (errParam) {
      setStatus("error");
      // Tell opener about the failure then close
      if (window.opener) {
        window.opener.postMessage({ type: "OAUTH_ERROR", error: errParam }, window.location.origin);
        setTimeout(() => window.close(), 800);
      } else {
        setTimeout(() => { window.location.href = "/"; }, 2500);
      }
      return;
    }

    if (!raw) {
      setStatus("error");
      setTimeout(() => { window.location.href = "/"; }, 2500);
      return;
    }

    try {
      const parsed = JSON.parse(decodeURIComponent(raw));

      if (window.opener && !window.opener.closed) {
        // ── Popup mode: send token to parent, close popup ──────────
        window.opener.postMessage(
          { type: "OAUTH_SUCCESS", ...parsed },
          window.location.origin
        );
        setStatus("done");
        setTimeout(() => window.close(), 500);
      } else {
        // ── Redirect mode: store directly and go to portal ─────────
        loginWithOAuthData(parsed.token, parsed.user);
        window.location.href = "/";
      }
    } catch {
      setStatus("error");
      setTimeout(() => { window.location.href = "/"; }, 2500);
    }
  }, []);

  const styles = {
    wrap:    { minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f0f0ec", fontFamily:"'DM Sans', sans-serif" },
    spinner: { width:44, height:44, border:"4px solid #f5b800", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 20px" },
  };

  return (
    <div style={styles.wrap}>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
      {status === "error" ? (
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>❌</div>
          <div style={{ fontWeight:700, color:"#dc2626" }}>Sign-in failed. Redirecting…</div>
        </div>
      ) : status === "done" ? (
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
          <div style={{ fontWeight:700, color:"#16a34a" }}>Signed in! Closing…</div>
        </div>
      ) : (
        <div style={{ textAlign:"center" }}>
          <div style={styles.spinner} />
          <div style={{ fontWeight:600, color:"#888" }}>Signing you in…</div>
        </div>
      )}
    </div>
  );
}