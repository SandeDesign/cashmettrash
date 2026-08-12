// src/App.tsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';

import ErrorBoundary from './components/shared/ErrorBoundary';
import ScrollToTop from './components/shared/ScrollToTop';
import Loading from './components/shared/Loading';
import RoleGuard from './components/guards/RoleGuard';
import { useAuth } from './hooks/useAuth';
import { setupGlobalErrorHandlers } from './utils/errorLogger';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Registreren from './pages/Registreren';
import GeenToegang from './pages/GeenToegang';

import KlantOverzicht from './pages/klant/Overzicht';
import GlasAanvraag from './pages/klant/GlasAanvraag';
import StatiegeldMelden from './pages/klant/StatiegeldMelden';
import BetalingGelukt from './pages/klant/BetalingGelukt';
import BetalingGeannuleerd from './pages/klant/BetalingGeannuleerd';
import Profiel from './pages/klant/Profiel';
import KlantChat from './pages/klant/Chat';

import JayceTaken from './pages/jayce/Taken';

import AdminOverzicht from './pages/admin/Overzicht';
import AdminGlasOrders from './pages/admin/GlasOrders';
import AdminStatiegeldLog from './pages/admin/StatiegeldLog';
import AdminGesprekken from './pages/admin/Gesprekken';
import AdminGesprek from './pages/admin/Gesprek';

/** Stuurt een ingelogde gebruiker naar het dashboard van zijn rol. */
const NaarDashboard: React.FC = () => {
  const { dashboardPad } = useAuth();
  return <Navigate to={dashboardPad} replace />;
};

const AppRoutes: React.FC = () => {
  const { loading, isAuthenticated, error } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading text="Even geduld..." />
      </div>
    );
  }

  if (error && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="cmt-card max-w-sm w-full text-center">
          <h1 className="text-lg font-bold mb-2">Inloggen lukt niet</h1>
          <p className="text-sm mb-5" style={{ color: 'var(--cmt-ink-soft)' }}>
            {error}
          </p>
          <a href="/login" className="cmt-btn-primary">
            Opnieuw inloggen
          </a>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <NaarDashboard /> : <Landing />} />
      <Route path="/login" element={isAuthenticated ? <NaarDashboard /> : <Login />} />
      <Route
        path="/registreren"
        element={isAuthenticated ? <NaarDashboard /> : <Registreren />}
      />
      <Route path="/geen-toegang" element={<GeenToegang />} />

      {/* Klant */}
      <Route
        path="/mijn"
        element={
          <RoleGuard allowedRoles={['klant']}>
            <KlantOverzicht />
          </RoleGuard>
        }
      />
      <Route
        path="/glas"
        element={
          <RoleGuard allowedRoles={['klant']}>
            <GlasAanvraag />
          </RoleGuard>
        }
      />
      <Route
        path="/statiegeld"
        element={
          <RoleGuard allowedRoles={['klant']}>
            <StatiegeldMelden />
          </RoleGuard>
        }
      />
      <Route
        path="/profiel"
        element={
          <RoleGuard allowedRoles={['klant']}>
            <Profiel />
          </RoleGuard>
        }
      />
      <Route
        path="/chat"
        element={
          <RoleGuard allowedRoles={['klant']}>
            <KlantChat />
          </RoleGuard>
        }
      />
      <Route
        path="/betaling/gelukt"
        element={
          <RoleGuard allowedRoles={['klant']}>
            <BetalingGelukt />
          </RoleGuard>
        }
      />
      <Route
        path="/betaling/geannuleerd"
        element={
          <RoleGuard allowedRoles={['klant']}>
            <BetalingGeannuleerd />
          </RoleGuard>
        }
      />

      {/* Jayce */}
      <Route
        path="/jayce"
        element={
          <RoleGuard allowedRoles={['jayce']}>
            <JayceTaken />
          </RoleGuard>
        }
      />

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <RoleGuard allowedRoles={['admin']}>
            <AdminOverzicht />
          </RoleGuard>
        }
      />
      <Route
        path="/admin/glas"
        element={
          <RoleGuard allowedRoles={['admin']}>
            <AdminGlasOrders />
          </RoleGuard>
        }
      />
      <Route
        path="/admin/statiegeld"
        element={
          <RoleGuard allowedRoles={['admin']}>
            <AdminStatiegeldLog />
          </RoleGuard>
        }
      />

      <Route
        path="/admin/berichten"
        element={
          <RoleGuard allowedRoles={['admin']}>
            <AdminGesprekken />
          </RoleGuard>
        }
      />
      <Route
        path="/admin/berichten/:customerId"
        element={
          <RoleGuard allowedRoles={['admin']}>
            <AdminGesprek />
          </RoleGuard>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  useEffect(() => {
    setupGlobalErrorHandlers();
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <ScrollToTop />
        <AppRoutes />
      </Router>
    </ErrorBoundary>
  );
};

export default App;
