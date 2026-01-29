/**
 * Email Service per gaurosa.it
 * Gestisce l'invio di email transazionali (verifica, reset password, ordini)
 */

import nodemailer from 'nodemailer';

// Configurazione SMTP
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465');
const SMTP_SECURE = process.env.SMTP_SECURE === 'true' || SMTP_PORT === 465; // true per SSL
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreplay@gaurosa.it';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Gaurosa Gioielli';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';

// Crea transporter (riutilizzabile)
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    // In development senza SMTP configurato, usa ethereal (email di test)
    if (!SMTP_USER || !SMTP_PASS) {
      console.warn('[Email] SMTP non configurato - email verranno solo loggata');
      // Crea un transporter fittizio che logga
      transporter = {
        sendMail: async (options: nodemailer.SendMailOptions) => {
          console.log('='.repeat(60));
          console.log('[Email MOCK] Invio email simulato:');
          console.log(`  To: ${options.to}`);
          console.log(`  Subject: ${options.subject}`);
          console.log(`  Preview URL: (email non inviata - SMTP non configurato)`);
          console.log('='.repeat(60));
          return { messageId: 'mock-' + Date.now() };
        },
      } as unknown as nodemailer.Transporter;
    } else {
      transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_SECURE, // true per porta 465 (SSL)
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });
      console.log(`[Email] SMTP configurato: ${SMTP_HOST}:${SMTP_PORT} (secure: ${SMTP_SECURE})`);
    }
  }
  return transporter;
}

/**
 * Invia email di verifica account
 */
export async function sendVerificationEmail(
  email: string,
  firstName: string,
  verificationToken: string
): Promise<boolean> {
  const verifyUrl = `${SITE_URL}/verifica-email?token=${verificationToken}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifica il tuo account</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: #d4af37; margin: 0; font-size: 28px;">Gaurosa Gioielli</h1>
  </div>

  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
    <h2 style="color: #1a1a2e; margin-top: 0;">Ciao ${firstName || 'Cliente'}!</h2>

    <p>Grazie per esserti registrato su <strong>gaurosa.it</strong>.</p>

    <p>Per completare la registrazione e attivare il tuo account, clicca sul pulsante qui sotto:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${verifyUrl}"
         style="display: inline-block; background: #d4af37; color: #1a1a2e; text-decoration: none; padding: 15px 40px; border-radius: 5px; font-weight: bold; font-size: 16px;">
        Verifica il mio account
      </a>
    </div>

    <p style="color: #666; font-size: 14px;">
      Oppure copia e incolla questo link nel tuo browser:<br>
      <a href="${verifyUrl}" style="color: #d4af37; word-break: break-all;">${verifyUrl}</a>
    </p>

    <p style="color: #666; font-size: 14px;">
      <strong>Nota:</strong> Questo link scade tra 24 ore.
    </p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

    <p style="color: #999; font-size: 12px; margin-bottom: 0;">
      Se non hai richiesto questa registrazione, puoi ignorare questa email in sicurezza.
    </p>
  </div>

  <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
    <p style="margin: 0; color: #666; font-size: 12px;">
      Mazzon Gioielli S.N.C. | Via Don G. Carrara 19 | Villa Del Conte (PD)<br>
      <a href="${SITE_URL}" style="color: #d4af37;">gaurosa.it</a>
    </p>
  </div>
</body>
</html>
  `.trim();

  const text = `
Ciao ${firstName || 'Cliente'}!

Grazie per esserti registrato su gaurosa.it.

Per completare la registrazione e attivare il tuo account, visita questo link:
${verifyUrl}

Nota: Questo link scade tra 24 ore.

Se non hai richiesto questa registrazione, puoi ignorare questa email in sicurezza.

---
Mazzon Gioielli S.N.C.
Via Don G. Carrara 19 | Villa Del Conte (PD)
gaurosa.it
  `.trim();

  try {
    const transport = getTransporter();
    await transport.sendMail({
      from: `"${EMAIL_FROM_NAME}" <${EMAIL_FROM}>`,
      to: email,
      subject: 'Verifica il tuo account - Gaurosa Gioielli',
      text,
      html,
    });

    console.log(`[Email] Verifica inviata a ${email}`);
    return true;
  } catch (error) {
    console.error('[Email] Errore invio verifica:', error);
    return false;
  }
}

/**
 * Invia email di reset password
 */
export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  resetToken: string
): Promise<boolean> {
  const resetUrl = `${SITE_URL}/reset-password?token=${resetToken}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: #d4af37; margin: 0; font-size: 28px;">Gaurosa Gioielli</h1>
  </div>

  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
    <h2 style="color: #1a1a2e; margin-top: 0;">Reset Password</h2>

    <p>Ciao ${firstName || 'Cliente'},</p>

    <p>Abbiamo ricevuto una richiesta di reset della password per il tuo account su <strong>gaurosa.it</strong>.</p>

    <p>Clicca sul pulsante qui sotto per impostare una nuova password:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}"
         style="display: inline-block; background: #d4af37; color: #1a1a2e; text-decoration: none; padding: 15px 40px; border-radius: 5px; font-weight: bold; font-size: 16px;">
        Reimposta Password
      </a>
    </div>

    <p style="color: #666; font-size: 14px;">
      Oppure copia e incolla questo link nel tuo browser:<br>
      <a href="${resetUrl}" style="color: #d4af37; word-break: break-all;">${resetUrl}</a>
    </p>

    <p style="color: #666; font-size: 14px;">
      <strong>Nota:</strong> Questo link scade tra 1 ora.
    </p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

    <p style="color: #999; font-size: 12px; margin-bottom: 0;">
      Se non hai richiesto il reset della password, puoi ignorare questa email. La tua password rimarr\u00E0 invariata.
    </p>
  </div>

  <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
    <p style="margin: 0; color: #666; font-size: 12px;">
      Mazzon Gioielli S.N.C. | Via Don G. Carrara 19 | Villa Del Conte (PD)<br>
      <a href="${SITE_URL}" style="color: #d4af37;">gaurosa.it</a>
    </p>
  </div>
</body>
</html>
  `.trim();

  const text = `
Ciao ${firstName || 'Cliente'},

Abbiamo ricevuto una richiesta di reset della password per il tuo account su gaurosa.it.

Per impostare una nuova password, visita questo link:
${resetUrl}

Nota: Questo link scade tra 1 ora.

Se non hai richiesto il reset della password, puoi ignorare questa email.

---
Mazzon Gioielli S.N.C.
Via Don G. Carrara 19 | Villa Del Conte (PD)
gaurosa.it
  `.trim();

  try {
    const transport = getTransporter();
    await transport.sendMail({
      from: `"${EMAIL_FROM_NAME}" <${EMAIL_FROM}>`,
      to: email,
      subject: 'Reset Password - Gaurosa Gioielli',
      text,
      html,
    });

    console.log(`[Email] Reset password inviata a ${email}`);
    return true;
  } catch (error) {
    console.error('[Email] Errore invio reset password:', error);
    return false;
  }
}

/**
 * Invia email di benvenuto dopo verifica
 */
export async function sendWelcomeEmail(
  email: string,
  firstName: string
): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Benvenuto su Gaurosa</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: #d4af37; margin: 0; font-size: 28px;">Benvenuto!</h1>
  </div>

  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
    <h2 style="color: #1a1a2e; margin-top: 0;">Ciao ${firstName || 'Cliente'}!</h2>

    <p>Il tuo account \u00E8 stato verificato con successo. Ora puoi accedere a tutte le funzionalit\u00E0 del nostro sito.</p>

    <h3 style="color: #1a1a2e;">Cosa puoi fare ora:</h3>
    <ul>
      <li>Sfogliare il nostro catalogo di gioielli e orologi</li>
      <li>Salvare i tuoi prodotti preferiti</li>
      <li>Effettuare ordini con checkout veloce</li>
      <li>Visualizzare lo storico dei tuoi ordini</li>
    </ul>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${SITE_URL}"
         style="display: inline-block; background: #d4af37; color: #1a1a2e; text-decoration: none; padding: 15px 40px; border-radius: 5px; font-weight: bold; font-size: 16px;">
        Inizia a Scoprire
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

    <p style="color: #666; font-size: 14px;">
      Hai domande? Rispondi a questa email o contattaci su WhatsApp.
    </p>
  </div>

  <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
    <p style="margin: 0; color: #666; font-size: 12px;">
      Mazzon Gioielli S.N.C. | Via Don G. Carrara 19 | Villa Del Conte (PD)<br>
      <a href="${SITE_URL}" style="color: #d4af37;">gaurosa.it</a>
    </p>
  </div>
</body>
</html>
  `.trim();

  const text = `
Ciao ${firstName || 'Cliente'}!

Il tuo account \u00E8 stato verificato con successo. Ora puoi accedere a tutte le funzionalit\u00E0 del nostro sito.

Cosa puoi fare ora:
- Sfogliare il nostro catalogo di gioielli e orologi
- Salvare i tuoi prodotti preferiti
- Effettuare ordini con checkout veloce
- Visualizzare lo storico dei tuoi ordini

Visita: ${SITE_URL}

Hai domande? Rispondi a questa email o contattaci su WhatsApp.

---
Mazzon Gioielli S.N.C.
Via Don G. Carrara 19 | Villa Del Conte (PD)
gaurosa.it
  `.trim();

  try {
    const transport = getTransporter();
    await transport.sendMail({
      from: `"${EMAIL_FROM_NAME}" <${EMAIL_FROM}>`,
      to: email,
      subject: 'Benvenuto su Gaurosa Gioielli!',
      text,
      html,
    });

    console.log(`[Email] Welcome inviata a ${email}`);
    return true;
  } catch (error) {
    console.error('[Email] Errore invio welcome:', error);
    return false;
  }
}
