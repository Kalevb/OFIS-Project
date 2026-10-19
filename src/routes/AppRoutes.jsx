import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/layout/ProtectedRoute.jsx';

// Public pages
const LandingPage = lazy(() => import('../pages/LandingPage.jsx'));
const VictimLoginPage = lazy(() => import('../pages/VictimLoginPage.jsx'));
const OfficerLoginPage = lazy(() => import('../pages/OfficerLoginPage.jsx'));
const RegisterPage = lazy(() => import('../pages/RegisterPage.jsx'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage.jsx'));
const ForbiddenPage = lazy(() => import('../pages/ForbiddenPage.jsx'));

// Victim pages
const VictimDashboardPage = lazy(() => import('../pages/VictimDashboardPage.jsx'));
const SubmitCasePage = lazy(() => import('../pages/SubmitCasePage.jsx'));
const TrackStatusPage = lazy(() => import('../pages/TrackStatusPage.jsx'));
const ProfilePage = lazy(() => import('../pages/ProfilePage.jsx'));

// Officer / Admin pages
const OfficerDashboardPage = lazy(() => import('../pages/OfficerDashboardPage.jsx'));
const OfficerCasesPage = lazy(() => import('../pages/OfficerCasesPage.jsx'));
const OfficerVictimsPage = lazy(() => import('../pages/OfficerVictimsPage.jsx'));
const OfficerDuplicatesPage = lazy(() => import('../pages/OfficerDuplicatesPage.jsx'));
const OfficerReportsPage = lazy(() => import('../pages/OfficerReportsPage.jsx'));
const OfficerSettingsPage = lazy(() => import('../pages/OfficerSettingsPage.jsx'));
const OfficerUsersPage = lazy(() => import('../pages/OfficerUsersPage.jsx'));

// Shared case detail pages
const CaseDetailPage = lazy(() => import('../pages/CaseDetailPage.jsx'));
const EvidenceDetailPage = lazy(() => import('../pages/EvidenceDetailPage.jsx'));
const CaseTimelinePage = lazy(() => import('../pages/CaseTimelinePage.jsx'));

// Minimal fast fallback
const PageFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', color: '#64748B' }}>
    <div style={{ textAlign: 'center' }}>
      <i className="bi bi-shield-shaded" style={{ fontSize: '32px', color: '#2563EB', animation: 'spin 0.8s linear infinite' }}></i>
      <p style={{ marginTop: '10px', fontSize: '13px' }}>กำลังโหลดหน้า...</p>
    </div>
  </div>
);

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<VictimLoginPage />} />
        <Route path="/victim-login" element={<VictimLoginPage />} />
        <Route path="/officer-login" element={<OfficerLoginPage />} />
        <Route path="/login-officer.html" element={<OfficerLoginPage />} />
        <Route path="/login.html" element={<VictimLoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register.html" element={<RegisterPage />} />

        {/* Victim routes */}
        <Route 
          path="/victim/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['victim', 'officer', 'admin']}>
              <VictimDashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/victim-dashboard" element={<Navigate to="/victim/dashboard" replace />} />
        <Route path="/victim-dashboard.html" element={<Navigate to="/victim/dashboard" replace />} />

        <Route 
          path="/victim/submit-case" 
          element={
            <ProtectedRoute allowedRoles={['victim', 'officer', 'admin']}>
              <SubmitCasePage />
            </ProtectedRoute>
          } 
        />
        <Route path="/submit-case" element={<Navigate to="/victim/submit-case" replace />} />
        <Route path="/submit-case.html" element={<Navigate to="/victim/submit-case" replace />} />

        <Route 
          path="/victim/track-status" 
          element={
            <ProtectedRoute allowedRoles={['victim', 'officer', 'admin']}>
              <TrackStatusPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/track-status" element={<Navigate to="/victim/track-status" replace />} />
        <Route path="/track-status.html" element={<Navigate to="/victim/track-status" replace />} />

        <Route 
          path="/victim/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        <Route path="/profile" element={<Navigate to="/victim/profile" replace />} />
        <Route path="/profile.html" element={<Navigate to="/victim/profile" replace />} />

        {/* Officer / Admin routes */}
        <Route 
          path="/officer/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['officer', 'admin']}>
              <OfficerDashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/officer-dashboard" element={<Navigate to="/officer/dashboard" replace />} />
        <Route path="/officer-dashboard.html" element={<Navigate to="/officer/dashboard" replace />} />

        <Route 
          path="/officer/cases" 
          element={
            <ProtectedRoute allowedRoles={['officer', 'admin']}>
              <OfficerCasesPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/cases" element={<Navigate to="/officer/cases" replace />} />
        <Route path="/cases.html" element={<Navigate to="/officer/cases" replace />} />
        <Route path="/all-cases" element={<Navigate to="/officer/cases" replace />} />

        <Route 
          path="/officer/victims" 
          element={
            <ProtectedRoute allowedRoles={['officer', 'admin']}>
              <OfficerVictimsPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/victim-list" element={<Navigate to="/officer/victims" replace />} />

        <Route 
          path="/officer/duplicates" 
          element={
            <ProtectedRoute allowedRoles={['officer', 'admin']}>
              <OfficerDuplicatesPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/duplicate-detection" element={<Navigate to="/officer/duplicates" replace />} />
        <Route path="/duplicate-detection.html" element={<Navigate to="/officer/duplicates" replace />} />

        <Route 
          path="/officer/reports" 
          element={
            <ProtectedRoute allowedRoles={['officer', 'admin']}>
              <OfficerReportsPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/reports" element={<Navigate to="/officer/reports" replace />} />
        <Route path="/reports.html" element={<Navigate to="/officer/reports" replace />} />

        <Route 
          path="/officer/settings" 
          element={
            <ProtectedRoute allowedRoles={['officer', 'admin']}>
              <OfficerSettingsPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/settings" element={<Navigate to="/officer/settings" replace />} />
        <Route path="/settings.html" element={<Navigate to="/officer/settings" replace />} />

        <Route 
          path="/officer/users" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <OfficerUsersPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/user-management" element={<Navigate to="/officer/users" replace />} />

        {/* Shared detail routes */}
        <Route 
          path="/cases/:caseId" 
          element={
            <ProtectedRoute>
              <CaseDetailPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/case-detail" element={<Navigate to="/cases/case_001" replace />} />
        <Route path="/case-detail.html" element={<Navigate to="/cases/case_001" replace />} />

        <Route 
          path="/cases/:caseId/evidence/:evidenceId" 
          element={
            <ProtectedRoute>
              <EvidenceDetailPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/evidence-detail" element={<Navigate to="/cases/case_001/evidence/evd_001_001" replace />} />
        <Route path="/evidence-detail.html" element={<Navigate to="/cases/case_001/evidence/evd_001_001" replace />} />

        <Route 
          path="/cases/:caseId/timeline" 
          element={
            <ProtectedRoute>
              <CaseTimelinePage />
            </ProtectedRoute>
          } 
        />
        <Route path="/case-timeline" element={<Navigate to="/cases/case_001/timeline" replace />} />
        <Route path="/case-timeline.html" element={<Navigate to="/cases/case_001/timeline" replace />} />

        {/* Error routes */}
        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
