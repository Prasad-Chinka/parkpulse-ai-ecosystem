# ParkPulse AI – AI-Driven Intelligent Parking Management System

A complete full-stack MERN (MongoDB, Express, React, Node.js) intelligent parking management web application featuring real-time slot allocation, interactive visual grid, QR-based entry/exit access control, digital payments with demo/Razorpay support, and AI-driven predictive demand forecasting with Random Forest regression and Gemini insights.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The architectural plan has been revised per your updated Master Prompt:
> - **Brand & System Name**: **ParkPulse AI**
> - **MongoDB Database Layer**: Configured with Mongoose in `backend/config/db.js` using `MONGO_URI`. If `MONGO_URI` is not configured, the system provides an explicit diagnostic banner while seamlessly persisting state to an embedded MongoDB-compatible store so the application runs immediately without runtime crashes.
> - **Machine Learning Engine**: Dual-stack AI approach:
>   1. Complete Python/Scikit-learn service files (`ai-service/train.py`, `ai-service/app.py`, `requirements.txt`, synthetic dataset) for your B.Tech submission and external execution.
>   2. An in-process JavaScript Random Forest Regression ensemble on the backend calculating real MAE & RMSE, plus Gemini 3.8 Flash (`gemini-3.8-flash`) operational insights for live interactive forecasting in the web app.
> - **Glassmorphic & Smart Mobility UI**: Deep dark navy sidebar (`#0b132b`), crisp light-grey main canvas with frosted glass cards (`backdrop-blur-md`, `bg-white/80` or `bg-slate-900/80`), electric blue action buttons (`#0284c7`, `#38bdf8`), and color-coded status slots (Emerald Available, Crimson Occupied, Amber Reserved, Slate Maintenance).

---

### 1. Overview & Core Concept

**ParkPulse AI** is an intelligent urban parking ecosystem designed for smart cities and commercial hubs:
- **Drivers / Users**: Explore parking lots with live availability and OpenStreetMap integration, reserve compatible slots in advance, execute digital payments, obtain a secure cryptographic QR ticket, and track live session status.
- **Parking Operators**: Dedicated tablet-ready scanning interface with browser camera support, QR code decoders, manual booking ID entry fallback, instant entry registration, and automated exit fee settlement.
- **Administrators**: Comprehensive control panel to manage lots, configure slots, manage operators and users, inspect financial records, export CSV audit reports, and evaluate AI demand predictions.
- **Machine Learning**: Predicts parking occupancy 1 hour, 3 hours, and 24 hours into the future using historical occupancy, day-of-week, hour-of-day, and holiday indicators, validated with MAE and RMSE metrics.

---

### 2. User Experience & Visual Design

#### Design System & Glassmorphic Aesthetic
- **Color Palette**: Deep Midnight Navy sidebar (`#070d1e`, `#0b132b`), clean light-grey workspace canvas (`#f8fafc`), electric blue primary accents (`#0284c7`, `#38bdf8`), with semantic slot states:
  - `AVAILABLE`: Vibrant Emerald Green (`#16a34a`)
  - `OCCUPIED`: Crisp Crimson Red (`#dc2626`)
  - `RESERVED`: Amber Orange (`#d97706`)
  - `MAINTENANCE`: Neutral Slate Grey (`#64748b`)
- **Glassmorphic Accents**: Subtle frosted translucent surfaces with hairline borders (`border-white/20` and `border-slate-200/80`), gentle backdrops (`backdrop-blur-md`), and glowing status indicators.
- **Typography**: `Plus Jakarta Sans` for clean titles, combined with monospace tabular figures (`font-mono tabular-nums`) for currency, timestamps, booking codes, and prediction figures.
- **Responsive Layout**: Full desktop sidebar layout with top breadcrumbs and live clock; collapsible mobile drawer and responsive data tables.

#### Key Workflows
```
[Landing Page] ──> [Register/Login] ──> [User Dashboard]
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
         [Register / Select Vehicle]                     [Find Parking (Map/List)]
                      │                                               │
                      └───────────────────────┬───────────────────────┘
                                              ▼
                               [Interactive Slot Grid View]
                                              │
                                              ▼
                               [Date & Time Range Selection]
                                              │
                                              ▼
                               [Conflict Check & Price Calc]
                                              │
                                              ▼
                             [Demo / Razorpay Payment Modal]
                                              │
                                              ▼
                                [Digital QR Code Ticket]
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    ▼                                                   ▼
         [Operator Camera Entry]                             [Operator Camera Exit]
        (Slot Marked OCCUPIED)                               (Slot Released/Finished)
```

---

### 3. Database Architecture (10 Collections)

The backend implements Mongoose models with proper schema validation, ObjectIds, and indexes:
1. `User`: `name`, `email` (unique index), `passwordHash`, `phone`, `role` (`user`, `admin`, `operator`), `createdAt`.
2. `Vehicle`: `userId` (ref: User), `registrationNumber` (unique), `vehicleType` (`car`, `bike`, `suv`, `ev`), `brand`, `model`, `color`.
3. `ParkingLot`: `name`, `address`, `latitude`, `longitude`, `totalSlots`, `hourlyPrice`, `operatingHours`, `amenities`.
4. `ParkingSlot`: `lotId` (ref: ParkingLot), `slotNumber`, `status` (`available`, `occupied`, `reserved`, `maintenance`), `vehicleTypes`, `hourlyPrice`.
5. `Reservation`: `userId`, `vehicleId`, `lotId`, `slotId`, `startTime`, `endTime`, `totalAmount`, `bookingStatus` (`pending`, `confirmed`, `active`, `completed`, `cancelled`), `paymentStatus`, `createdAt`.
6. `Payment`: `reservationId`, `userId`, `amount`, `transactionId`, `paymentMethod`, `status`, `receiptNumber`.
7. `ParkingSession`: `reservationId`, `entryTime`, `exitTime`, `status`, `entryVerifiedBy`, `exitVerifiedBy`.
8. `QRToken`: `reservationId`, `tokenHash`, `expiresAt`, `usedAt`.
9. `OccupancyHistory`: `lotId`, `timestamp`, `occupiedCount`, `reservedCount`, `availableCount`.
10. `Prediction`: `lotId`, `targetTime`, `predictedOccupancy`, `demandCategory` (`LOW`, `MEDIUM`, `HIGH`), `modelType`.

---

### 4. Technical Architecture & File Organization

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             REACT FRONTEND (VITE)                                │
│                                                                                  │
│  - Landing Page (Hero, Features, Live Demo Stats, How It Works)                 │
│  - Auth (Login, Register with Role Selector for testing)                        │
│  - User Portal (Dashboard, Vehicles, Parking Map, Slot Grid, Bookings, Tickets)  │
│  - Operator Portal (QR Camera Scanner, Manual Token Check, Active Sessions)     │
│  - Admin Portal (Dashboard KPIs, Lot/Slot Management, AI Demand Forecast, CSV)  │
└────────────────────────────────────┬─────────────────────────────────────────────┘
                                     │ REST APIs (/api/*)
┌────────────────────────────────────▼─────────────────────────────────────────────┐
│                            EXPRESS BACKEND SERVER                                │
│                                                                                  │
│  ├── config/db.js (Mongoose Atlas Connection + Resilient Local Fallback)         │
│  ├── controllers/ (Auth, Vehicles, Lots, Slots, Reservations, Payments, QR, AI)  │
│  ├── middleware/ (JWT Verify, Role Authorization, Request Validation)            │
│  ├── models/ (10 Mongoose Models with Schemas & Indexes)                         │
│  ├── services/                                                                   │
│  │   ├── aiEngine.js (In-process Random Forest Regressor & MAE/RMSE Metrics)     │
│  │   ├── geminiService.js (Gemini 3.8 Flash Strategic Insights)                  │
│  │   └── qrService.js (HMAC Token Generation & Validation)                       │
│  └── seed.js (Auto-seed demo lots, 30+ slots, sample vehicles, and users)       │
└────────────────────────────────────┬─────────────────────────────────────────────┘
                                     │
┌────────────────────────────────────┴─────────────────────────────────────────────┐
│                            PYTHON ML ARTIFACTS                                   │
│                                                                                  │
│  ├── ai-service/app.py (Flask API microservice for external deployment)          │
│  ├── ai-service/train.py (Scikit-learn Random Forest model training script)      │
│  ├── ai-service/requirements.txt (pandas, numpy, scikit-learn, flask)            │
│  └── ai-service/data/synthetic_occupancy.csv (Historical dataset for training)   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

### 5. Detailed Implementation Step Sequence

1. **Backend Foundation & Database Setup**:
   - Create `backend/config/db.js` with Mongoose connection logic using `MONGO_URI`, timeout handlers, and graceful fallback to an embedded JSON/in-memory store with clear connection logging.
   - Define all 10 Mongoose models in `backend/models/`.
   - Implement `backend/seed.js` with comprehensive sample data (Admin, Operator, User, 2 Parking Lots, 30+ Slots across categories, past reservations, and vehicles).

2. **Backend REST APIs & Security**:
   - `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`.
   - `GET /api/vehicles`, `POST /api/vehicles`, `PUT /api/vehicles/:id`, `DELETE /api/vehicles/:id`.
   - `GET /api/parking/lots`, `GET /api/parking/lots/:id`, `GET /api/parking/lots/:id/slots`, slot management endpoints.
   - `POST /api/reservations` (with strict overlapping reservation conflict detection), `GET /api/reservations/my`, cancellation endpoints.
   - `POST /api/payments/create`, `POST /api/payments/verify`, demo payment simulations.
   - `GET /api/qr/:reservationId`, `POST /api/qr/entry`, `POST /api/qr/exit`.
   - `GET /api/ai/predict/:lotId`, `GET /api/ai/recommend/:lotId`.
   - `GET /api/admin/dashboard`, `GET /api/admin/users`, `GET /api/admin/reservations`, `GET /api/admin/analytics`, CSV export.

3. **Machine Learning & AI Modules**:
   - In-process Random Forest regression ensemble in `backend/services/aiEngine.js` with synthetic 30-day training dataset, evaluating MAE and RMSE.
   - Gemini 3.8 Flash (`gemini-3.8-flash`) integration in `backend/services/geminiService.js` using `@google/genai` to analyze occupancy curves and recommend operational strategies.
   - Self-contained Python training and service code in `ai-service/` for academic evaluation.

4. **Frontend Architecture & Glassmorphic UI**:
   - Navigation sidebar with role switching, live clock, and glassmorphic styling.
   - Public Landing Page with interactive stats, feature highlights, and search bar.
   - Interactive Parking Slot Grid with visual color indicators, vehicle compatibility filter, and slot detail drawer.
   - Multi-step Reservation and Demo Payment Modal with transaction receipts.
   - Digital QR Ticket viewer with auto-refresh and check-in countdown.
   - Operator QR Scanner with camera support and manual token verification fallback.
   - Admin Analytics with Recharts (occupancy trends, revenue, demand comparison) and CSV download.

5. **Testing, Verification & Documentation**:
   - Test end-to-end user journey: Register -> Add Vehicle -> Book Slot -> Pay -> Scan Entry -> Scan Exit.
   - Compile applet and verify zero errors.
   - Provide complete README with run commands, API references, demo credentials, and deployment guides.
