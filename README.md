# Riyadh Metro — Train Schedule & Reservation System

> A university project built as part of a software engineering course at Imam Mohammad Ibn Saud Islamic University.
> A web-based system for managing train schedules, passenger reservations, and ticket generation for the Riyadh Metro.

---

## Project Overview

The Riyadh Metro Train Schedule & Reservation System is a full-stack web application designed to manage metro operations.

The system includes:

- **Staff Portal** — Register passengers, create reservations, generate tickets, view booking history, and cancel reservations
- **Admin Portal** — Manage trains and schedules, view schedule audit logs, manage system users, and access full analytics and reports
- **Role-Based Access** — Three roles: Staff, Administrator, and Super Administrator

This project was developed collaboratively as a team-based software engineering project.

---

## Team

| Name |
|------|
| NAWAF KHALID ALGHAMDI |
| IBRAHIM ABDULKARIM BIN BURIEEH |
| ABDULLAH OTHMAN ALTMEMI |
| FAHAD SAAD ALOHAIMER |

---

## Architecture

```
riyadh-metro-system/
├── artifacts/
│   ├── api-server/         # Backend REST API (Express.js)
│   └── train-system/       # Frontend web app (React)
└── lib/
    ├── db/                 # Database schema (7 tables)
    ├── api-spec/           # API contract (OpenAPI YAML)
    ├── api-client-react/   # Auto-generated React Query hooks
    └── api-zod/            # Auto-generated Zod validation schemas
```

### Architectural Highlights

- Contract-first API design — OpenAPI spec is written first, code is generated from it
- Clear separation of concerns: UI / API / Database
- Atomic seat updates to prevent double-booking
- Ticket auto-generated on every confirmed reservation

---

## Tech Stack

- **Frontend** — React 19, TypeScript, CSS, Recharts
- **Backend** — Node.js, Express.js 5, TypeScript
- **Database** — PostgreSQL hosted on Supabase
- **Authentication** — Session-based with role-based access control

---

## Key Features

- Login with email and password — role detected automatically
- Forgot password flow with time-limited verification code
- Role-based access control — each role sees only their pages
- Create, update, and delete train schedules with departure/arrival times
- Register passengers with national ID, phone, and contact details
- Book seats — automatic seat assignment and ticket generation (`TKT-YYYYMMDD-XXXX`)
- Cancel reservations — seat returned to pool, ticket voided automatically
- Full booking history with search by name, ticket number, or status
- Schedule audit log tracking every change with the name of who made it
- Reports: daily, weekly, monthly bookings, revenue statistics, and train utilization charts

---

## Getting Started

### Requirements
- Node.js 20 or higher
- pnpm — install with: `npm install -g pnpm`

### 1. Clone the repository

```bash
git clone https://github.com/your-repo/riyadh-metro-system.git
cd riyadh-metro-system
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set environment variables

```
SUPABASE_DATABASE_URL=your_supabase_connection_string
SESSION_SECRET=any_random_string
```

### 4. Start the backend

```bash
pnpm --filter @workspace/api-server run dev
```

### 5. Start the frontend

```bash
pnpm --filter @workspace/train-system run dev
```

> **Note:** This project requires a live Supabase PostgreSQL database with pre-seeded data. It cannot be run without the proper environment secrets configured.

---

## Login Credentials

| Role              | Email                    | Password  |
|-------------------|--------------------------|-----------|
| Super Admin       | super-admin@train.com    | super123  |
| Administrator     | admin@train.com          | admin123  |
| Staff             | staff@train.com          | staff123  |

---

*Imam Mohammad Ibn Saud Islamic University — Software Engineering Project*
