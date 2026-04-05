# SHIFT-UP — Workforce Management System

A full-stack workforce management application for restaurants and small businesses. Manage employee schedules, shift swaps, tips, staff registration, attendance, and subscriptions — all in one place.

---

## 🌐 Live Demo

| Service | URL |
|---------|-----|
| Frontend | https://shift-up.netlify.app |
| Backend API | https://capstone-project-4-w5io.onrender.com/api/health |
| GitHub | https://github.com/Henil5204/Capstone-Project |

> ⚠️ Render backend (free tier) may take 30–60 seconds to wake up on first request.

---

## 🔑 Demo Credentials

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Owner | owner@shiftup.com | password123 | Full portal + Register Staff + Subscription |
| Manager | manager@shiftup.com | password123 | Dashboard, Schedule, Swaps, Register Employee |
| Employee | maria@shiftup.com | password123 | Schedule, Swap, Availability, Notifications |
| Employee | kevin@shiftup.com | password123 | Schedule, Swap, Availability, Notifications |

### Staff Hierarchy (seed data)
```
owner@shiftup.com (Owner)
├── registered → manager@shiftup.com
│     └── registered → kevin@shiftup.com
└── registered → maria@shiftup.com
```

- **Owner sees in Register Staff:** manager + maria
- **Manager sees in Register Employee:** kevin
- **Owner's schedule:** maria + kevin (full org)
- **Manager's schedule:** kevin only
- **Swap:** maria and kevin can swap with each other (same org)

---

## 💳 Stripe Payment

| Field | Value |
|-------|-------|
| Card Number | 4242 4242 4242 4242 |
| Expiry | 12/29 |
| CVC | 123 |
| ZIP | 12345 |

> Stripe is in **LIVE MODE**. Use a real card on production. Test card works locally only.
> After payment a confirmation email is sent with your login credentials.

---

## 🚀 Local Setup

### Prerequisites
- Node.js v18+, npm v9+
- MongoDB Atlas account
- Stripe account (test mode for local)
- Gmail account with App Password

### 1. Clone
```bash
git clone https://github.com/Henil5204/Capstone-Project.git
cd Capstone-Project
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in values (see below)
npm start
# → http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env   # fill in values (see below)
npm start
# → http://localhost:3000
```

### 4. Seed Database
```bash
cd backend
node seed.js
```
Creates: 1 owner, 1 manager, 2 employees, current week shifts, attendance records, 1 swap request, 4 notifications.

---

## 🔧 Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/shiftup
JWT_SECRET=your_long_random_secret
JWT_EXPIRE=7d
SESSION_SECRET=your_session_secret
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

GOOGLE_CLIENT_ID=from_google_cloud_console
GOOGLE_CLIENT_SECRET=from_google_cloud_console
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...

EMAIL_USER=your@gmail.com
EMAIL_PASS=16-char-gmail-app-password
```

### Frontend (`frontend/.env`)

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Production (Render + Netlify)

**Render env vars:**
```
STRIPE_SECRET_KEY     = sk_live_...
STRIPE_PRICE_ID       = price_1TIAygRpyU2rhUpUBJkTfBTQ
STRIPE_WEBHOOK_SECRET = whsec_...
FRONTEND_URL          = https://shift-up.netlify.app
NODE_ENV              = production
```

**Netlify env vars:**
```
REACT_APP_API_URL                = https://capstone-project-4-w5io.onrender.com/api
REACT_APP_STRIPE_PUBLISHABLE_KEY = pk_live_...
```

---

## 👥 How Staff Gets Access

1. Owner registers via **Get Started** → pays → logs in
2. Owner clicks **Register Staff** → creates manager and employee accounts
3. Manager clicks **Register Employee** → creates employee accounts
4. Staff log in with their email and temporary password
5. Staff can change their password from **Profile → Password tab**

> There is NO public registration page. All accounts are created by owner or manager.

---

## ✨ Features

### Authentication
- Three-portal login: Employee / Manager / Owner
- Google OAuth (role-based)
- JWT with 7-day expiry
- No public registration

### Payment & Subscription
- 7-day free trial via Stripe SetupIntent (card saved, $0 today)
- Account created **only after** payment confirmed
- Credentials emailed automatically after registration
- $5 CAD/month after trial
- Cancel anytime from **Owner Profile → Subscription tab**
- Cancellation email sent automatically

### Org Data Isolation
- Each owner sees only their own org's data
- Owner creates managers + employees (`orgOwner` field tracks root)
- Manager sees only employees they registered
- Owner's schedule shows all org employees (own + manager's)
- All features (schedule, swaps, tips, attendance) scoped to org

### Scheduling
- Weekly grid with draft → publish workflow
- Preset times (Morning, Day, Swing, Evening, Night)
- Role and area tagging
- Copy previous week as drafts
- Employees notified on publish

### Shift Swap
- 3-step flow: select shift → select org employee → confirm
- Manager approves/rejects with comment
- Both employees notified on outcome

### Attendance
- Quick mark from Employee Overview (Present / Late / No-Show)
- Auto-updates coverage % and no-show count on employee
- Date-range staff report with hours and payroll estimate
- CSV export

### Tips
- Owner/Manager distributes tips (equal or manual split)
- Employee sees tip history with totals in Notifications → Tips tab

### Profile
- Photo upload (max 2MB) from all portals
- In-app password change (requires current password)
- Owner subscription management with cancel

### Other
- 9 language support (EN, ES, FR, PT, HI, JA, ZH, MR, KO)
- Real-time notification badge
- Tip history in employee Notifications tab

---

## 📁 Project Structure

```
Capstone-Project/
├── backend/
│   ├── config/           # DB + Passport OAuth
│   ├── middleware/        # JWT auth
│   ├── models/            # Mongoose schemas
│   ├── routes/            # Express API routes
│   ├── utils/             # getMyEmployees org helper
│   ├── seed.js            # Demo data seeder
│   └── server.js          # Entry point
│
└── frontend/src/
    ├── context/           # Auth + Language
    ├── components/        # ProfileCard, ChangePassword
    └── pages/
        ├── homepage/      # Home, Pricing, GetStartedModal
        ├── employee_login/# Login, OAuthCallback
        ├── payment/       # PaymentPage (Stripe)
        ├── subscription/  # SubscriptionRedirects
        ├── employee_portal/
        └── manager_portal/
```

---

## 🚢 Deployment

### Render (Backend)
| Setting | Value |
|---------|-------|
| Root Directory | backend |
| Build Command | npm install |
| Start Command | node server.js |

### Netlify (Frontend)
| Setting | Value |
|---------|-------|
| Base Directory | frontend |
| Build Command | npm run build |
| Publish Directory | frontend/build |

### Post-deploy checklist
1. Update `FRONTEND_URL` in Render → Netlify URL
2. Update `GOOGLE_CALLBACK_URL` in Render → Render backend URL
3. Update `REACT_APP_API_URL` in Netlify → Render URL + `/api`
4. Redeploy both after env var changes
5. Run `node seed.js` against production DB

---

## 🔌 Key API Endpoints

| Endpoint | Auth | Description |
|----------|------|-------------|
| POST /api/auth/login | No | Login all roles |
| PUT /api/auth/change-password | JWT | Change password |
| POST /api/subscription/setup-intent | No | Stripe SetupIntent |
| POST /api/subscription/register-and-activate | No | Register owner after payment |
| POST /api/subscription/cancel | JWT Owner | Cancel subscription |
| GET /api/users | JWT Mgr/Owner | Direct-registered staff |
| GET /api/users/employees | JWT Mgr/Owner | All org employees |
| GET /api/users/org-employees | JWT | Same-org employees (for swap) |
| POST /api/users/create-employee | JWT Mgr/Owner | Register staff |
| GET /api/shifts/week | JWT | Org-scoped weekly shifts |
| POST /api/shifts/publish | JWT Mgr/Owner | Publish + notify employees |
| GET /api/swaps | JWT | Org-scoped swap requests |
| POST /api/swaps | JWT Employee | Submit swap request |
| PUT /api/swaps/:id/approve | JWT Mgr/Owner | Approve swap |
| GET /api/attendance/summary | JWT Mgr/Owner | Attendance overview |
| GET /api/attendance/report | JWT Mgr/Owner | Date-range report |
| POST /api/attendance | JWT Mgr/Owner | Mark attendance |
| GET /api/tips/mine | JWT Employee | My tip history |
| POST /api/tips | JWT Owner/Mgr | Distribute tips |

---

## 🛠 Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend 404 | Check all routes in server.js. Ensure `attendance.js` is registered. |
| Login 500 | Check `backend/models/User.js` has `matchPassword` method. |
| No employees in schedule | Run `node seed.js` or register employees via Register Staff tab. |
| Stripe form not loading | Check `REACT_APP_STRIPE_PUBLISHABLE_KEY` in frontend .env. |
| Stripe 400 SetupIntent | Stale intent — backend now cancels old ones before creating new. |
| Payment method not attached | Backend retrieves setupIntent from Stripe to get actual PM ID. |
| No email after payment | Set `EMAIL_USER` and `EMAIL_PASS` (Gmail App Password) in .env. |
| Cannot see staff | Staff filtered by `createdBy`. Login as the account that registered them. |
| New owner sees no data | Correct — register staff first via Register Staff tab. |
| utils not found | Create `backend/utils/` folder and copy `getMyEmployees.js` into it. |
| Render slow to load | Free tier spins down — wait 30–60s on first request. |

---

## 👨‍💻 Author

**Henil Patel** — Capstone Project, Semester 6