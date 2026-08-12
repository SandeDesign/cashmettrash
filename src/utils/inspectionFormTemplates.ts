import { PhotoUploadTab, RentalCarInspectionForm } from '../types';

/**
 * Create photo upload tabs for inspection forms
 * Tabs are initialized closed by default
 */
export const createPhotoTabs = (): PhotoUploadTab[] => [
  {
    id: 'hoeken',
    title: 'Foto\'s van elke hoek',
    description: '4 foto\'s - Linksvoor, Rechtsvoor, Links-achter, Rechts-achter',
    type: 'hoeken',
    items: [
      { position: 'Linksvoor' },
      { position: 'Rechtsvoor' },
      { position: 'Links-achter' },
      { position: 'Rechts-achter' },
    ],
    is_open: false,
  },
  {
    id: 'wielen',
    title: 'Foto\'s van de wielen/velgen',
    description: '4 foto\'s - Voorwiel Links, Voorwiel Rechts, Achterwiel Links, Achterwiel Rechts',
    type: 'wielen',
    items: [
      { position: 'Voorwiel Links' },
      { position: 'Voorwiel Rechts' },
      { position: 'Achterwiel Links' },
      { position: 'Achterwiel Rechts' },
    ],
    is_open: false,
  },
  {
    id: 'interieur',
    title: 'Interieur',
    description: '3 foto\'s - Bestuurder zijde, Passagier zijde, Achterbank',
    type: 'interieur',
    items: [
      { position: 'Bestuurder zijde' },
      { position: 'Passagier zijde' },
      { position: 'Achterbank' },
    ],
    is_open: false,
  },
  {
    id: 'schade',
    title: 'Schade',
    description: '1+ foto\'s van eventuele schade (voeg meer toe als nodig)',
    type: 'schade',
    items: [{ position: 'Schade 1' }],
    is_open: false,
  },
];

/**
 * Create a new rental car inspection form
 */
export const createNewInspectionForm = (
  bookingId: string,
  customerId: string,
  carId: string,
  type: 'ophalen' | 'inleveren'
): Omit<RentalCarInspectionForm, 'id' | 'created_at' | 'updated_at'> => {
  return {
    booking_id: bookingId,
    customer_id: customerId,
    car_id: carId,
    type,
    status: 'voeg_fotos_toe',
    photo_tabs: createPhotoTabs(),
    odometer_reading_start: undefined,
    odometer_reading_end: undefined,
    fuel_level: undefined,
    extras_present: {
      spare_wheel: false,
      jack: false,
      first_aid_kit: false,
      warning_triangle: false,
      safety_vests: false,
    },
    technical_state: {
      lights_working: false,
      wipers_working: false,
      ac_working: false,
    },
    customer_remarks: '',
    admin_remarks: '',
    staff_notes: '',
  };
};
