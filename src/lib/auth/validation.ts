/**
 * Utilities per validazione dati
 */

import { VALIDATION } from './config';

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/**
 * Valida email
 */
export function validateEmail(email: string): boolean {
  return VALIDATION.EMAIL.test(email);
}

/**
 * Valida telefono italiano
 */
export function validatePhoneIT(phone: string): boolean {
  // Rimuovi spazi e trattini
  const cleaned = phone.replace(/[\s-]/g, '');
  return VALIDATION.PHONE_IT.test(cleaned);
}

/**
 * Valida Codice Fiscale italiano
 */
export function validateCodiceFiscale(cf: string): boolean {
  if (!VALIDATION.CODICE_FISCALE.test(cf)) {
    return false;
  }

  // Algoritmo di controllo del codice fiscale
  const weights = {
    odd: {
      '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17, '8': 19, '9': 21,
      'A': 1, 'B': 0, 'C': 5, 'D': 7, 'E': 9, 'F': 13, 'G': 15, 'H': 17, 'I': 19, 'J': 21,
      'K': 2, 'L': 4, 'M': 18, 'N': 20, 'O': 11, 'P': 3, 'Q': 6, 'R': 8, 'S': 12, 'T': 14,
      'U': 16, 'V': 10, 'W': 22, 'X': 25, 'Y': 24, 'Z': 23
    },
    even: {
      '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
      'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7, 'I': 8, 'J': 9,
      'K': 10, 'L': 11, 'M': 12, 'N': 13, 'O': 14, 'P': 15, 'Q': 16, 'R': 17, 'S': 18, 'T': 19,
      'U': 20, 'V': 21, 'W': 22, 'X': 23, 'Y': 24, 'Z': 25
    }
  };

  const cfUpper = cf.toUpperCase();
  let sum = 0;

  for (let i = 0; i < 15; i++) {
    const char = cfUpper[i];
    if (i % 2 === 0) {
      sum += (weights.odd as Record<string, number>)[char] || 0;
    } else {
      sum += (weights.even as Record<string, number>)[char] || 0;
    }
  }

  const checkChar = String.fromCharCode(65 + (sum % 26));
  return checkChar === cfUpper[15];
}

/**
 * Valida Partita IVA italiana
 */
export function validatePartitaIva(piva: string): boolean {
  if (!VALIDATION.PARTITA_IVA.test(piva)) {
    return false;
  }

  // Algoritmo di Luhn modificato per P.IVA italiana
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    const digit = parseInt(piva[i], 10);
    if (i % 2 === 0) {
      sum += digit;
    } else {
      const doubled = digit * 2;
      sum += doubled > 9 ? doubled - 9 : doubled;
    }
  }

  return sum % 10 === 0;
}

/**
 * Valida Codice SDI
 */
export function validateCodiceSdi(sdi: string): boolean {
  return VALIDATION.CODICE_SDI.test(sdi);
}

/**
 * Valida dati registrazione
 */
export function validateRegistration(data: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  // Email obbligatoria e valida
  if (!data.email) {
    errors.email = 'Email obbligatoria';
  } else if (!validateEmail(data.email)) {
    errors.email = 'Email non valida';
  }

  // Password obbligatoria
  if (!data.password) {
    errors.password = 'Password obbligatoria';
  } else if (data.password.length < 8) {
    errors.password = 'La password deve essere di almeno 8 caratteri';
  }

  // Telefono opzionale ma se presente deve essere valido
  if (data.phone && !validatePhoneIT(data.phone)) {
    errors.phone = 'Numero di telefono non valido';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Valida dati fiscali per fattura
 */
export function validateInvoiceData(data: {
  customerType: 'privato' | 'azienda';
  codiceFiscale?: string;
  partitaIva?: string;
  ragioneSociale?: string;
  codiceSdi?: string;
  pec?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (data.customerType === 'privato') {
    // Per privati: CF obbligatorio
    if (!data.codiceFiscale) {
      errors.codiceFiscale = 'Codice Fiscale obbligatorio per fattura a privato';
    } else if (!validateCodiceFiscale(data.codiceFiscale)) {
      errors.codiceFiscale = 'Codice Fiscale non valido';
    }
  } else if (data.customerType === 'azienda') {
    // Per aziende: Ragione Sociale + P.IVA obbligatori
    if (!data.ragioneSociale) {
      errors.ragioneSociale = 'Ragione Sociale obbligatoria';
    }
    if (!data.partitaIva) {
      errors.partitaIva = 'Partita IVA obbligatoria';
    } else if (!validatePartitaIva(data.partitaIva)) {
      errors.partitaIva = 'Partita IVA non valida';
    }

    // SDI o PEC obbligatorio
    if (!data.codiceSdi && !data.pec) {
      errors.codiceSdi = 'Codice SDI o PEC obbligatorio';
    }
    if (data.codiceSdi && !validateCodiceSdi(data.codiceSdi)) {
      errors.codiceSdi = 'Codice SDI non valido (7 caratteri alfanumerici)';
    }
    if (data.pec && !validateEmail(data.pec)) {
      errors.pec = 'PEC non valida';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
