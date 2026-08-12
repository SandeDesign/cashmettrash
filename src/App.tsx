import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import RoleGuard from './components/guards/RoleGuard';
import VerificationGuard from './components/guards/VerificationGuard';
import ErrorBoundary from './components/shared/ErrorBoundary';
import Loading from './components/shared/Loading';
import ScrollToTop from './components/shared/ScrollToTop';
import ChatModal from './components/chat/ChatModal';
import FAQ from './pages/shared/FAQ';
import Debug from './pages/shared/Debug';
import { ChatModalProvider, useChatModal } from './contexts/ChatModalContext';
import { ModalProvider } from './contexts/ModalContext';
import { OnboardingProvider } from './contexts/OnboardingContext';
import TourOverlay from './components/onboarding/TourOverlay';
import OnboardingTrigger from './components/onboarding/OnboardingTrigger';
import { setupGlobalErrorHandlers } from './utils/errorLogger';

// FAQ wrapper to provide chat modal
const FAQWithChat = () => {
  const { openChat } = useChatModal();
  return <FAQ onChatOpen={openChat} />;
};

// Pages
import Landing from './pages/Landing';
import PartnerLanding from './pages/PartnerLanding';
import VoorKlanten from './pages/VoorKlanten';
import HoeHetWerkt from './pages/HoeHetWerkt';
import LoginForm from './components/auth/LoginForm';
import SimpleRegisterForm from './components/auth/SimpleRegisterForm';
import Onboarding from './pages/Onboarding';
import PendingApproval from './pages/PendingApproval';
import PWAInstallGuide from './pages/PWAInstallGuide';

// Legal Pages
import TermsOfService from './pages/legal/TermsOfService';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import CookiePolicy from './pages/legal/CookiePolicy';

// SEO Pages
import AutoHurenLimburg from './pages/seo/AutoHurenLimburg';
import GoedkoopAutoHuren from './pages/seo/GoedkoopAutoHuren';

// Handleiding Pages
import HandleidingAdmin from './pages/HandleidingAdmin';
import HandleidingManager from './pages/HandleidingManager';
import HandleidingKlant from './pages/HandleidingKlant';

// Customer Pages
import CustomerDashboard from './pages/customer/Dashboard';
import CustomerCars from './pages/customer/Cars';
import CustomerBookings from './pages/customer/Bookings';
import CustomerProfile from './pages/customer/Profile';
import CustomerContracts from './pages/customer/Contracts';
import CustomerContractSigning from './pages/customer/ContractSigning';
import CustomerChat from './pages/customer/Chat';
import QuickBook from './pages/customer/QuickBook';
import QuickBookMultiple from './pages/customer/QuickBookMultiple';
import { GaragePage } from './pages/customer/GaragePage';
import { SOSPage } from './pages/customer/SOSPage';
import PaymentSuccess from './pages/customer/PaymentSuccess';
import PaymentCancel from './pages/customer/PaymentCancel';
import BorgPaymentSuccess from './pages/customer/BorgPaymentSuccess';
import DeliveryPaymentSuccess from './pages/customer/DeliveryPaymentSuccess';

// Manager Pages
import ManagerDashboard from './pages/manager/Dashboard';
import ManagerCars from './pages/manager/Cars';
import ManagerBookings from './pages/manager/Bookings';
import ManagerProcessPickup from './pages/manager/ProcessPickup';
import ManagerProcessReturn from './pages/manager/ProcessReturn';
import ManagerInspectionForms from './pages/manager/InspectionForms';
import ManagerInspections from './pages/manager/Inspections';
import ManagerCustomers from './pages/manager/Customers';
import ManagerReports from './pages/manager/Reports';
import ManagerContracts from './pages/manager/Contracts';
import ManagerContractDetail from './pages/manager/ContractDetail';
import ManagerStatistics from './pages/manager/Statistics';
import CarMaintenance from './pages/manager/CarMaintenance';
import WaitlistManagement from './pages/manager/WaitlistManagement';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminBookings from './pages/admin/Bookings';
import AdminInspections from './pages/admin/Inspections';
import AdminSettings from './pages/admin/Settings';
import AdminContractSettings from './pages/admin/ContractSettings';
import AdminContracts from './pages/admin/Contracts';
import UserVerification from './pages/admin/UserVerification';
import AdminStatistics from './pages/admin/Statistics';
import AdminChat from './pages/admin/Chat';
import ChatManagement from './pages/admin/ChatManagement';
import EmailTool from './pages/admin/EmailTool';

// Partner Pages
import PartnerDashboard from './pages/partner/Dashboard';
import PartnerCars from './pages/partner/Cars';
import PartnerBusinessProfile from './pages/partner/BusinessProfile';
import PartnerDocuments from './pages/partner/Documents';
import PartnerOnboarding from './pages/partner/Onboarding';
import PartnerWerkplaats from './pages/partner/Werkplaats';

// Admin Partner Management
import AdminPartners from './pages/admin/Partners';
import PartnerAgreements from './pages/admin/PartnerAgreements';
import PartnerCarSubmissions from './pages/admin/PartnerCarSubmissions';

// Partner Registration
import PartnerRegisterForm from './components/auth/PartnerRegisterForm';

import Unauthorized from './pages/Unauthorized';

const DashboardRedirect: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'customer':
      return <Navigate to="/dashboard" replace />;
    case 'manager':
      return <Navigate to="/manager" replace />;
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'partner':
      // If partner hasn't completed onboarding, always show wizard
      if (!user.onboarding_completed) {
        return <Navigate to="/partner-onboarding" replace />;
      }
      return <Navigate to="/partner" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

const AppContent: React.FC = () => {
  const { loading, isAuthenticated, user, error } = useAuth();
  const location = useLocation();
  const { isChatOpen, closeChat } = useChatModal();

  // Don't show chat on login/register/landing pages
  const showChat = isAuthenticated && !['/login', '/registreren', '/partner-registreren', '/'].includes(location.pathname);
  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  // Show error if auth failed
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-[var(--vl-bg-primary)] flex items-center justify-center p-4">
        <div className="vl-card p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-white mb-2">Authenticatie fout</h2>
          <p className="text-neutral-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-400 transition-colors"
          >
            Opnieuw proberen
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--vl-bg-primary)] flex items-center justify-center">
        <Loading text="App laden..." />
      </div>
    );
  }

  return (
    <>
      <Routes>
      {/* Public routes */}
      <Route
        path="/"
        element={isAuthenticated ? <DashboardRedirect /> : <Landing />}
      />
      <Route
        path="/partner-worden"
        element={<PartnerLanding />}
      />
      <Route path="/voor-garages" element={<Navigate to="/partner-worden" replace />} />
      <Route path="/voor-dealers" element={<Navigate to="/partner-worden" replace />} />
      <Route path="/voor-klanten" element={<VoorKlanten />} />
      <Route path="/hoe-het-werkt" element={<HoeHetWerkt />} />
      <Route
        path="/login"
        element={isAuthenticated ? <DashboardRedirect /> : <LoginForm />}
      />
      <Route
        path="/registreren"
        element={isAuthenticated ? <DashboardRedirect /> : <SimpleRegisterForm />}
      />
      <Route
        path="/partner-registreren"
        element={isAuthenticated ? <DashboardRedirect /> : <PartnerRegisterForm />}
      />
      <Route
        path="/pwa-install"
        element={<PWAInstallGuide />}
      />

      {/* Legal Pages */}
      <Route
        path="/terms"
        element={<TermsOfService />}
      />
      <Route
        path="/privacy"
        element={<PrivacyPolicy />}
      />
      <Route
        path="/cookies"
        element={<CookiePolicy />}
      />

      {/* FAQ - Accessible when logged in */}
      <Route
        path="/faq"
        element={isAuthenticated ? <FAQWithChat /> : <Navigate to="/login" replace />}
      />

      {/* SEO Pages */}
      <Route
        path="/auto-huren-limburg"
        element={<AutoHurenLimburg />}
      />
      <Route
        path="/goedkoop-auto-huren"
        element={<GoedkoopAutoHuren />}
      />

      {/* Handleiding Pages */}
      <Route path="/handleiding-admin" element={<HandleidingAdmin />} />
      <Route path="/handleiding-manager" element={<HandleidingManager />} />
      <Route path="/handleiding-klant" element={<HandleidingKlant />} />

      {/* Onboarding - customers only */}
      <Route
        path="/onboarding"
        element={
          isAuthenticated
            ? user?.role === 'partner'
              ? <Navigate to="/partner-onboarding" replace />
              : <Onboarding />
            : <Navigate to="/login" replace />
        }
      />

      {/* Pending Approval (authenticated, onboarding completed) */}
      <Route
        path="/pending-approval"
        element={isAuthenticated ? <PendingApproval /> : <Navigate to="/login" replace />}
      />

      {/* Partner onboarding - partners only */}
      <Route
        path="/partner-onboarding"
        element={
          isAuthenticated
            ? user?.role === 'partner'
              ? <PartnerOnboarding />
              : <Navigate to="/onboarding" replace />
            : <Navigate to="/login" replace />
        }
      />

      {/* Partner routes */}
      <Route
        path="/partner"
        element={
          <RoleGuard allowedRoles={['partner']}>
            <PartnerDashboard />
          </RoleGuard>
        }
      />
      <Route
        path="/partner/cars"
        element={
          <RoleGuard allowedRoles={['partner']}>
            <PartnerCars />
          </RoleGuard>
        }
      />
      <Route
        path="/partner/business"
        element={
          <RoleGuard allowedRoles={['partner']}>
            <PartnerBusinessProfile />
          </RoleGuard>
        }
      />
      <Route
        path="/partner/documents"
        element={
          <RoleGuard allowedRoles={['partner']}>
            <PartnerDocuments />
          </RoleGuard>
        }
      />
      <Route
        path="/partner/werkplaats"
        element={
          <RoleGuard allowedRoles={['partner']}>
            <PartnerWerkplaats />
          </RoleGuard>
        }
      />

      {/* Customer routes */}
      <Route
        path="/dashboard"
        element={
          <RoleGuard allowedRoles={['customer']}>
            <CustomerDashboard />
          </RoleGuard>
        }
      />
      <Route
        path="/cars"
        element={
          <RoleGuard allowedRoles={['customer']}>
            <CustomerCars />
          </RoleGuard>
        }
      />
      <Route
        path="/book/:carId"
        element={
          <RoleGuard allowedRoles={['customer']}>
            <QuickBook />
          </RoleGuard>
        }
      />
      <Route
        path="/book-multiple"
        element={
          <RoleGuard allowedRoles={['customer']}>
            <QuickBookMultiple />
          </RoleGuard>
        }
      />
      <Route
        path="/bookings"
        element={
          <RoleGuard allowedRoles={['customer']}>
            <CustomerBookings />
          </RoleGuard>
        }
      />
      <Route
        path="/profile"
        element={
          <RoleGuard allowedRoles={['customer', 'admin', 'manager', 'partner']}>
            <CustomerProfile />
          </RoleGuard>
        }
      />
      <Route
        path="/contracts"
        element={
          <RoleGuard allowedRoles={['customer']}>
            <CustomerContracts />
          </RoleGuard>
        }
      />
      <Route
        path="/customer/contract/:bookingId"
        element={
          <RoleGuard allowedRoles={['customer']}>
            <CustomerContractSigning />
          </RoleGuard>
        }
      />
      <Route
        path="/payment/success"
        element={
          <RoleGuard allowedRoles={['customer']}>
            <PaymentSuccess />
          </RoleGuard>
        }
      />
      <Route
        path="/payment/cancel"
        element={
          <RoleGuard allowedRoles={['customer']}>
            <PaymentCancel />
          </RoleGuard>
        }
      />
      <Route
        path="/payment/borg-success"
        element={
          <RoleGuard allowedRoles={['customer']}>
            <BorgPaymentSuccess />
          </RoleGuard>
        }
      />
      <Route
        path="/payment/delivery-success"
        element={
          <RoleGuard allowedRoles={['customer']}>
            <DeliveryPaymentSuccess />
          </RoleGuard>
        }
      />
      <Route
        path="/chat"
        element={
          <RoleGuard allowedRoles={['customer']}>
            <CustomerChat />
          </RoleGuard>
        }
      />
      <Route
        path="/garage"
        element={
          <RoleGuard allowedRoles={['customer']}>
            <GaragePage />
          </RoleGuard>
        }
      />
      <Route
        path="/sos"
        element={
          <RoleGuard allowedRoles={['customer']}>
            <SOSPage />
          </RoleGuard>
        }
      />

      {/* Manager routes - manager has access to these */}
      <Route
        path="/manager"
        element={
          <RoleGuard allowedRoles={['manager', 'admin']}>
            <ManagerDashboard />
          </RoleGuard>
        }
      />
      <Route
        path="/manager/cars"
        element={
          <RoleGuard allowedRoles={['manager', 'admin']}>
            <ManagerCars />
          </RoleGuard>
        }
      />
      <Route
        path="/manager/bookings"
        element={
          <RoleGuard allowedRoles={['manager', 'admin']}>
            <ManagerBookings />
          </RoleGuard>
        }
      />
      <Route
        path="/manager/booking/:bookingId/pickup"
        element={
          <RoleGuard allowedRoles={['manager', 'admin']}>
            <ManagerProcessPickup />
          </RoleGuard>
        }
      />
      <Route
        path="/manager/booking/:bookingId/return"
        element={
          <RoleGuard allowedRoles={['manager', 'admin']}>
            <ManagerProcessReturn />
          </RoleGuard>
        }
      />
      <Route
        path="/manager/inspection-forms"
        element={
          <RoleGuard allowedRoles={['manager', 'admin']}>
            <ManagerInspectionForms />
          </RoleGuard>
        }
      />
      <Route
        path="/manager/inspections"
        element={
          <RoleGuard allowedRoles={['manager', 'admin']}>
            <ManagerInspections />
          </RoleGuard>
        }
      />
      <Route
        path="/manager/customers"
        element={
          <RoleGuard allowedRoles={['manager', 'admin']}>
            <ManagerCustomers />
          </RoleGuard>
        }
      />
      <Route
        path="/manager/reports"
        element={
          <RoleGuard allowedRoles={['manager', 'admin']}>
            <ManagerReports />
          </RoleGuard>
        }
      />
      <Route
        path="/manager/contracts"
        element={
          <RoleGuard allowedRoles={['manager', 'admin']}>
            <ManagerContracts />
          </RoleGuard>
        }
      />
      <Route
        path="/manager/contract/:contractId"
        element={
          <RoleGuard allowedRoles={['manager', 'admin']}>
            <ManagerContractDetail />
          </RoleGuard>
        }
      />
      <Route
        path="/manager/statistics"
        element={
          <RoleGuard allowedRoles={['manager', 'admin']}>
            <ManagerStatistics />
          </RoleGuard>
        }
      />
      <Route
        path="/manager/cars/:carId/maintenance"
        element={
          <RoleGuard allowedRoles={['manager', 'admin']}>
            <CarMaintenance />
          </RoleGuard>
        }
      />
      <Route
        path="/manager/waitlist"
        element={
          <RoleGuard allowedRoles={['manager', 'admin']}>
            <WaitlistManagement />
          </RoleGuard>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <RoleGuard allowedRoles={['admin']}>
            <AdminDashboard />
          </RoleGuard>
        }
      />
      <Route
        path="/admin/users"
        element={
          <RoleGuard allowedRoles={['admin', 'manager']}>
            <AdminUsers />
          </RoleGuard>
        }
      />
      <Route
        path="/admin/bookings"
        element={
          <RoleGuard allowedRoles={['admin']}>
            <AdminBookings />
          </RoleGuard>
        }
      />
      <Route
        path="/admin/inspections"
        element={
          <RoleGuard allowedRoles={['admin']}>
            <AdminInspections />
          </RoleGuard>
        }
      />
      <Route
        path="/admin/users/:userId/verify"
        element={
          <RoleGuard allowedRoles={['admin', 'manager']}>
            <UserVerification />
          </RoleGuard>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <RoleGuard allowedRoles={['admin']}>
            <AdminSettings />
          </RoleGuard>
        }
      />
      <Route
        path="/admin/contract-settings"
        element={
          <RoleGuard allowedRoles={['admin']}>
            <AdminContractSettings />
          </RoleGuard>
        }
      />
      <Route
        path="/admin/contracts"
        element={
          <RoleGuard allowedRoles={['admin']}>
            <AdminContracts />
          </RoleGuard>
        }
      />
      <Route
        path="/admin/statistics"
        element={
          <RoleGuard allowedRoles={['admin']}>
            <AdminStatistics />
          </RoleGuard>
        }
      />
      <Route
        path="/admin/chat"
        element={
          <RoleGuard allowedRoles={['admin', 'manager']}>
            <AdminChat />
          </RoleGuard>
        }
      />
      <Route
        path="/admin/chat-management"
        element={
          <RoleGuard allowedRoles={['admin', 'manager']}>
            <ChatManagement />
          </RoleGuard>
        }
      />
      <Route
        path="/admin/email-tool"
        element={
          <RoleGuard allowedRoles={['admin', 'manager']}>
            <EmailTool />
          </RoleGuard>
        }
      />
      <Route
        path="/admin/partners"
        element={
          <RoleGuard allowedRoles={['admin']}>
            <AdminPartners />
          </RoleGuard>
        }
      />
      <Route
        path="/admin/partner-agreements"
        element={
          <RoleGuard allowedRoles={['admin']}>
            <PartnerAgreements />
          </RoleGuard>
        }
      />
      <Route
        path="/admin/partner-cars"
        element={
          <RoleGuard allowedRoles={['admin']}>
            <PartnerCarSubmissions />
          </RoleGuard>
        }
      />
      <Route
        path="/admin/debug"
        element={
          <RoleGuard allowedRoles={['admin', 'manager']}>
            <Debug />
          </RoleGuard>
        }
      />

      {/* Error routes */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>

    {/* Chat Modal - Controlled by Support Menu */}
    {showChat && (
      <ChatModal
        isOpen={isChatOpen}
        onClose={closeChat}
      />
    )}
    </>
  );
};

function App() {
  // Setup global error handlers on mount
  useEffect(() => {
    setupGlobalErrorHandlers();
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <ModalProvider>
          <ChatModalProvider>
            <OnboardingProvider>
              <ScrollToTop />
              <OnboardingTrigger />
              <AppContent />
              <TourOverlay />
            </OnboardingProvider>
          </ChatModalProvider>
        </ModalProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;