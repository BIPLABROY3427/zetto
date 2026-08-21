# Zetto.in (Payment Gateway) - AI Handoff & Planning Document

## 🌐 Project Details
- **Frontend Domain:** Zetto.in
- **Backend API Domain:** api.zetto.in
- **GitHub Repo:** `https://github.com/BIPLABROY3427/zetto`
- **Tech Stack:** React (Vite), Node.js, Express, MongoDB, Redis, JWT
- **Dev Server:** `npm run dev` in both `/client` and `/server`
- **Build:** `npm run build` inside `/client`

### 🔐 Superadmin Credentials
- **Username / Email:** `biplabroy3427@gmail.com`
- **Password:** `200010379`

---

## 🎨 UI/UX Design System (FROZEN - DO NOT CHANGE)

> 🛑 **CRITICAL RULE: STRICT UI FREEZE** 🛑
> The user has explicitly mandated: **"Ui UI change nahe kerna kesev kemat me existing ui change nahe kerna"**.
> Under NO circumstances should you alter the existing UI, redesign layouts, or change the visual appearance of any built components. All new features must strictly use the existing `.pg-*` classes without inventing new designs.

### Brand Colors & Theme

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-main` | `#f4f7fe` | App background |
| `--bg-panel` | `#ffffff` | Panel/card background |
| `--text-primary` | `#1b2559` | Main text |
| `--text-secondary` | `#a3aed1` | Muted/subtitle text |
| `--primary` | `#0066ff` | Primary Zetto Blue |
| `--primary-gradient` | `linear-gradient(135deg, #0066ff 0%, #00e5ff 100%)` | Branding accents only (NO gradient buttons) |
| `--border-color` | `#e2e8f0` | All borders |

### Design Philosophy
- **Light Mode First** — Use `#f4f7fe` for backgrounds and `#ffffff` for cards.
- **Premium UI** — Soft shadows (`--shadow-soft`, `--shadow-hover`), rounded corners (`--radius-lg`, `--radius-md`), clean spacing.
- **Flat Buttons** — NO gradients on buttons. Use solid flat colors for buttons.
- **Typography** — `Inter` (imported from Google Fonts).
- **Custom Dialogs** — `window.alert` and `window.confirm` are strictly forbidden. Use the custom `ConfirmDialog` and `useConfirm` hook.

### Shared CSS Variables & Design System Location
All CSS variables and global `.pg-*` classes are defined in:
```
client/src/index.css
```
Any new color usage or component should reuse the `.pg-*` classes (e.g., `.pg-card`, `.pg-btn-primary`, `.pg-table`).

---

## 📁 Frontend Folder Architecture

```
client/src/
├── index.css                  ← GLOBAL: CSS variables, auth page styles, body font
├── App.jsx                    ← Router
├── context/
│   ├── AuthContext.jsx         ← Auth state (user, login, logout, role)
│   └── TabsContext.jsx         ← Multi-tab manager
├── services/
│   └── apiClient.js            ← Axios instance, token refresh, error interceptor
├── features/
│   ├── auth/
│   │   ├── Auth.css            ← Auth pages shared CSS (.auth-card, .auth-form, etc.)
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Forget.jsx
│   │   └── AuthOtp.jsx
│   └── dashboard/
│       ├── layout/
│       │   ├── DashboardLayout.jsx / .css   ← Outer shell, main-content scroll
│       │   ├── Sidebar.jsx / .css           ← Navigation sidebar
│       │   ├── Header.jsx / .css            ← Top navbar, search, user dropdown
│       │   └── TabsBar.jsx / .css           ← Multi-tab browser bar
│       └── pages/
│           ├── Overview/                    ← Merchant main dashboard
│           ├── SuperAdminOverview/          ← Superadmin analytics dashboard
│           ├── UserManagement/              ← User list + manage/edit modals
│           ├── UserProfileDetails/          ← Per-user full profile page
│           ├── PayinOrder/                  ← Create Payin links
│           ├── PayoutOrder/                 ← Request Payout
│           ├── PayinHistory/                ← Payin transaction history
│           ├── PayoutHistory/               ← Payout transaction history
│           ├── SystemTransactions/          ← Superadmin: all txns
│           ├── Tickets/                     ← Support tickets
│           ├── RolesAndPermissions/         ← RBAC role editor
│           ├── BasicSetting/               ← Merchant webhook/api settings
│           ├── BalDaySum/                   ← Balance daily summary
│           ├── DailySummary/               ← Daily transaction summary
│           ├── ApiDocumentation/            ← API docs for merchants
│           └── Profile/                     ← User profile settings
└── components/
    └── ui/Accordion/
        ├── AccordionPanel.jsx              ← Reusable dark accordion panel
        └── AccordionPanel.css
```

---

## 🧩 Key CSS Component Patterns (Global Design System)

Instead of redefining CSS for every page, you **MUST** use the global design system classes defined in `client/src/index.css`.

### How to structure a new page:
```jsx
<div className="pg-root">
  <div className="pg-toolbar">
    <div>
      <h3>Page Title</h3>
      <p>Subtitle goes here</p>
    </div>
    <div className="pg-actions">
      <button className="pg-btn pg-btn-primary">Action</button>
    </div>
  </div>

  <div className="pg-card">
    <div className="pg-card-header">
      <h4 className="pg-card-title">Card Title</h4>
    </div>
    <div className="pg-card-body">
      {/* Content */}
    </div>
  </div>
</div>
```

**Common Global Classes (`index.css`):**
- **Cards:** `.pg-card`, `.pg-card-header`, `.pg-card-title`, `.pg-card-body`
- **Buttons:** `.pg-btn`, `.pg-btn-primary`, `.pg-btn-secondary`, `.pg-btn-danger`, `.pg-btn-success`
- **Inputs:** `.pg-input`, `.pg-select`, `.pg-field`, `.pg-textarea`
- **Tables:** `.pg-table-wrap`, `.pg-table`
- **Badges:** `.pg-badge`, `.pg-badge-blue`, `.pg-badge-green`, `.pg-badge-red`, etc.
- **Status:** `.pg-status`, `.pg-status-completed`, `.pg-status-pending`, `.pg-status-failed`
- **Modals:** `.pg-modal-backdrop`, `.pg-modal`, `.pg-modal-header`, `.pg-modal-body`

---

## 🔧 Key Files to Know

| File | What it does |
|------|-------------|
| `client/src/index.css` | Global CSS variables (`:root`), auth styles, body font |
| `client/src/features/auth/Auth.css` | Login, Signup, Forgot, OTP page styles |
| `client/src/features/dashboard/layout/Sidebar.css` | Sidebar nav, active states, submenu |
| `client/src/features/dashboard/layout/Header.css` | Top bar, search, user dropdown |
| `client/src/features/dashboard/layout/TabsBar.css` | Multi-tab bar below header |
| `client/src/features/dashboard/pages/Overview/Overview.css` | Shared: stat-card, data-table, badges, form-control |
| `client/src/features/dashboard/pages/UserManagement/UserManagement.css` | Buttons, modal, search bar |
| `client/src/components/ui/Accordion/AccordionPanel.css` | Accordion section styling |
| `client/src/services/apiClient.js` | Axios with token refresh + error handling (4xx suppressed) |

---

## ✅ Work Completed (Implemented Features)

### 1. Authentication & Session Management
- Login, Signup (with OTP verification), Forgot Password flows — all redesigned in Zetto brand.
- JWT based session management stored securely.
- Global token refresh system using Axios Interceptors.
- **Password show/hide toggle** on Login, Signup, Forgot Password pages.
- **Fanicon logo** displayed on all auth pages with cyan glow.

### 2. Role-Based Access Control (RBAC)
- **Roles:** `superadmin`, `admin`, `user` (merchant).
- **First Account Rule:** First account = superadmin. Rest = user.
- Protected routes by role. Superadmin cannot be deleted or downgraded.

### 3. Dashboard UI & Combined Sidebar
- **Dynamic Sidebar:** Superadmin sees Merchant + Superadmin items together.
- **Collapsed Sidebar** shows `fanicon.png` logo instead of "Z" text.
- Sidebar submenus have correct max-height (600px) for scrollable content.

### 4. Advanced Commission System
- Superadmin sets Custom Commissions per merchant (% + Flat ₹).
- Fully integrated into transaction calculations.

### 5. Transaction Gateway Integration (AeroPay)
- Payin/Payout via AeroPay. Webhook validated via MD5 Signature.

### 6. User (Merchant) Dashboard Actions
- Manual Payin link creation + Manual Payout requests.
- Unified auth: both `x-api-key` and `JWT` supported for gateway endpoints.

### 7. Support Tickets System
- Merchants create tickets. Superadmin/Admins reply in real-time.

### 8. API Documentation Center
- `/dashboard/api-docs` for Merchants with request/response/webhook docs.

### 9. Advanced User Management (Superadmin)
- User list with balances, VIP status toggle, create user (bypass OTP).
- **VIP Toggle:** In "Manage" modal, check "Mark as VIP User 👑" checkbox.
- **User Profile Page:** Click on username → `/dashboard/users/:id`.
- Row click goes to profile; action buttons stop propagation.

### 10. Dynamic Roles & Permissions (RBAC)
- Custom roles with CRUD permissions per gateway module.

### 11. System Analytics & Time Filters
- Today/Yesterday metrics on SuperAdmin dashboard with time filter.

### 12. Complete Dashboard UI Redesign (FULLY DONE ✅)

**Phase 1 — Global Foundation:**
- Migrated entire app from dark navy theme → premium **Light/White Theme** (`#f4f7fe` bg, `#ffffff` cards).
- Created a **global design system** in `index.css` with `.pg-*` utility classes for cards, buttons, inputs, tables, modals, badges, status chips, stat cards — used by every page.
- Created custom **`ConfirmDialog`** component + **`useConfirm`** hook (`client/src/components/ui/ConfirmDialog/`) to permanently replace `window.alert` and `window.confirm` across the entire app.

**Phase 2 — Layout Redesign:**
- `Sidebar.jsx/.css` — Colorful light sidebar, active states with left border accent, mobile collapsible, submenu support.
- `Header.jsx/.css` — Light topbar with search, user dropdown, notifications.
- `TabsBar.jsx/.css` — Multi-tab browser bar with light theme, close buttons, active tab indicator.
- `DashboardLayout.jsx/.css` — Main shell with responsive sidebar + content area.

**Phase 3 — ALL Pages Redesigned (zero old dark theme remaining):**

| Page | Key Features |
|---|---|
| `Overview.jsx` | Merchant dashboard with stat cards, Payin/Payout summary, balance display |
| `SuperAdminOverview.jsx` | 4 stat cards (Payin/Payout/Profit/Upstream), Top Merchants leaderboard, Merchant Performance table, date range filter |
| `UserManagement.jsx` | User list table, Create/Edit modals, VIP toggle, Commission modal, Global Commission modal |
| `RolesAndPermissions.jsx` | Roles table, Create/Edit role modal with CRUD permission checkboxes |
| `UserProfileDetails.jsx` | Avatar header card, Personal/Financials/Services info grid (3-col), Transactions table |
| `PayinOrder.jsx` | Search + status filter, Create Payment Link modal with copy-link success state |
| `PayoutOrder.jsx` | Search + status filter, Create Payout modal with 4 bank detail fields |
| `PayinHistory.jsx` | Filter bar, Resend Webhook action button |
| `PayoutHistory.jsx` | Filter bar, Resend Webhook action button |
| `DailySummary.jsx` | 4 stat cards (Total/Volume/Completed/Pending-Failed) + filtered table |
| `BalDaySum.jsx` | 4 stat cards (Records/Volume/Settled/Unsettled) + filtered table |
| `Tickets.jsx` | Ticket list table with unread badge, Raise Ticket modal, **full chat window** with bubble messages + polling |
| `SystemTransactions.jsx` | Multi-filter (status + type), Merchant click → profile, JSON payload modal, Resend Webhook |
| `Profile.jsx` | Avatar card (auto-initials) + 2-column edit form layout |
| `AccountSettings.jsx` | Edit profile, change password with strength bar, account details copy ID |
| `ActivityLog.jsx` | Vertical timeline with colored icons, filtering, and session stats |
| `ApiDocumentation.jsx` | (not changed, already had custom design) |

**Phase 4 — Build Verification:**
- `npm run build` → **✓ built in ~1.4s, zero errors**.

### 13. Frontend Code Architecture
- Every route = its own folder with `.jsx` + `.css`.
- Double Toast bug fixed: 4xx errors handled at component level only.

### 14. Version Control
- Git initialized. Uploaded to `https://github.com/BIPLABROY3427/zetto`.
- Root `.gitignore` excludes `.env`, `node_modules`, `dist`.

---

## ⏳ Pending / Future Work

> **UI/UX Redesign is 100% COMPLETE AND FROZEN. DO NOT MODIFY EXISTING UI.** All pages use the new `.pg-*` light theme. The following are functional/backend features still to be implemented:


### 2. Webhook Retry Mechanism
- **Plan:** BullMQ / Redis retry queue (3 retries, exponential backoff).

### 3. Custom Checkout Page (Optional)
- Public route: `https://zetto.in/checkout/:orderId` for VPA input UI.

### 4. Analytics & Exporting
- "Export to CSV" for Payin/Payout history tables.
- Chart.js / Recharts for weekly/monthly volume graphs.

### 5. Merchant KYC & Verification
- KYC upload in Basic Settings (Aadhar/PAN).
- Superadmin Approve/Reject KYC workflow.

### 6. Live Environment Testing
- Test with **Live AeroPay API Keys** + verify real webhook signatures.
- Fix `401: No Permission` error from upstream balance API (likely server IP whitelisting needed).

---

## 🛠 Active Roles
- **Superadmin:** Access to everything — commissions, system profit, user management, RBAC.
- **Admin:** View transactions + manage Support tickets.
- **User (Merchant):** API for payments, own balance, payout requests.

---

## ⚡ Quick Dev Reference

### Start Development
```bash
# Terminal 1 - Backend
cd /Users/biplab/Desktop/getway/server && npm run dev

# Terminal 2 - Frontend
cd /Users/biplab/Desktop/getway/client && npm run dev
```

### Verify Before Handoff (MANDATORY)
```bash
cd /Users/biplab/Desktop/getway/client && npm run build
# Must exit with code 0 (zero errors)
```

### Adding a New Page
1. Create folder: `client/src/features/dashboard/pages/NewPage/`
2. Create `NewPage.jsx` + `NewPage.css`
3. Import your CSS at the top: `import './NewPage.css';`
4. Use the global design system — wrap all content like this:
```jsx
import { FiIcon } from 'react-icons/fi';
import './NewPage.css';

const NewPage = () => (
  <div className="pg-root">
    {/* Toolbar with title + action buttons */}
    <div className="pg-toolbar">
      <div>
        <h3>Page Title</h3>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Subtitle</p>
      </div>
      <div className="pg-actions">
        <button className="pg-btn pg-btn-primary"><FiIcon /> Action</button>
      </div>
    </div>

    {/* Optional stats row */}
    <div className="pg-stats-row">
      <div className="pg-stat-card">
        <div className="pg-stat-label">Label</div>
        <div className="pg-stat-val blue">₹0</div>
      </div>
    </div>

    {/* Table card */}
    <div className="pg-card">
      <div className="pg-card-header">
        <h4 className="pg-card-title">
          <span className="pg-card-title-icon"><FiIcon /></span>
          Section Title
        </h4>
      </div>
      <div className="pg-table-wrap">
        <table className="pg-table">
          <thead><tr><th>Column</th></tr></thead>
          <tbody><tr><td>Data</td></tr></tbody>
        </table>
      </div>
    </div>
  </div>
);
export default NewPage;
```
5. Register route in `App.jsx`.
6. Add to Sidebar in `Sidebar.jsx`.

### All Available Global Classes (`index.css`)

**Layout:**
- `.pg-root` — Page root wrapper (padding, gap)
- `.pg-toolbar` — Flex row: title on left, actions on right
- `.pg-filters` — Flex row for filter inputs/selects
- `.pg-actions` — Flex row for action buttons (right side)

**Cards:**
- `.pg-card` — White card with shadow + border
- `.pg-card-header` — Card header (flex row, border-bottom)
- `.pg-card-title` — Card title with optional icon
- `.pg-card-title-icon` — Colored square icon in title
- `.pg-card-body` — Card body with padding

**Stats:**
- `.pg-stats-row` — Auto-fit stats grid
- `.pg-stat-card` — Single stat card
- `.pg-stat-label` — Small uppercase label
- `.pg-stat-val` — Big value number (add `.blue`, `.green`, `.red`)
- `.pg-stat-sub` — Small subtitle below value

**Buttons:**
- `.pg-btn` — Base button (flat, no gradient)
- `.pg-btn-primary` — Blue primary button
- `.pg-btn-secondary` — Gray outlined button
- `.pg-btn-danger` — Red outlined button
- `.pg-btn-success` — Green outlined button
- `.pg-btn-sm` — Small button size

**Forms:**
- `.pg-input`, `.pg-select`, `.pg-textarea`, `.pg-field` — Styled inputs
- `.pg-form` — Form wrapper with gap
- `.pg-form-row` — Single field row (label + input)
- `.pg-form-row-2` — Two-column row on desktop
- `.pg-label` — Field label
- `.pg-label-req` — Red asterisk for required fields

**Table:**
- `.pg-table-wrap` — Scrollable table wrapper
- `.pg-table` — Full-width styled table

**Badges & Status:**
- `.pg-badge` + `.pg-badge-blue/green/red/amber/gray/inr` — Color badges
- `.pg-status` + `.pg-status-completed/pending/failed/processing` — Status chips

**Modals:**
- `.pg-modal-backdrop` — Fixed overlay (click outside to close)
- `.pg-modal` — Modal box (max-width 520px)
- `.pg-modal-sm` — Smaller modal (max-width 420px)
- `.pg-modal-lg` — Larger modal (max-width 720px)
- `.pg-modal-header`, `.pg-modal-title`, `.pg-modal-close` — Modal header parts
- `.pg-modal-body` — Modal content area
- `.pg-modal-footer` — Modal footer with action buttons

**Utilities:**
- `.pg-empty` — Centered empty-state block
- `.pg-loading` — Centered loading indicator
- `.pg-divider` — Horizontal divider line
- `.pg-info-item`, `.pg-info-label`, `.pg-info-value` — Key-value info rows

### Adding a New Button / Action
- **Primary action:** `className="pg-btn pg-btn-primary"`
- **Secondary/outline action:** `className="pg-btn pg-btn-secondary"`
- **Danger action:** `className="pg-btn pg-btn-danger"`

### Asking User for Confirmation (Custom Dialog)
```jsx
import ConfirmDialog from '../../../../components/ui/ConfirmDialog/ConfirmDialog';
import useConfirm from '../../../../components/ui/ConfirmDialog/useConfirm';

const MyPage = () => {
  const { confirm, confirmProps } = useConfirm();

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Delete Item?',
      message: 'This action cannot be undone.',
      variant: 'danger'           // 'danger' | 'info'
    });
    if (!ok) return;
    // proceed with delete...
  };

  return (
    <>
      <div className="pg-root">
        {/* your page content */}
      </div>
      <ConfirmDialog {...confirmProps} />
    </>
  );
};
```

> ⚠️ **NEVER use `window.alert()` or `window.confirm()` — always use the ConfirmDialog above.**

