import React, { useEffect } from "react";

/**
 * OAuthCallback — handles Google OAuth redirect.
 * Extracts token+user from URL, posts to parent window, then closes popup.
 */
export default function OAuthCallback() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const raw    = params.get("data");
      if (!raw) { window.close(); return; }

      const { token, user } = JSON.parse(decodeURIComponent(raw));
      if (!token || !user)  { window.close(); return; }

      // Store in localStorage so parent can read
      localStorage.setItem("shiftup_token", token);
      localStorage.setItem("shiftup_user",  JSON.stringify(user));

      // If in popup — post message to parent
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type:"OAUTH_SUCCESS", token, user }, window.location.origin);
        setTimeout(() => window.close(), 300);
      } else {
        // If not in popup — redirect to home
        window.location.href = "/";
      }
    } catch (err) {
      console.error("OAuthCallback error:", err);
      window.location.href = "/login?error=oauth_failed";
    }
  }, []);

  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", fontFamily:"sans-serif", background:"#f0f0ec" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:40, height:40, border:"4px solid #f5b800", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 16px" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ color:"#888", fontSize:15 }}>Completing sign in…</div>
      </div>
    </div>
  );
}