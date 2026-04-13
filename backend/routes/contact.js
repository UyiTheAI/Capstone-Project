const express    = require("express");
const router     = express.Router();
const nodemailer = require("nodemailer");

// ── Gmail transporter ──────────────────────────────────────────────────────
const getTransporter = () => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
  });
};

const wrap = (html) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:20px;background:#f0f0ec;font-family:Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)">
    <div style="background:#1a1a1a;padding:20px 32px;text-align:center">
      <div style="font-size:24px;font-weight:900;color:#f5b800;letter-spacing:3px">SHIFT-UP</div>
    </div>
    <div style="padding:32px">${html}</div>
    <div style="background:#f9f9f7;padding:14px 32px;text-align:center;font-size:11px;color:#aaa">
      © ${new Date().getFullYear()} SHIFT-UP · shift-up.netlify.app
    </div>
  </div>
</body></html>`;

// ── POST /api/contact ──────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message)
      return res.status(400).json({ success:false, message:"Name, email and message are required" });

    const transporter = getTransporter();

    if (!transporter) {
      console.log("⚠️  Gmail not configured — contact form submitted but email not sent");
      console.log(`   From: ${name} <${email}>`);
      console.log(`   Message: ${message}`);
      // Still return success so the UI works even without email configured
      return res.json({ success:true, message:"Message received! We'll get back to you within 1–2 business days." });
    }

    const adminEmail = process.env.GMAIL_USER;

    // 1. Notify admin (internal)
    await transporter.sendMail({
      from:    `"SHIFT-UP Contact" <${adminEmail}>`,
      to:      adminEmail,
      replyTo: email,
      subject: `📬 Contact Form: ${name}`,
      html: wrap(`
        <h2 style="margin:0 0 16px;color:#1a1a1a">New Contact Form Submission</h2>
        <div style="background:#f9f9f7;border-radius:10px;padding:16px;margin-bottom:16px">
          <table style="width:100%;border-collapse:collapse">
            <tr style="border-bottom:1px solid #eee">
              <td style="padding:8px 0;font-size:13px;color:#888;width:80px">Name</td>
              <td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">${name}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-size:13px;color:#888">Email</td>
              <td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">${email}</td>
            </tr>
          </table>
        </div>
        <div style="background:#f9f9f7;border-radius:10px;padding:16px">
          <div style="font-size:11px;font-weight:700;color:#aaa;text-transform:uppercase;margin-bottom:8px">Message</div>
          <div style="font-size:14px;color:#555;line-height:1.8;white-space:pre-wrap">${message}</div>
        </div>
        <p style="font-size:12px;color:#aaa;margin-top:16px">Reply to this email to respond to ${name}.</p>
      `),
    });

    // 2. Auto-reply to sender
    await transporter.sendMail({
      from:    `"SHIFT-UP" <${adminEmail}>`,
      to:      email,
      subject: `Thanks for reaching out — SHIFT-UP`,
      html: wrap(`
        <h2 style="margin:0 0 8px;color:#1a1a1a">Thanks, ${name}!</h2>
        <p style="color:#666;font-size:14px;line-height:1.7;margin:0 0 20px">
          We've received your message and will get back to you within 1–2 business days.
        </p>

        <div style="background:#f9f9f7;border-left:4px solid #f5b800;border-radius:0 10px 10px 0;padding:14px 18px;margin-bottom:20px">
          <div style="font-size:11px;font-weight:700;color:#aaa;text-transform:uppercase;margin-bottom:6px">Your Message</div>
          <div style="font-size:13px;color:#555;line-height:1.7;white-space:pre-wrap">${message}</div>
        </div>

        <div style="background:#f9f9f7;border-radius:10px;padding:16px;margin-bottom:20px">
          <div style="font-size:11px;font-weight:700;color:#aaa;text-transform:uppercase;margin-bottom:10px">While you wait</div>
          <div style="font-size:13px;color:#555;line-height:1.9">
            🚀 <strong>Try the app</strong> — Start your 7-day free trial<br/>
            👤 <strong>Demo login</strong> — owner@shiftup.com / password123<br/>
            📅 <strong>Features</strong> — Scheduling, swaps, tips, attendance & more
          </div>
        </div>

        <a href="https://shift-up.netlify.app"
           style="display:block;text-align:center;background:#f5b800;color:#1a1a1a;font-weight:800;font-size:15px;padding:14px;border-radius:10px;text-decoration:none;margin-bottom:14px">
          Visit SHIFT-UP →
        </a>
        <p style="text-align:center;font-size:12px;color:#aaa;margin:0">The SHIFT-UP Team</p>
      `),
    });

    console.log(`✅ Contact form email sent — from: ${name} <${email}>`);
    res.json({ success:true, message:"Message sent! We'll get back to you within 1–2 business days." });

  } catch (err) {
    console.error("Contact route error:", err.message);
    res.status(500).json({ success:false, message:"Failed to send message. Please try again." });
  }
});

module.exports = router;