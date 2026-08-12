export interface DriverLicense {
  number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  issue_date: string;
  expiry_date: string;
  category?: string; // Rijbewijscategorie (B, BE, etc.)
  front_image_url: string;
  back_image_url?: string;
  verified: boolean;
  verified_at?: string;
  verified_by?: string;
  // OCR extracted data
  ocr_data?: {
    number?: string;
    first_name?: string;
    last_name?: string;
    date_of_birth?: string;
    issue_date?: string;
    expiry_date?: string;
  };
  // Field verification by admin/manager
  field_verification?: {
    number?: boolean;
    name?: boolean;
    date_of_birth?: boolean;
    issue_date?: boolean;
    expiry_date?: boolean;
  };
}

export interface User {
  uid: string;
  email: string;
  name: string;
  phone: string;
  address: string;
  date_of_birth: string;
  role: 'customer' | 'manager' | 'admin' | 'partner';
  verification_status: 'pending' | 'approved' | 'rejected';
  driver_license?: DriverLicense;
  onboarding_completed?: boolean;
  onboarding_completed_at?: string;
  onboarding_skipped?: boolean;
  onboarding_skipped_at?: string;
  profile_photo?: string; // URL to profile photo
  salary_slips?: string[]; // URLs of last 3 salary slips (loonstroken)
  // Partner-specific fields
  company_name?: string;
  company_kvk?: string; // KVK nummer
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  company_logo?: string; // Base64 logo
  company_description?: string;
  partner_type?: 'garage' | 'dealer' | 'both'; // Type partner
  offers_maintenance?: boolean; // Biedt ook onderhoud aan
  garage_services?: string[]; // Werkplaats diensten die aangeboden worden
  partner_agreement_signed?: boolean;
  partner_agreement_id?: string;
  partner_agreement_signed_at?: string;
  dealer_agreement_signed?: boolean;
  dealer_agreement_id?: string;
  dealer_agreement_signed_at?: string;
  garage_agreement_signed?: boolean;
  garage_agreement_id?: string;
  garage_agreement_signed_at?: string;
  pending_service_change?: string; // ID van actief wijzigingsverzoek
  created_at: string;
  updated_at: string;
}

export interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  license_plate: string;
  weekly_rate: number;
  status: 'available' | 'rented' | 'maintenance';
  images: string[];
  description: string;
  specs: Record<string, any>;
  published: boolean;
  groene_kaart_url?: string; // Optioneel: groene kaart document
  rdw_verklaring_url?: string; // Optioneel: RDW verklaring document
  // Maintenance & APK fields
  apk_expiry_date?: string; // APK expiry date
  apk_document_url?: string; // APK certificate document
  insurance_expiry_date?: string; // Insurance expiry date
  insurance_document_url?: string; // Insurance policy document
  last_maintenance_date?: string; // Last maintenance date
  last_maintenance_notes?: string; // Notes about last maintenance
  next_maintenance_date?: string; // Scheduled next maintenance
  vehicle_registration_url?: string; // Vehicle registration document (kentekenbewijs)
  maintenance_history?: MaintenanceRecord[]; // Full maintenance history
  // Partner-submitted car fields
  submitted_by_partner?: string; // Partner user ID who submitted
  partner_approved?: boolean; // Admin approved this car
  partner_approved_by?: string;
  partner_approved_at?: string;
  purchase_price?: number; // Inkoopprijs (door admin vastgesteld)
  repayment_percentage?: number; // Aflossingspercentage van verhuurinkomsten (door admin vastgesteld)
  partner_rejection_reason?: string;
  change_request_pending?: boolean;
  change_request_message?: string;
  change_request_at?: string;
  resubmitted_at?: string;
  // Contract tracking
  contract_signed?: boolean;       // True after customer has signed the rental contract
  contract_signed_at?: string;     // Timestamp of signing
  active_contract_id?: string;     // Reference to the active contract doc
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PartnerContract {
  id: string;
  partner_id: string;
  partner_name: string;
  partner_email: string;
  partner_company: string;
  contract_subtype: 'auto_inkoop' | 'garage_overeenkomst' | 'dealer_overeenkomst'; // Type partnercontract
  car_id?: string; // Linked car (optional, set when car is added)
  car_info?: string; // "BMW 3 Serie (2020)"
  license_plate?: string;
  purchase_price: number; // Inkoopprijs (door admin vastgesteld per auto)
  repayment_percentage?: number; // Aflossingspercentage van verhuurinkomsten
  payment_terms: string; // e.g., "Aflossing via 30% van verhuurinkomsten"
  contract_html: string;
  partner_signature_url?: string;
  admin_signature_url: string;
  signed_at?: string;
  signed: boolean;
  status: 'pending' | 'signed' | 'active' | 'completed' | 'terminated';
  created_at: string;
  updated_at: string;
}

export interface ServiceChangeRequest {
  id: string;
  partner_id: string;
  partner_name: string;
  partner_company: string;
  current_partner_type: 'garage' | 'dealer' | 'both';
  requested_partner_type: 'garage' | 'dealer' | 'both';
  current_offers_maintenance: boolean;
  requested_offers_maintenance: boolean;
  current_garage_services: string[];
  requested_garage_services: string[];
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceRecord {
  id: string;
  date: string;
  type: 'routine' | 'repair' | 'apk' | 'other';
  description: string;
  cost?: number;
  mileage?: number;
  performed_by?: string;
  documents?: string[]; // URLs to receipts/documents
  created_at: string;
}

export interface ExtensionRequest {
  type: '6_months' | '12_months';
  requested_at: string;
  status: 'pending' | 'approved' | 'denied';
  reviewed_by?: string; // Admin/Manager who approved/denied
  reviewed_at?: string;
  denial_reason?: string;
}

export interface Booking {
  id: string;
  car_id: string;
  customer_id: string;
  start_date: string;
  end_date?: string;
  plan_type?: 'basic' | 'long' | 'half_year' | 'year'; // 'basic'=4wk €140, 'half_year'=6mnd €105, 'year'=12mnd €85
  weeks_rented: number; // Initial weeks (for reference, ongoing after contract)
  weekly_rate: number;
  total_price: number;
  status: 'draft' | 'pending' | 'confirmed' | 'active' | 'cancelled' | 'completed'; // draft=before contract signed, pending=awaiting payment, confirmed=paid+awaiting pickup, active=car handed over, cancelled=stopped, completed=returned
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_intent_id?: string;
  stripe_session_id?: string;
  stripe_subscription_id?: string;
  is_subscription?: boolean;
  subscription_status?: 'pending' | 'active' | 'cancelled' | 'past_due';
  customer_snapshot: {
    name: string;
    email: string;
    phone: string;
  };
  // Pickup type & location - set during booking creation
  pickup_type?: 'ophalen' | 'bezorgen'; // Customer chooses: pick up at location or delivery
  pickup_location_id?: string; // If ophalen: id from settings.locations
  pickup_location_name?: string; // Snapshot of location name
  delivery_address?: string; // If bezorgen: delivery address
  // Bezorgkosten (delivery cost) - €25 flat fee for bezorgen
  delivery_cost?: number; // 25 for bezorgen, 0 or absent for ophalen
  delivery_cost_method?: 'contant' | 'pin' | 'stripe'; // Customer chosen payment method
  delivery_cost_confirmed?: boolean; // Admin confirmed delivery cost received
  delivery_cost_confirmed_at?: string;
  delivery_cost_confirmed_by?: string;
  // Borg (waarborgsom) - deposit management
  borg_amount?: number; // Snapshot from settings.borg_amount
  borg_payment_method?: 'contant' | 'pin' | 'stripe'; // Customer chosen method
  borg_payment_method_set_at?: string; // When customer chose the method
  borg_confirmed?: boolean; // Admin/manager confirmed deposit received
  borg_confirmed_by?: string;
  borg_confirmed_at?: string;
  // Pickup (ophalen) - Start of rental
  pickup_status?: 'pending' | 'scheduled' | 'completed';
  pickup_photos?: string[]; // URLs to 5 photos taken at pickup
  pickup_scheduled_date?: string;
  pickup_completed_date?: string;
  pickup_by?: string; // User ID of manager/admin who handled pickup
  pickup_notes?: string;
  pickup_inspection_form_id?: string; // Reference to RentalCarInspectionForm (ophalen)
  // Return (afleveren) - ONLY handled by admin
  return_status?: 'pending' | 'scheduled' | 'completed';
  return_photos?: string[]; // URLs to 5 photos taken at return
  return_scheduled_date?: string;
  return_completed_date?: string;
  return_by?: string; // User ID of admin who handled return
  return_notes?: string;
  return_inspection_form_id?: string; // Reference to RentalCarInspectionForm (inleveren)
  // Termination contract (beëindigingsovereenkomst) - Created at return
  termination_contract_id?: string;
  termination_contract_url?: string;
  termination_contract_signed?: boolean;
  termination_contract_created_at?: string;
  // Lock period (vastzetperiode) - Contractual lock, no impact on booking status
  lock_period?: '6_months' | '12_months'; // Fixed rental period
  lock_period_start_date?: string; // When lock period starts
  lock_period_end_date?: string; // Calculated: start + 6/12 months
  // Extension requests - Customer can request extension
  extension_requests?: ExtensionRequest[];
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  cancellation_confirmed?: boolean; // Admin must confirm before car becomes available
  cancellation_confirmed_at?: string;
  cancellation_confirmed_by?: string;
  // Customer cancellation request flow
  cancellation_requested?: boolean; // Customer has requested cancellation
  cancellation_requested_at?: string;
  cancellation_request_reason?: string;
  cancellation_denied_at?: string;
  cancellation_denied_by?: string;
  cancellation_denial_reason?: string; // Shown in-app to customer
  // Pickup ready notification
  pickup_ready_email_sent_at?: string; // When "klaar om op te halen" email was sent
}

export interface Waitlist {
  id: string;
  car_id: string;
  customer_id: string;
  customer_snapshot: {
    name: string;
    email: string;
    phone: string;
  };
  status: 'waiting' | 'notified' | 'cancelled' | 'converted';
  notified: boolean;
  notification_sent_at?: string;
  converted_to_booking_id?: string; // If customer made a booking after notification
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'car_available' | 'pickup_scheduled' | 'return_scheduled' | 'booking_confirmed' | 'car_approved' | 'contract_ready' | 'general';
  title: string;
  message: string;
  link?: string; // Where to navigate when clicked
  read: boolean;
  read_at?: string;
  data?: Record<string, any>; // Additional data (car_id, booking_id, etc.)
  created_at: string;
}

export interface RentalLocation {
  id: string;
  name: string;
  address?: string;
  active: boolean;
}

export interface AppSettings {
  id: string;
  stripe_publishable_key: string;
  stripe_price_id_basic?: string;        // Stripe recurring price ID voor Basis plan (€140/week)
  stripe_price_id_half_year?: string;    // Stripe recurring price ID voor Half jaar plan (€105/week)
  stripe_price_id_year?: string;         // Stripe recurring price ID voor Jaar plan (€85/week)
  stripe_price_id_borg?: string;         // Stripe price ID voor waarborgsom (eenmalig)
  stripe_price_id_bezorgkosten?: string; // Stripe price ID voor bezorgkosten (eenmalig)
  stripe_proxy_url?: string; // PHP proxy URL voor SEPA Direct Debit
  stripe_checkout_proxy_url?: string; // PHP proxy URL voor Stripe Checkout
  upload_proxy_url: string; // Voor foto uploads (rijbewijs, auto's, profiel)
  weekly_rental_rate: number;
  minimum_rental_weeks: number;
  borg_amount: number; // Waarborgsom in euros (bijv. 500)
  locations: RentalLocation[]; // Ophaal/bezorglocaties
  admin_signature_url?: string; // Admin handtekening (namens Vlottr)
  contract_template?: string; // HTML contract template met variabelen
  updated_at: string;
  updated_by: string;
}

export interface Contract {
  id: string;
  booking_id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string; // Customer phone number
  customer_address?: string; // Customer address (for contract)
  customer_birth_date?: string; // Customer date of birth
  customer_license_number?: string; // Rijbewijsnummer
  customer_license_category?: string; // Rijbewijscategorie (B, BE, etc.)
  customer_license_expiry?: string; // Rijbewijs verloopdatum
  customer_license_issue_date?: string; // Rijbewijs afgiftedatum
  incasso_dag?: string; // Dag van wekelijkse SEPA-incasso
  car_id: string;
  car_info: string; // "BMW 3 Serie (2020)"
  license_plate?: string; // Car license plate
  start_date: string;
  end_date?: string;
  weeks_rented: number;
  weekly_rate: number;
  total_price: number;
  contract_html: string; // Generated HTML from template
  customer_signature_url?: string; // Klant handtekening
  admin_signature_url: string; // Admin handtekening (from settings)
  signed_at?: string;
  signed: boolean;
  pdf_url?: string; // Generated PDF URL
  status: 'pending' | 'signed' | 'completed' | 'terminated';
  contract_type?: 'rental' | 'extension' | 'partner_agreement' | 'dealer_agreement' | 'garage_agreement';
  terminated_at?: string;
  terminated_by?: string;
  termination_reason?: string;
  // Inspection and mileage (filled in after pickup/return)
  km_ophalen?: number;
  km_inleveren?: number;
  inspectie?: {
    ophalen?: { datum?: string; status?: string };
    inleveren?: { datum?: string; status?: string };
  };
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface RegisterData {
  firstName: string;
  email: string;
  password: string;
}

export interface PartnerRegisterData {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  password: string;
  partnerType: 'garage' | 'dealer' | 'both';
  kvkNumber?: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: 'customer' | 'manager' | 'admin' | 'partner';
  action: string; // e.g., "login", "logout", "created_booking", "updated_car", etc.
  description: string; // Human-readable description
  entity_type?: 'car' | 'booking' | 'user' | 'contract' | 'settings'; // What was affected
  entity_id?: string; // ID of the affected entity
  metadata?: Record<string, any>; // Additional contextual data
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'customer' | 'admin' | 'manager' | 'partner';
  message: string;
  read: boolean;
  created_at: string;
}

export interface ChatConversation {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  status: 'open' | 'closed' | 'archived';
  last_message?: string;
  last_message_at?: string;
  unread_count_customer: number; // Unread messages for customer
  unread_count_admin: number; // Unread messages for admin
  created_at: string;
  updated_at: string;
}

export interface SentEmail {
  id: string;
  from: string; // System email address
  to: string;
  subject: string;
  message: string;
  signature?: string; // Signature used at send time
  status: 'sent' | 'failed';
  error?: string; // Error message if failed
  sent_by: string; // User ID who sent the email
  sent_by_name: string; // User name for display
  sent_at: string;
  created_at: string;
}

export interface EmailAttachment {
  name: string;
  type: string; // MIME type e.g. application/pdf, image/jpeg
  data: string; // base64 encoded content
  size: number; // bytes
}

export interface ReceivedEmail {
  id: string;
  uid: string; // IMAP UID - unique identifier for email on server
  from: string;
  to: string;
  subject: string;
  date: string; // ISO timestamp from server
  preview: string; // First 200 chars
  body: string; // Full email body
  isHtml: boolean; // true = HTML email, false = plain text
  isRead: boolean;
  attachments?: EmailAttachment[];
  archived?: boolean; // Archived emails are hidden from inbox
  archiveFolder?: string; // Archive folder ID
  fetched_at?: string;
  fetched_by?: string;
}

export interface ArchiveFolder {
  id: string;
  name: string;
  parentId?: string; // If set, this is a subfolder inside the parent folder
  created_at: string;
  created_by: string;
}

export interface EmailSettings {
  id: string; // User ID
  signature: string;
  signature_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Rental Car Inspection Form Types
export interface PhotoUploadItem {
  position: string; // e.g., "Linksvoor", "Rechtsvoor", "Bestuurder zijde", etc.
  url?: string; // Upload URL
  uploaded_at?: string;
}

export interface PhotoUploadTab {
  id: string; // e.g., "hoeken", "wielen", "interieur", "schade", "opmerkingen"
  title: string;
  description: string;
  type: 'hoeken' | 'wielen' | 'interieur' | 'schade' | 'opmerkingen';
  items: PhotoUploadItem[]; // For most tabs: 3-4 items. For "schade": 1+ items
  is_open?: boolean; // Collapsible tabs - default closed
}

export interface RentalCarInspectionForm {
  id: string;
  booking_id: string;
  customer_id: string;
  car_id: string;
  type: 'ophalen' | 'inleveren'; // Pickup or Return

  // Form status
  status: 'voeg_fotos_toe' | 'in_behandeling' | 'goedgekeurd' | 'afgekeurd';

  // Questions
  odometer_reading_start?: number; // Kilometerstand departure
  odometer_reading_end?: number; // Kilometerstand arrival (only for inleveren)
  fuel_level?: '100%' | '75-100%' | '50-75%' | '25-50%' | '0-25%';

  // Extras: boolean for each item
  extras_present?: {
    spare_wheel: boolean;
    jack: boolean;
    first_aid_kit: boolean;
    warning_triangle: boolean;
    safety_vests: boolean;
  };

  // Technical state
  technical_state?: {
    lights_working: boolean;
    wipers_working: boolean;
    ac_working: boolean;
  };

  // Admin/Manager only
  staff_notes?: string; // Rejection reason for rejected status
  admin_staff_member_name?: string; // Name of staff member who handled it
  admin_delivery_time?: string; // Delivery/Return time
  admin_delivery_location?: string; // Delivery/Return location

  // Photo uploads (organized in tabs)
  photo_tabs: PhotoUploadTab[];

  // Remarks
  customer_remarks?: string;
  admin_remarks?: string;

  // Rejection reason (shown to customer when reopening if rejected)
  rejection_reason?: string;

  // Metadata
  customer_submitted_at?: string;
  reviewed_by?: string; // User ID of admin/manager who reviewed
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export type EmailTemplateId = 'ophalen' | 'ontvangen' | 'borg' | 'bezorgkosten' | 'vastzetperiode_6_maanden' | 'vastzetperiode_12_maanden';

export interface EmailTemplate {
  id: EmailTemplateId;
  label: string;
  subject: string;
  body_html: string;
  updated_at: string;
  updated_by: string;
}
