import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router";
import { ErrorBoundary } from "@/components/ErrorBoundary";
// Removed missing import: import AuthLayoutSkeleton from "@/components/AuthLayoutSkeleton";

const Landing = lazy(() => import("./pages/Landing"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Billing = lazy(() => import("./pages/Billing"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Restock = lazy(() => import("./pages/Restock"));
const Trades = lazy(() => import("./pages/Trades"));
const MapPindrops = lazy(() => import("./pages/MapPindrops"));
const Campaigns = lazy(() => import("./pages/Campaigns"));
const Heatmap = lazy(() => import("./pages/Heatmap"));
const Genie = lazy(() => import("./pages/Genie"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const RetailerSetup = lazy(() => import("./pages/RetailerSetup"));
const Login = lazy(() => import("./pages/Login"));
const SignUp = lazy(() => import("./pages/SignUp"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const EmailVerification = lazy(() => import("./pages/EmailVerification"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const NotFound = lazy(() => import("./pages/NotFound"));

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center">Loading...</div>}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/restock" element={<Restock />} />
          <Route path="/trades" element={<Trades />} />
          <Route path="/pindrops" element={<MapPindrops />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/heatmap" element={<Heatmap />} />
          <Route path="/genie" element={<Genie />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/retailer/setup" element={<RetailerSetup />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
