import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const EMAIL_PROXY_URL = 'https://internedata.nl/uploads/vlottr/mail/send.php';

interface SendEmailParams {
  to: string;
  subject: string;
  message: string;
  isHtml?: boolean;
}

export async function sendEmail(params: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    if (!params.to || !params.to.includes('@')) {
      console.error('[sendEmail] Invalid or missing "to" address:', params.to);
      return { success: false, error: `Ongeldig e-mailadres: "${params.to}"` };
    }

    const payload = {
      to: params.to,
      subject: params.subject,
      message: params.message,
      isHtml: params.isHtml ?? true,
    };

    console.log('[sendEmail] Sending to:', params.to, '| Subject:', params.subject, '| Message length:', params.message.length);

    const response = await fetch(EMAIL_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error(`[sendEmail] HTTP ${response.status} from proxy:`, responseText);
      try {
        const errorData = JSON.parse(responseText);
        return { success: false, error: errorData.error || `Server error ${response.status}` };
      } catch {
        return { success: false, error: `Server error ${response.status}: ${responseText.substring(0, 200)}` };
      }
    }

    try {
      const data = JSON.parse(responseText);
      return data;
    } catch {
      console.error('[sendEmail] Invalid JSON response:', responseText.substring(0, 500));
      return { success: false, error: 'Ongeldig antwoord van e-mail server' };
    }
  } catch (err: any) {
    console.error('[sendEmail] Network error:', err);
    return { success: false, error: err.message || 'Netwerkfout bij verzenden e-mail' };
  }
}

/**
 * Send email AND log it to sent_emails collection for admin visibility
 */
export async function sendAndLogEmail(
  params: SendEmailParams & { sentBy?: string; sentByName?: string }
): Promise<{ success: boolean; error?: string }> {
  const result = await sendEmail(params);
  const now = new Date().toISOString();

  try {
    await addDoc(collection(db, 'sent_emails'), {
      from: 'noreply@vlottr.nl',
      to: params.to,
      subject: params.subject,
      message: params.message,
      status: result.success ? 'sent' : 'failed',
      error: result.error || null,
      sent_by: params.sentBy || 'system',
      sent_by_name: params.sentByName || 'Systeem (automatisch)',
      sent_at: now,
      created_at: now,
    });
  } catch (logErr) {
    console.error('Failed to log sent email:', logErr);
  }

  return result;
}

export async function sendPaymentLinkEmail(
  customerEmail: string,
  customerName: string,
  paymentUrl: string,
  amount: number,
  type: 'borg' | 'bezorgkosten'
): Promise<{ success: boolean; error?: string }> {
  const label = type === 'borg' ? 'Waarborgsom' : 'Bezorgkosten';
  const subject = `Vlottr - Betaallink ${label}`;

  const message = `<!DOCTYPE html><html lang="nl" xmlns="http://www.w3.org/1999/xhtml"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><style>body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}table,td{mso-table-lspace:0;mso-table-rspace:0}img{border:0;height:auto;line-height:100%;outline:none;text-decoration:none}body{margin:0!important;padding:0!important;width:100%!important;background:#0a0a0a}@media screen and (max-width:600px){.ec{width:100%!important;max-width:100%!important}.mp{padding-left:20px!important;padding-right:20px!important}}</style></head><body style="margin:0;padding:0;background:#0a0a0a;"><div role="article" lang="nl"><table role="presentation" style="width:100%;border:none;border-spacing:0;background:#0a0a0a;"><tr><td align="center" style="padding:24px 8px;"><table role="presentation" class="ec" style="width:560px;max-width:560px;border:none;border-spacing:0;text-align:left;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;"><tr><td style="padding:32px 32px 24px;text-align:center;background:#0d2818;border-radius:16px 16px 0 0;" class="mp"><img src="https://vlottr.eu/512x512x2.png" alt="Vlottr" width="44" height="44" style="display:block;margin:0 auto;width:44px;height:44px;border-radius:10px;"><p style="margin:12px 0 0;font-size:22px;font-weight:800;color:#fff;letter-spacing:-.3px;">Vlottr</p><p style="margin:4px 0 0;font-size:11px;color:#4ade80;letter-spacing:1.5px;text-transform:uppercase;font-weight:600;">Autoverhuur Zuid-Limburg</p></td></tr><tr><td style="padding:32px 32px 0;background:#111;" class="mp"><p style="margin:0 0 4px;font-size:26px;font-weight:800;color:#fff;line-height:1.2;letter-spacing:-.3px;">Betaallink ${label}</p><p style="margin:12px 0 0;font-size:15px;color:#a3a3a3;line-height:1.6;">Hallo ${customerName},</p><p style="margin:8px 0 0;font-size:15px;color:#a3a3a3;line-height:1.6;">Hierbij ontvangt u de betaallink voor de <strong style="color:#fff;">${label.toLowerCase()}</strong> van:</p></td></tr><tr><td style="padding:16px 32px 0;background:#111;" class="mp"><table role="presentation" style="width:100%;border:none;border-spacing:0;"><tr><td style="height:2px;background:linear-gradient(to right,#22c55e,transparent);font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr><tr><td style="padding:24px 32px;background:#111;" class="mp"><table role="presentation" style="width:100%;border:none;border-spacing:0;background:#1a1a1a;border-radius:12px;border:1px solid #222;"><tr><td style="padding:24px;text-align:center;"><p style="margin:0;font-size:11px;color:#22c55e;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;">${label}</p><p style="margin:8px 0 0;font-size:48px;font-weight:800;color:#fff;font-family:'Courier New',monospace;letter-spacing:-1px;">&euro;${amount}</p></td></tr></table></td></tr><tr><td style="padding:0 32px 28px;background:#111;text-align:center;" class="mp"><table role="presentation" style="margin:0 auto;border:none;border-spacing:0;"><tr><td style="border-radius:12px;background:#22c55e;text-align:center;"><a href="${paymentUrl}" target="_blank" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:800;color:#0a0a0a;text-decoration:none;">Betaal nu &rarr;</a></td></tr></table><p style="margin:16px 0 0;font-size:12px;color:#525252;">Werkt de knop niet? Kopieer deze link:<br><span style="color:#22c55e;word-break:break-all;">${paymentUrl}</span></p></td></tr><tr><td style="padding:0 32px;background:#111;" class="mp"><table role="presentation" style="width:100%;border:none;border-spacing:0;"><tr><td style="height:1px;background:#222;font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr><tr><td style="padding:24px 32px;background:#0a0a0a;border-radius:0 0 16px 16px;text-align:center;border-top:1px solid #1a1a1a;" class="mp"><table role="presentation" style="margin:0 auto 12px;border:none;border-spacing:0;"><tr><td style="width:28px;height:28px;text-align:center;vertical-align:middle;"><img src="https://vlottr.eu/512x512x2.png" alt="Vlottr" width="28" height="28" style="display:block;width:28px;height:28px;border-radius:7px;"></td><td style="padding-left:8px;font-size:15px;font-weight:700;color:#fff;vertical-align:middle;">Vlottr</td></tr></table><p style="margin:0 0 4px;font-size:12px;color:#525252;"><a href="https://vlottr.eu" style="color:#525252;text-decoration:underline;">vlottr.eu</a> &middot; <a href="mailto:support@vlottr.eu" style="color:#525252;text-decoration:underline;">support@vlottr.eu</a></p><p style="margin:0 0 12px;font-size:12px;color:#525252;">Autoverhuur Zuid-Limburg</p><p style="margin:0;font-size:11px;color:#333;">&copy; 2026 Vlottr &mdash; Je ontvangt deze mail omdat er een betaallink voor je is aangemaakt.</p></td></tr></table></td></tr></table></div></body></html>`;

  return sendAndLogEmail({ to: customerEmail, subject, message, isHtml: true, sentByName: 'Systeem (automatisch)' });
}

/**
 * Send wizard reminder email to a CUSTOMER who hasn't completed onboarding.
 * Includes a CTA link to the dashboard (existing auth flow handles login).
 */
export async function sendCustomerWizardReminderEmail(
  customerEmail: string,
  customerName: string,
  sentByName?: string
): Promise<{ success: boolean; error?: string }> {
  const dashboardUrl = 'https://vlottr.eu/dashboard';
  const subject = 'Vlottr - Rond je registratie af';

  const message = buildWizardReminderHtml({
    recipientName: customerName,
    heading: 'Rond je registratie af',
    bodyText:
      'Je account bij Vlottr is aangemaakt, maar je hebt de registratiewizard nog niet afgerond. ' +
      'Zonder deze stap kunnen we je aanvraag niet in behandeling nemen.',
    steps: [
      'Persoonlijke gegevens invullen',
      'Rijbewijs uploaden',
      'Loonstroken uploaden',
    ],
    ctaLabel: 'Registratie afronden',
    ctaUrl: dashboardUrl,
    footerNote: 'Je ontvangt deze e-mail omdat je registratie bij Vlottr nog niet is afgerond.',
  });

  return sendAndLogEmail({
    to: customerEmail,
    subject,
    message,
    isHtml: true,
    sentByName: sentByName || 'Admin (handmatig)',
  });
}

/**
 * Send wizard reminder email to a PARTNER who hasn't completed onboarding.
 */
export async function sendPartnerWizardReminderEmail(
  partnerEmail: string,
  partnerName: string,
  companyName: string,
  sentByName?: string
): Promise<{ success: boolean; error?: string }> {
  const dashboardUrl = 'https://vlottr.eu/dashboard';
  const subject = 'Vlottr - Rond je partnerregistratie af';

  const message = buildWizardReminderHtml({
    recipientName: partnerName,
    heading: 'Partnerregistratie afronden',
    bodyText:
      `Het partneraccount voor <strong style="color:#ffffff;">${companyName}</strong> is aangemaakt, ` +
      'maar de onboarding-wizard is nog niet voltooid. Rond deze af zodat we je aanvraag kunnen beoordelen.',
    steps: [
      'Bedrijfsgegevens invullen',
      'Contactgegevens & adres',
      'Logo uploaden (optioneel)',
      'Partnerovereenkomst tekenen',
    ],
    ctaLabel: 'Onboarding afronden',
    ctaUrl: dashboardUrl,
    footerNote: 'Je ontvangt deze e-mail omdat je partnerregistratie bij Vlottr nog niet is afgerond.',
  });

  return sendAndLogEmail({
    to: partnerEmail,
    subject,
    message,
    isHtml: true,
    sentByName: sentByName || 'Admin (handmatig)',
  });
}

/** Shared HTML builder for wizard-reminder emails, matching Vlottr email style. */
function buildWizardReminderHtml(opts: {
  recipientName: string;
  heading: string;
  bodyText: string;
  steps: string[];
  ctaLabel: string;
  ctaUrl: string;
  footerNote: string;
}): string {
  const stepsHtml = opts.steps
    .map(
      (s, i) =>
        `<tr>
          <td style="padding: 10px 16px; vertical-align: top;">
            <table role="presentation" style="border: none; border-spacing: 0;">
              <tr>
                <td style="width: 28px; height: 28px; border-radius: 50%; background-color: #22c55e; text-align: center; vertical-align: middle; font-size: 13px; font-weight: 800; color: #0a0a0a;">${i + 1}</td>
                <td style="padding-left: 12px; font-size: 14px; color: #d4d4d4; line-height: 1.4;">${s}</td>
              </tr>
            </table>
          </td>
        </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="nl" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${opts.heading} - Vlottr</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #0a0a0a; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .mobile-pad { padding-left: 20px !important; padding-right: 20px !important; }
    }
    @media (prefers-color-scheme: dark) { body { background-color: #0a0a0a !important; } }
  </style>
</head>
<body style="margin: 0; padding: 0; word-spacing: normal; background-color: #0a0a0a;">
  <div role="article" aria-roledescription="email" lang="nl" style="font-size: max(16px, 1rem);">
    <table role="presentation" style="width: 100%; border: none; border-spacing: 0; background-color: #0a0a0a;">
      <tr>
        <td align="center" style="padding: 24px 8px;">
          <table role="presentation" class="email-container" style="width: 560px; max-width: 560px; border: none; border-spacing: 0; text-align: left; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">

            <!-- HEADER -->
            <tr>
              <td style="padding: 32px 32px 24px 32px; text-align: center; background-color: #0d2818; border-radius: 16px 16px 0 0;" class="mobile-pad">
                <img src="https://vlottr.eu/512x512x2.png" alt="Vlottr" width="44" height="44" style="display: block; margin: 0 auto; width: 44px; height: 44px; border-radius: 10px; border: 0;" />
                <p style="margin: 12px 0 0 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px;">Vlottr</p>
                <p style="margin: 4px 0 0 0; font-size: 11px; color: #4ade80; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 600;">Autoverhuur Zuid-Limburg</p>
              </td>
            </tr>

            <!-- GREETING -->
            <tr>
              <td style="padding: 32px 32px 0 32px; background-color: #111111;" class="mobile-pad">
                <p style="margin: 0 0 4px 0; font-size: 26px; font-weight: 800; color: #ffffff; line-height: 1.2; letter-spacing: -0.3px;">${opts.heading}</p>
                <p style="margin: 12px 0 0 0; font-size: 15px; color: #a3a3a3; line-height: 1.6;">Hallo ${opts.recipientName},</p>
                <p style="margin: 8px 0 0 0; font-size: 15px; color: #a3a3a3; line-height: 1.6;">${opts.bodyText}</p>
              </td>
            </tr>

            <!-- DIVIDER -->
            <tr>
              <td style="padding: 16px 32px 0 32px; background-color: #111111;" class="mobile-pad">
                <table role="presentation" style="width: 100%; border: none; border-spacing: 0;">
                  <tr><td style="height: 2px; background: linear-gradient(to right, #22c55e, transparent); font-size: 0; line-height: 0;">&nbsp;</td></tr>
                </table>
              </td>
            </tr>

            <!-- STEPS -->
            <tr>
              <td style="padding: 16px 32px; background-color: #111111;" class="mobile-pad">
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #737373; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Nog af te ronden stappen</p>
                <table role="presentation" style="width: 100%; border: none; border-spacing: 0; background-color: #1a1a1a; border-radius: 12px; border: 1px solid #222222;">
                  ${stepsHtml}
                </table>
              </td>
            </tr>

            <!-- CTA BUTTON -->
            <tr>
              <td style="padding: 8px 32px 28px 32px; background-color: #111111; text-align: center;" class="mobile-pad">
                <table role="presentation" style="margin: 0 auto; border: none; border-spacing: 0;">
                  <tr>
                    <td style="border-radius: 12px; background-color: #22c55e; text-align: center;">
                      <a href="${opts.ctaUrl}" target="_blank" style="display: inline-block; padding: 14px 36px; font-size: 15px; font-weight: 800; color: #0a0a0a; text-decoration: none; letter-spacing: -0.2px;">
                        ${opts.ctaLabel} &rarr;
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin: 16px 0 0 0; font-size: 12px; color: #525252;">
                  Werkt de knop niet? Kopieer deze link in uw browser:<br/>
                  <a href="${opts.ctaUrl}" style="color: #22c55e; word-break: break-all;">${opts.ctaUrl}</a>
                </p>
              </td>
            </tr>

            <!-- DIVIDER -->
            <tr>
              <td style="padding: 0 32px; background-color: #111111;" class="mobile-pad">
                <table role="presentation" style="width: 100%; border: none; border-spacing: 0;">
                  <tr><td style="height: 1px; background-color: #222222; font-size: 0; line-height: 0;">&nbsp;</td></tr>
                </table>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="padding: 24px 32px; background-color: #0a0a0a; border-radius: 0 0 16px 16px; text-align: center; border-top: 1px solid #1a1a1a;" class="mobile-pad">
                <table role="presentation" style="margin: 0 auto 12px auto; border: none; border-spacing: 0;">
                  <tr>
                    <td style="width: 28px; height: 28px; text-align: center; vertical-align: middle;">
                      <img src="https://vlottr.eu/512x512x2.png" alt="Vlottr" width="28" height="28" style="display: block; width: 28px; height: 28px; border-radius: 7px; border: 0;" />
                    </td>
                    <td style="padding-left: 8px; font-size: 15px; font-weight: 700; color: #ffffff; vertical-align: middle;">Vlottr</td>
                  </tr>
                </table>
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #525252;">
                  <a href="https://vlottr.eu" style="color: #525252; text-decoration: underline;">vlottr.eu</a>
                  &nbsp;&middot;&nbsp;
                  <a href="mailto:support@vlottr.eu" style="color: #525252; text-decoration: underline;">support@vlottr.eu</a>
                </p>
                <p style="margin: 0 0 12px 0; font-size: 12px; color: #525252;">Autoverhuur Zuid-Limburg</p>
                <p style="margin: 0; font-size: 11px; color: #333333;">
                  &copy; 2026 Vlottr &mdash; ${opts.footerNote}
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

export function applyTemplateVariables(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

export async function sendLockPeriodEmail(
  customerEmail: string,
  customerName: string,
  carName: string,
  lockPeriodMonths: number,
  startDate: string,
  endDate: string,
  weeklyRate: number,
  templateSubject: string,
  templateBody: string
): Promise<{ success: boolean; error?: string }> {
  const vars: Record<string, string> = {
    customer_name: customerName,
    car_name: carName,
    lock_period_months: String(lockPeriodMonths),
    start_date: startDate,
    end_date: endDate,
    weekly_rate: String(weeklyRate),
  };
  const subject = applyTemplateVariables(templateSubject, vars);
  const message = applyTemplateVariables(templateBody, vars);
  return sendAndLogEmail({ to: customerEmail, subject, message, isHtml: true, sentByName: 'Systeem (automatisch)' });
}

export async function sendPickupReadyEmail(
  customerEmail: string,
  customerName: string,
  carName: string,
  pickupLocation: string,
  pickupDate: string,
  templateSubject: string,
  templateBody: string
): Promise<{ success: boolean; error?: string }> {
  const vars: Record<string, string> = {
    customer_name: customerName,
    car_name: carName,
    pickup_location: pickupLocation,
    pickup_date: pickupDate,
  };
  const subject = applyTemplateVariables(templateSubject, vars);
  const message = applyTemplateVariables(templateBody, vars);
  return sendAndLogEmail({ to: customerEmail, subject, message, isHtml: true, sentByName: 'Systeem (automatisch)' });
}
