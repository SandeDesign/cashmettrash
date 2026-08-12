import { OnboardingTour } from '../contexts/OnboardingContext';

export const customerTour: OnboardingTour = {
  id: 'customer-onboarding',
  name: 'Klant Onboarding',
  role: 'customer',
  steps: [
    // Welcome
    {
      id: 'welcome',
      target: 'body',
      title: 'Welkom bij Vlottr! 🎉',
      content: 'Je account is goedgekeurd! Laten we je even rondleiden zodat je alle functies kent.',
      placement: 'bottom',
      showOn: 'both',
      highlightPadding: 0
    },

    // Dashboard - Metrics
    {
      id: 'metrics',
      target: '[data-tour="metrics"]',
      title: 'Jouw Statistieken 📊',
      content: 'Hier zie je je totaal aantal dagen gehuurd, kilometers gereden, en hoeveel je bespaart t.o.v. een eigen auto!',
      placement: 'bottom',
      showOn: 'both',
      page: '/dashboard'
    },

    // Dashboard - Car Documents (Desktop)
    {
      id: 'car-documents-desktop',
      target: '[data-tour="car-documents"]',
      title: 'Auto Documenten 📄',
      content: 'Als je een actieve boeking hebt, zie je hier direct toegang tot de Groene Kaart en andere belangrijke documenten van je gehuurde auto.',
      placement: 'bottom',
      showOn: 'desktop',
      page: '/dashboard'
    },

    // Dashboard - Car Documents (Mobile)
    {
      id: 'car-documents-mobile',
      target: '[data-tour="car-documents"]',
      title: 'Auto Documenten 📄',
      content: 'Hier vind je de Groene Kaart en andere documenten van je gehuurde auto. Altijd bij de hand!',
      placement: 'top',
      showOn: 'mobile',
      page: '/dashboard'
    },

    // Dashboard - Activity Feed
    {
      id: 'activity-feed',
      target: '[data-tour="activity-feed"]',
      title: 'Jouw Activiteit 📝',
      content: 'Hier zie je een overzicht van al je acties: nieuwe boekingen, annuleringen, contract ondertekeningen, etc.',
      placement: 'top',
      showOn: 'both',
      page: '/dashboard'
    },

    // Sidebar Navigation (Desktop only)
    {
      id: 'sidebar-nav',
      target: '[data-tour="sidebar"]',
      title: 'Navigatie Menu 🧭',
      content: 'Via dit menu navigeer je door alle paginas: Dashboard, Auto\'s, Boekingen, Contracten, en meer!',
      placement: 'right',
      showOn: 'desktop',
      page: '/dashboard'
    },

    // Bottom Navigation (Mobile only)
    {
      id: 'bottom-nav',
      target: '[data-tour="bottom-nav"]',
      title: 'Snelle Navigatie 🧭',
      content: 'Onderaan vind je de belangrijkste menu items: Dashboard, Auto\'s, Boekingen, en meer!',
      placement: 'top',
      showOn: 'mobile',
      page: '/dashboard'
    },

    // Cars Page
    {
      id: 'cars-intro',
      target: '[data-tour="cars-grid"]',
      title: 'Beschikbare Auto\'s 🚗',
      content: 'Hier zie je alle beschikbare auto\'s. Klik op "Details" voor meer info of "Huur nu" om direct te boeken!',
      placement: 'top',
      showOn: 'both',
      page: '/cars',
    },

    // Car Card
    {
      id: 'car-card',
      target: '[data-tour="car-card"]:first-of-type',
      title: 'Auto Kaart 🎴',
      content: 'Elke auto toont foto\'s, specificaties, en prijzen. Klik op "Bekijk details" voor meer info, of "Boek nu" om direct te huren!',
      placement: 'top',
      showOn: 'both',
      page: '/cars'
    },

    // Bookings Page
    {
      id: 'bookings-intro',
      target: '[data-tour="bookings-page"]',
      title: 'Jouw Boekingen 📅',
      content: 'Hier zie je al je boekingen: actieve verhuur, wachtend op betaling, en geschiedenis.',
      placement: 'bottom',
      showOn: 'both',
      page: '/bookings',
      action: () => {
        if (window.location.pathname !== '/bookings') {
          window.location.href = '/bookings';
        }
      }
    },

    // Bookings Tabs
    {
      id: 'bookings-tabs',
      target: '[data-tour="bookings-tabs"]',
      title: 'Actief & Geschiedenis 📋',
      content: 'Wissel tussen "Actieve boekingen" (lopend) en "Geschiedenis" (voltooid/geannuleerd).',
      placement: 'bottom',
      showOn: 'both',
      page: '/bookings'
    },

    // Contracts Page
    {
      id: 'contracts-intro',
      target: '[data-tour="contracts-page"]',
      title: 'Jouw Contracten 📜',
      content: 'Al je huurcontracten vind je hier. Download ze als PDF, bekijk details, of onderteken nieuwe contracten.',
      placement: 'bottom',
      showOn: 'both',
      page: '/contracts',
      action: () => {
        if (window.location.pathname !== '/contracts') {
          window.location.href = '/contracts';
        }
      }
    },

    // Profile Menu (Desktop)
    {
      id: 'profile-menu-desktop',
      target: '[data-tour="profile-menu"]',
      title: 'Jouw Profiel 👤',
      content: 'Klik hier om je profiel te bekijken, instellingen aan te passen, of uit te loggen.',
      placement: 'right',
      showOn: 'desktop',
      page: '/dashboard',
      centerTooltip: true,
      action: () => {
        if (window.location.pathname !== '/dashboard') {
          window.location.href = '/dashboard';
        }
      }
    },

    // Support/Chat
    {
      id: 'support-chat',
      target: '[data-tour="support"]',
      title: 'Hulp Nodig? 💬',
      content: 'Vragen? Klik hier voor FAQ, chat met support, of SOS noodknop (pech/ongeluk)!',
      placement: 'left',
      showOn: 'desktop',
      page: '/dashboard'
    },

    // Completion
    {
      id: 'completion',
      target: 'body',
      title: 'Je bent klaar! 🎊',
      content: 'Je kent nu alle belangrijke functies van Vlottr! Begin met het huren van een auto of bekijk je dashboard. Veel plezier!',
      placement: 'bottom',
      showOn: 'both',
      highlightPadding: 0,
      page: '/dashboard',
      action: () => {
        if (window.location.pathname !== '/dashboard') {
          window.location.href = '/dashboard';
        }
      }
    }
  ]
};
