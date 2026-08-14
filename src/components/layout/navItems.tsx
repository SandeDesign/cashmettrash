// src/components/layout/navItems.tsx
//
// De navigatie per rol. Op desktop staat alles in de balk onder de header; op
// mobiel opent het menu rechtsonder en worden de items per `groep` bij elkaar
// gezet. Houd een groep klein, anders wordt het uitklappen een lange lijst.

import {
  BarChart3,
  Bike,
  CalendarCheck,
  CalendarClock,
  ClipboardList,
  Heart,
  Lightbulb,
  Map,
  MessageSquare,
  Recycle,
  Settings,
  ShieldAlert,
  Smartphone,
  Star,
  User,
  Users,
  Wine,
} from 'lucide-react';
import type { NavItem } from './AppLayout';

export const KLANT_NAV: NavItem[] = [
  {
    to: '/mijn',
    label: 'Overzicht',
    icon: <ClipboardList className="w-5 h-5" />,
    end: true,
    groep: 'Startpunt',
  },
  { to: '/glas', label: 'Glas', icon: <Wine className="w-5 h-5" />, groep: 'Laten ophalen' },
  {
    to: '/statiegeld',
    label: 'Statiegeld',
    icon: <Recycle className="w-5 h-5" />,
    groep: 'Laten ophalen',
  },
  {
    to: '/chat',
    label: 'Berichten',
    icon: <MessageSquare className="w-5 h-5" />,
    groep: 'Van mij',
    teller: 'chat',
  },
  { to: '/profiel', label: 'Gegevens', icon: <User className="w-5 h-5" />, groep: 'Van mij' },
  {
    to: '/installeren',
    label: 'Op je telefoon',
    icon: <Smartphone className="w-5 h-5" />,
    groep: 'Van mij',
  },
];

// Korte woorden en grote knoppen, want dit menu is voor Jayce.
export const JAYCE_NAV: NavItem[] = [
  {
    to: '/jayce',
    label: 'Ophalen',
    icon: <ClipboardList className="w-5 h-5" />,
    end: true,
    groep: 'Op pad',
    teller: 'nieuw',
  },
  {
    to: '/jayce/route',
    label: 'Route',
    icon: <Map className="w-5 h-5" />,
    groep: 'Op pad',
    teller: 'ronde',
  },
  {
    to: '/jayce/bekenden',
    label: 'Bekenden',
    icon: <Heart className="w-5 h-5" />,
    groep: 'Van mij',
  },
  {
    to: '/jayce/score',
    label: 'Mijn score',
    icon: <Star className="w-5 h-5" />,
    groep: 'Van mij',
  },
  {
    to: '/installeren',
    label: 'Op je telefoon',
    icon: <Smartphone className="w-5 h-5" />,
    groep: 'Van mij',
  },
];

export const MOEDER_NAV: NavItem[] = [
  {
    to: '/mama',
    label: 'Overzicht',
    icon: <ClipboardList className="w-5 h-5" />,
    end: true,
    groep: 'Meekijken',
    teller: 'ronde',
  },
  {
    to: '/mama/tijden',
    label: 'Tijden',
    icon: <CalendarClock className="w-5 h-5" />,
    groep: 'Instellen',
  },
  {
    to: '/mama/plekken',
    label: 'Plekken',
    icon: <ShieldAlert className="w-5 h-5" />,
    groep: 'Instellen',
  },
  {
    to: '/mama/ideeen',
    label: 'Ideeën',
    icon: <Lightbulb className="w-5 h-5" />,
    groep: 'Doorgeven',
  },
  {
    to: '/installeren',
    label: 'Op je telefoon',
    icon: <Smartphone className="w-5 h-5" />,
    groep: 'Doorgeven',
  },
];

export const ADMIN_NAV: NavItem[] = [
  {
    to: '/admin',
    label: 'Te doen',
    icon: <ClipboardList className="w-5 h-5" />,
    end: true,
    groep: 'Vandaag',
  },
  {
    to: '/admin/berichten',
    label: 'Berichten',
    icon: <MessageSquare className="w-5 h-5" />,
    groep: 'Vandaag',
    teller: 'chat',
  },
  {
    to: '/admin/dagoverzicht',
    label: 'Per dag',
    icon: <CalendarCheck className="w-5 h-5" />,
    groep: 'Vandaag',
  },
  {
    to: '/admin/ophalen',
    label: 'Ophaalronde',
    icon: <Bike className="w-5 h-5" />,
    groep: 'Ophalen',
    teller: 'nieuw',
  },
  { to: '/admin/glas', label: 'Glas', icon: <Wine className="w-5 h-5" />, groep: 'Ophalen' },
  {
    to: '/admin/statiegeld',
    label: 'Statiegeld',
    icon: <Recycle className="w-5 h-5" />,
    groep: 'Ophalen',
    teller: 'afrekenen',
  },
  { to: '/admin/klanten', label: 'Mensen', icon: <Users className="w-5 h-5" />, groep: 'Beheer' },
  {
    to: '/admin/tijden',
    label: 'Tijden',
    icon: <CalendarClock className="w-5 h-5" />,
    groep: 'Beheer',
  },
  {
    to: '/admin/instellingen',
    label: 'Werkgebied',
    icon: <Settings className="w-5 h-5" />,
    groep: 'Beheer',
  },
  {
    to: '/admin/ideeen',
    label: 'Ideeën',
    icon: <Lightbulb className="w-5 h-5" />,
    groep: 'Beheer',
    teller: 'ideeen',
  },
  {
    to: '/admin/cijfers',
    label: 'Cijfers',
    icon: <BarChart3 className="w-5 h-5" />,
    groep: 'Beheer',
  },
  {
    to: '/installeren',
    label: 'Op je telefoon',
    icon: <Smartphone className="w-5 h-5" />,
    groep: 'Beheer',
  },
];
