// src/App.tsx
import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';

import ErrorBoundary from './components/shared/ErrorBoundary';
import { lazyRoute } from './utils/lazyRoute';
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

const Registreren = lazyRoute(() => import('./pages/Registreren'));
const GeenToegang = lazyRoute(() => import('./pages/GeenToegang'));
const Installeren = lazyRoute(() => import('./pages/Installeren'));

const Voorwaarden = lazyRoute(() => import('./pages/juridisch/Voorwaarden'));
const Privacy = lazyRoute(() => import('./pages/juridisch/Privacy'));
const Cookies = lazyRoute(() => import('./pages/juridisch/Cookies'));
const Herroeping = lazyRoute(() => import('./pages/juridisch/Herroeping'));
const Disclaimer = lazyRoute(() => import('./pages/juridisch/Disclaimer'));
const Viatim = lazyRoute(() => import('./pages/juridisch/Viatim'));

const KlantOverzicht = lazyRoute(() => import('./pages/klant/Overzicht'));
const GlasAanvraag = lazyRoute(() => import('./pages/klant/GlasAanvraag'));
const StatiegeldMelden = lazyRoute(() => import('./pages/klant/StatiegeldMelden'));
const BetalingGelukt = lazyRoute(() => import('./pages/klant/BetalingGelukt'));
const BetalingGeannuleerd = lazyRoute(() => import('./pages/klant/BetalingGeannuleerd'));
const Profiel = lazyRoute(() => import('./pages/klant/Profiel'));
const KlantChat = lazyRoute(() => import('./pages/klant/Chat'));

const JayceTaken = lazyRoute(() => import('./pages/jayce/Taken'));
const JayceScore = lazyRoute(() => import('./pages/jayce/Score'));
const JayceRoute = lazyRoute(() => import('./pages/jayce/Route'));
const JayceBekenden = lazyRoute(() => import('./pages/jayce/Bekenden'));

const MoederOverzicht = lazyRoute(() => import('./pages/moeder/Overzicht'));
const MoederPlekken = lazyRoute(() => import('./pages/moeder/Plekken'));
const MoederIdeeen = lazyRoute(() => import('./pages/moeder/Ideeen'));
const MoederTijden = lazyRoute(() => import('./pages/moeder/Tijden'));
const MoederContant = lazyRoute(() => import('./pages/moeder/Contant'));
const MoederInscannen = lazyRoute(() => import('./pages/moeder/Inscannen'));

const AdminOverzicht = lazyRoute(() => import('./pages/admin/Overzicht'));
const AdminGlasOrders = lazyRoute(() => import('./pages/admin/GlasOrders'));
const AdminStatiegeldLog = lazyRoute(() => import('./pages/admin/StatiegeldLog'));
const AdminGesprekken = lazyRoute(() => import('./pages/admin/Gesprekken'));
const AdminGesprek = lazyRoute(() => import('./pages/admin/Gesprek'));
const AdminCijfers = lazyRoute(() => import('./pages/admin/Cijfers'));
const AdminKlanten = lazyRoute(() => import('./pages/admin/Klanten'));
const AdminInstellingen = lazyRoute(() => import('./pages/admin/Instellingen'));
const AdminDagoverzicht = lazyRoute(() => import('./pages/admin/Dagoverzicht'));
const AdminIdeeen = lazyRoute(() => import('./pages/admin/Ideeen'));
const AdminTijden = lazyRoute(() => import('./pages/admin/Tijden'));
const AdminOphalen = lazyRoute(() => import('./pages/admin/Ophalen'));
const AdminContant = lazyRoute(() => import('./pages/admin/Contant'));

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
          path="/mama/scannen"
          element={
            <RoleGuard allowedRoles={['moeder']}>
              <MoederInscannen />
            </RoleGuard>
          }
        />
        <Route
          path="/mama/contant"
          element={
            <RoleGuard allowedRoles={['moeder']}>
              <MoederContant />
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
          path="/admin/contant"
          element={
            <RoleGuard allowedRoles={['admin']}>
              <AdminContant />
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
