import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import InternLayout from './components/layouts/InternLayout';
import InternDashboard from './pages/intern/Dashboard';
import WeeklyPulse from './pages/intern/WeeklyPulse';
import BlockerBoard from './pages/intern/BlockerBoard';
import WinWall from './pages/intern/WinWall';
import MilestoneCheckin from './pages/intern/MilestoneCheckin';
import AdminLayout from './components/layouts/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import RiskRadar from './pages/admin/RiskRadar';
import BlockerHeatmap from './pages/admin/BlockerHeatmap';
import CohortComparison from './pages/admin/CohortComparison';
import AnonInsights from './pages/admin/AnonInsights';
import CohortsManage from './pages/admin/CohortsManage';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen bg-background text-white flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to={user.role === 'INTERN' ? '/intern/dashboard' : '/admin/dashboard'} replace />} />

      {/* Intern Routes */}
      <Route path="/intern" element={
        <ProtectedRoute allowedRoles={['INTERN']}>
          <InternLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<InternDashboard />} />
        <Route path="weekly-pulse" element={<WeeklyPulse />} />
        <Route path="milestones" element={<MilestoneCheckin />} />
        <Route path="blocker-board" element={<BlockerBoard />} />
        <Route path="win-wall" element={<WinWall />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Admin/Mentor Routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['ADMIN', 'MENTOR']}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="risk-radar" element={<RiskRadar />} />
        <Route path="blocker-heatmap" element={<BlockerHeatmap />} />
        <Route path="cohort-comparison" element={<CohortComparison />} />
        <Route path="insights" element={<AnonInsights />} />
        <Route path="cohorts" element={<CohortsManage />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Root redirect */}
      <Route path="*" element={<Navigate to={user ? (user.role === 'INTERN' ? '/intern/dashboard' : '/admin/dashboard') : "/login"} replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
