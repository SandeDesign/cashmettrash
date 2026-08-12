import { create } from 'zustand';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User, AuthState, RegisterData, PartnerRegisterData } from '../types';
import { getFirebaseErrorMessage } from '../utils/validation';
import { logUserLogin, logUserLogout } from '../utils/logger';
import { sendAndLogEmail } from '../utils/email';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  registerPartner: (data: PartnerRegisterData) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  loading: true,
  error: null,

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  login: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        set({ user: userData, loading: false });

        // Log the login activity
        logUserLogin(userData.uid, userData.name || userData.email, userData.email, userData.role);
      } else {
        throw new Error('Gebruikersgegevens niet gevonden');
      }
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error.code);
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  register: async (data: RegisterData) => {
    try {
      set({ loading: true, error: null });

      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const now = new Date().toISOString();

      const userData: User = {
        uid: userCredential.user.uid,
        email: data.email,
        name: data.firstName,
        phone: '',
        address: '',
        date_of_birth: '',
        role: 'customer',
        verification_status: 'pending',
        created_at: now,
        updated_at: now
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userData);

      // Trigger webhook with registration data
      try {
        await fetch('https://hook.eu2.make.com/u325jx4udma3ya9oso47nl5qo9xd5ews', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'customer_registration',
            firstName: data.firstName,
            email: data.email,
            uid: userCredential.user.uid,
            created_at: now
          }),
        });
      } catch (webhookError) {
        // Log webhook error but don't fail registration
        console.error('Webhook error:', webhookError);
      }

      // Send welcome email to customer
      try {
        await sendAndLogEmail({
          to: data.email,
          subject: 'Welkom bij Vlottr \u2014 Account aangemaakt',
          message: `<!DOCTYPE html>
<html lang="nl" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>Welkom bij Vlottr</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #0a0a0a; }
  </style>
</head>
<body style="margin: 0; padding: 0; word-spacing: normal; background-color: #0a0a0a;">
  <div role="article" aria-roledescription="email" lang="nl" style="font-size: max(16px, 1rem);">
    <table role="presentation" style="width: 100%; border: none; border-spacing: 0; background-color: #0a0a0a;">
      <tr>
        <td align="center" style="padding: 24px 8px;">
          <table role="presentation" style="width: 560px; max-width: 560px; border: none; border-spacing: 0; text-align: left; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
            <tr>
              <td style="padding: 32px 32px 24px 32px; text-align: center; background-color: #0d2818; border-radius: 16px 16px 0 0;">
                <img src="https://vlottr.eu/512x512x2.png" alt="Vlottr" width="44" height="44" style="display: block; margin: 0 auto; width: 44px; height: 44px; border-radius: 10px; border: 0;" />
                <p style="margin: 12px 0 0 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px;">Welkom bij Vlottr!</p>
                <p style="margin: 4px 0 0 0; font-size: 11px; color: #4ade80; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 600;">Autoverhuur Zuid-Limburg</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 32px 32px 0 32px; background-color: #111111;">
                <p style="margin: 0; font-size: 15px; color: #a3a3a3; line-height: 1.6;">Hallo ${data.firstName},</p>
                <p style="margin: 12px 0 0 0; font-size: 15px; color: #a3a3a3; line-height: 1.6;">Welkom bij Vlottr! Je account is aangemaakt. Rond je profiel af zodat we je aanvraag kunnen beoordelen.</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 24px 32px; background-color: #111111;">
                <table role="presentation" style="width: 100%; border: none; border-spacing: 0; background-color: #0d2818; border-radius: 12px; border: 1px solid #1a4d2e;">
                  <tr>
                    <td style="padding: 24px;">
                      <p style="margin: 0 0 12px 0; font-size: 11px; color: #22c55e; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 700;">Wat moet je doen?</p>
                      <p style="margin: 0; font-size: 14px; color: #d4d4d4; line-height: 2;">
                        1. Vul je persoonlijke gegevens aan<br/>
                        2. Upload je rijbewijs<br/>
                        3. Wacht op goedkeuring<br/>
                        4. Boek je eerste auto!
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 0 32px 28px 32px; background-color: #111111; text-align: center;">
                <table role="presentation" style="margin: 0 auto; border: none; border-spacing: 0;">
                  <tr>
                    <td style="border-radius: 12px; background-color: #22c55e; text-align: center;">
                      <a href="https://vlottr.eu/login" target="_blank" style="display: inline-block; padding: 14px 36px; font-size: 15px; font-weight: 800; color: #0a0a0a; text-decoration: none;">
                        Profiel afronden &rarr;
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 0 32px; background-color: #111111;">
                <table role="presentation" style="width: 100%; border: none; border-spacing: 0;">
                  <tr><td style="height: 1px; background-color: #222222; font-size: 0; line-height: 0;">&nbsp;</td></tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 24px 32px; background-color: #0a0a0a; border-radius: 0 0 16px 16px; text-align: center; border-top: 1px solid #1a1a1a;">
                <table role="presentation" style="margin: 0 auto 12px auto; border: none; border-spacing: 0;">
                  <tr>
                    <td style="width: 28px; height: 28px; text-align: center; vertical-align: middle;">
                      <img src="https://vlottr.eu/512x512x2.png" alt="Vlottr" width="28" height="28" style="display: block; width: 28px; height: 28px; border-radius: 7px; border: 0;" />
                    </td>
                    <td style="padding-left: 8px; font-size: 15px; font-weight: 700; color: #ffffff; vertical-align: middle;">Vlottr</td>
                  </tr>
                </table>
                <p style="margin: 0; font-size: 12px; color: #525252;">Autoverhuur Zuid-Limburg</p>
                <p style="margin: 8px 0 0 0; font-size: 11px; color: #333333;">&copy; 2026 Vlottr</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`,
          isHtml: true,
          sentByName: 'Systeem (klant registratie)',
        });
      } catch (emailError) {
        console.error('Customer welcome email error:', emailError);
      }

      set({ user: userData, loading: false });
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error.code);
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  registerPartner: async (data: PartnerRegisterData) => {
    try {
      set({ loading: true, error: null });

      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const now = new Date().toISOString();

      const userData: User = {
        uid: userCredential.user.uid,
        email: data.email,
        name: data.contactName,
        phone: data.phone,
        address: '',
        date_of_birth: '',
        role: 'partner',
        verification_status: 'pending',
        company_name: data.companyName,
        company_kvk: data.kvkNumber || '',
        company_phone: data.phone,
        company_email: data.email,
        partner_type: data.partnerType,
        created_at: now,
        updated_at: now,
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userData);

      // Send welcome email to partner (using table layout for email client compatibility)
      try {
        await sendAndLogEmail({
          to: data.email,
          subject: 'Welkom bij Vlottr \u2014 Partner aanmelding ontvangen',
          message: `<!DOCTYPE html>
<html lang="nl" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>Welkom bij Vlottr - Partner</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #0a0a0a; }
  </style>
</head>
<body style="margin: 0; padding: 0; word-spacing: normal; background-color: #0a0a0a;">
  <div role="article" aria-roledescription="email" lang="nl" style="font-size: max(16px, 1rem);">
    <table role="presentation" style="width: 100%; border: none; border-spacing: 0; background-color: #0a0a0a;">
      <tr>
        <td align="center" style="padding: 24px 8px;">
          <table role="presentation" style="width: 560px; max-width: 560px; border: none; border-spacing: 0; text-align: left; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
            <tr>
              <td style="padding: 32px 32px 24px 32px; text-align: center; background-color: #0d2818; border-radius: 16px 16px 0 0;">
                <img src="https://vlottr.eu/512x512x2.png" alt="Vlottr" width="44" height="44" style="display: block; margin: 0 auto; width: 44px; height: 44px; border-radius: 10px; border: 0;" />
                <p style="margin: 12px 0 0 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px;">Welkom bij Vlottr!</p>
                <p style="margin: 4px 0 0 0; font-size: 11px; color: #4ade80; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 600;">Partner Programma</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 32px 32px 0 32px; background-color: #111111;">
                <p style="margin: 0 0 4px 0; font-size: 26px; font-weight: 800; color: #ffffff; line-height: 1.2;">Partner aanmelding ontvangen</p>
                <p style="margin: 16px 0 0 0; font-size: 15px; color: #a3a3a3; line-height: 1.6;">Beste ${data.contactName},</p>
                <p style="margin: 8px 0 0 0; font-size: 15px; color: #a3a3a3; line-height: 1.6;">Bedankt voor je aanmelding als partner bij Vlottr! We hebben je registratie ontvangen en gaan deze zo snel mogelijk beoordelen.</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 24px 32px; background-color: #111111;">
                <table role="presentation" style="width: 100%; border: none; border-spacing: 0; background-color: #0d2818; border-radius: 12px; border: 1px solid #1a4d2e;">
                  <tr>
                    <td style="padding: 24px;">
                      <p style="margin: 0 0 12px 0; font-size: 11px; color: #22c55e; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 700;">Volgende stappen</p>
                      <p style="margin: 0; font-size: 14px; color: #d4d4d4; line-height: 2;">
                        1. Vul je bedrijfsgegevens aan in het dashboard<br/>
                        2. Teken de partnerovereenkomst<br/>
                        3. Wacht op goedkeuring van het Vlottr team<br/>
                        4. Start met het aanmelden van auto&rsquo;s!
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 0 32px 28px 32px; background-color: #111111; text-align: center;">
                <table role="presentation" style="margin: 0 auto; border: none; border-spacing: 0;">
                  <tr>
                    <td style="border-radius: 12px; background-color: #22c55e; text-align: center;">
                      <a href="https://vlottr.eu/login" target="_blank" style="display: inline-block; padding: 14px 36px; font-size: 15px; font-weight: 800; color: #0a0a0a; text-decoration: none;">
                        Inloggen &rarr;
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 0 32px; background-color: #111111;">
                <table role="presentation" style="width: 100%; border: none; border-spacing: 0;">
                  <tr><td style="height: 1px; background-color: #222222; font-size: 0; line-height: 0;">&nbsp;</td></tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px 32px; background-color: #111111;">
                <p style="margin: 0; font-size: 13px; color: #525252; line-height: 1.6;">Heb je vragen? Neem contact op via <a href="mailto:info@vlottr.nl" style="color: #22c55e; text-decoration: underline;">info@vlottr.nl</a></p>
              </td>
            </tr>
            <tr>
              <td style="padding: 24px 32px; background-color: #0a0a0a; border-radius: 0 0 16px 16px; text-align: center; border-top: 1px solid #1a1a1a;">
                <table role="presentation" style="margin: 0 auto 12px auto; border: none; border-spacing: 0;">
                  <tr>
                    <td style="width: 28px; height: 28px; text-align: center; vertical-align: middle;">
                      <img src="https://vlottr.eu/512x512x2.png" alt="Vlottr" width="28" height="28" style="display: block; width: 28px; height: 28px; border-radius: 7px; border: 0;" />
                    </td>
                    <td style="padding-left: 8px; font-size: 15px; font-weight: 700; color: #ffffff; vertical-align: middle;">Vlottr</td>
                  </tr>
                </table>
                <p style="margin: 0; font-size: 12px; color: #525252;">Partner Programma &bull; Buddy BV</p>
                <p style="margin: 8px 0 0 0; font-size: 11px; color: #333333;">&copy; 2026 Vlottr</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`,
          isHtml: true,
          sentByName: 'Systeem (partner registratie)',
        });
      } catch (emailError) {
        console.error('Partner welcome email error:', emailError);
      }

      set({ user: userData, loading: false });
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error.code);
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      const currentUser = get().user;

      await signOut(auth);

      // Log the logout activity
      if (currentUser) {
        logUserLogout(currentUser.uid, currentUser.name || currentUser.email, currentUser.email, currentUser.role);
      }

      set({ user: null, loading: false, error: null });
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error.code);
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  initializeAuth: () => {
    try {
      const unsubscribe = onAuthStateChanged(
        auth,
        async (firebaseUser: FirebaseUser | null) => {
          if (firebaseUser) {
            try {
              const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
              if (userDoc.exists()) {
                const userData = userDoc.data() as User;
                set({ user: userData, loading: false, error: null });
              } else {
                console.error('User document not found for uid:', firebaseUser.uid);
                set({ user: null, loading: false, error: 'Gebruikersgegevens niet gevonden' });
              }
            } catch (error) {
              console.error('Error fetching user data:', error);
              set({ user: null, loading: false, error: 'Fout bij ophalen gebruikersgegevens' });
            }
          } else {
            set({ user: null, loading: false, error: null });
          }
        },
        (error) => {
          // Error callback for auth state changes
          console.error('Auth state change error:', error);
          set({ user: null, loading: false, error: 'Authenticatie fout' });
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ user: null, loading: false, error: 'Kan authenticatie niet initialiseren' });
      return () => {}; // Return empty unsubscribe function
    }
  }
}));