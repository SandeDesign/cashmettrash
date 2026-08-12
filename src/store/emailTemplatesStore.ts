import { create } from 'zustand';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { EmailTemplate, EmailTemplateId } from '../types';

/** Bump this number whenever default templates are updated. Forces Firestore docs to upgrade. */
const TEMPLATE_VERSION = 3;

const EMAIL_HEADER = `<!DOCTYPE html>
<html lang="nl" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
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
<div role="article" lang="nl" style="font-size: max(16px, 1rem);">
<table role="presentation" style="width: 100%; border: none; border-spacing: 0; background-color: #0a0a0a;">
<tr><td align="center" style="padding: 24px 8px;">
<table role="presentation" class="email-container" style="width: 560px; max-width: 560px; border: none; border-spacing: 0; text-align: left; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">`;

const EMAIL_LOGO_HEADER = `
<!-- HEADER -->
<tr>
  <td style="padding: 32px 32px 24px 32px; text-align: center; background-color: #0d2818; border-radius: 16px 16px 0 0;" class="mobile-pad">
    <img src="https://vlottr.eu/512x512x2.png" alt="Vlottr" width="44" height="44" style="display: block; margin: 0 auto; width: 44px; height: 44px; border-radius: 10px; border: 0;" />
    <p style="margin: 12px 0 0 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px;">Vlottr</p>
    <p style="margin: 4px 0 0 0; font-size: 11px; color: #4ade80; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 600;">Autoverhuur Zuid-Limburg</p>
  </td>
</tr>`;

const EMAIL_DIVIDER_GREEN = `
<tr>
  <td style="padding: 0 32px; background-color: #111111;" class="mobile-pad">
    <table role="presentation" style="width: 100%; border: none; border-spacing: 0;">
      <tr><td style="height: 2px; background: linear-gradient(to right, #22c55e, transparent); font-size: 0; line-height: 0;">&nbsp;</td></tr>
    </table>
  </td>
</tr>`;

const EMAIL_DIVIDER_LINE = `
<tr>
  <td style="padding: 0 32px; background-color: #111111;" class="mobile-pad">
    <table role="presentation" style="width: 100%; border: none; border-spacing: 0;">
      <tr><td style="height: 1px; background-color: #222222; font-size: 0; line-height: 0;">&nbsp;</td></tr>
    </table>
  </td>
</tr>`;

const EMAIL_FOOTER = `
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
    <p style="margin: 0; font-size: 11px; color: #333333;">&copy; 2026 Vlottr &mdash; Je ontvangt deze mail omdat je een boeking hebt bij Vlottr.</p>
  </td>
</tr>
</table></td></tr></table></div></body></html>`;

const DEFAULT_TEMPLATES: Record<EmailTemplateId, Omit<EmailTemplate, 'updated_at' | 'updated_by'>> = {
  ophalen: {
    id: 'ophalen',
    label: 'Auto klaar om op te halen',
    subject: 'Vlottr \u2014 Uw auto is klaar om op te halen!',
    body_html: EMAIL_HEADER + EMAIL_LOGO_HEADER + `
<!-- TITLE -->
<tr>
  <td style="padding: 32px 32px 8px 32px; background-color: #111111;" class="mobile-pad">
    <p style="margin: 0 0 8px 0; font-size: 26px; font-weight: 800; color: #ffffff; line-height: 1.2; letter-spacing: -0.3px;">Uw auto staat klaar! &#128663;</p>
    <p style="margin: 0; font-size: 15px; color: #a3a3a3; line-height: 1.6;">Hallo {{customer_name}},</p>
    <p style="margin: 8px 0 0 0; font-size: 15px; color: #a3a3a3; line-height: 1.6;">
      Goed nieuws &mdash; uw <strong style="color: #ffffff;">{{car_name}}</strong> staat klaar voor ophaling. Hieronder vindt u de details.
    </p>
  </td>
</tr>
` + EMAIL_DIVIDER_GREEN + `
<!-- DETAILS BLOCK -->
<tr>
  <td style="padding: 24px 32px; background-color: #111111;" class="mobile-pad">
    <table role="presentation" style="width: 100%; border: none; border-spacing: 0;">
      <!-- Auto -->
      <tr>
        <td style="padding: 0 0 8px 0; vertical-align: top;">
          <table role="presentation" style="width: 100%; border: none; border-spacing: 0; background-color: #1a1a1a; border-radius: 12px; border: 1px solid #222222;">
            <tr>
              <td style="width: 56px; padding: 16px 0 16px 16px; vertical-align: middle;">
                <table role="presentation" style="border: none; border-spacing: 0;">
                  <tr>
                    <td style="width: 36px; height: 36px; background-color: rgba(34,197,94,0.1); border-radius: 10px; text-align: center; vertical-align: middle; border: 1px solid rgba(34,197,94,0.2);">
                      <span style="color: #22c55e; font-size: 18px; line-height: 36px;">&#128663;</span>
                    </td>
                  </tr>
                </table>
              </td>
              <td style="padding: 16px 16px 16px 12px; vertical-align: middle;">
                <p style="margin: 0 0 2px 0; font-size: 11px; color: #525252; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Auto</p>
                <p style="margin: 0; font-size: 15px; font-weight: 700; color: #ffffff;">{{car_name}}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- Locatie -->
      <tr>
        <td style="padding: 0 0 8px 0; vertical-align: top;">
          <table role="presentation" style="width: 100%; border: none; border-spacing: 0; background-color: #1a1a1a; border-radius: 12px; border: 1px solid #222222;">
            <tr>
              <td style="width: 56px; padding: 16px 0 16px 16px; vertical-align: middle;">
                <table role="presentation" style="border: none; border-spacing: 0;">
                  <tr>
                    <td style="width: 36px; height: 36px; background-color: rgba(34,197,94,0.1); border-radius: 10px; text-align: center; vertical-align: middle; border: 1px solid rgba(34,197,94,0.2);">
                      <span style="color: #22c55e; font-size: 18px; line-height: 36px;">&#128205;</span>
                    </td>
                  </tr>
                </table>
              </td>
              <td style="padding: 16px 16px 16px 12px; vertical-align: middle;">
                <p style="margin: 0 0 2px 0; font-size: 11px; color: #525252; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Ophaallocatie</p>
                <p style="margin: 0; font-size: 15px; font-weight: 700; color: #ffffff;">{{pickup_location}}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- Datum -->
      <tr>
        <td style="padding: 0; vertical-align: top;">
          <table role="presentation" style="width: 100%; border: none; border-spacing: 0; background-color: #1a1a1a; border-radius: 12px; border: 1px solid #222222;">
            <tr>
              <td style="width: 56px; padding: 16px 0 16px 16px; vertical-align: middle;">
                <table role="presentation" style="border: none; border-spacing: 0;">
                  <tr>
                    <td style="width: 36px; height: 36px; background-color: rgba(34,197,94,0.1); border-radius: 10px; text-align: center; vertical-align: middle; border: 1px solid rgba(34,197,94,0.2);">
                      <span style="color: #22c55e; font-size: 18px; line-height: 36px;">&#128197;</span>
                    </td>
                  </tr>
                </table>
              </td>
              <td style="padding: 16px 16px 16px 12px; vertical-align: middle;">
                <p style="margin: 0 0 2px 0; font-size: 11px; color: #525252; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Datum</p>
                <p style="margin: 0; font-size: 15px; font-weight: 700; color: #ffffff;">{{pickup_date}}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td>
</tr>
<!-- TIP BOX -->
<tr>
  <td style="padding: 0 32px 28px 32px; background-color: #111111;" class="mobile-pad">
    <table role="presentation" style="width: 100%; border: none; border-spacing: 0; border-radius: 10px; border: 1px solid rgba(34,197,94,0.2);" bgcolor="#0d2818">
      <tr>
        <td style="padding: 14px 16px; background-color: #0d2818; border-radius: 10px;">
          <p style="margin: 0; font-size: 13px; color: #4ade80; line-height: 1.5;">
            &#9989; Neem uw <strong>rijbewijs</strong> en eventueel betalingsbewijs mee bij ophaling.
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>
` + EMAIL_DIVIDER_LINE + EMAIL_FOOTER,
  },

  ontvangen: {
    id: 'ontvangen',
    label: 'Auto ontvangen / ingeleverd',
    subject: 'Vlottr \u2014 Uw auto is ontvangen',
    body_html: EMAIL_HEADER + EMAIL_LOGO_HEADER + `
<!-- TITLE -->
<tr>
  <td style="padding: 32px 32px 8px 32px; background-color: #111111;" class="mobile-pad">
    <p style="margin: 0 0 8px 0; font-size: 26px; font-weight: 800; color: #ffffff; line-height: 1.2; letter-spacing: -0.3px;">Auto succesvol ingeleverd &#10003;</p>
    <p style="margin: 0; font-size: 15px; color: #a3a3a3; line-height: 1.6;">Hallo {{customer_name}},</p>
    <p style="margin: 8px 0 0 0; font-size: 15px; color: #a3a3a3; line-height: 1.6;">
      Wij hebben uw <strong style="color: #ffffff;">{{car_name}}</strong> in goede orde ontvangen op <strong style="color: #ffffff;">{{return_date}}</strong>.
    </p>
  </td>
</tr>
` + EMAIL_DIVIDER_GREEN + `
<!-- THANKS BLOCK -->
<tr>
  <td style="padding: 24px 32px 28px 32px; background-color: #111111;" class="mobile-pad">
    <table role="presentation" style="width: 100%; border: none; border-spacing: 0; border-radius: 10px; border: 1px solid rgba(34,197,94,0.2);" bgcolor="#0d2818">
      <tr>
        <td style="padding: 20px; background-color: #0d2818; border-radius: 10px;">
          <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 700; color: #ffffff;">Bedankt voor uw vertrouwen in Vlottr!</p>
          <p style="margin: 0; font-size: 13px; color: #4ade80; line-height: 1.5;">
            We hopen u snel weer te mogen verwelkomen. Bekijk ons actuele aanbod op vlottr.eu.
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>
<!-- CTA BUTTON -->
<tr>
  <td style="padding: 0 32px 28px 32px; background-color: #111111; text-align: center;" class="mobile-pad">
    <table role="presentation" style="margin: 0 auto; border: none; border-spacing: 0;">
      <tr>
        <td style="border-radius: 12px; background-color: #22c55e; text-align: center;">
          <a href="https://vlottr.eu/cars" target="_blank" style="display: inline-block; padding: 14px 36px; font-size: 15px; font-weight: 800; color: #0a0a0a; text-decoration: none; letter-spacing: -0.2px;">
            Bekijk de auto's &rarr;
          </a>
        </td>
      </tr>
    </table>
  </td>
</tr>
` + EMAIL_DIVIDER_LINE + EMAIL_FOOTER,
  },

  borg: {
    id: 'borg',
    label: 'Waarborgsom (borg)',
    subject: 'Vlottr \u2014 Betaallink waarborgsom \u20AC{{amount}}',
    body_html: EMAIL_HEADER + EMAIL_LOGO_HEADER + `
<!-- TITLE -->
<tr>
  <td style="padding: 32px 32px 0 32px; background-color: #111111;" class="mobile-pad">
    <p style="margin: 0 0 4px 0; font-size: 26px; font-weight: 800; color: #ffffff; line-height: 1.2; letter-spacing: -0.3px;">Betaallink waarborgsom</p>
    <p style="margin: 12px 0 0 0; font-size: 15px; color: #a3a3a3; line-height: 1.6;">Hallo {{customer_name}},</p>
    <p style="margin: 8px 0 0 0; font-size: 15px; color: #a3a3a3; line-height: 1.6;">Hierbij ontvangt u de betaallink voor de <strong style="color: #ffffff;">waarborgsom</strong> van:</p>
  </td>
</tr>
` + EMAIL_DIVIDER_GREEN + `
<!-- AMOUNT BLOCK -->
<tr>
  <td style="padding: 24px 32px; background-color: #111111;" class="mobile-pad">
    <table role="presentation" style="width: 100%; border: none; border-spacing: 0; background-color: #1a1a1a; border-radius: 12px; border: 1px solid #222222;">
      <tr>
        <td style="padding: 24px; text-align: center;">
          <p style="margin: 0; font-size: 11px; color: #22c55e; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 700;">Waarborgsom</p>
          <p style="margin: 8px 0 0 0; font-size: 48px; font-weight: 800; color: #ffffff; font-family: 'Courier New', monospace; letter-spacing: -1px;">&euro;{{amount}}</p>
        </td>
      </tr>
    </table>
  </td>
</tr>
<!-- CTA BUTTON -->
<tr>
  <td style="padding: 0 32px 28px 32px; background-color: #111111; text-align: center;" class="mobile-pad">
    <table role="presentation" style="margin: 0 auto; border: none; border-spacing: 0;">
      <tr>
        <td style="border-radius: 12px; background-color: #22c55e; text-align: center;">
          <a href="{{payment_url}}" target="_blank" style="display: inline-block; padding: 14px 36px; font-size: 15px; font-weight: 800; color: #0a0a0a; text-decoration: none; letter-spacing: -0.2px;">
            Betaal nu &rarr;
          </a>
        </td>
      </tr>
    </table>
    <p style="margin: 16px 0 0 0; font-size: 12px; color: #525252;">
      Werkt de knop niet? Kopieer deze link in uw browser:<br/>
      <a href="{{payment_url}}" style="color: #22c55e; word-break: break-all;">{{payment_url}}</a>
    </p>
  </td>
</tr>
` + EMAIL_DIVIDER_LINE + EMAIL_FOOTER,
  },

  bezorgkosten: {
    id: 'bezorgkosten',
    label: 'Bezorgkosten',
    subject: 'Vlottr \u2014 Betaallink bezorgkosten \u20AC{{amount}}',
    body_html: EMAIL_HEADER + EMAIL_LOGO_HEADER + `
<!-- TITLE -->
<tr>
  <td style="padding: 32px 32px 0 32px; background-color: #111111;" class="mobile-pad">
    <p style="margin: 0 0 4px 0; font-size: 26px; font-weight: 800; color: #ffffff; line-height: 1.2; letter-spacing: -0.3px;">Betaallink bezorgkosten</p>
    <p style="margin: 12px 0 0 0; font-size: 15px; color: #a3a3a3; line-height: 1.6;">Hallo {{customer_name}},</p>
    <p style="margin: 8px 0 0 0; font-size: 15px; color: #a3a3a3; line-height: 1.6;">Hierbij ontvangt u de betaallink voor de <strong style="color: #ffffff;">bezorgkosten</strong> van:</p>
  </td>
</tr>
` + EMAIL_DIVIDER_GREEN + `
<!-- AMOUNT BLOCK -->
<tr>
  <td style="padding: 24px 32px; background-color: #111111;" class="mobile-pad">
    <table role="presentation" style="width: 100%; border: none; border-spacing: 0; background-color: #1a1a1a; border-radius: 12px; border: 1px solid #222222;">
      <tr>
        <td style="padding: 24px; text-align: center;">
          <p style="margin: 0; font-size: 11px; color: #22c55e; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 700;">Bezorgkosten</p>
          <p style="margin: 8px 0 0 0; font-size: 48px; font-weight: 800; color: #ffffff; font-family: 'Courier New', monospace; letter-spacing: -1px;">&euro;{{amount}}</p>
        </td>
      </tr>
    </table>
  </td>
</tr>
<!-- CTA BUTTON -->
<tr>
  <td style="padding: 0 32px 28px 32px; background-color: #111111; text-align: center;" class="mobile-pad">
    <table role="presentation" style="margin: 0 auto; border: none; border-spacing: 0;">
      <tr>
        <td style="border-radius: 12px; background-color: #22c55e; text-align: center;">
          <a href="{{payment_url}}" target="_blank" style="display: inline-block; padding: 14px 36px; font-size: 15px; font-weight: 800; color: #0a0a0a; text-decoration: none; letter-spacing: -0.2px;">
            Betaal nu &rarr;
          </a>
        </td>
      </tr>
    </table>
    <p style="margin: 16px 0 0 0; font-size: 12px; color: #525252;">
      Werkt de knop niet? Kopieer deze link in uw browser:<br/>
      <a href="{{payment_url}}" style="color: #22c55e; word-break: break-all;">{{payment_url}}</a>
    </p>
  </td>
</tr>
` + EMAIL_DIVIDER_LINE + EMAIL_FOOTER,
  },

  vastzetperiode_6_maanden: {
    id: 'vastzetperiode_6_maanden',
    label: 'Vastzetperiode 6 maanden (contract)',
    subject: 'Vlottr \u2014 Uw contract voor vastzetperiode 6 maanden',
    body_html: EMAIL_HEADER + EMAIL_LOGO_HEADER + `
<!-- TITLE -->
<tr>
  <td style="padding: 32px 32px 8px 32px; background-color: #111111;" class="mobile-pad">
    <p style="margin: 0 0 8px 0; font-size: 26px; font-weight: 800; color: #ffffff; line-height: 1.2; letter-spacing: -0.3px;">Vastzetperiode 6 maanden &#128203;</p>
    <p style="margin: 0; font-size: 15px; color: #a3a3a3; line-height: 1.6;">Hallo {{customer_name}},</p>
    <p style="margin: 8px 0 0 0; font-size: 15px; color: #a3a3a3; line-height: 1.6;">
      Bedankt voor het ondertekenen van uw contract. Hierbij bevestigen wij uw vastzetperiode van <strong style="color: #ffffff;">6 maanden</strong> voor uw <strong style="color: #ffffff;">{{car_name}}</strong>.
    </p>
  </td>
</tr>
` + EMAIL_DIVIDER_GREEN + `
<!-- DETAILS BLOCK -->
<tr>
  <td style="padding: 24px 32px; background-color: #111111;" class="mobile-pad">
    <table role="presentation" style="width: 100%; border: none; border-spacing: 0;">
      <!-- Auto -->
      <tr>
        <td style="padding: 0 0 8px 0; vertical-align: top;">
          <table role="presentation" style="width: 100%; border: none; border-spacing: 0; background-color: #1a1a1a; border-radius: 12px; border: 1px solid #222222;">
            <tr>
              <td style="width: 56px; padding: 16px 0 16px 16px; vertical-align: middle;">
                <table role="presentation" style="border: none; border-spacing: 0;"><tr>
                  <td style="width: 36px; height: 36px; background-color: rgba(34,197,94,0.1); border-radius: 10px; text-align: center; vertical-align: middle; border: 1px solid rgba(34,197,94,0.2);">
                    <span style="color: #22c55e; font-size: 18px; line-height: 36px;">&#128663;</span>
                  </td>
                </tr></table>
              </td>
              <td style="padding: 16px 16px 16px 12px; vertical-align: middle;">
                <p style="margin: 0 0 2px 0; font-size: 11px; color: #525252; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Auto</p>
                <p style="margin: 0; font-size: 15px; font-weight: 700; color: #ffffff;">{{car_name}}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- Periode -->
      <tr>
        <td style="padding: 0 0 8px 0; vertical-align: top;">
          <table role="presentation" style="width: 100%; border: none; border-spacing: 0; background-color: #1a1a1a; border-radius: 12px; border: 1px solid #222222;">
            <tr>
              <td style="width: 56px; padding: 16px 0 16px 16px; vertical-align: middle;">
                <table role="presentation" style="border: none; border-spacing: 0;"><tr>
                  <td style="width: 36px; height: 36px; background-color: rgba(34,197,94,0.1); border-radius: 10px; text-align: center; vertical-align: middle; border: 1px solid rgba(34,197,94,0.2);">
                    <span style="color: #22c55e; font-size: 18px; line-height: 36px;">&#128197;</span>
                  </td>
                </tr></table>
              </td>
              <td style="padding: 16px 16px 16px 12px; vertical-align: middle;">
                <p style="margin: 0 0 2px 0; font-size: 11px; color: #525252; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Vastzetperiode</p>
                <p style="margin: 0; font-size: 15px; font-weight: 700; color: #ffffff;">{{start_date}} t/m {{end_date}}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- Tarief -->
      <tr>
        <td style="padding: 0; vertical-align: top;">
          <table role="presentation" style="width: 100%; border: none; border-spacing: 0; background-color: #1a1a1a; border-radius: 12px; border: 1px solid #222222;">
            <tr>
              <td style="width: 56px; padding: 16px 0 16px 16px; vertical-align: middle;">
                <table role="presentation" style="border: none; border-spacing: 0;"><tr>
                  <td style="width: 36px; height: 36px; background-color: rgba(34,197,94,0.1); border-radius: 10px; text-align: center; vertical-align: middle; border: 1px solid rgba(34,197,94,0.2);">
                    <span style="color: #22c55e; font-size: 18px; line-height: 36px;">&#128176;</span>
                  </td>
                </tr></table>
              </td>
              <td style="padding: 16px 16px 16px 12px; vertical-align: middle;">
                <p style="margin: 0 0 2px 0; font-size: 11px; color: #525252; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Wekelijks tarief</p>
                <p style="margin: 0; font-size: 15px; font-weight: 700; color: #ffffff;">&euro;{{weekly_rate}} per week</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td>
</tr>
<!-- INFO BOX -->
<tr>
  <td style="padding: 0 32px 28px 32px; background-color: #111111;" class="mobile-pad">
    <table role="presentation" style="width: 100%; border: none; border-spacing: 0; border-radius: 10px; border: 1px solid rgba(34,197,94,0.2);" bgcolor="#0d2818">
      <tr>
        <td style="padding: 14px 16px; background-color: #0d2818; border-radius: 10px;">
          <p style="margin: 0; font-size: 13px; color: #4ade80; line-height: 1.5;">
            &#128203; Uw handtekening is ontvangen en uw contract is geactiveerd. U kunt uw contract bekijken via de Vlottr app.
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>
` + EMAIL_DIVIDER_LINE + EMAIL_FOOTER,
  },

  vastzetperiode_12_maanden: {
    id: 'vastzetperiode_12_maanden',
    label: 'Vastzetperiode 12 maanden (contract)',
    subject: 'Vlottr \u2014 Uw contract voor vastzetperiode 12 maanden',
    body_html: EMAIL_HEADER + EMAIL_LOGO_HEADER + `
<!-- TITLE -->
<tr>
  <td style="padding: 32px 32px 8px 32px; background-color: #111111;" class="mobile-pad">
    <p style="margin: 0 0 8px 0; font-size: 26px; font-weight: 800; color: #ffffff; line-height: 1.2; letter-spacing: -0.3px;">Vastzetperiode 12 maanden &#128203;</p>
    <p style="margin: 0; font-size: 15px; color: #a3a3a3; line-height: 1.6;">Hallo {{customer_name}},</p>
    <p style="margin: 8px 0 0 0; font-size: 15px; color: #a3a3a3; line-height: 1.6;">
      Bedankt voor het ondertekenen van uw contract. Hierbij bevestigen wij uw vastzetperiode van <strong style="color: #ffffff;">12 maanden</strong> voor uw <strong style="color: #ffffff;">{{car_name}}</strong>.
    </p>
  </td>
</tr>
` + EMAIL_DIVIDER_GREEN + `
<!-- DETAILS BLOCK -->
<tr>
  <td style="padding: 24px 32px; background-color: #111111;" class="mobile-pad">
    <table role="presentation" style="width: 100%; border: none; border-spacing: 0;">
      <!-- Auto -->
      <tr>
        <td style="padding: 0 0 8px 0; vertical-align: top;">
          <table role="presentation" style="width: 100%; border: none; border-spacing: 0; background-color: #1a1a1a; border-radius: 12px; border: 1px solid #222222;">
            <tr>
              <td style="width: 56px; padding: 16px 0 16px 16px; vertical-align: middle;">
                <table role="presentation" style="border: none; border-spacing: 0;"><tr>
                  <td style="width: 36px; height: 36px; background-color: rgba(34,197,94,0.1); border-radius: 10px; text-align: center; vertical-align: middle; border: 1px solid rgba(34,197,94,0.2);">
                    <span style="color: #22c55e; font-size: 18px; line-height: 36px;">&#128663;</span>
                  </td>
                </tr></table>
              </td>
              <td style="padding: 16px 16px 16px 12px; vertical-align: middle;">
                <p style="margin: 0 0 2px 0; font-size: 11px; color: #525252; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Auto</p>
                <p style="margin: 0; font-size: 15px; font-weight: 700; color: #ffffff;">{{car_name}}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- Periode -->
      <tr>
        <td style="padding: 0 0 8px 0; vertical-align: top;">
          <table role="presentation" style="width: 100%; border: none; border-spacing: 0; background-color: #1a1a1a; border-radius: 12px; border: 1px solid #222222;">
            <tr>
              <td style="width: 56px; padding: 16px 0 16px 16px; vertical-align: middle;">
                <table role="presentation" style="border: none; border-spacing: 0;"><tr>
                  <td style="width: 36px; height: 36px; background-color: rgba(34,197,94,0.1); border-radius: 10px; text-align: center; vertical-align: middle; border: 1px solid rgba(34,197,94,0.2);">
                    <span style="color: #22c55e; font-size: 18px; line-height: 36px;">&#128197;</span>
                  </td>
                </tr></table>
              </td>
              <td style="padding: 16px 16px 16px 12px; vertical-align: middle;">
                <p style="margin: 0 0 2px 0; font-size: 11px; color: #525252; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Vastzetperiode</p>
                <p style="margin: 0; font-size: 15px; font-weight: 700; color: #ffffff;">{{start_date}} t/m {{end_date}}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- Tarief -->
      <tr>
        <td style="padding: 0; vertical-align: top;">
          <table role="presentation" style="width: 100%; border: none; border-spacing: 0; background-color: #1a1a1a; border-radius: 12px; border: 1px solid #222222;">
            <tr>
              <td style="width: 56px; padding: 16px 0 16px 16px; vertical-align: middle;">
                <table role="presentation" style="border: none; border-spacing: 0;"><tr>
                  <td style="width: 36px; height: 36px; background-color: rgba(34,197,94,0.1); border-radius: 10px; text-align: center; vertical-align: middle; border: 1px solid rgba(34,197,94,0.2);">
                    <span style="color: #22c55e; font-size: 18px; line-height: 36px;">&#128176;</span>
                  </td>
                </tr></table>
              </td>
              <td style="padding: 16px 16px 16px 12px; vertical-align: middle;">
                <p style="margin: 0 0 2px 0; font-size: 11px; color: #525252; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Wekelijks tarief</p>
                <p style="margin: 0; font-size: 15px; font-weight: 700; color: #ffffff;">&euro;{{weekly_rate}} per week</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td>
</tr>
<!-- INFO BOX -->
<tr>
  <td style="padding: 0 32px 28px 32px; background-color: #111111;" class="mobile-pad">
    <table role="presentation" style="width: 100%; border: none; border-spacing: 0; border-radius: 10px; border: 1px solid rgba(34,197,94,0.2);" bgcolor="#0d2818">
      <tr>
        <td style="padding: 14px 16px; background-color: #0d2818; border-radius: 10px;">
          <p style="margin: 0; font-size: 13px; color: #4ade80; line-height: 1.5;">
            &#128203; Uw handtekening is ontvangen en uw contract is geactiveerd. U kunt uw contract bekijken via de Vlottr app.
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>
` + EMAIL_DIVIDER_LINE + EMAIL_FOOTER,
  },
};

interface EmailTemplatesStore {
  templates: Record<EmailTemplateId, EmailTemplate> | null;
  loading: boolean;
  error: string | null;
  loadTemplates: () => Promise<void>;
  saveTemplate: (id: EmailTemplateId, subject: string, body_html: string, updatedBy: string) => Promise<void>;
  getTemplate: (id: EmailTemplateId) => EmailTemplate | null;
}

export const useEmailTemplatesStore = create<EmailTemplatesStore>((set, get) => ({
  templates: null,
  loading: false,
  error: null,

  loadTemplates: async () => {
    set({ loading: true, error: null });
    try {
      const ids: EmailTemplateId[] = ['ophalen', 'ontvangen', 'borg', 'bezorgkosten', 'vastzetperiode_6_maanden', 'vastzetperiode_12_maanden'];
      const loaded: Record<string, EmailTemplate> = {};

      await Promise.all(
        ids.map(async (id) => {
          const ref = doc(db, 'email_templates', id);
          const snap = await getDoc(ref);
          const stored = snap.exists() ? (snap.data() as any) : null;

          // Auto-upgrade if stored template is an older version
          if (stored && (stored._version ?? 1) >= TEMPLATE_VERSION) {
            loaded[id] = stored as EmailTemplate;
          } else {
            const def = DEFAULT_TEMPLATES[id];
            const template = {
              ...def,
              // Preserve custom subject if the user has changed it from the original default
              subject: stored?.subject ?? def.subject,
              updated_at: new Date().toISOString(),
              updated_by: 'system',
              _version: TEMPLATE_VERSION,
            };
            await setDoc(ref, template);
            loaded[id] = template as EmailTemplate;
          }
        })
      );

      set({ templates: loaded as Record<EmailTemplateId, EmailTemplate> });
    } catch (err: any) {
      set({ error: err.message || 'Fout bij laden sjablonen' });
    } finally {
      set({ loading: false });
    }
  },

  saveTemplate: async (id, subject, body_html, updatedBy) => {
    const templates = get().templates;
    const existing = templates?.[id];
    const updated = {
      id,
      label: existing?.label ?? DEFAULT_TEMPLATES[id].label,
      subject,
      body_html,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy,
      _version: TEMPLATE_VERSION,
    };
    const ref = doc(db, 'email_templates', id);
    await setDoc(ref, updated);
    set({
      templates: {
        ...(templates ?? ({} as Record<EmailTemplateId, EmailTemplate>)),
        [id]: updated as EmailTemplate,
      },
    });
  },

  getTemplate: (id) => {
    return get().templates?.[id] ?? null;
  },
}));
