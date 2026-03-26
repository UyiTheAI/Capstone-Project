# SHIFT-UP – Full Stack Workforce Management App

> A complete workforce scheduling platform for restaurants and shift-based businesses.  
> Built with React (frontend) + Node.js/Express/MongoDB (backend).

---

## 📁 Project Structure

```
shiftup/
├── backend/
│   ├── config/
│   │   └── db.js                  ← MongoDB Atlas connection
│   ├── middleware/
│   │   ├── auth.js                ← JWT protect + authorize + generateToken
│   │   ├── errorHandler.js        ← Global error handler
│   │   └── logger.js              ← Request logger
│   ├── models/
│   │   ├── User.js                ← User schema (employee/manager/owner)
│   │   ├── Shift.js               ← Shift schema
│   │   ├── SwapRequest.js         ← Swap request schema (shift optional)
│   │   ├── Notification.js        ← Notification schema
│   │   ├── Attendance.js          ← Attendance schema
│   │   └── Tip.js                 ← Tip distribution schema (NEW)
│   ├── routes/
│   │   ├── auth.js                ← POST /register, POST /login, GET /me
│   │   ├── shifts.js              ← CRUD shifts, /week, /today, /publish
│   │   ├── swaps.js               ← GET/POST swaps, approve/reject
│   │   ├── notifications.js       ← GET, mark read, delete
│   │   ├── users.js               ← employees list, reports, availability
│   │   ├── dashboard.js           ← Manager dashboard summary
│   │   └── tips.js                ← Tip distribution CRUD (NEW)
│   ├── .env                       ← Environment variables
│   ├── .env.example               ← Template for .env
│   ├── server.js                  ← Express app entry point
│   └── seed.js                    ← Database seeder with demo data
│
└── frontend/
    └── src/
        ├── api.js                 ← Axios client with JWT interceptor
        ├── App.js                 ← Root component + routing
        ├── App.css                ← Global design system (DM Sans + Bebas Neue)
        ├── index.js               ← React entry point
        ├── context/
        │   └── AuthContext.jsx    ← Global auth state (login/logout/register)
        └── pages/
            ├── homepage/
            │   └── Home.jsx       ← Marketing landing page
            ├── employee_login/
            │   ├── Login.jsx      ← Login with portal tabs + demo credentials
            │   └── Register.jsx   ← Registration form
            ├── employee_portal/
            │   ├── EmployeePortal.jsx   ← Employee nav wrapper
            │   ├── Schedule.jsx         ← Weekly shift calendar grid
            │   ├── ShiftSwap.jsx        ← Submit + view swap requests
            │   ├── Availability.jsx     ← 7-day availability grid
            │   └── Notifications.jsx    ← Notification inbox
            └── manager_portal/
                ├── ManagerPortal.jsx    ← Manager/Owner nav wrapper
                ├── ManagerDashboard.jsx ← Coverage, hours, alerts
                ├── ManagerSchedule.jsx  ← Schedule planner + publish
                ├── SwapApprovals.jsx    ← Approve/reject swap requests
                ├── StaffReport.jsx      ← Reports & analytics
                ├── EmployeeOverview.jsx ← Employee cards + CSV export
                └── TipManager.jsx       ← Tip distribution tool (NEW, owner only)
```

---

## 🚀 Setup & Running

### Prerequisites
- Node.js 16+
- MongoDB Atlas account (or local MongoDB)

### 1. Backend Setup

```bash
cd backend
npm install

# Copy and configure environment
cp .env.example .env
```

Edit `.env`:
```dotenv
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/shiftup
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
```

```bash
# Seed demo data (recommended for first run)
node seed.js

# Start development server
npm run dev
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

## 🔑 API Endpoints

### Auth — `/api/auth`
| Method | Endpoint    | Access | Description       |
|--------|-------------|--------|-------------------|
| POST   | /register   | Public | Register new user |
| POST   | /login      | Public | Login + get JWT   |
| GET    | /me         | Any    | Get my profile    |
| PUT    | /me         | Any    | Update my profile |

### Shifts — `/api/shifts`
| Method | Endpoint   | Access    | Description                        |
|--------|------------|-----------|------------------------------------|
| GET    | /          | Any       | Get shifts (filtered by role)      |
| GET    | /week      | Any       | Get shifts for a date range        |
| GET    | /today     | Mgr/Owner | Today's coverage                   |
| POST   | /          | Mgr/Owner | Create shift (draft or published)  |
| PUT    | /:id       | Mgr/Owner | Update shift                       |
| DELETE | /:id       | Mgr/Owner | Delete shift                       |
| POST   | /publish   | Mgr/Owner | Publish drafts + notify employees  |

### Swap Requests — `/api/swaps`
| Method | Endpoint         | Access    | Description          |
|--------|------------------|-----------|----------------------|
| GET    | /                | Any       | Get swap requests    |
| POST   | /                | Employee  | Submit swap request  |
| PUT    | /:id/approve     | Mgr/Owner | Approve swap         |
| PUT    | /:id/reject      | Mgr/Owner | Reject swap          |

### Notifications — `/api/notifications`
| Method | Endpoint     | Access | Description           |
|--------|--------------|--------|-----------------------|
| GET    | /            | Any    | Get my notifications  |
| PUT    | /:id/read    | Any    | Mark one as read      |
| PUT    | /read-all    | Any    | Mark all as read      |
| DELETE | /:id         | Any    | Delete notification   |

### Users — `/api/users`
| Method | Endpoint              | Access    | Description             |
|--------|-----------------------|-----------|-------------------------|
| GET    | /employees            | Any       | All employees + stats   |
| GET    | /reports/weekly       | Mgr/Owner | Hours & cost report     |
| PUT    | /me/availability      | Employee  | Update availability     |

### Dashboard — `/api/dashboard`
| Method | Endpoint | Access    | Description             |
|--------|----------|-----------|-------------------------|
| GET    | /        | Mgr/Owner | Manager dashboard data  |

### Tips — `/api/tips` *(Owner only)*
| Method | Endpoint | Access | Description                    |
|--------|----------|--------|--------------------------------|
| GET    | /        | Owner  | All tip records                |
| GET    | /mine    | Any    | My own tip history             |
| POST   | /        | Owner  | Distribute tips to employees   |
| DELETE | /:id     | Owner  | Delete a tip record            |

---

## 👤 Demo Accounts

Run `node seed.js` first to create these accounts:

| Role     | Email               | Password    | Portal Access              |
|----------|---------------------|-------------|----------------------------|
| Employee | maria@shiftup.com   | password123 | Employee portal            |
| Employee | kevin@shiftup.com   | password123 | Employee portal            |
| Employee | sarah@shiftup.com   | password123 | Employee portal            |
| Manager  | manager@shiftup.com | password123 | Manager portal             |
| Owner    | owner@shiftup.com   | password123 | Manager portal + Tips tab  |

---

## 🧩 Feature Overview

### Employee Portal
| Feature | Description |
|---|---|
| **Schedule** | 7-column weekly calendar grid with color-coded shift blocks per role. Shows time, duration, area, and status. Toggle between week and list view. |
| **Shift Swap** | Submit a swap request by selecting a shift and proposing a coworker. View status of all past requests with manager comments. |
| **Availability** | 7-day × 3 time-slot grid (morning/afternoon/evening). Set availability type (Full-Time / Part-Time / On-Call). |
| **Notifications** | Real-time inbox for swap approvals, schedule publishes, and shift alerts. Mark read/unread. |

### Manager Portal
| Feature | Description |
|---|---|
| **Dashboard** | Today's coverage, pending swap approvals, weekly hours with cost, and shift alerts. |
| **Schedule Planner** | Create draft shifts per day, copy previous week, and publish to notify all employees. |
| **Swap Approvals** | Review pending swap requests with employee reason and coverage notes. Approve or reject with comment. |
| **Staff Reports** | Date-range filtered report with hours, cost, no-shows, and swap requests per employee. Export to CSV. |
| **Employee Overview** | Card grid of all employees with performance stats (coverage %, no-shows, swaps). |

### Owner-Only
| Feature | Description |
|---|---|
| **Tip Manager** | Record tip distributions by date and total amount. Split equally or enter manual amounts per employee. Full history with delete. Auto-notifies employees when tips are distributed. |

---

## 🔒 Authentication & Security

- Passwords hashed with **bcrypt** (10 salt rounds)
- **JWT tokens** stored in `localStorage`, attached to all API requests via Axios interceptor
- Auto-logout on `401 Unauthorized`
- **Role-based access control** — `employee`, `manager`, `owner`
- MongoDB injection protection via Mongoose schema validation
- CORS restricted to `localhost:3000` / `localhost:3001` in development

---

## 🎨 Design System

| Token | Value |
|---|---|
| Primary (yellow) | `#f5b800` |
| Dark | `#1a1a1a` |
| Background | `#f0f0ec` |
| Heading font | Bebas Neue |
| Body font | DM Sans |
| CSS prefix | `su-` |

---

## 🗄️ Database Models

| Model | Key Fields |
|---|---|
| **User** | firstName, lastName, email, password, role, position, availability, availabilitySchedule, noShows, coveragePercent |
| **Shift** | employee, date, startTime, endTime, timeLabel, role, area, status, isDraft, publishedAt |
| **SwapRequest** | requester, proposedEmployee, shift (optional), shiftDate, shiftTime, reason, status, managerComment |
| **Notification** | recipient, type, title, message, read, relatedSwap, relatedShift |
| **Attendance** | employee, shift, date, status, clockIn, clockOut, hoursWorked |
| **Tip** | date, totalAmount, splitMethod, note, recordedBy, distributions[ {employee, amount} ] |

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Axios, Lucide React |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas + Mongoose |
| Auth | JSON Web Tokens (JWT) + bcryptjs |
| Fonts | Google Fonts (Bebas Neue, DM Sans) |
| Dev Tools | nodemon, dotenv |

---

## 🔧 Changelog

| Version | Changes |
|---|---|
| v1.0 | Initial full-stack build — all portals, auth, shifts, swaps, notifications |
| v1.1 | Fixed `ObjectId` cast error on swap requests with invalid shift IDs |
| v1.2 | Opened `/api/users/employees` to all authenticated roles (employees can fetch coworkers for swap proposals) |
| v1.3 | Redesigned employee `Schedule` — week grid view, color-coded shift blocks, stats bar, list toggle |
| v1.4 | Added **Tip Manager** — `Tip` model, `/api/tips` routes, `TipManager.jsx` (owner only), tip notifications |
| v1.5 | MongoDB Atlas connection configured |