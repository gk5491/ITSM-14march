# ITSM Helpdesk - Mobile App

A full-featured React Native (Expo) mobile application for the ITSM Helpdesk Portal and Site Engineering Management System. Connects to the same backend API and database as the web application.

---

## Prerequisites

- [Node.js](https://nodejs.org) (v18 or newer)
- [Expo Go](https://expo.dev/client) app installed on your Android device
- The ITSM web backend must be running and accessible over the network

---

## Setup Instructions

### 1. Clone / Download this folder

Download the `mobile/` folder to your local machine.

### 2. Install dependencies

```bash
cd mobile
npm install
```

### 3. Configure the API URL

Create a `.env` file in the `mobile/` directory:

```env
EXPO_PUBLIC_API_URL=http://YOUR_SERVER_IP:5000
```

Replace `YOUR_SERVER_IP` with:
- The IP address of the machine running the backend server (e.g., `192.168.1.10`)
- Or your Replit project URL (e.g., `https://your-repl-name.replit.dev`)

**Important:** Both your phone and the server must be on the same network, OR the server must be accessible via a public URL.

### 4. Start the Expo development server

```bash
npx expo start
```

### 5. Open on your Android device

- Open the **Expo Go** app on your Android device
- Scan the QR code shown in the terminal
- The app will load on your device

---

## Features

### For All Users
- **Login** with existing ITSM credentials
- **Dashboard** with ticket stats and quick actions
- **My Tickets** — view, filter, and search your support tickets
- **Create Ticket** — submit new support tickets with priority, category, support type
- **Ticket Detail** — view full ticket info, comments, and history
- **Profile** — view account info, change password, logout

### For Agents & Admins
- **All Tickets** — view and manage all tickets across the system
- **Update Tickets** — change status, priority, assign agents
- **Internal Comments** — private notes only visible to agents/admins

### For Admins
- **User Management** — create, edit, delete users; assign roles
- **Reports & Analytics** — ticket overview, status breakdown, agent performance

### Site Engineering Module
- **Attendance** — GPS-verified check-in/check-out
- **Daily Reports** — submit and view work progress reports
- **Leave Management** — apply for leaves, view approval status

### For HR & Admins (Site-Engg)
- **Muster Roll** — monthly attendance tracking for all engineers
- **Leave Approval** — approve or reject leave requests

---

## Role-Based Access

| Role | Access Level |
|------|-------------|
| **user** | My tickets, create tickets, site-engg (attendance/reports/leaves) |
| **agent** | All tickets, update/assign tickets, internal comments |
| **hr** | Site-engg HR features (muster roll, leave approvals) |
| **admin** | Full access including user management and reports |

---

## Tech Stack

- **React Native** with Expo SDK 51
- **Expo Router** for file-based navigation
- **@tanstack/react-query** for data fetching and caching
- **Axios** for HTTP requests
- **AsyncStorage** for session persistence
- **Expo Location** for GPS attendance tracking
- **@expo/vector-icons** (Ionicons) for icons

---

## Folder Structure

```
mobile/
├── app/                    # Expo Router screens
│   ├── _layout.tsx         # Root layout (providers)
│   ├── index.tsx           # Auth redirect
│   ├── (auth)/
│   │   └── login.tsx       # Login screen
│   └── (app)/
│       ├── _layout.tsx     # Tab navigation
│       ├── dashboard.tsx   # Main dashboard
│       ├── profile.tsx     # User profile
│       ├── tickets/
│       │   ├── index.tsx   # Ticket list
│       │   ├── new.tsx     # Create ticket
│       │   └── [id].tsx    # Ticket detail
│       ├── admin/
│       │   ├── users.tsx   # User management (admin)
│       │   └── reports.tsx # Analytics (admin/agent)
│       └── site-engg/
│           ├── index.tsx   # Site-engg home
│           ├── attendance.tsx # GPS check-in/out
│           ├── reports.tsx # Daily reports
│           ├── leaves.tsx  # Leave management
│           └── muster.tsx  # Muster roll (HR/admin)
├── src/
│   ├── api/               # API client & endpoints
│   ├── components/        # Reusable UI components
│   ├── context/           # Auth context
│   └── utils/             # Colors & helpers
├── assets/               # App icons & splash screen
├── app.json              # Expo configuration
└── package.json          # Dependencies
```

---

## Troubleshooting

**"Network Error" when logging in:**
- Make sure `EXPO_PUBLIC_API_URL` is set correctly in `.env`
- Ensure the backend server is running
- Check that your phone and server are on the same WiFi

**GPS not working for attendance:**
- Allow location permission when prompted
- Make sure Location Services are enabled on your device
- You can still check in without GPS (location will be empty)

**App not loading after QR scan:**
- Ensure Expo Go is updated to the latest version
- Try clearing the Expo Go cache
