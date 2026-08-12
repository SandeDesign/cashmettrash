// src/components/layout/navItems.tsx
import { ClipboardList, MessageSquare, Recycle, User, Wine } from 'lucide-react';
import type { NavItem } from './AppLayout';

export const KLANT_NAV: NavItem[] = [
  { to: '/mijn', label: 'Overzicht', icon: <ClipboardList className="w-5 h-5" />, end: true },
  { to: '/glas', label: 'Glas', icon: <Wine className="w-5 h-5" /> },
  { to: '/statiegeld', label: 'Statiegeld', icon: <Recycle className="w-5 h-5" /> },
  { to: '/chat', label: 'Berichten', icon: <MessageSquare className="w-5 h-5" /> },
  { to: '/profiel', label: 'Gegevens', icon: <User className="w-5 h-5" /> },
];

export const ADMIN_NAV: NavItem[] = [
  { to: '/admin', label: 'Overzicht', icon: <ClipboardList className="w-5 h-5" />, end: true },
  { to: '/admin/glas', label: 'Glas', icon: <Wine className="w-5 h-5" /> },
  { to: '/admin/statiegeld', label: 'Statiegeld', icon: <Recycle className="w-5 h-5" /> },
  { to: '/admin/berichten', label: 'Berichten', icon: <MessageSquare className="w-5 h-5" /> },
];
