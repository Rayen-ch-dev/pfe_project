import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import SignInPage from './pages/Auth/SignInPage';
import SignUpPage from './pages/Auth/SignUpPage';
import { DashboardLayout } from './pages/dashboard/components';
import Dashboard from './pages/dashboard/Dashboard';
import UsersPage from './pages/dashboard/UsersPage';
import ReservationsPage from './pages/dashboard/ReservationsPage';
import PaymentsPage from './pages/dashboard/PaymentsPage';
import ReportsPage from './pages/dashboard/ReportsPage';
import SettingsPage from './pages/dashboard/SettingsPage';
import KitchenPlanningPage from './pages/dashboard/Kitchenplanningpage ';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Redirect root to signin */}
            <Route path="/" element={<Navigate to="/auth/signin" replace />} />

            {/* Auth Routes - Only Sign In for Admin */}
            <Route path="/auth/signin" element={<SignInPage />} />
            <Route path="/auth/signup" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <SignUpPage />
              </ProtectedRoute>
            } />

            {/* Protected Admin Dashboard Routes with Layout */}
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'AGENT_RESTAURANT', 'STUDENT']}>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />

              <Route path="settings" element={<SettingsPage />} />

              <Route path="reservations" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'AGENT_RESTAURANT']}>
                  <ReservationsPage />
                </ProtectedRoute>
              } />

              <Route path="kitchen" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'AGENT_RESTAURANT']}>
                  <KitchenPlanningPage />
                </ProtectedRoute>
              } />

              <Route path="users" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <UsersPage />
                </ProtectedRoute>
              } />

              <Route path="payments" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <PaymentsPage />
                </ProtectedRoute>
              } />

              <Route path="reports" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <ReportsPage />
                </ProtectedRoute>
              } />
            </Route>

            {/* Catch all route - redirect to signin */}
            <Route path="*" element={<Navigate to="/auth/signin" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;