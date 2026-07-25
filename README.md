# DigitalHeroes - Lead Management Platform

Built for [Digital Heroes Training Task](https://digitalheroesco.com)

A lead management application for small sales teams.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Express, JWT, MongoDB Mongoose

---

## Deployed App

| Service  | URL                                                |
|----------|----------------------------------------------------|
| Frontend | https://lead-manager-task.vercel.app               |
| Backend  | https://digitalheroestask.onrender.com             |

### Login Credentials

| Role   | Email                     | Password  |
|--------|---------------------------|-----------|
| Admin  | admin@digitalheroes.com   | admin123  |
| Member | member@digitalheroes.com  | member123 |

> Use these credentials on the deployed frontend at https://lead-manager-task.vercel.app

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running on `localhost:27017`

### 1. Server

```bash
cd server
npm install
cp .env .env.local  # edit if needed
npm run seed         # creates test accounts
npm run dev          # starts on port 3001
```

### 2. Client

```bash
cd client
npm install
npm run dev          # starts on port 3000
```

Open http://localhost:3000

---

## Test Credentials

| Role   | Email                     | Password  |
|--------|---------------------------|-----------|
| Admin  | admin@digitalheroes.com   | admin123  |
| Member | member@digitalheroes.com  | member123 |

---

## Running Tests

```bash
cd server
npm test
```

Tests use an in-memory MongoDB (mongodb-memory-server). No external DB needed.

**Test coverage:**
- Auth rules: unauthenticated requests return 401, members cannot delete leads (403), admins can delete (200)
- Lead lifecycle: public capture, create → update status → assign → add note → verify activity trail
- Pagination and filtering

---

## API Documentation

**Base URLs:**
- Local: `http://localhost:3001`
- Deployed: `https://digitalheroestask.onrender.com`

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

---

### Root

#### GET /
Returns API status and available endpoints.

**Response** `200`:
```json
{ "message": "DigitalHeroes Lead Management API", "version": "1.0.0", "endpoints": { "auth": { "register": "POST /api/auth/register", "login": "POST /api/auth/login", "me": "GET /api/auth/me", "users": "GET /api/auth/users" }, "leads": { "public": "POST /api/leads/public", "list": "GET /api/leads", "get": "GET /api/leads/:id", "create": "POST /api/leads", "update": "PATCH /api/leads/:id", "addNote": "POST /api/leads/:id/notes", "delete": "DELETE /api/leads/:id" } } }
```

---

### Authentication

#### POST /api/auth/register
Create a new member account.

**Request:**
```json
{ "name": "John Doe", "email": "john@example.com", "password": "secret123" }
```

**Response** `201`:
```json
{ "token": "jwt...", "user": { "id": "...", "name": "John Doe", "email": "john@example.com", "role": "member" } }
```

**Errors:** `400` (missing fields), `409` (email exists)

---

#### POST /api/auth/login
Authenticate and receive a JWT.

**Request:**
```json
{ "email": "admin@digitalheroes.com", "password": "admin123" }
```

**Response** `200`:
```json
{ "token": "jwt...", "user": { "id": "...", "name": "Admin User", "email": "admin@digitalheroes.com", "role": "admin" } }
```

**Errors:** `400` (missing fields), `401` (invalid credentials)

---

#### GET /api/auth/me
Get the currently authenticated user. Requires auth.

**Response** `200`:
```json
{ "user": { "id": "...", "name": "Admin User", "email": "admin@digitalheroes.com", "role": "admin" } }
```

---

#### GET /api/auth/users
List all users. Admin only.

**Response** `200`:
```json
{ "users": [{ "id": "...", "name": "Member User", "email": "member@digitalheroes.com", "role": "member" }] }
```

---

### Leads

#### POST /api/leads/public
Public lead capture. No auth required.

**Request:**
```json
{ "firstName": "Jane", "lastName": "Doe", "email": "jane@example.com", "phone": "1234567890", "company": "ACME" }
```

**Response** `201`:
```json
{ "message": "Lead submitted successfully", "lead": { ... } }
```

**Errors:** `400` (missing firstName, lastName, or email)

---

#### GET /api/leads
List leads with pagination and filtering. Requires auth.

**Query Parameters:**
| Param      | Type   | Description                          |
|------------|--------|--------------------------------------|
| page       | number | Page number (default: 1)             |
| limit      | number | Items per page (default: 10, max: 100) |
| status     | string | Filter by status                     |
| search     | string | Search name, email, company          |
| assignedTo | string | Filter by assigned user ID           |

**Permissions:**
- Admin: sees all leads
- Member: sees only leads assigned to them

**Response** `200`:
```json
{
  "leads": [ { "_id": "...", "firstName": "Jane", "lastName": "Doe", "email": "jane@example.com", "status": "new", "assignedTo": null, "notes": [], "activity": [], "createdAt": "2024-..." } ],
  "pagination": { "page": 1, "limit": 10, "total": 1, "pages": 1 }
}
```

---

#### GET /api/leads/:id
Get a single lead by ID. Requires auth.

**Permissions:** Member can only view leads assigned to them.

**Response** `200`:
```json
{ "lead": { "_id": "...", "firstName": "Jane", "lastName": "Doe", "email": "jane@example.com", "status": "new", "assignedTo": { "_id": "...", "name": "Admin User", "email": "admin@digitalheroes.com" }, "notes": [{ "text": "...", "author": { "_id": "...", "name": "Admin" }, "createdAt": "..." }], "activity": [{ "action": "created", "performedBy": { "_id": "...", "name": "Admin" }, "details": "Lead created", "createdAt": "..." }], "source": "manual", "createdAt": "..." } }
```

**Errors:** `404` (not found), `403` (access denied for member)

---

#### POST /api/leads
Create a new lead manually. Requires auth.

**Request:**
```json
{ "firstName": "Jane", "lastName": "Doe", "email": "jane@example.com", "phone": "1234567890", "company": "ACME" }
```

**Response** `201`:
```json
{ "lead": { ... } }
```

---

#### PATCH /api/leads/:id
Update a lead. Requires auth.

**Request:**
```json
{ "status": "contacted", "assignedTo": "user_id_here" }
```

**Updatable fields:** `firstName`, `lastName`, `email`, `phone`, `company`, `status`, `assignedTo` (admin only)

**Status values:** `new`, `contacted`, `qualified`, `proposal`, `closed_won`, `closed_lost`

**Response** `200`: Returns updated lead with populated references.

**Errors:** `404` (not found), `403` (access denied)

---

#### POST /api/leads/:id/notes
Add a note to a lead. Requires auth.

**Request:**
```json
{ "text": "Called client, interested in demo" }
```

**Response** `201`: Returns lead with new note and activity entry.

**Errors:** `404` (not found), `400` (missing text), `403` (access denied)

---

#### DELETE /api/leads/:id
Delete a lead. Admin only.

**Response** `200`:
```json
{ "message": "Lead deleted" }
```

**Errors:** `404` (not found), `403` (insufficient permissions)

---

## Status Pipeline

```
new → contacted → qualified → proposal → closed_won
                                          → closed_lost
```

Each status change is recorded in the activity trail with a timestamp and the user who made the change.

---

## Data Model

### User
| Field    | Type                  | Description          |
|----------|-----------------------|----------------------|
| name     | String                | Full name            |
| email    | String (unique)       | Email address        |
| password | String (hashed)       | BCrypt hash          |
| role     | `admin` or `member`   | Access level         |

### Lead
| Field       | Type                              | Description                    |
|-------------|-----------------------------------|--------------------------------|
| firstName   | String                            | Lead's first name              |
| lastName    | String                            | Lead's last name               |
| email       | String                            | Lead's email                   |
| phone       | String (optional)                 | Phone number                   |
| company     | String (optional)                 | Company name                   |
| status      | String (enum)                     | Pipeline stage                 |
| assignedTo  | ObjectId (ref: User)              | Assigned sales rep             |
| notes       | [{ text, author, createdAt }]     | Internal notes                 |
| activity    | [{ action, performedBy, details, createdAt }] | Activity trail |
| source      | `public` or `manual`              | How the lead was captured      |
| createdBy   | ObjectId (ref: User)              | Who created the lead           |

---

## Permissions Matrix

| Action                  | Public | Member | Admin |
|-------------------------|--------|--------|-------|
| Submit lead (public)    | ✅     | ✅     | ✅    |
| View assigned leads     | ❌     | ✅     | ✅    |
| View all leads          | ❌     | ❌     | ✅    |
| Create lead             | ❌     | ✅     | ✅    |
| Update lead             | ❌     | ✅*    | ✅    |
| Add note                | ❌     | ✅*    | ✅    |
| Assign lead             | ❌     | ❌     | ✅    |
| Delete lead             | ❌     | ❌     | ✅    |
| List all users          | ❌     | ❌     | ✅    |

*\*Member can only update/add notes to leads assigned to them*

---

## Deployment

### Deploy Backend (Render / Railway / Fly.io)
1. Set environment variables: `MONGODB_URI`, `JWT_SECRET`, `PORT`
2. Build: `cd server && npm run build`
3. Start: `npm start`

### Deploy Frontend (Vercel)
1. Set env: `NEXT_PUBLIC_API_URL` pointing to your deployed backend
2. Import the `client/` directory to Vercel
3. Build automatically runs on deploy
