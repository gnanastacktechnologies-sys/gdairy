# GDairy - Milk Collection, Milk Billing, Reports & Analytics Management System

GDairy is a complete, production-ready, mobile-first **MERN Stack** web application designed for dairy owners and milk collectors. It handles daily milk collection (Morning & Evening sessions), dynamic per-litre price billing, period calculations (10-day, 15-day, 30-day, and custom ranges), role-based permissions (Admin & User), data retention configuration, and interactive analytics.

---

## Features

- **Mobile-First Responsive Layout**: Built specifically for mobile devices, tablets, and desktops with smooth touch targets, mobile drawer navigation, and independent sidebar/content scroll containers (`100vh`).
- **Milk Collection Entry**: Simple daily collection interface supporting Morning and Evening sessions. Automatic real-time calculation of `Total Amount = Litres × Price Per Litre`.
- **Dynamic Pricing**: Stores historical `milkPricePerLitre` with every record to preserve historical accuracy even when price per litre changes over time.
- **Period Calculation & Billing**: Automatic summaries for 10-Day, 15-Day, 30-Day, or Custom Date Ranges with totals, session breakdowns, daily averages, and average price/litre.
- **Reports & Analytics**: Daily and Period reports along with interactive Recharts graphs (Milk Quantity Line Chart, Morning vs Evening Bar Chart, Daily Amount Area Chart, Price Trend Line Chart).
- **User Management & Role Authorization**: Admin account created via idempotent seed script (`seed.js`). Admin can create, edit, activate/deactivate, reset password, or delete users. No public registration.
- **Data Retention Settings**: Configurable retention periods (1 Month, 3 Months [Default], 6 Months, 12 Months, Custom).

---

## Tech Stack

- **Frontend**: React.js, Vite, Tailwind CSS, React Router v6, Axios, React Icons, Recharts
- **Backend**: Node.js, Express.js (ES Modules `"type": "module"`), MongoDB, Mongoose
- **Authentication**: JWT & `bcryptjs` password hashing

---

## Project Structure

```text
GDairy/
│
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/      # Reusable DataTable, Modal, Cards, Badges
│   │   │   ├── layout/      # Sidebar, Topbar, MainLayout
│   │   │   └── charts/      # Recharts visualizations
│   │   ├── context/         # AuthContext
│   │   ├── pages/           # Dashboard, MilkEntry, MilkRecords, Reports, Analytics, Users, Settings, Profile, Login
│   │   ├── services/        # Axios API client
│   │   ├── utils/           # Date & Currency formatters
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/
│   ├── config/              # MongoDB connection
│   ├── controllers/         # Auth, User, Milk, Report, Analytics, Settings controllers
│   ├── middleware/          # JWT Auth, Role Authorization, Central Error Handler
│   ├── models/              # User, MilkEntry, Settings Mongoose models
│   ├── routes/              # Express Router endpoints
│   ├── seed.js              # Idempotent Admin account bootstrapper
│   ├── app.js               # Express application configuration
│   ├── server.js            # Server entry point
│   └── package.json
│
├── .env.example
└── README.md
```

---

## Quick Start & Installation

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) running locally (`mongodb://localhost:27017/gdairy`) or MongoDB Atlas URI

### 2. Backend Setup
1. Open terminal in `backend/`:
   ```bash
   cd backend
   npm install
   ```
2. Create `.env` in `backend/` (or copy from root `.env.example`):
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/gdairy
   JWT_SECRET=gdairy_jwt_secret_key_super_secure_2026
   NODE_ENV=development

   ADMIN_USERNAME=Gnanasekaran
   ADMIN_PASSWORD=Gnana123@
   ADMIN_NAME=Gnanasekaran
   ```
3. Seed the initial Admin account:
   ```bash
   npm run seed
   ```
4. Start the backend server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Open a new terminal in `frontend/`:
   ```bash
   cd frontend
   npm install
   ```
2. Create `.env` in `frontend/`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
3. Start Vite development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) or [http://localhost:5173](http://localhost:5173) in your browser.

---

## Localhost Mobile Device Testing (Physical Mobile Phone over Wi-Fi)

To test the application directly on your physical mobile phone connected to the same Wi-Fi network:

1. **Connect Devices**: Ensure both your development computer and physical mobile phone are connected to the same Wi-Fi network.
2. **Find Computer IP Address**:
   - Windows: Open Command Prompt / PowerShell and run `ipconfig`. Find your **IPv4 Address** (e.g. `192.168.1.5`).
   - Mac/Linux: Run `ifconfig` or `ip a` (e.g. `192.168.1.5`).
3. **Configure Frontend Environment**:
   In `frontend/.env`, set `VITE_API_URL` to your computer's local IP address:
   ```env
   VITE_API_URL=http://192.168.1.5:5000/api
   ```
4. **Start Servers**:
   - Backend listens on `0.0.0.0:5000` automatically.
   - Frontend Vite server runs with `--host 0.0.0.0`.
5. **Open on Mobile**:
   On your phone's browser, visit:
   `http://192.168.1.5:3000` (or the port Vite prints in terminal).

---

## Default Admin Credentials

- **Username**: `Gnanasekaran`
- **Password**: `Gnana123@`

*(Password can be customized in `.env` before running `npm run seed`)*
