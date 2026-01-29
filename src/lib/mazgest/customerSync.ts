/**
 * Service per sincronizzazione clienti con MazGest
 *
 * Quando un cliente si registra o aggiorna i suoi dati sul sito,
 * questo service invia i dati a MazGest per la sincronizzazione.
 */

const MAZGEST_API_URL = process.env.MAZGEST_API_URL || 'http://localhost:5000';
const MAZGEST_API_KEY = process.env.MAZGEST_API_KEY || 'gaurosa-secret-key-2026';

export interface CustomerSyncData {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  customerType?: 'privato' | 'azienda';
  ragioneSociale?: string | null;
  codiceFiscale?: string | null;
  partitaIva?: string | null;
  codiceSdi?: string | null;
  pec?: string | null;
  billingAddress?: {
    address?: string | null;
    city?: string | null;
    province?: string | null;
    postcode?: string | null;
    country?: string | null;
  };
  shippingAddress?: {
    address?: string | null;
    city?: string | null;
    province?: string | null;
    postcode?: string | null;
    country?: string | null;
  };
  marketingConsent?: boolean;
  siteCustomerId?: number; // ID nel DB gaurosa-site
}

export interface CustomerSyncResult {
  success: boolean;
  isNew?: boolean;
  mazgestId?: number;
  error?: string;
}

/**
 * Sincronizza un cliente con MazGest
 *
 * Questa funzione:
 * 1. Invia i dati cliente all'API MazGest
 * 2. MazGest cerca duplicati (per email/telefono)
 * 3. Se esiste: aggiorna solo campi mancanti
 * 4. Se nuovo: crea cliente con origine_cliente = 'online'
 * 5. Ritorna l'ID MazGest del cliente
 */
export async function syncCustomerToMazGest(
  customerData: CustomerSyncData
): Promise<CustomerSyncResult> {
  try {
    console.log(`📤 Sincronizzando cliente con MazGest: ${customerData.email}`);

    const response = await fetch(`${MAZGEST_API_URL}/ecommerce/customers/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': MAZGEST_API_KEY,
      },
      body: JSON.stringify(customerData),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Errore sync MazGest:', result.error);
      return {
        success: false,
        error: result.error || 'Errore sincronizzazione',
      };
    }

    console.log(
      `✅ Cliente sincronizzato con MazGest: #${result.mazgestId} (${result.isNew ? 'NUOVO' : 'ESISTENTE'})`
    );

    return {
      success: true,
      isNew: result.isNew,
      mazgestId: result.mazgestId,
    };
  } catch (error) {
    console.error('❌ Errore chiamata API MazGest:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Errore di connessione',
    };
  }
}

/**
 * Verifica se un cliente esiste già in MazGest
 */
export async function checkCustomerInMazGest(
  email?: string,
  phone?: string
): Promise<{ exists: boolean; mazgestId?: number }> {
  try {
    const params = new URLSearchParams();
    if (email) params.append('email', email);
    if (phone) params.append('phone', phone);

    const response = await fetch(
      `${MAZGEST_API_URL}/ecommerce/customers/check?${params.toString()}`,
      {
        headers: {
          'x-api-key': MAZGEST_API_KEY,
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return { exists: false };
    }

    return {
      exists: result.exists,
      mazgestId: result.mazgestId,
    };
  } catch (error) {
    console.error('❌ Errore check cliente MazGest:', error);
    return { exists: false };
  }
}
