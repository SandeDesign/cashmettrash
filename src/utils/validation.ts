// src/utils/validation.ts

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => password.length >= 8;

export const validateDutchPhone = (phone: string): boolean => {
  const dutchPhoneRegex = /^(\+31|0031|0)[1-9][0-9]{8}$/;
  return dutchPhoneRegex.test(phone.replace(/\s/g, ''));
};

export const validateDutchPostcode = (postcode: string): boolean => {
  const postcodeRegex = /^[1-9][0-9]{3}\s?[a-zA-Z]{2}$/;
  return postcodeRegex.test(postcode.trim());
};

/** Normaliseert een postcode naar het formaat "1234 AB". */
export const formatPostcode = (postcode: string): string => {
  const clean = postcode.replace(/\s/g, '').toUpperCase();
  return clean.length === 6 ? `${clean.slice(0, 4)} ${clean.slice(4)}` : postcode.trim();
};

export const getFirebaseErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'Dit e-mailadres is al in gebruik';
    case 'auth/invalid-email':
      return 'Ongeldig e-mailadres';
    case 'auth/weak-password':
      return 'Wachtwoord is te zwak';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'E-mailadres of wachtwoord klopt niet';
    case 'auth/too-many-requests':
      return 'Te veel pogingen. Probeer het later opnieuw';
    case 'auth/network-request-failed':
      return 'Geen verbinding. Controleer je internetverbinding';
    default:
      return 'Er is een fout opgetreden. Probeer het opnieuw';
  }
};
