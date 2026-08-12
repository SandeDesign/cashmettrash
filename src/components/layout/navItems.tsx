// src/components/layout/navItems.tsx
//
// De navigatie per rol. Op desktop staat alles in de balk onder de header, op
// mobiel alleen de items zonder `alleenDesktop`, want in een onderbalk passen er
// hooguit vijf naast elkaar.

import {
  BarChart3,
  CalendarCheck,
  ClipboardList,
  Heart,
  Lightbulb,
  Map,
  MessageSquare,
  Recycle,
  Settings,
  ShieldAlert,
  Star,
  User,
  Users,
  Wine,
} from 'lucide-react';
import type { NavItem } from './AppLayout';

export const KLANT_NAV: NavItem[] = [
  { to: '/mijn', label: 'Overzicht', icon: <ClipboardList className="w-5 h-5" />, end: true },
  { to: '/glas', label: 'Glas', icon: <Wine className="w-5 h-5" /> },
  { to: '/statiegeld', label: 'Statiegeld', icon: <Recycle className="w-5 h-5" /> },
  { to: '/chat', label: 'Berichten', icon: <MessageSquare className="w-5 h-5" /> },
  { to: '/profiel', label: 'Gegevens', icon: <User className="w-5 h-5" /> },
];

// Korte woorden en grote knoppen, want dit menu is voor Jayce.
export const JAYCE_NAV: NavItem[] = [
  { to: '/jayce', label: 'Ophalen', icon: <ClipboardList className="w-5 h-5" />, end: true },
  { to: '/jayce/route', label: 'Route', icon: <Map className="w-5 h-5" /> },
  { to: '/jayce/bekenden', label: 'Bekenden', icon: <Heart className="w-5 h-5" /> },
  { to: '/jayce/score', label: 'Mijn score', icon: <Star className="w-5 h-5" /> },
];

export const MOEDER_NAV: NavItem[] = [
  { to: '/mama', label: 'Overzicht', icon: <ClipboardList className="w-5 h-5" />, end: true },
  { to: '/mama/plekken', label: 'Plekken', icon: <ShieldAlert className="w-5 h-5" /> },
  { to: '/mama/ideeen', label: 'Ideeën', icon: <Lightbulb className="w-5 h-5" /> },
];

export const ADMIN_NAV: NavItem[] = [
  { to: '/admin', label: 'Te doen', icon: <ClipboardList className="w-5 h-5" />, end: true },
  { to: '/admin/glas', label: 'Glas', icon: <Wine className="w-5 h-5" /> },
  { to: '/admin/statiegeld', label: 'Statiegeld', icon: <Recycle className="w-5 h-5" /> },
  { to: '/admin/berichten', label: 'Berichten', icon: <MessageSquare className="w-5 h-5" /> },
  { to: '/admin/dagoverzicht', label: 'Per dag', icon: <CalendarCheck className="w-5 h-5" /> },
  { to: '/admin/klanten', label: 'Klanten', icon: <Users className="w-5 h-5" />, alleenDesktop: true },
  { to: '/admin/cijfers', label: 'Cijfers', icon: <BarChart3 className="w-5 h-5" />, alleenDesktop: true },
  { to: '/admin/ideeen', label: 'Ideeën', icon: <Lightbulb className="w-5 h-5" />, alleenDesktop: true },
  {
    to: '/admin/instellingen',
    label: 'Werkgebied',
    icon: <Settings className="w-5 h-5" />,
    alleenDesktop: true,
  },
];
