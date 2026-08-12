import { OnboardingTour } from '../contexts/OnboardingContext';

export const managerTour: OnboardingTour = {
  id: 'manager-onboarding',
  name: 'Manager Onboarding',
  role: 'manager',
  steps: [
    // Welcome
    {
      id: 'welcome',
      target: 'body',
      title: 'Welkom Manager! 👋',
      content: 'Laten we je rondleiden door het manager dashboard en alle beheer functies.',
      placement: 'bottom',
      showOn: 'both',
      highlightPadding: 0
    },

    // Dashboard Stats
    {
      id: 'dashboard-stats',
      target: '[data-tour="dashboard-stats"]',
      title: 'Overzicht Statistieken 📊',
      content: 'Hier zie je de belangrijkste metrics: totaal auto\'s, beschikbare auto\'s, actieve boekingen, en omzet.',
      placement: 'bottom',
      showOn: 'both',
      page: '/manager'
    },

    // Quick Actions
    {
      id: 'quick-actions',
      target: '[data-tour="quick-actions"]',
      title: 'Snelle Acties ⚡',
      content: 'Via deze knoppen kun je snel een auto toevoegen, boekingen beheren, klanten bekijken, of statistieken inzien.',
      placement: 'bottom',
      showOn: 'both',
      page: '/manager'
    },

    // Recent Bookings
    {
      id: 'recent-bookings',
      target: '[data-tour="recent-bookings"]',
      title: 'Recente Boekingen 📅',
      content: 'Zie direct de laatste boekingen met status (actief, bevestigd, in afwachting).',
      placement: 'top',
      showOn: 'both',
      page: '/manager'
    },

    // Activity Feed
    {
      id: 'activity-feed',
      target: '[data-tour="activity-feed"]',
      title: 'Recente Activiteit 📝',
      content: 'Alle manager acties worden hier gelogd. Filter op boekingen, auto\'s, contracten, of gebruikers.',
      placement: 'top',
      showOn: 'both',
      page: '/manager'
    },

    // Cars Management
    {
      id: 'cars-management',
      target: '[data-tour="cars-page"]',
      title: 'Auto Beheer 🚗',
      content: 'Hier beheer je alle auto\'s: toevoegen, bewerken, publiceren, of verwijderen. Zie direct de status (beschikbaar/verhuurd/onderhoud).',
      placement: 'bottom',
      showOn: 'both',
      page: '/manager/cars',
      action: () => {
        if (window.location.pathname !== '/manager/cars') {
          window.location.href = '/manager/cars';
        }
      }
    },

    // Add Car Button
    {
      id: 'add-car',
      target: '[data-tour="add-car"]',
      title: 'Auto Toevoegen ➕',
      content: 'Klik hier om een nieuwe auto toe te voegen aan de vloot. Vul alle specs in, upload foto\'s, en stel prijzen in.',
      placement: 'left',
      showOn: 'desktop',
      page: '/manager/cars'
    },

    // Car Card Actions
    {
      id: 'car-actions',
      target: '[data-tour="car-card"]:first-of-type',
      title: 'Auto Acties 🔧',
      content: 'Per auto kun je details bekijken, bewerken, onderhoud plannen, of de status wijzigen (beschikbaar/verhuurd/onderhoud).',
      placement: 'top',
      showOn: 'both',
      page: '/manager/cars'
    },

    // Bookings Management
    {
      id: 'bookings-management',
      target: '[data-tour="bookings-page"]',
      title: 'Boekingen Beheren 📋',
      content: 'Bekijk en beheer alle boekingen: actief, bevestigd, in afwachting, voltooid, of geannuleerd.',
      placement: 'bottom',
      showOn: 'both',
      page: '/manager/bookings',
      action: () => {
        if (window.location.pathname !== '/manager/bookings') {
          window.location.href = '/manager/bookings';
        }
      }
    },

    // Booking Filters
    {
      id: 'booking-filters',
      target: '[data-tour="booking-filters"]',
      title: 'Filter Boekingen 🔍',
      content: 'Filter op status, datum, of zoek op klant/auto. Zo vind je snel wat je zoekt.',
      placement: 'bottom',
      showOn: 'both',
      page: '/manager/bookings'
    },

    // Customer Management
    {
      id: 'customers-management',
      target: '[data-tour="customers-page"]',
      title: 'Klanten Beheren 👥',
      content: 'Hier zie je alle klanten. Verifieer nieuwe accounts, bekijk details, of beheer gebruikers.',
      placement: 'bottom',
      showOn: 'both',
      page: '/manager/customers',
      action: () => {
        if (window.location.pathname !== '/manager/customers') {
          window.location.href = '/manager/customers';
        }
      }
    },

    // Verification Button
    {
      id: 'verify-customer',
      target: '[data-tour="verify-button"]:first-of-type',
      title: 'Klant Verifiëren ✅',
      content: 'Nieuwe klanten moeten geverifieerd worden. Bekijk hun documenten (ID, rijbewijs) en keur goed of af.',
      placement: 'left',
      showOn: 'both',
      page: '/manager/customers'
    },

    // Statistics
    {
      id: 'statistics',
      target: '[data-tour="statistics-page"]',
      title: 'Statistieken & Analytics 📈',
      content: 'Bekijk uitgebreide statistieken: omzet, boekingen, gebruikers, en activiteit analytics.',
      placement: 'bottom',
      showOn: 'both',
      page: '/manager/statistics',
      action: () => {
        if (window.location.pathname !== '/manager/statistics') {
          window.location.href = '/manager/statistics';
        }
      }
    },

    // Contracts
    {
      id: 'contracts',
      target: '[data-tour="contracts-page"]',
      title: 'Contracten Beheer 📜',
      content: 'Alle huurcontracten vind je hier. Bekijk details, download PDFs, of beheer handtekeningen.',
      placement: 'bottom',
      showOn: 'both',
      page: '/manager/contracts',
      action: () => {
        if (window.location.pathname !== '/manager/contracts') {
          window.location.href = '/manager/contracts';
        }
      }
    },

    // Maintenance (if on cars page)
    {
      id: 'maintenance',
      target: '[data-tour="maintenance-button"]:first-of-type',
      title: 'Onderhoud Plannen 🔧',
      content: 'Klik hier om onderhoud te plannen voor een auto. Vul details in en de auto wordt automatisch op "onderhoud" gezet.',
      placement: 'left',
      showOn: 'desktop',
      page: '/manager/cars',
      action: () => {
        if (window.location.pathname !== '/manager/cars') {
          window.location.href = '/manager/cars';
        }
      }
    },

    // Completion
    {
      id: 'completion',
      target: 'body',
      title: 'Klaar voor Beheer! 🎊',
      content: 'Je kent nu alle manager functies! Begin met het beheren van auto\'s, boekingen, en klanten. Succes!',
      placement: 'bottom',
      showOn: 'both',
      highlightPadding: 0,
      page: '/manager',
      action: () => {
        if (window.location.pathname !== '/manager') {
          window.location.href = '/manager';
        }
      }
    }
  ]
};
