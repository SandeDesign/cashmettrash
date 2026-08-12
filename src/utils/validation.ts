export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 8;
};

export const validateDutchPhone = (phone: string): boolean => {
  const dutchPhoneRegex = /^(\+31|0031|0)[1-9][0-9]{8}$/;
  return dutchPhoneRegex.test(phone.replace(/\s/g, ''));
};

export const validateAge = (dateOfBirth: string): boolean => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1 >= 21;
  }
  
  return age >= 21;
};

export const validateLicenseMinYears = (issueDate: string, minYears: number = 3): boolean => {
  if (!issueDate) return false;
  const today = new Date();
  const issue = new Date(issueDate);
  const years = today.getFullYear() - issue.getFullYear();
  const monthDiff = today.getMonth() - issue.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < issue.getDate())) {
    return years - 1 >= minYears;
  }

  return years >= minYears;
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
      return 'Gebruiker niet gevonden';
    case 'auth/wrong-password':
      return 'Onjuist wachtwoord';
    case 'auth/too-many-requests':
      return 'Te veel inlogpogingen. Probeer het later opnieuw';
    default:
      return 'Er is een fout opgetreden. Probeer het opnieuw';
  }
};