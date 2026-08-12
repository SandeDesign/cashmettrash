// src/store/authStore.ts
import { create } from 'zustand';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { AuthState, Customer, RegisterData, User } from '../types';
import { formatPostcode, getFirebaseErrorMessage } from '../utils/validation';
import { clearErrorLogs } from '../utils/errorLogger';
import { stuurPushNaarRol } from '../utils/push';
import { ververCoordinaten } from './customerStore';

interface AuthStore extends AuthState {
  login: (email: string, wachtwoord: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  setError: (error: string | null) => void;
  initializeAuth: () => () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  error: null,

  login: async (email, wachtwoord) => {
    try {
      set({ loading: true, error: null });
      const credential = await signInWithEmailAndPassword(auth, email, wachtwoord);
      const snapshot = await getDoc(doc(db, 'users', credential.user.uid));

      if (!snapshot.exists()) {
        throw new Error('Gebruikersgegevens niet gevonden');
      }

      set({ user: snapshot.data() as User, loading: false });
    } catch (error: unknown) {
      const bericht =
        error instanceof Error && 'code' in error
          ? getFirebaseErrorMessage((error as { code: string }).code)
          : error instanceof Error
            ? error.message
            : 'Inloggen mislukt';
      set({ error: bericht, loading: false });
      throw new Error(bericht);
    }
  },

  /**
   * Registreert een klant. Schrijft users/{uid} met rol 'klant' en customers/{uid}
   * in één flow. Er is geen aparte onboarding en geen goedkeuringsstap.
   * De rollen 'jayce' en 'admin' worden handmatig in Firestore gezet; de
   * security rules blokkeren dat een gebruiker zichzelf een andere rol geeft.
   */
  register: async (data) => {
    try {
      set({ loading: true, error: null });

      const credential = await createUserWithEmailAndPassword(auth, data.email, data.wachtwoord);
      const { uid } = credential.user;
      const nu = new Date().toISOString();

      const user: User = {
        uid,
        email: data.email,
        naam: data.naam,
        rol: 'klant',
        createdAt: nu,
        updatedAt: nu,
      };

      const customer: Customer = {
        id: uid,
        naam: data.naam,
        adres: data.adres,
        postcode: formatPostcode(data.postcode),
        plaats: data.plaats,
        telefoon: data.telefoon,
        email: data.email,
        createdAt: nu,
        updatedAt: nu,
      };

      await setDoc(doc(db, 'users', uid), user);
      await setDoc(doc(db, 'customers', uid), customer);

      // Op de achtergrond, want de routeplanner heeft de coordinaten pas later
      // nodig en het registreren mag er niet op wachten.
      void ververCoordinaten(uid, customer.adres, customer.postcode, customer.plaats);

      void stuurPushNaarRol('admin', {
        titel: 'Nieuwe klant',
        tekst: `${data.naam} heeft zich aangemeld.`,
        url: '/admin',
      });

      set({ user, loading: false });
    } catch (error: unknown) {
      const bericht =
        error instanceof Error && 'code' in error
          ? getFirebaseErrorMessage((error as { code: string }).code)
          : error instanceof Error
            ? error.message
            : 'Registreren mislukt';
      set({ error: bericht, loading: false });
      throw new Error(bericht);
    }
  },

  logout: async () => {
    await signOut(auth);
    // Het lokale foutenlogboek hoort bij deze gebruiker; bij uitloggen weg.
    clearErrorLogs();
    set({ user: null, loading: false, error: null });
  },

  setError: (error) => set({ error }),

  initializeAuth: () =>
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        set({ user: null, loading: false });
        return;
      }

      try {
        const snapshot = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (snapshot.exists()) {
          set({ user: snapshot.data() as User, loading: false, error: null });
        } else {
          set({ user: null, loading: false, error: 'Gebruikersgegevens niet gevonden' });
        }
      } catch (error: unknown) {
        set({
          user: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Kon account niet laden',
        });
      }
    }),
}));
