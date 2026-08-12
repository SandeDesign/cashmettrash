import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Contract } from '../types';

/**
 * Generate PDF from contract HTML
 */
export async function generateContractPDF(
  contract: Contract,
  elementId: string = 'contract-content'
): Promise<Blob> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Contract element not found');
    }

    // Create canvas from HTML
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed (only if significant content remains)
    while (heightLeft > pageHeight * 0.1) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    return pdf.output('blob');
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
}

/**
 * Generate contract HTML from template
 */
export function generateContractHTML(
  template: string,
  variables: Record<string, string>
): string {
  let html = template;

  // Replace all variables
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{${key}}`, 'g');

    // Special handling for signatures - render as image if URL exists
    if (key === 'customer_signature' || key === 'admin_signature') {
      const signatureUrl = variables[key];
      if (signatureUrl && signatureUrl.trim() !== '') {
        // Render signature as image (no crossorigin to avoid CORS issues)
        html = html.replace(regex, `<img src="${signatureUrl}" alt="Handtekening" style="max-width: 100%; max-height: 80px; object-fit: contain; display: block;" />`);
      } else {
        // Show placeholder if no signature
        const placeholderText = key === 'customer_signature'
          ? 'Nog niet ondertekend'
          : 'Namens Vlottr (Buddy BV)';
        const placeholderColor = key === 'customer_signature'
          ? 'rgba(255,255,255,0.3)'
          : 'rgba(0,0,0,0.4)';
        html = html.replace(regex, `<p style="margin: 0; color: ${placeholderColor}; font-size: 12px; font-style: italic;">${placeholderText}</p>`);
      }
    } else {
      // Normal text replacement
      html = html.replace(regex, variables[key]);
    }
  });

  return html;
}

/**
 * Convert image URL to base64 data URL
 */
async function imageUrlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to convert image to base64:', error);
    return ''; // Return empty string if conversion fails
  }
}

/**
 * Download contract as PDF - generates and downloads directly
 */
export async function downloadContractPDF(contract: Contract): Promise<void> {
  try {
    // Convert logo to base64 for embedding in PDF
    let logoBase64 = '';
    try {
      logoBase64 = await imageUrlToBase64('/512x512x2.png');
    } catch {
      console.warn('Could not load logo for PDF');
    }

    // Convert signature URLs to base64 if they exist
    let customerSignature = '';
    let adminSignature = '';

    if (contract.customer_signature_url) {
      console.log('Converting customer signature to base64...');
      customerSignature = await imageUrlToBase64(contract.customer_signature_url);
    }

    if (contract.admin_signature_url) {
      console.log('Converting admin signature to base64...');
      adminSignature = await imageUrlToBase64(contract.admin_signature_url);
    }

    // Create temporary container
    const container = document.createElement('div');
    container.id = 'temp-contract-pdf';
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '800px';
    document.body.appendChild(container);

    // Use signed_at date if contract is signed, otherwise use current date
    const contractDate = contract.signed_at
      ? new Date(contract.signed_at).toLocaleDateString('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' })
      : new Date().toLocaleDateString('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' });

    // Generate HTML with base64 signatures and logo
    const logoImg = logoBase64
      ? `<img src="${logoBase64}" alt="Vlottr Logo" style="width: 100px; height: 100px; object-fit: contain; border-radius: 20px;" />`
      : `<span style="font-size: 64px; font-weight: 900; color: #000000; line-height: 1;">V</span>`;
    const logoImgSmall = logoBase64
      ? `<img src="${logoBase64}" alt="Vlottr Logo" style="width: 50px; height: 50px; object-fit: contain; border-radius: 12px;" />`
      : `<span style="font-size: 32px; font-weight: 900; color: #000000; line-height: 1;">V</span>`;

    const html = generateContractHTML(DEFAULT_CONTRACT_TEMPLATE, {
      contract_id: contract.id.substring(0, 8),
      customer_name: contract.customer_name || '',
      customer_email: contract.customer_email || '',
      customer_phone: contract.customer_phone || '',
      customer_address: contract.customer_address || '',
      customer_birth_date: contract.customer_birth_date || '',
      customer_license_number: contract.customer_license_number || '',
      customer_license_category: contract.customer_license_category || 'B',
      customer_license_expiry: contract.customer_license_expiry || '',
      customer_license_issue_date: contract.customer_license_issue_date || '',
      incasso_dag: contract.incasso_dag || 'maandag',
      car_info: contract.car_info || '',
      license_plate: contract.license_plate || 'N/A',
      start_date: new Date(contract.start_date).toLocaleDateString('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' }),
      end_date: contract.end_date ? new Date(contract.end_date).toLocaleDateString('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Open contract',
      weeks_rented: String(contract.weeks_rented || 1),
      weekly_rate: String(contract.weekly_rate || 0),
      total_price: String(contract.total_price || 0),
      current_date: contractDate, // Use SIGNED_AT date, not download date!
      customer_signature: customerSignature, // Base64 data URL
      admin_signature: adminSignature, // Base64 data URL
      logo_img: logoImg,
      logo_img_small: logoImgSmall,
      inspectie_ophalen_datum: contract.inspectie?.ophalen?.datum || '',
      inspectie_ophalen_status: contract.inspectie?.ophalen?.status || 'Nog niet gedaan',
      inspectie_inleveren_datum: contract.inspectie?.inleveren?.datum || '',
      inspectie_inleveren_status: contract.inspectie?.inleveren?.status || 'Nog niet gedaan',
      km_ophalen: String(contract.km_ophalen ?? ''),
      km_inleveren: String(contract.km_inleveren ?? ''),
    });

    container.innerHTML = html;

    // Wait for render (images are now embedded as base64)
    await new Promise(resolve => setTimeout(resolve, 300));

    // Generate PDF
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: false, // Not needed anymore with base64
      allowTaint: false, // Not needed anymore
      logging: false,
      backgroundColor: '#000000'
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add black background to first page
    pdf.setFillColor(0, 0, 0);
    pdf.rect(0, 0, imgWidth, pageHeight, 'F');

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > pageHeight * 0.1) {
      position = heightLeft - imgHeight;
      pdf.addPage();

      // Add black background to each new page to prevent white bars
      pdf.setFillColor(0, 0, 0);
      pdf.rect(0, 0, imgWidth, pageHeight, 'F');

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Download
    pdf.save(`contract-${contract.id.substring(0, 8)}.pdf`);

    // Cleanup
    document.body.removeChild(container);
  } catch (error) {
    console.error('PDF download error:', error);
    throw error;
  }
}

/**
 * Download partner agreement as PDF
 */
export async function downloadPartnerAgreementPDF(contract: Contract): Promise<void> {
  try {
    let logoBase64 = '';
    try {
      logoBase64 = await imageUrlToBase64('/512x512x2.png');
    } catch {
      console.warn('Could not load logo for PDF');
    }

    let customerSignature = '';
    let adminSignature = '';

    if (contract.customer_signature_url) {
      customerSignature = await imageUrlToBase64(contract.customer_signature_url);
    }
    if (contract.admin_signature_url) {
      adminSignature = await imageUrlToBase64(contract.admin_signature_url);
    }

    const container = document.createElement('div');
    container.id = 'temp-partner-pdf';
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '800px';
    document.body.appendChild(container);

    const contractDate = contract.signed_at
      ? new Date(contract.signed_at).toLocaleDateString('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' })
      : new Date().toLocaleDateString('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' });

    const logoImg = logoBase64
      ? `<img src="${logoBase64}" alt="Vlottr Logo" style="width: 100px; height: 100px; object-fit: contain; border-radius: 20px;" />`
      : `<span style="font-size: 64px; font-weight: 900; color: #000000; line-height: 1;">V</span>`;

    // Use the contract_html directly if available (it was already generated with variables filled in)
    const html = contract.contract_html || generateContractHTML(DEALER_AGREEMENT_TEMPLATE, {
      contract_id: contract.id.substring(0, 8),
      company_name: contract.car_info || '',
      partner_name: contract.customer_name || '',
      partner_email: contract.customer_email || '',
      partner_phone: contract.customer_phone || '',
      partner_kvk: '',
      current_date: contractDate,
      customer_signature: customerSignature,
      admin_signature: adminSignature,
      logo_img: logoImg,
      logo_img_small: logoImg,
    });

    container.innerHTML = html;

    await new Promise(resolve => setTimeout(resolve, 300));

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: false,
      allowTaint: false,
      logging: false,
      backgroundColor: '#000000'
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.setFillColor(0, 0, 0);
    pdf.rect(0, 0, imgWidth, pageHeight, 'F');
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > pageHeight * 0.1) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.setFillColor(0, 0, 0);
      pdf.rect(0, 0, imgWidth, pageHeight, 'F');
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`partnerovereenkomst-${contract.id.substring(0, 8)}.pdf`);
    document.body.removeChild(container);
  } catch (error) {
    console.error('PDF download error:', error);
    throw error;
  }
}

/**
 * Default contract template - PREMIUM BLACK & GREEN DESIGN
 */
export const DEFAULT_CONTRACT_TEMPLATE = `
<div style="font-family: 'Outfit', Arial, sans-serif; width: 800px; background: #000000; color: #ffffff;">
  <!-- PAGE 1: Cover + Partijen -->
  <div style="min-height: 1131px; background: #000000; position: relative; overflow: hidden;">

    <!-- Dark Green Gradient Header -->
    <div style="background: linear-gradient(135deg, #1a4d2e 0%, #0f2818 100%); padding: 60px 50px; position: relative; overflow: hidden;">
      <!-- Decorative dots top left -->
      <div style="position: absolute; top: 20px; left: 50px; display: flex; gap: 6px;">
        <div style="width: 5px; height: 5px; border-radius: 50%; background: #22c55e;"></div>
        <div style="width: 5px; height: 5px; border-radius: 50%; background: #22c55e; opacity: 0.6;"></div>
        <div style="width: 5px; height: 5px; border-radius: 50%; background: #22c55e; opacity: 0.3;"></div>
      </div>

      <!-- Logo with Vlottr image -->
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 100px; height: 100px; margin: 0 auto; background: #22c55e; border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 15px 50px rgba(34, 197, 94, 0.4); overflow: hidden;">
          {logo_img}
        </div>
      </div>

      <!-- Title -->
      <h1 style="text-align: center; color: #ffffff; font-weight: 900; font-size: 38px; margin: 0 0 10px 0; letter-spacing: -1px;">HUURCONTRACT</h1>
      <p style="text-align: center; color: rgba(255,255,255,0.6); margin: 0; font-family: 'Space Mono', monospace; font-size: 13px; letter-spacing: 2px;">
        CONTRACT #{contract_id}
      </p>
    </div>

    <!-- Black Content with Giant Green Circles -->
    <div style="background: #000000; padding: 50px; position: relative; min-height: 580px;">
      <!-- Giant Decorative Green Circles -->
      <div style="position: absolute; right: -200px; top: 50%; transform: translateY(-50%); width: 500px; height: 500px; border-radius: 50%; border: 3px solid #22c55e; opacity: 0.15;"></div>
      <div style="position: absolute; right: -150px; top: 50%; transform: translateY(-50%); width: 400px; height: 400px; border-radius: 50%; border: 2px solid #22c55e; opacity: 0.1;"></div>

      <!-- Content Cards -->
      <div style="position: relative; z-index: 2;">
        <!-- Verhuurder -->
        <div style="margin-bottom: 40px;">
          <div style="display: flex; align-items: center; margin-bottom: 16px;">
            <div style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%; margin-right: 12px;"></div>
            <h2 style="color: #ffffff; font-weight: 800; font-size: 14px; margin: 0; text-transform: uppercase; letter-spacing: 2px;">Verhuurder</h2>
          </div>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 24px;">
            <p style="color: rgba(255,255,255,0.9); line-height: 1.8; margin: 0; font-size: 15px;">
              <strong style="color: #22c55e;">Vlottr</strong><br/>
              Handelend namens: <strong>Buddy BV</strong><br/>
              KVK: <strong>98132873</strong><br/>
              BTW: <strong>NL868369755B01</strong><br/>
              Adres: <strong>Oude Maastrichterweg 16, 6162 BD Geleen, Zuid-Limburg</strong><br/>
              E-mail: <strong>support@vlottr.eu</strong><br/>
              Telefoon: <strong>045 209 2101</strong>
            </p>
          </div>
        </div>

        <!-- Huurder -->
        <div style="margin-bottom: 40px;">
          <div style="display: flex; align-items: center; margin-bottom: 16px;">
            <div style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%; margin-right: 12px;"></div>
            <h2 style="color: #ffffff; font-weight: 800; font-size: 14px; margin: 0; text-transform: uppercase; letter-spacing: 2px;">Huurder</h2>
          </div>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 24px;">
            <p style="color: rgba(255,255,255,0.9); line-height: 1.8; margin: 0; font-size: 15px;">
              <strong style="color: #22c55e;">{customer_name}</strong><br/>
              Adres: <strong>{customer_address}</strong><br/>
              E-mail: {customer_email}<br/>
              Telefoon: {customer_phone}<br/>
              Geboortedatum: <strong>{customer_birth_date}</strong><br/>
              Rijbewijsnummer: <strong>{customer_license_number}</strong><br/>
              Rijbewijscategorie: <strong>{customer_license_category}</strong><br/>
              Rijbewijs geldig t/m: <strong>{customer_license_expiry}</strong>
            </p>
          </div>
        </div>

        <!-- Big Green Button -->
        <div style="margin-top: 50px; text-align: center;">
          <div style="display: inline-flex; align-items: center; gap: 12px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 18px; padding: 14px 50px; box-shadow: 0 8px 35px rgba(34, 197, 94, 0.3);">
            <div style="width: 35px; height: 35px; background: #000000; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center;">
              <span style="font-size: 24px; font-weight: 900; color: #22c55e; line-height: 1;">V</span>
            </div>
            <p style="margin: 0; color: #000000; font-weight: 800; font-size: 17px; letter-spacing: 1px;">CONTRACT DETAILS</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- PAGE 2: Voertuig + Contract details -->
  <div style="min-height: 1131px; background: #000000; padding: 50px; position: relative;">

    <!-- Voertuig -->
    <div style="margin-bottom: 40px;">
      <div style="display: flex; align-items: center; margin-bottom: 16px;">
        <div style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%; margin-right: 12px;"></div>
        <h2 style="color: #ffffff; font-weight: 800; font-size: 14px; margin: 0; text-transform: uppercase; letter-spacing: 2px;">Voertuig</h2>
      </div>
      <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 24px;">
        <p style="color: rgba(255,255,255,0.9); line-height: 1.8; margin: 0; font-size: 15px;">
          <strong style="color: #22c55e;">{car_info}</strong><br/>
          Kenteken: <span style="font-family: 'Space Mono', monospace; color: #22c55e;">{license_plate}</span>
        </p>
      </div>
    </div>

    <!-- Icon Sections -->
    <div style="margin-bottom: 40px;">
      <!-- Section 1 - Termijn -->
      <div style="margin-bottom: 50px;">
        <div style="display: flex; align-items: center; margin-bottom: 20px;">
          <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 16px;">
            <span style="font-size: 24px; line-height: 1; display: flex; align-items: center; justify-content: center;">📅</span>
          </div>
          <h2 style="color: #ffffff; font-weight: 800; font-size: 18px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Contractperiode</h2>
        </div>
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 28px; margin-left: 66px;">
          <p style="color: rgba(255,255,255,0.9); line-height: 1.8; margin: 0; font-size: 15px;">
            <strong style="color: #22c55e;">Type contract:</strong> Doorlopend huurcontract<br/>
            <strong style="color: #22c55e;">Startdatum:</strong> {start_date}<br/>
            <strong style="color: #22c55e;">Minimale duur:</strong> 4 weken<br/>
            <strong style="color: #22c55e;">Opzegging:</strong> Na 4 weken wekelijks opzegbaar
          </p>
        </div>
      </div>

      <!-- Section 2 - Kosten -->
      <div style="margin-bottom: 50px;">
        <div style="display: flex; align-items: center; margin-bottom: 20px;">
          <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 16px;">
            <span style="font-size: 24px; line-height: 1; display: flex; align-items: center; justify-content: center;">💰</span>
          </div>
          <h2 style="color: #ffffff; font-weight: 800; font-size: 18px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Kosten</h2>
        </div>
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 28px; margin-left: 66px;">
          <p style="color: rgba(255,255,255,0.9); line-height: 1.8; margin: 0; font-size: 15px;">
            <strong style="color: #22c55e;">Dagprijs excl. BTW:</strong> €12,40<br/>
            <strong style="color: #22c55e;">BTW (21%):</strong> €2,60<br/>
            <strong style="color: #22c55e;">Dagprijs incl. BTW:</strong> <strong>€15,00</strong><br/>
            <strong style="color: #22c55e;">Weekprijs incl. BTW:</strong> <strong>€105,00</strong><br/>
            <strong style="color: #22c55e;">Betaling:</strong> Wekelijks automatische incasso (elke {incasso_dag})<br/>
            <strong style="color: #22c55e;">Borg:</strong> <strong>€250,00</strong> (€0 bij 6 maanden vooruit plannen)<br/>
            <strong style="color: #22c55e;">Eigen risico schade:</strong> <strong>€1.000,00</strong> per schadegeval<br/>
            <strong style="color: #22c55e;">Eigen risico diefstal:</strong> <strong>€1.000,00</strong> per incident
          </p>
        </div>
      </div>

    </div>

  </div>

  <!-- PAGE 3: Staat van het voertuig + Handtekeningen -->
  <div style="min-height: 1131px; background: #000000; padding: 50px; position: relative;">

    <!-- Staat van het voertuig -->
    <div style="margin-bottom: 50px;">
      <div style="display: flex; align-items: center; margin-bottom: 20px;">
        <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 16px;">
          <span style="font-size: 24px; line-height: 1; display: flex; align-items: center; justify-content: center;">🚗</span>
        </div>
        <h2 style="color: #ffffff; font-weight: 800; font-size: 18px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Staat van het voertuig</h2>
      </div>
      <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 28px; margin-left: 66px;">
        <p style="color: rgba(255,255,255,0.9); line-height: 1.8; margin: 0; font-size: 15px;">
          De staat van het voertuig wordt vastgelegd via het digitale inspectieprotocol
          in de Vlottr-app. Bij ophalen én bij inleveren worden <strong>15 foto's</strong>
          (rondom het voertuig) gemaakt en gekoppeld aan dit contract.<br/><br/>
          <strong style="color: #22c55e;">Inspectie ophalen:</strong> <strong>{inspectie_ophalen_datum}</strong>
          &nbsp;— Status: <strong>{inspectie_ophalen_status}</strong><br/>
          <strong style="color: #22c55e;">Inspectie inleveren:</strong> <strong>{inspectie_inleveren_datum}</strong>
          &nbsp;— Status: <strong>{inspectie_inleveren_status}</strong><br/>
          <strong style="color: #22c55e;">Kilometerstand ophalen:</strong> <strong>{km_ophalen}</strong> km<br/>
          <strong style="color: #22c55e;">Kilometerstand inleveren:</strong> <strong>{km_inleveren}</strong> km<br/><br/>
          Het volledige fotodossier is beschikbaar via de Vlottr-app
          onder Contract <strong>{contract_id}</strong> en geldt als integraal onderdeel
          van deze overeenkomst.
        </p>
      </div>
    </div>

    <!-- Handtekeningen -->
    <div style="display: flex; gap: 35px; justify-content: space-between; padding: 0 30px;">
      <!-- Handtekening Huurder -->
      <div style="flex: 1; max-width: 340px;">
        <div style="background: #000000; border: 2px solid #22c55e; border-radius: 20px; padding: 28px; box-shadow: 0 15px 50px rgba(34, 197, 94, 0.2);">
          <p style="margin: 0 0 18px 0; color: #22c55e; font-weight: 800; font-size: 15px; letter-spacing: 1px; text-transform: uppercase;">
            ✓ Handtekening Huurder
          </p>
          <div style="border-bottom: 3px solid #22c55e; padding-bottom: 8px; margin-bottom: 14px; min-height: 100px; display: flex; align-items: center; justify-content: center; background: #000000;">
            {customer_signature}
          </div>
          <p style="margin: 8px 0 0 0; color: rgba(34,197,94,0.7); font-size: 13px;">
            <strong style="color: #22c55e;">Naam:</strong> {customer_name}
          </p>
          <p style="margin: 6px 0 0 0; color: rgba(34,197,94,0.7); font-size: 13px;">
            <strong style="color: #22c55e;">Datum:</strong> {current_date}
          </p>
        </div>
      </div>

      <!-- Handtekening Verhuurder -->
      <div style="flex: 1; max-width: 340px;">
        <div style="background: #000000; border: 2px solid #22c55e; border-radius: 20px; padding: 28px; box-shadow: 0 15px 50px rgba(34, 197, 94, 0.2);">
          <p style="margin: 0 0 18px 0; color: #22c55e; font-weight: 800; font-size: 15px; letter-spacing: 1px; text-transform: uppercase;">
            ✓ Handtekening Verhuurder
          </p>
          <div style="border-bottom: 3px solid #22c55e; padding-bottom: 8px; margin-bottom: 14px; min-height: 100px; display: flex; align-items: center; justify-content: center; background: #000000;">
            {admin_signature}
          </div>
          <p style="margin: 8px 0 0 0; color: rgba(34,197,94,0.7); font-size: 13px;">
            <strong style="color: #22c55e;">Namens:</strong> Vlottr handelend namens Buddy BV
          </p>
          <p style="margin: 6px 0 0 0; color: rgba(34,197,94,0.7); font-size: 13px;">
            <strong style="color: #22c55e;">Datum:</strong> {current_date}
          </p>
        </div>
      </div>
    </div>

    <!-- Footer Branding -->
    <div style="margin-top: 50px; padding: 0 50px 30px 50px; text-align: center;">
      <p style="margin: 0; color: #22c55e; font-weight: 900; font-size: 30px; letter-spacing: -1px;">VLOTTR</p>
      <p style="margin: 4px 0 0 0; color: rgba(255,255,255,0.4); font-size: 11px; font-family: 'Space Mono', monospace; letter-spacing: 2px;">AUTO VERHUUR • BUDDY BV • ZUID-LIMBURG</p>
    </div>
  </div>

  <!-- PAGE 4: Algemene Voorwaarden deel 1 (Contractduur, Betaling, Gebruik) -->
  <div style="min-height: 1131px; background: #000000; padding: 50px; position: relative;">
    <div style="margin-bottom: 40px; text-align: center;">
      <div style="display: inline-flex; align-items: center; justify-content: center; width: 60px; height: 60px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 50%; margin-bottom: 20px;">
        <span style="font-size: 28px; line-height: 1; display: flex; align-items: center; justify-content: center;">📋</span>
      </div>
      <h2 style="color: #ffffff; font-weight: 900; font-size: 32px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Algemene Voorwaarden</h2>
      <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.5); font-size: 14px;">Vlottr handelend namens Buddy BV</p>
    </div>

    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; padding: 32px;">
      <p style="color: rgba(255,255,255,0.8); line-height: 1.7; margin: 0; font-size: 13px;">
        <strong style="color: #22c55e; font-size: 15px;">Contractduur &amp; Opzegging</strong><br/>
        • Doorlopend contract met minimale duur van 4 weken<br/>
        • Na 4 weken wekelijks opzegbaar met minimaal 1 week opzegtermijn<br/>
        • Opzegging schriftelijk (e-mail of via platform) kenbaar maken<br/><br/>

        <strong style="color: #22c55e; font-size: 15px;">Betaling &amp; Kosten</strong><br/>
        • Weekprijs: €{weekly_rate} (incl. BTW) — dagprijs €15,00 incl. BTW (€12,40 excl. + €2,60 BTW 21%)<br/>
        • Eerste week vooruit betalen bij ophalen voertuig<br/>
        • Daarna wekelijkse automatische incasso (SEPA Core-machtiging)<br/>
        • Huurder ontvangt minimaal 3 werkdagen vóór afschrijving een betalingsmelding per e-mail<br/>
        • Huurder heeft het recht een incasso-opdracht zonder opgaaf van reden te storneren binnen <strong>8 weken</strong> na de afschrijvingsdatum via de eigen bank<br/>
        • Bij een ongeldige machtiging bedraagt het storneerrecht <strong>13 maanden</strong><br/>
        • Borg: €250 (of €0 bij 6 maanden vooruit plannen)<br/>
        • Geen boekingskosten, servicekosten of verborgen kosten<br/><br/>
        <strong style="color: #22c55e;">Inbegrepen in de huurprijs:</strong><br/>
        • WA-verzekering (wettelijk verplicht, Wet Aansprakelijkheidsverzekering Motorrijtuigen)<br/>
        • Wegenbelasting<br/>
        • Pechhulp (24/7 binnen Nederland)<br/>
        • APK-keuring gedurende looptijd contract<br/><br/>
        <strong style="color: #22c55e;">Eigen risico:</strong> €1.000 per schadegeval en €1.000 bij diefstal.
        Schade boven het eigen risico valt onder de verzekering van verhuurder.<br/>
        <strong style="color: #22c55e;">Niet inbegrepen:</strong> verkeersboetes, parkeerkosten,
        schade door opzet of grove nalatigheid boven het eigen risico.<br/><br/>

        <strong style="color: #22c55e; font-size: 15px;">Gebruik &amp; Onderhoud</strong><br/>
        • Geldig Nederlands rijbewijs verplicht, minimaal 3 jaar in bezit (verzekeringseis) • Voertuig netjes en in goede staat houden<br/>
        • Geen commercieel gebruik zonder toestemming • Schade direct melden<br/>
        • Huurder verantwoordelijk voor verkeersovertredingen en boetes<br/>
        • Voertuig retourneren in dezelfde staat als ontvangen
      </p>
    </div>
  </div>

  <!-- PAGE 5: Algemene Voorwaarden deel 2 (Aansprakelijkheid, Gebreken, Herroepingsrecht, Klachten) -->
  <div style="min-height: 1131px; background: #000000; padding: 50px; position: relative;">
    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; padding: 32px;">
      <p style="color: rgba(255,255,255,0.8); line-height: 1.7; margin: 0; font-size: 13px;">
        <strong style="color: #22c55e; font-size: 15px;">Aansprakelijkheid</strong><br/>
        • Schade door schuld of nalatigheid van huurder wordt verhaald tot maximaal <strong>€1.000,00 eigen risico</strong> per schadegeval<br/>
        • Schade boven het eigen risico valt onder de verzekering van verhuurder, tenzij sprake is van opzet of grove nalatigheid<br/>
        • Huurder is aansprakelijk voor diefstal van het voertuig bij grove nalatigheid (bijv. sleutels in het voertuig laten) tot maximaal <strong>€1.000,00</strong><br/>
        • Huurder is verantwoordelijk voor alle verkeersboetes en parkeerkosten die tijdens de huurperiode worden opgelegd<br/>
        • Verhuurder is niet aansprakelijk voor schade aan eigendommen van huurder in of aan het voertuig<br/>
        • De staat van het voertuig bij ophalen wordt vastgelegd via het digitale inspectieprotocol (15 foto's). Eventuele nieuwe schade bij inlevering wordt vergeleken met de opname bij ophalen<br/><br/>

        <strong style="color: #22c55e; font-size: 15px;">Gebreken &amp; Reparaties (art. 7:206–7:209 BW)</strong><br/>
        • Verhuurder levert het voertuig in goede staat af, vrij van gebreken die normaal gebruik belemmeren (art. 7:203 BW)<br/>
        • Huurder meldt gebreken zo spoedig mogelijk via de Vlottr-app of per e-mail aan support@vlottr.eu<br/>
        • Verhuurder herstelt gebreken die niet aan huurder zijn toe te rekenen (art. 7:206 BW)<br/>
        • Bij ernstige gebreken heeft huurder recht op evenredige huurprijsvermindering (art. 7:207 BW)<br/>
        • Huurder heeft het recht zelf gemaakte noodzakelijke herstelkosten te verrekenen met de huurprijs na voorafgaande schriftelijke toestemming van verhuurder (art. 7:206 lid 3 BW — hiervan kan niet worden afgeweken)<br/><br/>

        <strong style="color: #22c55e; font-size: 15px;">Herroepingsrecht (art. 6:230p sub e BW)</strong><br/>
        Op deze overeenkomst is <strong>geen herroepingsrecht</strong> van toepassing. Het betreft een huurovereenkomst waarbij een specifieke startdatum is overeengekomen (art. 6:230p sub e Burgerlijk Wetboek). Door ondertekening bevestigt huurder hiervan kennis te hebben genomen.<br/><br/>

        <strong style="color: #22c55e; font-size: 15px;">Klachten &amp; Geschillen (art. 6:230m sub t BW)</strong><br/>
        • Klachten kunnen worden ingediend via support@vlottr.eu of schriftelijk aan het vestigingsadres van Buddy BV: Oude Maastrichterweg 16, 6162 BD Geleen<br/>
        • Verhuurder streeft naar beantwoording binnen 5 werkdagen<br/>
        • Indien een klacht niet naar tevredenheid wordt opgelost, kan huurder een geschil voorleggen aan de <strong>Geschillencommissie Voertuigverhuur</strong> (www.degeschillencommissie.nl) of de bevoegde rechter in het arrondissement Limburg<br/>
        • Op deze overeenkomst is <strong>Nederlands recht</strong> van toepassing
      </p>
    </div>
  </div>

  <!-- PAGE 6: Algemene Voorwaarden deel 3 (Privacy, Disclaimer) + Footer -->
  <div style="background: #000000; padding: 50px; position: relative;">
    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; padding: 32px;">
      <p style="color: rgba(255,255,255,0.8); line-height: 1.7; margin: 0; font-size: 13px;">
        <strong style="color: #22c55e; font-size: 15px;">Privacy (AVG)</strong><br/>
        Buddy BV is verwerkingsverantwoordelijke voor uw persoonsgegevens. Verwerkte gegevens: naam, adres, e-mail, telefoon, rijbewijsgegevens, geboortedatum. Doeleinden: uitvoering huurovereenkomst, facturatie, identiteits- en rijbewijscontrole. Rechtsgrond: uitvoering overeenkomst (art. 6 lid 1 sub b AVG). Bewaartermijn: 7 jaar (fiscale bewaarplicht). Huurder heeft recht op inzage, rectificatie en verwijdering van gegevens. Klachten kunnen worden ingediend bij de Autoriteit Persoonsgegevens (www.autoriteitpersoonsgegevens.nl). Volledige privacyverklaring: <strong>vlottr.eu/privacy</strong>.<br/><br/>

        <strong style="color: #22c55e; font-size: 15px;">Disclaimer</strong><br/>
        Door ondertekening verklaart huurder akkoord te gaan met deze voorwaarden, te beschikken over een geldig rijbewijs voor categorie B, en het voertuig uitsluitend zelf te besturen tenzij schriftelijk anders overeengekomen.<br/><br/>
        <strong>Buddy BV</strong> behoudt zich het recht voor de overeenkomst te ontbinden bij aantoonbare wanbetaling, na schriftelijke ingebrekestelling met een hersteltermijn van 14 dagen, of bij ernstig misbruik van het voertuig.<br/><br/>
        <strong>Huurder</strong> heeft het recht de overeenkomst te ontbinden indien verhuurder toerekenbaar tekortkomt en de tekortkoming na schriftelijke ingebrekestelling niet binnen 14 dagen herstelt (art. 6:265 BW).
      </p>
    </div>

    <!-- Footer with Logo -->
    <div style="margin-top: 60px; padding: 30px 50px; text-align: center; background: linear-gradient(180deg, transparent 0%, rgba(34, 197, 94, 0.05) 100%); border-top: 1px solid rgba(34, 197, 94, 0.1);">
      <div style="margin-bottom: 16px;">
        <div style="width: 50px; height: 50px; margin: 0 auto; background: #22c55e; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 8px 30px rgba(34, 197, 94, 0.3); overflow: hidden;">
          {logo_img_small}
        </div>
      </div>
      <p style="margin: 12px 0 0 0; color: #22c55e; font-weight: 900; font-size: 24px; letter-spacing: -0.5px;">VLOTTR</p>
      <p style="margin: 4px 0 12px 0; color: rgba(255,255,255,0.4); font-size: 11px; font-family: 'Space Mono', monospace; letter-spacing: 2px;">AUTO VERHUUR • BUDDY BV • ZUID-LIMBURG</p>
      <p style="margin: 16px 0 0 0; color: rgba(255,255,255,0.3); font-size: 10px; font-family: 'Space Mono', monospace; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px;">
        Contract ID: {contract_id} • Gegenereerd op {current_date}
      </p>
    </div>
  </div>
</div>
`;

/**
 * Extension contract template - FOR 6-MONTH EXTENSIONS WITH 1 MONTH DISCOUNT
 */
/**
 * Partner agreement template - PARTNEROVEREENKOMST
 */
export const PARTNER_AGREEMENT_TEMPLATE = `
<div style="font-family: 'Outfit', Arial, sans-serif; width: 800px; background: #000000; color: #ffffff;">
  <!-- PAGE 1 -->
  <div style="min-height: 1050px; background: #000000; position: relative; overflow: hidden;">

    <!-- Dark Green Gradient Header -->
    <div style="background: linear-gradient(135deg, #1a4d2e 0%, #0f2818 100%); padding: 60px 50px; position: relative; overflow: hidden;">
      <div style="position: absolute; top: 20px; left: 50px; display: flex; gap: 6px;">
        <div style="width: 5px; height: 5px; border-radius: 50%; background: #22c55e;"></div>
        <div style="width: 5px; height: 5px; border-radius: 50%; background: #22c55e; opacity: 0.6;"></div>
        <div style="width: 5px; height: 5px; border-radius: 50%; background: #22c55e; opacity: 0.3;"></div>
      </div>

      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 100px; height: 100px; margin: 0 auto; background: #22c55e; border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 15px 50px rgba(34, 197, 94, 0.4); overflow: hidden;">
          {logo_img}
        </div>
      </div>

      <h1 style="text-align: center; color: #ffffff; font-weight: 900; font-size: 38px; margin: 0 0 10px 0; letter-spacing: -1px;">PARTNEROVEREENKOMST</h1>
      <p style="text-align: center; color: rgba(255,255,255,0.6); margin: 0; font-family: 'Space Mono', monospace; font-size: 13px; letter-spacing: 2px;">
        CONTRACT #{contract_id}
      </p>
    </div>

    <!-- Content -->
    <div style="background: #000000; padding: 50px; position: relative; min-height: 580px;">
      <div style="position: absolute; right: -200px; top: 50%; transform: translateY(-50%); width: 500px; height: 500px; border-radius: 50%; border: 3px solid #22c55e; opacity: 0.15;"></div>

      <div style="position: relative; z-index: 2;">
        <!-- Vlottr -->
        <div style="margin-bottom: 40px;">
          <div style="display: flex; align-items: center; margin-bottom: 16px;">
            <div style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%; margin-right: 12px;"></div>
            <h2 style="color: #ffffff; font-weight: 800; font-size: 14px; margin: 0; text-transform: uppercase; letter-spacing: 2px;">Platform</h2>
          </div>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 24px;">
            <p style="color: rgba(255,255,255,0.9); line-height: 1.8; margin: 0; font-size: 15px;">
              <strong style="color: #22c55e;">Vlottr</strong><br/>
              Handelend namens: Buddy BV<br/>
              Regio: Zuid-Limburg
            </p>
          </div>
        </div>

        <!-- Partner -->
        <div style="margin-bottom: 40px;">
          <div style="display: flex; align-items: center; margin-bottom: 16px;">
            <div style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%; margin-right: 12px;"></div>
            <h2 style="color: #ffffff; font-weight: 800; font-size: 14px; margin: 0; text-transform: uppercase; letter-spacing: 2px;">Partner</h2>
          </div>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 24px;">
            <p style="color: rgba(255,255,255,0.9); line-height: 1.8; margin: 0; font-size: 15px;">
              <strong style="color: #22c55e;">{company_name}</strong><br/>
              Contactpersoon: {partner_name}<br/>
              Email: {partner_email}<br/>
              Telefoon: {partner_phone}<br/>
              KVK: {partner_kvk}
            </p>
          </div>
        </div>

        <!-- Big Green Button -->
        <div style="margin-top: 50px; text-align: center;">
          <div style="display: inline-flex; align-items: center; gap: 12px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 18px; padding: 14px 50px; box-shadow: 0 8px 35px rgba(34, 197, 94, 0.3);">
            <div style="width: 35px; height: 35px; background: #000000; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center;">
              <span style="font-size: 24px; font-weight: 900; color: #22c55e; line-height: 1;">V</span>
            </div>
            <p style="margin: 0; color: #000000; font-weight: 800; font-size: 17px; letter-spacing: 1px;">SPELREGELS & VOORWAARDEN</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- PAGE 2 - SPELREGELS -->
  <div style="min-height: 1050px; background: #000000; padding: 50px; position: relative;">
    <div style="margin-bottom: 40px; text-align: center;">
      <div style="display: inline-flex; align-items: center; justify-content: center; width: 60px; height: 60px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 50%; margin-bottom: 20px;">
        <span style="font-size: 28px; line-height: 1; display: flex; align-items: center; justify-content: center;">📋</span>
      </div>
      <h2 style="color: #ffffff; font-weight: 900; font-size: 32px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Spelregels voor Partners</h2>
      <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.5); font-size: 14px;">Vlottr handelend namens Buddy BV</p>
    </div>

    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; padding: 32px;">
      <p style="color: rgba(255,255,255,0.8); line-height: 1.7; margin: 0; font-size: 13px;">
        <strong style="color: #22c55e; font-size: 15px;">1. Auto's Aanmelden</strong><br/>
        • U kunt auto's aanmelden via het partnerdashboard<br/>
        • Elke auto wordt eerst beoordeeld en goedgekeurd door Vlottr<br/>
        • Auto's moeten in goede technische staat verkeren en APK-goedgekeurd zijn<br/>
        • Foto's en volledige voertuiggegevens zijn verplicht bij aanmelding<br/><br/>

        <strong style="color: #22c55e; font-size: 15px;">2. Kwaliteitseisen</strong><br/>
        • Voertuigen moeten schoon en representatief worden aangeleverd<br/>
        • Onderhoud en reparaties zijn de verantwoordelijkheid van de partner<br/>
        • Vlottr behoudt het recht auto's te weigeren of uit het aanbod te halen<br/>
        • Bij klachten van huurders wordt de partner hierover geïnformeerd<br/><br/>

        <strong style="color: #22c55e; font-size: 15px;">3. Financiële Afspraken</strong><br/>
        • Vlottr hanteert een commissiemodel per verhuurde week<br/>
        • Uitbetalingen vinden wekelijks plaats naar het opgegeven rekeningnummer<br/>
        • De exacte commissiepercentages worden per auto afgesproken<br/>
        • Facturatie verloopt via het Vlottr platform<br/><br/>

        <strong style="color: #22c55e; font-size: 15px;">4. Verantwoordelijkheden Partner</strong><br/>
        • De partner garandeert eigenaar of gemachtigd beheerder van de voertuigen te zijn<br/>
        • Verzekering en wegenbelasting dienen op naam van de partner te staan<br/>
        • De partner is verantwoordelijk voor tijdige APK-keuring<br/>
        • Wijzigingen in beschikbaarheid moeten tijdig worden doorgegeven<br/><br/>

        <strong style="color: #22c55e; font-size: 15px;">5. Beëindiging</strong><br/>
        • Beide partijen kunnen de samenwerking beëindigen met 2 weken opzegtermijn<br/>
        • Lopende verhuringen worden altijd afgemaakt<br/>
        • Bij ernstige overtredingen kan Vlottr de samenwerking per direct beëindigen<br/><br/>

        <strong style="color: #22c55e; font-size: 15px;">Disclaimer</strong><br/>
        Door ondertekening verklaart de partner akkoord te gaan met bovenstaande spelregels en bevestigt bevoegd te zijn om namens het bedrijf te tekenen. Buddy BV behoudt zich het recht voor om deze voorwaarden aan te passen, waarvan de partner tijdig op de hoogte wordt gesteld.
      </p>
    </div>

    <!-- Handtekeningen Section -->
    <div style="margin-top: 50px; display: flex; gap: 35px; justify-content: space-between; padding: 0 50px;">
      <!-- Handtekening Partner -->
      <div style="flex: 1; max-width: 340px;">
        <div style="background: #000000; border: 2px solid #22c55e; border-radius: 20px; padding: 28px; box-shadow: 0 15px 50px rgba(34, 197, 94, 0.2);">
          <p style="margin: 0 0 18px 0; color: #22c55e; font-weight: 800; font-size: 15px; letter-spacing: 1px; text-transform: uppercase;">
            Handtekening Partner
          </p>
          <div style="border-bottom: 3px solid #22c55e; padding-bottom: 8px; margin-bottom: 14px; min-height: 100px; display: flex; align-items: center; justify-content: center; background: #000000;">
            {customer_signature}
          </div>
          <p style="margin: 8px 0 0 0; color: rgba(34,197,94,0.7); font-size: 13px;">
            <strong style="color: #22c55e;">Namens:</strong> {company_name}
          </p>
          <p style="margin: 6px 0 0 0; color: rgba(34,197,94,0.7); font-size: 13px;">
            <strong style="color: #22c55e;">Datum:</strong> {current_date}
          </p>
        </div>
      </div>

      <!-- Handtekening Vlottr -->
      <div style="flex: 1; max-width: 340px;">
        <div style="background: #000000; border: 2px solid #22c55e; border-radius: 20px; padding: 28px; box-shadow: 0 15px 50px rgba(34, 197, 94, 0.2);">
          <p style="margin: 0 0 18px 0; color: #22c55e; font-weight: 800; font-size: 15px; letter-spacing: 1px; text-transform: uppercase;">
            Handtekening Vlottr
          </p>
          <div style="border-bottom: 3px solid #22c55e; padding-bottom: 8px; margin-bottom: 14px; min-height: 100px; display: flex; align-items: center; justify-content: center; background: #000000;">
            {admin_signature}
          </div>
          <p style="margin: 8px 0 0 0; color: rgba(34,197,94,0.7); font-size: 13px;">
            <strong style="color: #22c55e;">Namens:</strong> Vlottr handelend namens Buddy BV
          </p>
          <p style="margin: 6px 0 0 0; color: rgba(34,197,94,0.7); font-size: 13px;">
            <strong style="color: #22c55e;">Datum:</strong> {current_date}
          </p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="margin-top: 50px; padding: 30px 50px; text-align: center; background: linear-gradient(180deg, transparent 0%, rgba(34, 197, 94, 0.05) 100%); border-top: 1px solid rgba(34, 197, 94, 0.1);">
      <p style="margin: 12px 0 0 0; color: #22c55e; font-weight: 900; font-size: 24px; letter-spacing: -0.5px;">VLOTTR</p>
      <p style="margin: 4px 0 12px 0; color: rgba(255,255,255,0.4); font-size: 11px; font-family: 'Space Mono', monospace; letter-spacing: 2px;">PARTNER PROGRAMMA • BUDDY BV • ZUID-LIMBURG</p>
      <p style="margin: 16px 0 0 0; color: rgba(255,255,255,0.3); font-size: 10px; font-family: 'Space Mono', monospace; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px;">
        Partnerovereenkomst ID: {contract_id} • Ondertekend op {current_date}
      </p>
    </div>
  </div>
</div>
`;

/**
 * Dealer agreement template - DEALER OVEREENKOMST (autohandel)
 */
export const DEALER_AGREEMENT_TEMPLATE = `
<div style="font-family: 'Outfit', Arial, sans-serif; width: 800px; background: #000000; color: #ffffff;">
  <div style="min-height: 1050px; background: #000000; position: relative; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #1a4d2e 0%, #0f2818 100%); padding: 60px 50px; position: relative; overflow: hidden;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 100px; height: 100px; margin: 0 auto; background: #22c55e; border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 15px 50px rgba(34, 197, 94, 0.4); overflow: hidden;">
          {logo_img}
        </div>
      </div>
      <h1 style="text-align: center; color: #ffffff; font-weight: 900; font-size: 38px; margin: 0 0 10px 0; letter-spacing: -1px;">DEALER OVEREENKOMST</h1>
      <p style="text-align: center; color: rgba(255,255,255,0.6); margin: 0; font-family: 'Space Mono', monospace; font-size: 13px; letter-spacing: 2px;">PARTNEROVEREENKOMST AUTOHANDEL #{contract_id}</p>
    </div>
    <div style="background: #000000; padding: 50px; position: relative; min-height: 580px;">
      <div style="position: relative; z-index: 2;">
        <div style="margin-bottom: 40px;">
          <div style="display: flex; align-items: center; margin-bottom: 16px;">
            <div style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%; margin-right: 12px;"></div>
            <h2 style="color: #ffffff; font-weight: 800; font-size: 14px; margin: 0; text-transform: uppercase; letter-spacing: 2px;">Platform</h2>
          </div>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 24px;">
            <p style="color: rgba(255,255,255,0.9); line-height: 1.8; margin: 0; font-size: 15px;">
              <strong style="color: #22c55e;">Vlottr</strong><br/>Handelend namens: Buddy BV<br/>Regio: Zuid-Limburg
            </p>
          </div>
        </div>
        <div style="margin-bottom: 40px;">
          <div style="display: flex; align-items: center; margin-bottom: 16px;">
            <div style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%; margin-right: 12px;"></div>
            <h2 style="color: #ffffff; font-weight: 800; font-size: 14px; margin: 0; text-transform: uppercase; letter-spacing: 2px;">Partner (Dealer)</h2>
          </div>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 24px;">
            <p style="color: rgba(255,255,255,0.9); line-height: 1.8; margin: 0; font-size: 15px;">
              <strong style="color: #22c55e;">{company_name}</strong><br/>Contactpersoon: {partner_name}<br/>Email: {partner_email}<br/>Telefoon: {partner_phone}<br/>KVK: {partner_kvk}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div style="min-height: 1050px; background: #000000; padding: 50px; position: relative;">
    <div style="margin-bottom: 30px; text-align: center;">
      <h2 style="color: #ffffff; font-weight: 900; font-size: 28px; margin: 0;">Voorwaarden Dealer Samenwerking</h2>
      <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.5); font-size: 14px;">Vlottr handelend namens Buddy BV</p>
    </div>
    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; padding: 32px;">
      <p style="color: rgba(255,255,255,0.8); line-height: 1.7; margin: 0; font-size: 13px;">
        <strong style="color: #22c55e; font-size: 15px;">1. Samenwerking</strong><br/>
        Partner meldt auto's aan bij Vlottr voor de verhuurvloot. Vlottr beoordeelt en bepaalt of het voertuig geschikt is voor verhuur.<br/><br/>
        <strong style="color: #22c55e; font-size: 15px;">2. Inkoop &amp; Verkoopprijs</strong><br/>
        Vlottr stelt per voertuig een verkoopprijs vast na beoordeling. De partner gaat akkoord dat de auto door Vlottr wordt ingekocht tegen de vastgestelde verkoopprijs.<br/><br/>
        <strong style="color: #22c55e; font-size: 15px;">3. Aflossing in Termijnen</strong><br/>
        De verkoopprijs wordt afgelost via een percentage van de maandelijkse verhuurinkomsten. Het aflossingspercentage wordt per auto door Vlottr vastgesteld. Bij volledige verhuur is de verwachte aflosperiode 8 tot 9 maanden. Na volledige aflossing gaat het eigendom over naar Vlottr.<br/><br/>
        <strong style="color: #22c55e; font-size: 15px;">4. Voorwaarden Voertuig</strong><br/>
        De verkoper garandeert dat het voertuig geen op voorhand bekende gebreken vertoont. Het voertuig dient APK-goedgekeurd te zijn en in goede technische staat te verkeren. Bij gebreken die niet zijn gemeld, behoudt Vlottr het recht de overeenkomst te ontbinden.<br/><br/>
        <strong style="color: #22c55e; font-size: 15px;">5. Kwaliteitseisen</strong><br/>
        Voertuigen moeten schoon en representatief worden aangeleverd. Vlottr behoudt het recht auto's te weigeren of uit het aanbod te halen.<br/><br/>
        <strong style="color: #22c55e; font-size: 15px;">6. Verantwoordelijkheden</strong><br/>
        Partner garandeert eigenaar of gemachtigd beheerder te zijn van de aangeboden voertuigen. Verzekering en wegenbelasting staan op naam van partner tot eigendomsoverdracht.<br/><br/>
        <strong style="color: #22c55e; font-size: 15px;">7. Be&euml;indiging</strong><br/>
        Beide partijen kunnen de samenwerking be&euml;indigen met 2 weken opzegtermijn. Lopende aflossingen worden altijd afgemaakt. Bij ernstige overtredingen kan Vlottr de samenwerking per direct be&euml;indigen.<br/><br/>
        <strong style="color: #22c55e;">Disclaimer</strong><br/>
        Door ondertekening verklaart de partner akkoord te gaan met bovenstaande voorwaarden en bevestigt bevoegd te zijn om namens het bedrijf te tekenen.
      </p>
    </div>
    <div style="margin-top: 50px; display: flex; gap: 35px; justify-content: space-between; padding: 0 50px;">
      <div style="flex: 1; max-width: 340px;">
        <div style="background: #000000; border: 2px solid #22c55e; border-radius: 20px; padding: 28px;">
          <p style="margin: 0 0 18px 0; color: #22c55e; font-weight: 800; font-size: 15px; letter-spacing: 1px; text-transform: uppercase;">Handtekening Partner</p>
          <div style="border-bottom: 3px solid #22c55e; padding-bottom: 8px; margin-bottom: 14px; min-height: 100px; display: flex; align-items: center; justify-content: center; background: #000000;">{customer_signature}</div>
          <p style="margin: 8px 0 0 0; color: rgba(34,197,94,0.7); font-size: 13px;"><strong style="color: #22c55e;">Namens:</strong> {company_name}</p>
          <p style="margin: 6px 0 0 0; color: rgba(34,197,94,0.7); font-size: 13px;"><strong style="color: #22c55e;">Datum:</strong> {current_date}</p>
        </div>
      </div>
      <div style="flex: 1; max-width: 340px;">
        <div style="background: #000000; border: 2px solid #22c55e; border-radius: 20px; padding: 28px;">
          <p style="margin: 0 0 18px 0; color: #22c55e; font-weight: 800; font-size: 15px; letter-spacing: 1px; text-transform: uppercase;">Handtekening Vlottr</p>
          <div style="border-bottom: 3px solid #22c55e; padding-bottom: 8px; margin-bottom: 14px; min-height: 100px; display: flex; align-items: center; justify-content: center; background: #000000;">{admin_signature}</div>
          <p style="margin: 8px 0 0 0; color: rgba(34,197,94,0.7); font-size: 13px;"><strong style="color: #22c55e;">Namens:</strong> Vlottr handelend namens Buddy BV</p>
          <p style="margin: 6px 0 0 0; color: rgba(34,197,94,0.7); font-size: 13px;"><strong style="color: #22c55e;">Datum:</strong> {current_date}</p>
        </div>
      </div>
    </div>
    <div style="margin-top: 50px; padding: 30px 50px; text-align: center; border-top: 1px solid rgba(34, 197, 94, 0.1);">
      <p style="margin: 12px 0 0 0; color: #22c55e; font-weight: 900; font-size: 24px;">VLOTTR</p>
      <p style="margin: 4px 0 0 0; color: rgba(255,255,255,0.4); font-size: 11px; font-family: 'Space Mono', monospace; letter-spacing: 2px;">DEALER OVEREENKOMST &bull; BUDDY BV &bull; ZUID-LIMBURG</p>
      <p style="margin: 16px 0 0 0; color: rgba(255,255,255,0.3); font-size: 10px; font-family: 'Space Mono', monospace; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px;">Overeenkomst ID: {contract_id} &bull; Ondertekend op {current_date}</p>
    </div>
  </div>
</div>
`;

/**
 * Garage agreement template - GARAGE OVEREENKOMST (onderhoud)
 */
export const GARAGE_AGREEMENT_TEMPLATE = `
<div style="font-family: 'Outfit', Arial, sans-serif; width: 800px; background: #000000; color: #ffffff;">
  <div style="min-height: 1050px; background: #000000; position: relative; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #1a4d2e 0%, #0f2818 100%); padding: 60px 50px; position: relative; overflow: hidden;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 100px; height: 100px; margin: 0 auto; background: #22c55e; border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 15px 50px rgba(34, 197, 94, 0.4); overflow: hidden;">
          {logo_img}
        </div>
      </div>
      <h1 style="text-align: center; color: #ffffff; font-weight: 900; font-size: 38px; margin: 0 0 10px 0; letter-spacing: -1px;">GARAGE OVEREENKOMST</h1>
      <p style="text-align: center; color: rgba(255,255,255,0.6); margin: 0; font-family: 'Space Mono', monospace; font-size: 13px; letter-spacing: 2px;">PARTNEROVEREENKOMST ONDERHOUD #{contract_id}</p>
    </div>
    <div style="background: #000000; padding: 50px; position: relative; min-height: 580px;">
      <div style="position: relative; z-index: 2;">
        <div style="margin-bottom: 40px;">
          <div style="display: flex; align-items: center; margin-bottom: 16px;">
            <div style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%; margin-right: 12px;"></div>
            <h2 style="color: #ffffff; font-weight: 800; font-size: 14px; margin: 0; text-transform: uppercase; letter-spacing: 2px;">Platform</h2>
          </div>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 24px;">
            <p style="color: rgba(255,255,255,0.9); line-height: 1.8; margin: 0; font-size: 15px;">
              <strong style="color: #22c55e;">Vlottr</strong><br/>Handelend namens: Buddy BV<br/>Regio: Zuid-Limburg
            </p>
          </div>
        </div>
        <div style="margin-bottom: 40px;">
          <div style="display: flex; align-items: center; margin-bottom: 16px;">
            <div style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%; margin-right: 12px;"></div>
            <h2 style="color: #ffffff; font-weight: 800; font-size: 14px; margin: 0; text-transform: uppercase; letter-spacing: 2px;">Partner (Garage)</h2>
          </div>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 24px;">
            <p style="color: rgba(255,255,255,0.9); line-height: 1.8; margin: 0; font-size: 15px;">
              <strong style="color: #22c55e;">{company_name}</strong><br/>Contactpersoon: {partner_name}<br/>Email: {partner_email}<br/>Telefoon: {partner_phone}<br/>KVK: {partner_kvk}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div style="min-height: 1050px; background: #000000; padding: 50px; position: relative;">
    <div style="margin-bottom: 30px; text-align: center;">
      <h2 style="color: #ffffff; font-weight: 900; font-size: 28px; margin: 0;">Voorwaarden Garage Samenwerking</h2>
      <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.5); font-size: 14px;">Vlottr handelend namens Buddy BV</p>
    </div>
    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; padding: 32px;">
      <p style="color: rgba(255,255,255,0.8); line-height: 1.7; margin: 0; font-size: 13px;">
        <strong style="color: #22c55e; font-size: 15px;">1. Samenwerking</strong><br/>
        Vlottr maakt gebruik van de onderhoudsdiensten van Partner voor voertuigen in de Vlottr verhuurvloot. Vlottr controleert vooraf of de garage geschikt is voor het uitvoeren van onderhoud aan de vloot.<br/><br/>
        <strong style="color: #22c55e; font-size: 15px;">2. Diensten</strong><br/>
        Partner biedt onderhoud, reparatie en APK-keuringen aan voor Vlottr-voertuigen. De specifieke diensten worden in het partnerdashboard vastgelegd.<br/><br/>
        <strong style="color: #22c55e; font-size: 15px;">3. Tarieven</strong><br/>
        Partner wordt betaald conform marktconforme tarieven voor alle geleverde diensten. Tarieven worden vooraf afgestemd per diensttype. Facturatie verloopt via het Vlottr platform.<br/><br/>
        <strong style="color: #22c55e; font-size: 15px;">4. Kwaliteitseisen</strong><br/>
        Reparaties en onderhoud worden vakkundig en volgens geldende normen uitgevoerd. Vlottr behoudt het recht om kwaliteitscontroles uit te voeren. Bij herhaaldelijke kwaliteitsproblemen kan Vlottr de samenwerking herzien.<br/><br/>
        <strong style="color: #22c55e; font-size: 15px;">5. Planning &amp; Beschikbaarheid</strong><br/>
        Partner streeft naar snelle doorlooptijden om verhuuruitval te minimaliseren. Afspraken worden via het platform ingepland. Bij spoedgevallen wordt prioriteit gegeven aan Vlottr-voertuigen.<br/><br/>
        <strong style="color: #22c55e; font-size: 15px;">6. Verantwoordelijkheden</strong><br/>
        Partner garandeert over de juiste certificeringen en vergunningen te beschikken. Partner is aansprakelijk voor schade door onjuist uitgevoerd onderhoud. Garantie op uitgevoerd werk conform branchestandaarden.<br/><br/>
        <strong style="color: #22c55e; font-size: 15px;">7. Be&euml;indiging</strong><br/>
        Beide partijen kunnen de samenwerking be&euml;indigen met 2 weken opzegtermijn. Lopende werkzaamheden worden afgerond. Bij ernstige overtredingen kan Vlottr de samenwerking per direct be&euml;indigen.<br/><br/>
        <strong style="color: #22c55e;">Disclaimer</strong><br/>
        Door ondertekening verklaart de partner akkoord te gaan met bovenstaande voorwaarden en bevestigt bevoegd te zijn om namens het bedrijf te tekenen.
      </p>
    </div>
    <div style="margin-top: 50px; display: flex; gap: 35px; justify-content: space-between; padding: 0 50px;">
      <div style="flex: 1; max-width: 340px;">
        <div style="background: #000000; border: 2px solid #22c55e; border-radius: 20px; padding: 28px;">
          <p style="margin: 0 0 18px 0; color: #22c55e; font-weight: 800; font-size: 15px; letter-spacing: 1px; text-transform: uppercase;">Handtekening Partner</p>
          <div style="border-bottom: 3px solid #22c55e; padding-bottom: 8px; margin-bottom: 14px; min-height: 100px; display: flex; align-items: center; justify-content: center; background: #000000;">{customer_signature}</div>
          <p style="margin: 8px 0 0 0; color: rgba(34,197,94,0.7); font-size: 13px;"><strong style="color: #22c55e;">Namens:</strong> {company_name}</p>
          <p style="margin: 6px 0 0 0; color: rgba(34,197,94,0.7); font-size: 13px;"><strong style="color: #22c55e;">Datum:</strong> {current_date}</p>
        </div>
      </div>
      <div style="flex: 1; max-width: 340px;">
        <div style="background: #000000; border: 2px solid #22c55e; border-radius: 20px; padding: 28px;">
          <p style="margin: 0 0 18px 0; color: #22c55e; font-weight: 800; font-size: 15px; letter-spacing: 1px; text-transform: uppercase;">Handtekening Vlottr</p>
          <div style="border-bottom: 3px solid #22c55e; padding-bottom: 8px; margin-bottom: 14px; min-height: 100px; display: flex; align-items: center; justify-content: center; background: #000000;">{admin_signature}</div>
          <p style="margin: 8px 0 0 0; color: rgba(34,197,94,0.7); font-size: 13px;"><strong style="color: #22c55e;">Namens:</strong> Vlottr handelend namens Buddy BV</p>
          <p style="margin: 6px 0 0 0; color: rgba(34,197,94,0.7); font-size: 13px;"><strong style="color: #22c55e;">Datum:</strong> {current_date}</p>
        </div>
      </div>
    </div>
    <div style="margin-top: 50px; padding: 30px 50px; text-align: center; border-top: 1px solid rgba(34, 197, 94, 0.1);">
      <p style="margin: 12px 0 0 0; color: #22c55e; font-weight: 900; font-size: 24px;">VLOTTR</p>
      <p style="margin: 4px 0 0 0; color: rgba(255,255,255,0.4); font-size: 11px; font-family: 'Space Mono', monospace; letter-spacing: 2px;">GARAGE OVEREENKOMST &bull; BUDDY BV &bull; ZUID-LIMBURG</p>
      <p style="margin: 16px 0 0 0; color: rgba(255,255,255,0.3); font-size: 10px; font-family: 'Space Mono', monospace; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px;">Overeenkomst ID: {contract_id} &bull; Ondertekend op {current_date}</p>
    </div>
  </div>
</div>
`;

/**
 * Download dealer agreement as PDF
 */
export async function downloadDealerAgreementPDF(contract: Contract): Promise<void> {
  try {
    let logoBase64 = '';
    try { logoBase64 = await imageUrlToBase64('/512x512x2.png'); } catch { /* ignore */ }

    let customerSignature = '';
    let adminSignature = '';
    if (contract.customer_signature_url) customerSignature = await imageUrlToBase64(contract.customer_signature_url);
    if (contract.admin_signature_url) adminSignature = await imageUrlToBase64(contract.admin_signature_url);

    const container = document.createElement('div');
    container.id = 'temp-dealer-pdf';
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '800px';
    document.body.appendChild(container);

    const contractDate = contract.signed_at
      ? new Date(contract.signed_at).toLocaleDateString('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' })
      : new Date().toLocaleDateString('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' });

    const logoImg = logoBase64
      ? `<img src="${logoBase64}" alt="Vlottr Logo" style="width: 100px; height: 100px; object-fit: contain; border-radius: 20px;" />`
      : `<span style="font-size: 64px; font-weight: 900; color: #000000; line-height: 1;">V</span>`;

    const html = contract.contract_html || generateContractHTML(DEALER_AGREEMENT_TEMPLATE, {
      contract_id: contract.id.substring(0, 8),
      company_name: contract.car_info || '',
      partner_name: contract.customer_name || '',
      partner_email: contract.customer_email || '',
      partner_phone: contract.customer_phone || '',
      partner_kvk: '',
      current_date: contractDate,
      customer_signature: customerSignature,
      admin_signature: adminSignature,
      logo_img: logoImg,
    });

    container.innerHTML = html;
    await new Promise(resolve => setTimeout(resolve, 300));

    const canvas = await html2canvas(container, { scale: 2, useCORS: false, logging: false, backgroundColor: '#000000' });
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.setFillColor(0, 0, 0);
    pdf.rect(0, 0, imgWidth, pageHeight, 'F');
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    while (heightLeft > pageHeight * 0.1) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.setFillColor(0, 0, 0);
      pdf.rect(0, 0, imgWidth, pageHeight, 'F');
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`dealer-overeenkomst-${contract.id.substring(0, 8)}.pdf`);
    document.body.removeChild(container);
  } catch (error) {
    console.error('PDF download error:', error);
    throw error;
  }
}

/**
 * Download garage agreement as PDF
 */
export async function downloadGarageAgreementPDF(contract: Contract): Promise<void> {
  try {
    let logoBase64 = '';
    try { logoBase64 = await imageUrlToBase64('/512x512x2.png'); } catch { /* ignore */ }

    let customerSignature = '';
    let adminSignature = '';
    if (contract.customer_signature_url) customerSignature = await imageUrlToBase64(contract.customer_signature_url);
    if (contract.admin_signature_url) adminSignature = await imageUrlToBase64(contract.admin_signature_url);

    const container = document.createElement('div');
    container.id = 'temp-garage-pdf';
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '800px';
    document.body.appendChild(container);

    const contractDate = contract.signed_at
      ? new Date(contract.signed_at).toLocaleDateString('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' })
      : new Date().toLocaleDateString('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' });

    const logoImg = logoBase64
      ? `<img src="${logoBase64}" alt="Vlottr Logo" style="width: 100px; height: 100px; object-fit: contain; border-radius: 20px;" />`
      : `<span style="font-size: 64px; font-weight: 900; color: #000000; line-height: 1;">V</span>`;

    const html = contract.contract_html || generateContractHTML(GARAGE_AGREEMENT_TEMPLATE, {
      contract_id: contract.id.substring(0, 8),
      company_name: contract.car_info || '',
      partner_name: contract.customer_name || '',
      partner_email: contract.customer_email || '',
      partner_phone: contract.customer_phone || '',
      partner_kvk: '',
      current_date: contractDate,
      customer_signature: customerSignature,
      admin_signature: adminSignature,
      logo_img: logoImg,
    });

    container.innerHTML = html;
    await new Promise(resolve => setTimeout(resolve, 300));

    const canvas = await html2canvas(container, { scale: 2, useCORS: false, logging: false, backgroundColor: '#000000' });
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.setFillColor(0, 0, 0);
    pdf.rect(0, 0, imgWidth, pageHeight, 'F');
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    while (heightLeft > pageHeight * 0.1) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.setFillColor(0, 0, 0);
      pdf.rect(0, 0, imgWidth, pageHeight, 'F');
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`garage-overeenkomst-${contract.id.substring(0, 8)}.pdf`);
    document.body.removeChild(container);
  } catch (error) {
    console.error('PDF download error:', error);
    throw error;
  }
}

export const EXTENSION_CONTRACT_TEMPLATE = `
<div style="font-family: 'Outfit', Arial, sans-serif; width: 800px; background: #000000; color: #ffffff;">
  <!-- PAGE 1 -->
  <div style="min-height: 1050px; background: #000000; position: relative; overflow: hidden;">

    <!-- Dark Green Gradient Header -->
    <div style="background: linear-gradient(135deg, #1a4d2e 0%, #0f2818 100%); padding: 60px 50px; position: relative; overflow: hidden;">
      <!-- Decorative dots top left -->
      <div style="position: absolute; top: 20px; left: 50px; display: flex; gap: 6px;">
        <div style="width: 5px; height: 5px; border-radius: 50%; background: #22c55e;"></div>
        <div style="width: 5px; height: 5px; border-radius: 50%; background: #22c55e; opacity: 0.6;"></div>
        <div style="width: 5px; height: 5px; border-radius: 50%; background: #22c55e; opacity: 0.3;"></div>
      </div>

      <!-- Logo with Vlottr image -->
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 100px; height: 100px; margin: 0 auto; background: #22c55e; border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 15px 50px rgba(34, 197, 94, 0.4); overflow: hidden;">
          {logo_img}
        </div>
      </div>

      <!-- Title -->
      <h1 style="text-align: center; color: #ffffff; font-weight: 900; font-size: 38px; margin: 0 0 10px 0; letter-spacing: -1px;">6 MAANDEN COMMITMENT</h1>
      <p style="text-align: center; color: rgba(255,255,255,0.6); margin: 0; font-family: 'Space Mono', monospace; font-size: 13px; letter-spacing: 2px;">
        CONTRACT #{contract_id} • VOORUITBOEKEN 6 MAANDEN + 1 GRATIS
      </p>
    </div>

    <!-- Black Content -->
    <div style="background: #000000; padding: 50px; position: relative; min-height: 580px;">
      <!-- Giant Decorative Green Circles -->
      <div style="position: absolute; right: -200px; top: 50%; transform: translateY(-50%); width: 500px; height: 500px; border-radius: 50%; border: 3px solid #22c55e; opacity: 0.15;"></div>
      <div style="position: absolute; right: -150px; top: 50%; transform: translateY(-50%); width: 400px; height: 400px; border-radius: 50%; border: 2px solid #22c55e; opacity: 0.1;"></div>

      <!-- Content Cards -->
      <div style="position: relative; z-index: 2;">
        <!-- Extension Notice -->
        <div style="margin-bottom: 40px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 16px; padding: 28px; text-align: center;">
          <p style="margin: 0; color: #000000; font-weight: 800; font-size: 16px; letter-spacing: 1px; text-transform: uppercase;">
            ✓ 6 MAANDEN VERLENGING + 1 MAAND GRATIS!
          </p>
          <p style="margin: 8px 0 0 0; color: rgba(0,0,0,0.7); font-size: 14px;">
            U ontvangt 26 weken verhuur maar betaalt slechts voor 22 weken
          </p>
        </div>

        <!-- Verhuurder -->
        <div style="margin-bottom: 40px;">
          <div style="display: flex; align-items: center; margin-bottom: 16px;">
            <div style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%; margin-right: 12px;"></div>
            <h2 style="color: #ffffff; font-weight: 800; font-size: 14px; margin: 0; text-transform: uppercase; letter-spacing: 2px;">Verhuurder</h2>
          </div>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 24px;">
            <p style="color: rgba(255,255,255,0.9); line-height: 1.8; margin: 0; font-size: 15px;">
              <strong style="color: #22c55e;">Vlottr</strong><br/>
              Handelend namens: <strong>Buddy BV</strong><br/>
              KVK: <strong>98132873</strong><br/>
              BTW: <strong>NL868369755B01</strong><br/>
              Adres: <strong>Oude Maastrichterweg 16, 6162 BD Geleen, Zuid-Limburg</strong><br/>
              E-mail: <strong>support@vlottr.eu</strong><br/>
              Telefoon: <strong>045 209 2101</strong>
            </p>
          </div>
        </div>

        <!-- Huurder -->
        <div style="margin-bottom: 40px;">
          <div style="display: flex; align-items: center; margin-bottom: 16px;">
            <div style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%; margin-right: 12px;"></div>
            <h2 style="color: #ffffff; font-weight: 800; font-size: 14px; margin: 0; text-transform: uppercase; letter-spacing: 2px;">Huurder</h2>
          </div>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 24px;">
            <p style="color: rgba(255,255,255,0.9); line-height: 1.8; margin: 0; font-size: 15px;">
              <strong style="color: #22c55e;">{customer_name}</strong><br/>
              Adres: <strong>{customer_address}</strong><br/>
              E-mail: {customer_email}<br/>
              Telefoon: {customer_phone}<br/>
              Geboortedatum: <strong>{customer_birth_date}</strong><br/>
              Rijbewijsnummer: <strong>{customer_license_number}</strong><br/>
              Rijbewijscategorie: <strong>{customer_license_category}</strong><br/>
              Rijbewijs geldig t/m: <strong>{customer_license_expiry}</strong>
            </p>
          </div>
        </div>

        <!-- Voertuig -->
        <div style="margin-bottom: 40px;">
          <div style="display: flex; align-items: center; margin-bottom: 16px;">
            <div style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%; margin-right: 12px;"></div>
            <h2 style="color: #ffffff; font-weight: 800; font-size: 14px; margin: 0; text-transform: uppercase; letter-spacing: 2px;">Voertuig</h2>
          </div>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 24px;">
            <p style="color: rgba(255,255,255,0.9); line-height: 1.8; margin: 0; font-size: 15px;">
              <strong style="color: #22c55e;">{car_info}</strong><br/>
              Kenteken: <span style="font-family: 'Space Mono', monospace; color: #22c55e;">{license_plate}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- PAGE 2 -->
  <div style="min-height: 1050px; background: #000000; padding: 50px; position: relative;">

    <!-- Extension Details -->
    <div style="margin-bottom: 60px;">
      <!-- Verlenging Periode -->
      <div style="margin-bottom: 50px;">
        <div style="display: flex; align-items: center; margin-bottom: 20px;">
          <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 16px;">
            <span style="font-size: 24px; line-height: 1; display: flex; align-items: center; justify-content: center;">📅</span>
          </div>
          <h2 style="color: #ffffff; font-weight: 800; font-size: 18px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Verlengingsperiode</h2>
        </div>
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 28px; margin-left: 66px;">
          <p style="color: rgba(255,255,255,0.9); line-height: 1.8; margin: 0; font-size: 15px;">
            <strong style="color: #22c55e;">Type verlenging:</strong> 6 maanden commitment<br/>
            <strong style="color: #22c55e;">Nieuwe einddatum:</strong> {end_date}<br/>
            <strong style="color: #22c55e;">Verlenging duur:</strong> 26 weken (6 maanden)<br/>
            <strong style="color: #22c55e;">Betaling:</strong> 22 weken (5 maanden) - 1 maand GRATIS!<br/>
            <strong style="color: #22c55e;">Opzegging:</strong> Na 6 maanden wekelijks opzegbaar
          </p>
        </div>
      </div>

      <!-- Kosten Verlenging -->
      <div style="margin-bottom: 50px;">
        <div style="display: flex; align-items: center; margin-bottom: 20px;">
          <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 16px;">
            <span style="font-size: 24px; line-height: 1; display: flex; align-items: center; justify-content: center;">💰</span>
          </div>
          <h2 style="color: #ffffff; font-weight: 800; font-size: 18px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Verlengingskosten</h2>
        </div>
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 28px; margin-left: 66px;">
          <!-- Big emphasis on weekly rate -->
          <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: center;">
            <p style="margin: 0; color: #000000; font-weight: 900; font-size: 28px;">
              €{weekly_rate} per week
            </p>
            <p style="margin: 4px 0 0 0; color: rgba(0,0,0,0.7); font-size: 13px; font-weight: 600;">
              Automatische wekelijkse incasso
            </p>
          </div>

          <p style="color: rgba(255,255,255,0.9); line-height: 1.9; margin: 0; font-size: 15px;">
            <strong style="color: #22c55e;">Commitment periode:</strong> 6 maanden (26 weken)<br/>
            <strong style="color: #22c55e;">U betaalt:</strong> 22 weken × €{weekly_rate} = €{total_price}<br/>
            <strong style="color: #22c55e;">U ontvangt:</strong> 26 weken verhuur<br/>
            <strong style="color: #22c55e;">Uw voordeel:</strong> 4 weken GRATIS! (€{discount_amount} korting)<br/>
            <strong style="color: #22c55e;">Betaalwijze:</strong> Wekelijks via automatische incasso
          </p>
        </div>
      </div>

      <!-- Voorwaarden -->
      <div style="margin-bottom: 50px;">
        <div style="display: flex; align-items: center; margin-bottom: 20px;">
          <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 16px;">
            <span style="font-size: 24px; line-height: 1; display: flex; align-items: center; justify-content: center;">📋</span>
          </div>
          <h2 style="color: #ffffff; font-weight: 800; font-size: 18px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Verlengingsvoorwaarden</h2>
        </div>
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 28px; margin-left: 66px;">
          <p style="color: rgba(255,255,255,0.8); line-height: 1.9; margin: 0; font-size: 14px;">
            • <strong style="color: #22c55e;">6 Maanden Commitment:</strong> Door ondertekening committeert u zich aan 6 maanden extra verhuur (26 weken)<br/><br/>
            • <strong style="color: #22c55e;">1 Maand GRATIS:</strong> U ontvangt 26 weken verhuur, maar betaalt slechts voor 22 weken. De overige 4 weken krijgt u cadeau van Vlottr!<br/><br/>
            • <strong style="color: #22c55e;">Wekelijkse Betaling:</strong> U betaalt €{weekly_rate} per week via automatische incasso. Dit blijft gewoon elke week doorgaan, net als nu.<br/><br/>
            • <strong style="color: #22c55e;">Na 6 Maanden:</strong> Na afloop van de commitment periode is het contract weer wekelijks opzegbaar<br/><br/>
            • <strong style="color: #22c55e;">Algemene Voorwaarden:</strong> De algemene voorwaarden van het oorspronkelijke contract blijven van kracht
          </p>
        </div>
      </div>
    </div>

    <!-- Handtekeningen Section -->
    <div style="margin-top: 50px; display: flex; gap: 35px; justify-content: space-between; padding: 0 50px;">
      <!-- Handtekening Huurder -->
      <div style="flex: 1; max-width: 340px;">
        <div style="background: #000000; border: 2px solid #22c55e; border-radius: 20px; padding: 28px; box-shadow: 0 15px 50px rgba(34, 197, 94, 0.2);">
          <p style="margin: 0 0 18px 0; color: #22c55e; font-weight: 800; font-size: 15px; letter-spacing: 1px; text-transform: uppercase;">
            ✓ Handtekening Huurder
          </p>
          <div style="border-bottom: 3px solid #22c55e; padding-bottom: 8px; margin-bottom: 14px; min-height: 100px; display: flex; align-items: center; justify-content: center; background: #000000;">
            {customer_signature}
          </div>
          <p style="margin: 8px 0 0 0; color: rgba(34,197,94,0.7); font-size: 13px;">
            <strong style="color: #22c55e;">Naam:</strong> {customer_name}
          </p>
          <p style="margin: 6px 0 0 0; color: rgba(34,197,94,0.7); font-size: 13px;">
            <strong style="color: #22c55e;">Datum:</strong> {current_date}
          </p>
        </div>
      </div>

      <!-- Handtekening Verhuurder -->
      <div style="flex: 1; max-width: 340px;">
        <div style="background: #000000; border: 2px solid #22c55e; border-radius: 20px; padding: 28px; box-shadow: 0 15px 50px rgba(34, 197, 94, 0.2);">
          <p style="margin: 0 0 18px 0; color: #22c55e; font-weight: 800; font-size: 15px; letter-spacing: 1px; text-transform: uppercase;">
            ✓ Handtekening Verhuurder
          </p>
          <div style="border-bottom: 3px solid #22c55e; padding-bottom: 8px; margin-bottom: 14px; min-height: 100px; display: flex; align-items: center; justify-content: center; background: #000000;">
            {admin_signature}
          </div>
          <p style="margin: 8px 0 0 0; color: rgba(34,197,94,0.7); font-size: 13px;">
            <strong style="color: #22c55e;">Namens:</strong> Vlottr handelend namens Buddy BV
          </p>
          <p style="margin: 6px 0 0 0; color: rgba(34,197,94,0.7); font-size: 13px;">
            <strong style="color: #22c55e;">Datum:</strong> {current_date}
          </p>
        </div>
      </div>
    </div>

    <!-- Footer with Logo -->
    <div style="margin-top: 60px; padding: 30px 50px; text-align: center; background: linear-gradient(180deg, transparent 0%, rgba(34, 197, 94, 0.05) 100%); border-top: 1px solid rgba(34, 197, 94, 0.1);">
      <!-- VLOTTR Logo -->
      <div style="margin-bottom: 16px;">
        <div style="width: 50px; height: 50px; margin: 0 auto; background: #22c55e; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 8px 30px rgba(34, 197, 94, 0.3); overflow: hidden;">
          {logo_img_small}
        </div>
      </div>
      <p style="margin: 12px 0 0 0; color: #22c55e; font-weight: 900; font-size: 24px; letter-spacing: -0.5px;">VLOTTR</p>
      <p style="margin: 4px 0 12px 0; color: rgba(255,255,255,0.4); font-size: 11px; font-family: 'Space Mono', monospace; letter-spacing: 2px;">AUTO VERHUUR • BUDDY BV • Zuid-LIMBURG</p>
      <p style="margin: 16px 0 0 0; color: rgba(255,255,255,0.3); font-size: 10px; font-family: 'Space Mono', monospace; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px;">
        Verlengingscontract ID: {contract_id} • Ondertekend op {current_date}
      </p>
    </div>
  </div>
</div>
`;
