// src/App.tsx
import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';

import ErrorBoundary from './components/shared/ErrorBoundary';
import ScrollToTop from './components/shared/ScrollToTop';
import Loading from './components/shared/Loading';
import RouteProgress from './components/shared/RouteProgress';
import CookieBanner from './components/common/CookieBanner';
import RoleGuard from './components/guards/RoleGuard';
import { useAuth } from './hooks/useAuth';
import { usePwaInstall } from './hooks/usePwaInstall';
import { setupGlobalErrorHandlers } from './utils/errorLogger';

// De landingspagina en de inlogpagina zijn het eerste dat een bezoeker ziet en
// blijven daarom in de hoofdbundle. De rest wordt lazy geladen, zodat een klant
// de admin- en Jayce-schermen niet hoeft te downloaden.
import Landing from './pages/Landing';
import Login from './pages/Login';

const Registreren = lazy(() => import('./pages/Registreren'));
const GeenToegang = lazy(() => import('./pages/GeenToegang'));
const Installeren = lazy(() => import('./pages/Installeren'));

const Voorwaarden = lazy(() => import('./pages/juridisch/Voorwaarden'));
const Privacy = lazy(() => import('./pages/juridisch/Privacy'));
const Cookies = lazy(() => import('./pages/juridisch/Cookies'));
const Herroeping = lazy(() => import('./pages/juridisch/Herroeping'));
const Disclaimer = lazy(() => import('./pages/juridisch/Disclaimer'));
const Viatim = lazy(() => import('./pages/juridisch/Viatim'));

const KlantOverzicht = lazy(() => import('./pages/klant/Overzicht'));
const GlasAanvraag = lazy(() => import('./pages/klant/GlasAanvraag'));
const StatiegeldMelden = lazy(() => import('./pages/klant/StatiegeldMelden'));
const BetalingGelukt = lazy(() => import('./pages/klant/BetalingGelukt'));
const BetalingGeannuleerd = lazy(() => import('./pages/klant/BetalingGeannuleerd'));
const Profiel = lazy(() => import('./pages/klant/Profiel'));
const KlantChat = lazy(() => import('./pages/klant/Chat'));

const JayceTaken = lazy(() => import('./pages/jayce/Taken'));
const JayceScore = lazy(() => import('./pages/jayce/Score'));
const JayceRoute = lazy(() => import('./pages/jayce/Route'));
const JayceBekenden = lazy(() => import('./pages/jayce/Bekenden'));

const MoederOverzicht = lazy(() => import('./pages/moeder/Overzicht'));
const MoederPlekken = lazy(() => import('./pages/moeder/Plekken'));
const MoederIdeeen = lazy(() => import('./pages/moeder/Ideeen'));
const MoederTijden = lazy(() => import('./pages/moeder/Tijden'));

const AdminOverzicht = lazy(() => import('./pages/admin/Overzicht'));
const AdminGlasOrders = lazy(() => import('./pages/admin/GlasOrders'));
const AdminStatiegeldLog = lazy(() => import('./pages/admin/StatiegeldLog'));
const AdminGesprekken = lazy(() => import('./pages/admin/Gesprekken'));
const AdminGesprek = lazy(() => import('./pages/admin/Gesprek'));
const AdminCijfers = lazy(() => import('./pages/admin/Cijfers'));
const AdminKlanten = lazy(() => import('./pages/admin/Klanten'));
const AdminInstellingen = lazy(() => import('./pages/admin/Instellingen'));
const AdminDagoverzicht = lazy(() => import('./pages/admin/Dagoverzicht'));
const AdminIdeeen = lazy(() => import('./pages/admin/Ideeen'));
const AdminTijden = lazy(() => import('./pages/admin/Tijden'));
const AdminOphalen = lazy(() => import('./pages/admin/Ophalen'));

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
    <Suspense fallback={<RouteProgress />}>
      <Routes>
        <Route path="/" element={isAuthenticated ? <NaarDashboard /> : <Landing />} />
        <Route path="/login" element={isAuthenticated ? <NaarDashboard /> : <Login />} />
        <Route
          path="/registreren"
          element={isAuthenticated ? <NaarDashboard /> : <Registreren />}
        />
        <Route path="/geen-toegang" element={<GeenToegang />} />

        {/* Publiek toegankelijk, ook zonder account */}
        <Route path="/installeren" element={<Installeren />} />
        <Route path="/voorwaarden" element={<Voorwaarden />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/cookies" element={<Cookies />} />
        <Route path="/herroeping" element={<Herroeping />} />
        <Route path="/disclaimer" element={<Disclaimer />} />
        <Route path="/statiegeld-verwerking" element={<Viatim />} />

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

        <Route
          path="/jayce/route"
          element={
            <RoleGuard allowedRoles={['jayce']}>
              <JayceRoute />
            </RoleGuard>
          }
        />
        <Route
          path="/jayce/bekenden"
          element={
            <RoleGuard allowedRoles={['jayce']}>
              <JayceBekenden />
            </RoleGuard>
          }
        />
        <Route
          path="/jayce/score"
          element={
            <RoleGuard allowedRoles={['jayce']}>
              <JayceScore />
            </RoleGuard>
          }
        />

        {/* Mama */}
        <Route
          path="/mama"
          element={
            <RoleGuard allowedRoles={['moeder']}>
              <MoederOverzicht />
            </RoleGuard>
          }
        />
        <Route
          path="/mama/plekken"
          element={
            <RoleGuard allowedRoles={['moeder']}>
              <MoederPlekken />
            </RoleGuard>
          }
        />
        <Route
          path="/mama/tijden"
          element={
            <RoleGuard allowedRoles={['moeder']}>
              <MoederTijden />
            </RoleGuard>
          }
        />
        <Route
          path="/mama/ideeen"
          element={
            <RoleGuard allowedRoles={['moeder']}>
              <MoederIdeeen />
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

        <Route
          path="/admin/ophalen"
          element={
            <RoleGuard allowedRoles={['admin']}>
              <AdminOphalen />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/dagoverzicht"
          element={
            <RoleGuard allowedRoles={['admin']}>
              <AdminDagoverzicht />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/klanten"
          element={
            <RoleGuard allowedRoles={['admin']}>
              <AdminKlanten />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/tijden"
          element={
            <RoleGuard allowedRoles={['admin']}>
              <AdminTijden />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/ideeen"
          element={
            <RoleGuard allowedRoles={['admin']}>
              <AdminIdeeen />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/instellingen"
          element={
            <RoleGuard allowedRoles={['admin']}>
              <AdminInstellingen />
            </RoleGuard>
          }
        />

        <Route
          path="/admin/cijfers"
          element={
            <RoleGuard allowedRoles={['admin']}>
              <AdminCijfers />
            </RoleGuard>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

const App: React.FC = () => {
  useEffect(() => {
    setupGlobalErrorHandlers();
  }, []);

  // Vroeg monteren, zodat het installatie-event van de browser niet gemist wordt.
  usePwaInstall();

  return (
    <ErrorBoundary>
      <Router>
        <ScrollToTop />
        <AppRoutes />
        <CookieBanner />
      </Router>
    </ErrorBoundary>
  );
};

export default App;
