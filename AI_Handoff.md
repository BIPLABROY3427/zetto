# Zetto.in (Payment Gateway) - AI Handoff & Planning Document

## 🌐 Project Details
- **Frontend Domain:** Zetto.in
- **Backend API Domain:** api.zetto.in
- **Tech Stack:** React (Vite), Node.js, Express, MongoDB, Redis, JWT

### 🔐 Superadmin Credentials
- **Username / Email:** `biplabroy3427@gmail.com`
- **Password:** `200010379`

---

## ✅ Work Completed (Implemented Features)

### 1. Authentication & Session Management
- Login, Signup (with OTP verification), Forgot Password flows.
- JWT based session management stored securely.
- Global token refresh system using Axios Interceptors so users don't get logged out abruptly.

### 2. Role-Based Access Control (RBAC)
- **Roles:** `superadmin`, `admin`, `user` (merchant).
- **First Account Rule:** The first account created automatically becomes the `superadmin`. Subsequent accounts are `user`.
- Protected routes depending on user role. Superadmin cannot be deleted or downgraded.

### 3. Dashboard UI & Combined Sidebar
- **Dynamic Sidebar:** `superadmin` sees all Merchant items (Payin, Payout, Basic Settings) **AND** Superadmin items (System Overview, All User's Transactions, Balances) in a combined, unified sidebar.
- Modern glassmorphism UI with responsive design.

### 4. Advanced Commission System
- Superadmin can set **Custom Commissions** per merchant.
- Supports both **Percentage (%)** + **Flat Rate (₹)** simultaneously.
- Example: Payin (2% + ₹5), Payout (3% + ₹10).
- Fully integrated into transaction calculations (Net amount).

### 5. Transaction Gateway Integration (Upstream AeroPay)
- Integrated AeroPay APIs (Payin and Payout).
- **Payin Flow:** User requests Payin ➔ We generate `PAY_XXX` Order ➔ Call AeroPay ➔ Return Payment URL.
- **Payout Flow:** User requests Payout ➔ Calculate Fees ➔ Deduct Wallet Balance ➔ Call AeroPay ➔ Handle failures (Refund on failure).
- Webhook endpoints (`/api/v1/gateway/aeropay/callback`) validated via MD5 Signature.

### 6. User (Merchant) Dashboard Actions
- **Manual Payin:** Merchants can manually create a Payment link directly from their dashboard (`PayinOrder.jsx`).
- **Manual Payout:** Merchants can directly request a bank withdrawal from their dashboard (`PayoutOrder.jsx`).
- **Unified Auth Middleware:** The gateway endpoints (`/api/v1/gateway/...`) now support **both** `x-api-key` (for server-to-server) and `JWT` (for manual dashboard clicks).

### 7. Support Tickets System
- Merchants can create support tickets.
- Superadmin/Admins can view and reply to tickets in real-time.

### 8. API Documentation Center
- Added `/dashboard/api-docs` page for Merchants.
- Contains endpoints, request payloads, response payloads, and Webhook verification instructions (HMAC-SHA256).

### 9. Advanced User Management (Superadmin)
- Superadmin can see user balances directly in the User List.
- **VIP Status:** Superadmin can mark users as VIP and set their global custom commission separate from regular users.
- **User Details Page:** Clicking on a user opens a dedicated full-page profile (`/dashboard/users/:id`) showing complete transaction history, personal details, and balances.
- Superadmin can create users directly from the dashboard (bypassing OTP).

### 10. Dynamic Roles & Route Permissions (RBAC)
- Built a custom **Roles & Permissions** page mirroring a premium RBAC layout.
- Superadmin can create new roles (e.g., 'Support Agent', 'Finance Admin') and configure specific CRUD permissions (`view`, `create`, `edit`, `delete`) for Payment Gateway modules like Payin, Payout, Tickets, User Management, etc.
- **Support Tickets Access:** Only admins with "Support Tickets" permission can view or reply to tickets.
- Custom Roles can be assigned to `admin` level staff members from the Staff User List.
- Base roles (`superadmin`, `admin`, `user`) are still maintained.

### 11. System Analytics & Time Filters
- Implemented "Today" and "Yesterday" metrics on both backend aggregations and frontend charts for clearer daily revenue tracking.

### 12. Frontend Code Architecture Restructuring
- Fully refactored frontend routing structure.
- Every route component (e.g., `PayinOrder`, `UserProfileDetails`) now has its own dedicated folder containing its `.jsx` and isolated `.css` file for maintainability.

---

## ⏳ Pending / Future Work

### 1. Webhook Retry Mechanism
- Currently, when a transaction completes, we fire a webhook to the merchant's `callbackUrl`. If the merchant's server is down, it fails. 
- **Plan:** Implement a BullMQ / Redis based retry queue for webhooks (e.g., retry 3 times with exponential backoff).

### 2. Custom Checkout Page (Optional)
- Currently, for Payins, we return the AeroPay generated `paymentUrl`. If AeroPay requires us to build the UI for the customer to input their VPA, we will need to create a public checkout route (e.g., `https://zetto.in/checkout/:orderId`).

### 3. Analytics & Exporting
- Add "Export to CSV" buttons for Transaction tables (Payin/Payout history).
- Advanced graph implementations (Chart.js / Recharts) for weekly/monthly volume.

### 4. Merchant KYC & Verification
- Add a KYC section in Basic Settings where merchants can upload Aadhar/PAN.
- Superadmin dashboard to "Approve" or "Reject" KYC before allowing payouts.

### 5. Live Environment Testing
- Test the full flow using **Live AeroPay API Keys**.
- Verify Webhook signatures with real data.

---

## 🛠 Active Roles
- **Superadmin:** Has access to EVERYTHING. Can set commissions, view system profit, manage users.
- **Admin:** Can view transactions and manage Support tickets on behalf of Superadmin.
- **User (Merchant):** Uses the API to process payments, manages their own balance, and requests payouts.
