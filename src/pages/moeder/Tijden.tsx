// src/pages/moeder/Tijden.tsx
//
// Mama beheert dezelfde tijden als de beheerder; alleen het menu eromheen
// verschilt. De inhoud staat daarom in één component.

import React from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { MOEDER_NAV } from '../../components/layout/navItems';
import TijdenBeheer from '../../components/tijden/TijdenBeheer';

const Tijden: React.FC = () => (
  <AppLayout nav={MOEDER_NAV} title="Wanneer mag hij">
    <TijdenBeheer />
  </AppLayout>
);

export default Tijden;
