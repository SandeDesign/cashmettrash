// src/pages/admin/Contant.tsx
//
// Dezelfde lijst met contant geld als bij mama, met het menu van de beheerder
// eromheen. Normaal vinkt mama af, maar de beheerder moet kunnen zien wat er
// nog openstaat en kan het zelf afvinken als zij er niet bij is.

import React from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { ADMIN_NAV } from '../../components/layout/navItems';
import ContantBeheer from '../../components/contant/ContantBeheer';

const Contant: React.FC = () => (
  <AppLayout nav={ADMIN_NAV} title="Contant geld">
    <ContantBeheer />
  </AppLayout>
);

export default Contant;
