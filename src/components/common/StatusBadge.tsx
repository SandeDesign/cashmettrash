// src/components/common/StatusBadge.tsx
import React from 'react';
import type { GlasStatus, StatiegeldStatus } from '../../types';
import { GLAS_STATUS_LABEL, STATIEGELD_STATUS_LABEL } from '../../utils/constants';

/** Badge-variant per status. Groen = glas-flow, blauw = statiegeld-flow. */
const GLAS_VARIANT: Record<GlasStatus, string> = {
  aangemeld: 'cmt-badge-warning',
  ingepland: 'cmt-badge-glas',
  betaald: 'cmt-badge-glas',
  opgehaald: 'cmt-badge-done',
  geannuleerd: 'cmt-badge-error',
};

const STATIEGELD_VARIANT: Record<StatiegeldStatus, string> = {
  aangemeld: 'cmt-badge-warning',
  ingepland: 'cmt-badge-stat',
  opgehaald: 'cmt-badge-stat',
  verwerktBijViatim: 'cmt-badge-stat',
  tikkieVerstuurd: 'cmt-badge-done',
};

export const GlasStatusBadge: React.FC<{ status: GlasStatus }> = ({ status }) => (
  <span className={`cmt-badge ${GLAS_VARIANT[status]}`}>{GLAS_STATUS_LABEL[status]}</span>
);

export const StatiegeldStatusBadge: React.FC<{ status: StatiegeldStatus }> = ({ status }) => (
  <span className={`cmt-badge ${STATIEGELD_VARIANT[status]}`}>
    {STATIEGELD_STATUS_LABEL[status]}
  </span>
);
