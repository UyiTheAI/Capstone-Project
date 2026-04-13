import React, { useState } from "react";
import api from "../api";

export default function ContactForm() {
  const [form,        setForm]        = useState({ name:"", email:"", message:"" });
  const [loading,     setLoading]     = useState(false);
  const [success,     setSuccess]     = useState("");
  const [error,       setError]       = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) { setError("Please fill in all fields."); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      const res = await api.post("/contact", form);
      setSuccess(res.data.message || "Message sent! We'll get back to you within 1–2 business days.");
      setForm({ name:"", email:"", message:"" });
    } catch(err) {
      setError(err.response?.data?.message || "Failed to send. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <section id="contact" className="contact-section">
      <div className="contact-container">
        <h2 className="section-title">Get In Touch</h2>
        <p className="section-sub">
          Have a question about SHIFT-UP? We'll get back to you within 1–2 business days.
        </p>

        <form className="contact-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Your Name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name:e.target.value }))}
            required
          />
          <input
            type="email"
            placeholder="Your Email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email:e.target.value }))}
            required
          />
          <textarea
            placeholder="Your message…"
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message:e.target.value }))}
            required
          />

          {error   && <div className="contact-error">⚠️ {error}</div>}
          {success && <div className="contact-success">✅ {success}</div>}

          <button type="submit" className="contact-submit" disabled={loading}>
            {loading ? "Sending…" : "Send Message →"}
          </button>
        </form>
      </div>
    </section>
  );
}