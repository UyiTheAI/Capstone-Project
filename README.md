# SHIFT-UP – Full Stack Workforce Management App

> A complete workforce scheduling platform for restaurants and shift-based businesses.  
> Built with React 18 (frontend) + Node.js/Express/MongoDB (backend).

---

## 📁 Project Structure

```
Capstone-Project/
├── backend/
│   ├── config/
│   │   ├── db.js                  ← MongoDB Atlas connection
│   │   └── passport.js            ← Google + Apple OAuth strategies
│   ├── middleware/
│   │   ├── auth.js                ← JWT protect + authorize + generateToken
│   │   ├── errorHandler.js        ← Global error handler
│   │   └── logger.js              ← Request logger
│   ├── models/
│   │   ├── User.js                ← User schema (+ googleId, appleId, avatar)
│   │   ├── Shift.js               ← Shift schema
│   │   ├── SwapRequest.js         ← Swap request schema
│   │   ├── Notification.js        ← Notification schema
│   │   ├── Attendance.js          ← Attendance schema
│   │   └── tip.js                 ← Tip distribution schema
│   ├── routes/
│   │   ├── auth.js                ← register, login, /me, Google + Apple OAuth
│   │   ├── shifts.js              ← CRUD shifts, /week, /today, /publish
│   │   ├── swaps.js               ← GET/POST swaps, approve/reject
│   │   ├── notifications.js       ← GET, mark read, delete
│   │   ├── users.js               ← employees list, reports, availability
│   │   ├── dashboard.js           ← Manager dashboard summary
│   │   └── tips.js                ← Tip distribution CRUD
│   ├── .env                       ← Environment variables (never commit)
│   ├── .env.example               ← Template for .env
│   ├── package.json
│   ├── server.js                  ← Express app entry point
│   └── seed.js                    ← Database seeder with full demo data
│
└── frontend/
    └── src/
        ├── api.js                 ← Axios client with JWT interceptor
        ├── App.js                 ← Root component + routing
        ├── App.css                ← Global design system
        ├── context/
        │   ├── AuthContext.jsx    ← Auth state + popup OAuth login
        │   ├── LanguageContext.jsx← i18n context + Google Font loader
        │   └── translations.js   ← 9-language translation strings
        ├── components/
        │   └── LanguageSwitcher.jsx ← Language dropdown (9 languages)
        └── pages/
            ├── homepage/
            │   └── Home.jsx             ← Landing page with language switcher
            ├── employee_login/
            │   ├── Login.jsx            ← Login + portal picker + Google/Apple
            │   ├── Register.jsx         ← Registration + Google/Apple
            │   └── OAuthCallback.jsx    ← Handles OAuth popup/redirect
            ├── employee_portal/
            │   ├── EmployeePortal.jsx
            │   ├── Schedule.jsx
            │   ├── ShiftSwap.jsx
            │   ├── Availability.jsx
            │   └── Notifications.jsx
            └── manager_portal/
                ├── ManagerPortal.jsx
                ├── ManagerDashboard.jsx
                ├── ManagerSchedule.jsx
                ├── SwapApprovals.jsx
                ├── StaffReport.jsx
                ├── EmployeeOverview.jsx
                └── TipManager.jsx       ← Owner only
```

---

## 🚀 Setup & Running

### Prerequisites
- Node.js 16+
- MongoDB Atlas account

### 1. Backend Setup

```bash
cd backend
npm install
```

Edit `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/shiftup
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d
SESSION_SECRET=your_session_secret_here
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Optional — leave blank to disable Google login
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

```bash
# Seed demo data
node seed.js

# Start server
npm start
```

Backend runs on: `http://localhost:5000`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend runs on: `http://localhost:3000`

---

## 🌐 Multi-Language Support

The app supports **9 languages** selectable from any page before or after login:

| Code | Language   | Script     |
|------|------------|------------|
| en   | English    | Latin      |
| es   | Español    | Latin      |
| fr   | Français   | Latin      |
| pt   | Português  | Latin      |
| hi   | हिंदी      | Devanagari |
| ja   | 日本語      | Japanese   |
| zh   | 中文        | Chinese    |
| mr   | मराठी      | Devanagari |
| ko   | 한국어      | Korean     |

Each language has 300+ translation keys covering every label, button, status, role name, and error message in the app. Language-specific Google Fonts are loaded dynamically.

---

## 🔑 API Endpoints

### Auth — `/api/auth`
| Method | Endpoint              | Access | Description              |
|--------|-----------------------|--------|--------------------------|
| POST   | /register             | Public | Register new user        |
| POST   | /login                | Public | Login + get JWT          |
| GET    | /me                   | Any    | Get my profile           |
| PUT    | /me                   | Any    | Update my profile        |
| GET    | /google               | Public | Start Google OAuth       |
| GET    | /google/callback      | Public | Google OAuth callback    |
| GET    | /apple                | Public | Start Apple OAuth        |
| POST   | /apple/callback       | Public | Apple OAuth callback     |

### Shifts — `/api/shifts`
| Method | Endpoint   | Access    | Description                       |
|--------|------------|-----------|-----------------------------------|
| GET    | /          | Any       | Get shifts (filtered by role)     |
| GET    | /week      | Any       | Get shifts for a date range       |
| GET    | /today     | Mgr/Owner | Today's coverage                  |
| POST   | /          | Mgr/Owner | Create shift                      |
| PUT    | /:id       | Mgr/Owner | Update shift                      |
| DELETE | /:id       | Mgr/Owner | Delete shift                      |
| POST   | /publish   | Mgr/Owner | Publish drafts + notify employees |

### Swap Requests — `/api/swaps`
| Method | Endpoint     | Access    | Description         |
|--------|--------------|-----------|---------------------|
| GET    | /            | Any       | Get swap requests   |
| POST   | /            | Employee  | Submit swap request |
| PUT    | /:id/approve | Mgr/Owner | Approve swap        |
| PUT    | /:id/reject  | Mgr/Owner | Reject swap         |

### Notifications — `/api/notifications`
| Method | Endpoint  | Access | Description          |
|--------|-----------|--------|----------------------|
| GET    | /         | Any    | Get my notifications |
| PUT    | /:id/read | Any    | Mark one as read     |
| PUT    | /read-all | Any    | Mark all as read     |
| DELETE | /:id      | Any    | Delete notification  |

### Users — `/api/users`
| Method | Endpoint         | Access    | Description           |
|--------|------------------|-----------|-----------------------|
| GET    | /employees       | Any       | All employees + stats |
| GET    | /reports/weekly  | Mgr/Owner | Hours & cost report   |
| PUT    | /me/availability | Employee  | Update availability   |

### Dashboard — `/api/dashboard`
| Method | Endpoint | Access    | Description            |
|--------|----------|-----------|------------------------|
| GET    | /        | Mgr/Owner | Manager dashboard data |

### Tips — `/api/tips`
| Method | Endpoint | Access | Description                  |
|--------|----------|--------|------------------------------|
| GET    | /        | Owner  | All tip records              |
| GET    | /mine    | Any    | My own tip history           |
| POST   | /        | Owner  | Distribute tips to employees |
| DELETE | /:id     | Owner  | Delete a tip record          |

---

## 👤 Demo Accounts

Run `node seed.js` first, then log in with:

| Role     | Email                | Password    |
|----------|----------------------|-------------|
| Employee | maria@shiftup.com    | password123 |
| Employee | kevin@shiftup.com    | password123 |
| Employee | sarah@shiftup.com    | password123 |
| Employee | john@shiftup.com     | password123 |
| Employee | terry@shiftup.com    | password123 |
| Employee | priya@shiftup.com    | password123 |
| Employee | alex@shiftup.com     | password123 |
| Manager  | manager@shiftup.com  | password123 |
| Owner    | owner@shiftup.com    | password123 |

---

## 🧩 Feature Overview

### Employee Portal
| Feature | Description |
|---|---|
| **Schedule** | 7-column weekly calendar with color-coded shift blocks. Shows time, area, role, duration. Week and list views. |
| **Shift Swap** | Select a shift, propose a coworker, provide a reason. View all past requests with manager comments and status. |
| **Availability** | 7-day × 3 time-slot grid (morning/afternoon/evening). Set Full-Time, Part-Time, or On-Call status. |
| **Notifications** | Inbox for swap approvals, rejections, schedule publishes, and tip distributions. Mark read/unread, delete. |

### Manager Portal
| Feature | Description |
|---|---|
| **Dashboard** | Today's coverage, pending swaps, weekly hours with estimated cost, and shift alerts. |
| **Schedule Planner** | Drag-style shift creation per employee per day. Copy previous week, publish drafts, notify all employees. |
| **Swap Approvals** | Review pending requests with reason and coverage notes. Approve or reject with optional comment. |
| **Staff Reports** | Date-range filtered table — hours, cost, no-shows, swap count per employee. Export CSV. |
| **Employee Overview** | All employees with coverage %, no-shows, swap requests, last attendance, availability type. |

### Owner-Only
| Feature | Description |
|---|---|
| **Tip Manager** | Record tips by date and total amount. Equal split or manual entry per employee. History with delete. Auto-notifies all employees on distribution. |

---

## 🔐 Google OAuth Setup (optional)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → **APIs & Services** → **Credentials**
3. Create **OAuth 2.0 Client ID** → Web application
4. Add Authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
5. Copy Client ID and Secret into `backend/.env`

The app works fine without Google OAuth — email/password login always works.

---

## 🔒 Security

- Passwords hashed with **bcrypt** (10 salt rounds)
- **JWT tokens** in `localStorage`, sent via Authorization header
- Auto-logout on `401 Unauthorized`
- Role-based access: `employee` → `manager` → `owner`
- OAuth users get a random placeholder password — they can only log in via Google/Apple
- CORS restricted to `localhost:3000` in development

---

## 🎨 Design System

| Token | Value |
|---|---|
| Primary yellow | `#f5b800` |
| Dark | `#1a1a1a` |
| Background | `#f0f0ec` |
| Heading font | Bebas Neue |
| Body font | DM Sans |
| CSS class prefix | `su-` |

---

## 🗄️ Database Models

| Model | Key Fields |
|---|---|
| **User** | firstName, lastName, email, password, role, position, availability, availabilitySchedule, noShows, coveragePercent, googleId, appleId, avatar |
| **Shift** | employee, date, startTime, endTime, timeLabel, role, area, status, isDraft, publishedAt |
| **SwapRequest** | requester, proposedEmployee, shift, shiftDate, shiftTime, reason, status, managerComment |
| **Notification** | recipient, type, title, message, read, relatedSwap |
| **Attendance** | employee, shift, date, status, clockIn, clockOut, hoursWorked |
| **Tip** | date, totalAmount, splitMethod, note, recordedBy, distributions[ {employee, amount} ] |

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Axios, Lucide React |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT + bcryptjs + Passport.js |
| OAuth | passport-google-oauth20, passport-apple |
| Session | express-session (OAuth flow only) |
| Fonts | Google Fonts (Bebas Neue, DM Sans, Noto Sans family) |
| Dev Tools | nodemon, dotenv |

---

## 📝 Changelog

| Version | Changes |
|---|---|
| v1.0 | Initial full-stack build — auth, shifts, swaps, notifications |
| v1.1 | Fixed ObjectId cast error on swap requests |
| v1.2 | Opened `/api/users/employees` to all authenticated roles |
| v1.3 | Redesigned Schedule — week grid, color-coded blocks, stats bar |
| v1.4 | Added Tip Manager — owner-only tip distribution with notifications |
| v1.5 | MongoDB Atlas connection configured |
| v1.6 | Fixed notifications route (was returning dashboard data) |
| v1.7 | Fixed users route ordering (/me before /:id) |
| v1.8 | Fixed ManagerSchedule isEdit crash + t variable shadowing bugs |
| v1.9 | Added 9-language i18n — en, es, fr, pt, hi, ja, zh, mr, ko |
| v2.0 | Added Google + Apple OAuth login via popup window |
| v2.1 | Language switcher on Login, Register, and Home pages |
| v2.2 | Expanded seed data — 9 users, 31 shifts, tips, attendance |