import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from './context/AuthContext';
import { TabsProvider } from "./context/TabsContext";
// Auth
const Login = lazy(() => import("./features/auth/Login"));
const Signup = lazy(() => import("./features/auth/Signup"));
const ForgetPw = lazy(() => import("./features/auth/Forget"));
const AuthOtp = lazy(() => import("./features/auth/AuthOtp"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const DashboardLayout = lazy(() => import("./features/dashboard/layout/DashboardLayout"));
const Overview = lazy(() => import("./features/dashboard/pages/Overview/Overview"));
const BasicSetting = lazy(() => import("./features/dashboard/pages/BasicSetting/BasicSetting"));
const PayinOrder = lazy(() => import("./features/dashboard/pages/PayinOrder/PayinOrder"));
const PayoutOrder = lazy(() => import("./features/dashboard/pages/PayoutOrder/PayoutOrder"));
const DailySummary = lazy(() => import("./features/dashboard/pages/DailySummary/DailySummary"));
const BalDaySum = lazy(() => import("./features/dashboard/pages/BalDaySum/BalDaySum"));
const Tickets = lazy(() => import("./features/dashboard/pages/Tickets/Tickets"));
const UserManagement = lazy(() => import("./features/dashboard/pages/UserManagement/UserManagement"));
const RolesAndPermissions = lazy(() => import("./features/dashboard/pages/RolesAndPermissions/RolesAndPermissions"));
const SuperAdminOverview = lazy(() => import("./features/dashboard/pages/SuperAdminOverview/SuperAdminOverview"));
const SystemTransactions = lazy(() => import("./features/dashboard/pages/SystemTransactions/SystemTransactions"));
const SystemBalances = lazy(() => import("./features/dashboard/pages/SystemBalances/SystemBalances"));
const ApiDocumentation = lazy(() => import("./features/dashboard/pages/ApiDocumentation/ApiDocumentation"));
const UserProfileDetails = lazy(() => import("./features/dashboard/pages/UserProfileDetails/UserProfileDetails"));
const AccountSettings = lazy(() => import("./features/dashboard/pages/AccountSettings/AccountSettings"));
const ActivityLog = lazy(() => import("./features/dashboard/pages/ActivityLog/ActivityLog"));

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', height: '100vh', alignItems: 'center', background: '#0f172a', color: '#00d2ff' }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

const AdminRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', height: '100vh', alignItems: 'center', background: '#0f172a', color: '#00d2ff' }}>Loading...</div>;
  }

  return user?.role === 'admin' || user?.role === 'superadmin' ? <Outlet /> : <Navigate to="/dashboard" />;
};

const PermissionRoute = ({ moduleName }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user?.role === 'superadmin' || user?.role === 'user') {
    return <Outlet />; // Superadmin has all access. User (merchant) has access to their own data via backend.
  }

  if (user?.role === 'admin') {
    if (!moduleName) return <Outlet />;
    if (user?.permissions && user.permissions[moduleName]?.view === true) {
      return <Outlet />;
    }
  }

  return <Navigate to="/dashboard" />;
};

const App = () => {

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', height: '100vh', alignItems: 'center', background: '#0f172a', color: '#00d2ff' }}>Loading Zetto.in...</div>}>
        <Routes>

          {/* ================= PUBLIC PATH ================= */}
          <Route path="/" element={<LandingPage />} />

          {/* ================= USER AUTH ================= */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forget" element={<ForgetPw />} />
          <Route path="/auth-otp" element={<AuthOtp />} />

          {/* ================= PROTECTED ROUTES ================= */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<TabsProvider><DashboardLayout /></TabsProvider>}>

              <Route element={<PermissionRoute moduleName="Dashboard Overview" />}>
                <Route index element={<Overview />} />
              </Route>

              <Route element={<PermissionRoute moduleName="Developer Settings" />}>
                <Route path="basic" element={<BasicSetting />} />
                <Route path="account-settings" element={<AccountSettings />} />
                <Route path="activity-log" element={<ActivityLog />} />
              </Route>

              <Route element={<PermissionRoute moduleName="Payin Management" />}>
                <Route path="payin" element={<PayinOrder />} />
              </Route>

              <Route element={<PermissionRoute moduleName="Payout Management" />}>
                <Route path="payout" element={<PayoutOrder />} />
              </Route>

              <Route element={<PermissionRoute moduleName="Transaction History" />}>
                <Route path="daily-summary" element={<DailySummary />} />
                <Route path="bal-day-sum" element={<BalDaySum />} />
              </Route>

              <Route element={<PermissionRoute moduleName="Support Tickets" />}>
                <Route path="tickets" element={<Tickets />} />
              </Route>

              <Route path="api-docs" element={<ApiDocumentation />} />

              {/* ADMIN / SUPERADMIN ROUTES */}
              <Route element={<AdminRoute />}>
                <Route element={<PermissionRoute moduleName="User Management" />}>
                  <Route path="users" element={<UserManagement />} />
                  <Route path="users/:id" element={<UserProfileDetails />} />
                </Route>
                <Route path="roles-permissions" element={<RolesAndPermissions />} />
                <Route element={<PermissionRoute moduleName="Dashboard Overview" />}>
                  <Route path="system-overview" element={<SuperAdminOverview />} />
                </Route>
                <Route element={<PermissionRoute moduleName="Transaction History" />}>
                  <Route path="system-transactions" element={<SystemTransactions initialType="all" />} />
                  <Route path="system-balances" element={<SystemBalances />} />
                </Route>
                <Route element={<PermissionRoute moduleName="Payin Management" />}>
                  <Route path="system-payins" element={<SystemTransactions initialType="payment" />} />
                </Route>
                <Route element={<PermissionRoute moduleName="Payout Management" />}>
                  <Route path="system-payouts" element={<SystemTransactions initialType="withdrawal" />} />
                </Route>
              </Route>
            </Route>
          </Route>

          {/* (Removed naked admin routes, moved to dashboard) */}

        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
