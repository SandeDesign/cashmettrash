// src/components/layout/navItems.tsx
import { BarChart3, ClipboardList, MessageSquare, Recycle, Star, User, Wine } from 'lucide-react';
import type { NavItem } from './AppLayout';

export const KLANT_NAV: NavItem[] = [
  { to: '/mijn', label: 'Overzicht', icon: <ClipboardList className="w-5 h-5" />, end: true },
  { to: '/glas', label: 'Glas', icon: <Wine className="w-5 h-5" /> },
  { to: '/statiegeld', label: 'Statiegeld', icon: <Recycle className="w-5 h-5" /> },
  { to: '/chat', label: 'Berichten', icon: <MessageSquare className="w-5 h-5" /> },
  { to: '/profiel', label: 'Gegevens', icon: <User className="w-5 h-5" /> },
];

// Twee items, want meer heeft Jayce niet nodig en grote knoppen zijn prettiger.
export const JAYCE_NAV: NavItem[] = [
  { to: '/jayce', label: 'Ophalen', icon: <ClipboardList className="w-5 h-5" />, end: true },
  { to: '/jayce/score', label: 'Mijn score', icon: <Star className="w-5 h-5" /> },
];

export const ADMIN_NAV: NavItem[] = [
  { to: '/admin', label: 'Te doen', icon: <ClipboardList className="w-5 h-5" />, end: true },
  { to: '/admin/glas', label: 'Glas', icon: <Wine className="w-5 h-5" /> },
  { to: '/admin/statiegeld', label: 'Statiegeld', icon: <Recycle className="w-5 h-5" /> },
  { to: '/admin/berichten', label: 'Berichten', icon: <MessageSquare className="w-5 h-5" /> },
  { to: '/admin/cijfers', label: 'Cijfers', icon: <BarChart3 className="w-5 h-5" /> },
];
