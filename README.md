# SHIFT-UP — Workforce Management App

A full-stack workforce management application built for restaurants and small businesses. Manage employee schedules, shift swaps, tips, and staff accounts — all in one place.

---

## 🌐 Live Demo

| Service | URL |
|---------|-----|
| Frontend | https://shift-up.netlify.app |
| Backend API | https://capstone-project-4-w5io.onrender.com/api/health |

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@shiftup.com | password123 |
| Manager | manager@shiftup.com | password123 |
| Employee | maria@shiftup.com | password123 |

> Run `node seed.js` inside the `backend/` folder to populate the database with demo data.

---

## ✨ Features

### Authentication
- Email + password login for Employee, Manager, and Owner portals
- Google OAuth popup login (role-based)
- Forgot password / reset via email link
- JWT authentication with 7-day token expiry

### Payment & Subscription
- **7-day free trial** — card saved via Stripe SetupIntent, no charge until trial ends
- **$5 CAD/month** after trial — billed automatically via Stripe
- Account created **only after successful payment**
- Confirmation email sent after trial starts
- Cancel subscription anytime from settings

### Owner Portal
- Full manager portal access + owner-only features
- **Register Staff tab** — create Employee and Manager accounts
- Tip manager with employee notifications
- Subscription management

### Manager Portal
- **Register Employee tab** — create new employee accounts
- Weekly schedule planner (drag, create, edit, delete shifts)
- Copy previous week's schedule
- Publish drafts — employees get notified
- Shift swap approvals
- Staff reports with CSV export
- Employee overview and performance tracking

### Employee Portal
- View weekly schedule
- Submit shift swap requests
- Set availability preferences
- Notifications inbox (shifts, swaps, tips)

### Other Features
- 9 language support (EN, ES, FR, PT, HI, JA, ZH, MR, KO)
- Profile photo upload (base64, max 2MB)
- Real-time notifications
- Tip distribution with per-employee notifications

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Axios, Stripe.js |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT, Passport.js (Google OAuth) |
| Payments | Stripe (SetupIntent + Subscriptions) |
| Email | Nodemailer + Gmail |
| Deployment | Netlify (frontend) + Render (backend) |

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Stripe account (test mode)
- Google Cloud Console OAuth credentials

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Fill in your .env values
npm start
```

### Frontend
```bash
cd frontend
npm install
# Create frontend/.env with:
# REACT_APP_API_URL=http://localhost:5000/api
# REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
npm start
```

### Seed Database
```bash
cd backend
node seed.js
```

---

## 🔧 Environment Variables

### Backend `.env`
```env
PORT=5000
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
SESSION_SECRET=your_session_secret
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...

EMAIL_USER=your@gmail.com
EMAIL_PASS=your_gmail_app_password
```

### Frontend `.env`
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## 📁 Project Structure

```
Capstone-Project/
├── backend/
│   ├── config/         # DB + Passport config
│   ├── middleware/      # JWT auth + error handler
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express API routes
│   ├── seed.js          # Database seeder
│   └── server.js        # Entry point + Stripe webhook
│
└── frontend/
    └── src/
        ├── context/     # Auth + Language context
        ├── components/  # Shared components
        └── pages/
            ├── homepage/         # Landing + pricing + get started
            ├── employee_login/   # Login + forgot/reset password
            ├── payment/          # Stripe payment page
            ├── subscription/     # Subscription management
            ├── employee_portal/  # Employee dashboard
            └── manager_portal/   # Manager/Owner dashboard
```

---

## 💳 Test Stripe Payments

Use these test card details on the payment page:

```
Card Number:  4242 4242 4242 4242
Expiry:       12/29
CVC:          123
ZIP:          12345
```

No real money is charged in test mode.

---

## 👥 How Staff Gets Access

1. **Owner** registers via Get Started → pays → logs in
2. Owner goes to **Register Staff** tab → creates employee/manager accounts
3. Staff receive their email + temporary password from the owner
4. Staff log in via the Login page → directed to their portal

> There is no public registration page — all staff accounts are created by the owner or manager.

---

## 🌍 Supported Languages

English · Español · Français · Português · हिन्दी · 日本語 · 中文 · मराठी · 한국어

---

## 📦 Deployment

### Render (Backend)
- Root: `backend`
- Build: `npm install`
- Start: `node server.js`
- Add all environment variables in Render dashboard

### Netlify (Frontend)
- Base: `frontend`
- Build: `npm run build`
- Publish: `frontend/build`
- Add `REACT_APP_API_URL` and `REACT_APP_STRIPE_PUBLISHABLE_KEY` in Netlify environment variables

---

## 👨‍💻 Author

**Henil Patel** — Capstone Project, Semester 6