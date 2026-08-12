// src/pages/admin/Tijden.tsx
//
// Dezelfde tijdenlijst als bij mama, met het menu van de beheerder eromheen.

import React from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { ADMIN_NAV } from '../../components/layout/navItems';
import TijdenBeheer from '../../components/tijden/TijdenBeheer';

const Tijden: React.FC = () => (
  <AppLayout nav={ADMIN_NAV} title="Ophaaltijden">
    <TijdenBeheer />
  </AppLayout>
);

export default Tijden;
