import { create } from 'zustand';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AppSettings } from '../types';
import { DEFAULT_CONTRACT_TEMPLATE } from '../utils/pdf';

interface SettingsStore {
  settings: AppSettings | null;
  loading: boolean;
  error: string | null;
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>, updatedBy: string) => Promise<void>;
}

const DEFAULT_SETTINGS: AppSettings = {
  id: 'app_settings',
  stripe_publishable_key: '',
  stripe_price_id_basic: '',
  stripe_price_id_half_year: '',
  stripe_price_id_year: '',
  stripe_price_id_borg: '',
  stripe_price_id_bezorgkosten: '',
  stripe_proxy_url: 'https://internedata.nl/uploads/vlottr/stripe-proxy.php',
  stripe_checkout_proxy_url: 'https://internedata.nl/uploads/vlottr/checkout.php',
  upload_proxy_url: 'https://internedata.nl/proxyvlottr.php',
  weekly_rental_rate: 140,
  minimum_rental_weeks: 4,
  borg_amount: 500,
  locations: [],
  admin_signature_url: '',
  contract_template: DEFAULT_CONTRACT_TEMPLATE,
  updated_at: new Date().toISOString(),
  updated_by: 'system'
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: null,
  loading: false,
  error: null,

  loadSettings: async () => {
    try {
      set({ loading: true, error: null });

      const settingsDoc = await getDoc(doc(db, 'settings', 'app_settings'));

      if (settingsDoc.exists()) {
        set({ settings: settingsDoc.data() as AppSettings, loading: false });
      } else {
        // Create default settings if they don't exist
        await setDoc(doc(db, 'settings', 'app_settings'), DEFAULT_SETTINGS);
        set({ settings: DEFAULT_SETTINGS, loading: false });
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
      console.error('Error loading settings:', error);
    }
  },

  updateSettings: async (updates: Partial<AppSettings>, updatedBy: string) => {
    try {
      set({ loading: true, error: null });

      const currentSettings = get().settings || DEFAULT_SETTINGS;
      const updatedSettings: AppSettings = {
        ...currentSettings,
        ...updates,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy
      };

      await setDoc(doc(db, 'settings', 'app_settings'), updatedSettings);
      set({ settings: updatedSettings, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  }
}));
