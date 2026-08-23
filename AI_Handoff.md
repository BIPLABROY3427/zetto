# Zetto.in (Payment Gateway)

## 🌐 Project Details
- **Project Name:** Zetto Payment Gateway
- **Frontend Domain:** Zetto.in
- **Backend API Domain:** api.zetto.in
- **GitHub Repo:** `https://github.com/BIPLABROY3427/zetto`
- **Tech Stack:** React (Vite), Node.js, Express, MongoDB, Mongoose, Redis, JWT
- **Role System:** 
  - **Superadmin:** Full access to commissions, analytics, and merchant management.
  - **Admin:** Support tickets and transaction monitoring.
  - **User (Merchant):** Payment APIs, wallet balance, and payout requests.

## 🔐 Superadmin Credentials
- **Email:** `biplabroy3427@gmail.com`
- **Password:** `200010379`

## 🏗 System Architecture
- **Frontend (`/client`):** React dashboard for Merchants and Admins. Fully stylized using a custom light theme (global `.pg-*` classes in `index.css`). **UI is strictly frozen and should not be modified or redesigned.**
- **Backend (`/server`):** Express API handling authentication, role-based access control, transaction ledger, and wallet balances.
- **Gateway Integration (AeroPay):** Handles upstream Payin and Payout lifecycle. Securely processes async webhooks via MD5 signature verification and strict atomic state locks to prevent race conditions and double-refund vulnerabilities.

## 🚀 Quick Start
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev

# Production Build Verification
cd client
npm run build
```

## 🛠 Core Modules & Features
1. **Authentication:** Secure JWT session management with Axios interceptors for global token refresh and 4xx error interception.
2. **Transaction Engine:** Real-time Payin/Payout lifecycle management including custom tier commissions (Flat + %) per merchant.
3. **Concurrency Security:** Deeply integrated MongoDB `findOneAndUpdate` atomic locks on payout queueing, upstream API queries, and webhook callbacks to eliminate double-refund financial loss vectors.
4. **Analytics & Support:** Superadmin dashboard with daily summaries, VIP user toggle, transaction timeline logs, and a real-time Support Ticket chat system.

## ⏳ Pending / Future Work
- **Merchant KYC:** Build upload workflow (Aadhar/PAN) in Basic Settings and Superadmin Approval/Rejection panel.
- **Live Deployment Testing:** Switch to Live AeroPay API Keys, verify real webhook deliveries, and fix Upstream Balance API `401: No Permission` (likely requires server IP whitelisting on gateway side).
