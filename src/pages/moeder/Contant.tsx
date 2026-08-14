// src/pages/moeder/Contant.tsx
//
// Dezelfde lijst met contant geld als bij de beheerder, met het menu van mama
// eromheen. Zij is degene die het geld van Jayce krijgt en afvinkt.

import React from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { MOEDER_NAV } from '../../components/layout/navItems';
import ContantBeheer from '../../components/contant/ContantBeheer';

const Contant: React.FC = () => (
  <AppLayout nav={MOEDER_NAV} title="Contant geld">
    <ContantBeheer />
  </AppLayout>
);

export default Contant;
