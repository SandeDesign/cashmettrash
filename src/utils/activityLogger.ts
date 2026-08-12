import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ActivityLog } from '../types';

interface LogActivityParams {
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: 'customer' | 'manager' | 'admin' | 'partner';
  action: string;
  description: string;
  entity_type?: 'car' | 'booking' | 'user' | 'contract' | 'settings' | 'chat' | 'maintenance';
  entity_id?: string;
  metadata?: Record<string, any>;
}

/**
 * Central activity logging function
 * Logs all user actions to Firestore for audit trail and analytics
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    const {
      user_id,
      user_name,
      user_email,
      user_role,
      action,
      description,
      entity_type,
      entity_id,
      metadata = {}
    } = params;

    // Get IP address and user agent (client-side)
    const ip_address = await fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => data.ip)
      .catch(() => 'unknown');

    const user_agent = navigator.userAgent;

    const activityLog: Omit<ActivityLog, 'id' | 'created_at'> = {
      user_id,
      user_name,
      user_email,
      user_role,
      action,
      description,
      entity_type,
      entity_id,
      metadata,
      ip_address,
      user_agent
    };

    // Add to Firestore
    await addDoc(collection(db, 'activity_logs'), {
      ...activityLog,
      created_at: serverTimestamp()
    });

    console.log('✅ Activity logged:', action, description);
  } catch (error) {
    console.error('❌ Failed to log activity:', error);
    // Don't throw error - logging should not break app functionality
  }
}

// Pre-defined activity actions for consistency
export const ACTIVITY_ACTIONS = {
  // Auth
  LOGIN: 'login',
  LOGOUT: 'logout',
  REGISTER: 'register',

  // Bookings
  CREATE_BOOKING: 'create_booking',
  UPDATE_BOOKING: 'update_booking',
  CANCEL_BOOKING: 'cancel_booking',
  EXTEND_BOOKING: 'extend_booking',
  COMPLETE_BOOKING: 'complete_booking',

  // Cars
  CREATE_CAR: 'create_car',
  UPDATE_CAR: 'update_car',
  DELETE_CAR: 'delete_car',
  PUBLISH_CAR: 'publish_car',
  UNPUBLISH_CAR: 'unpublish_car',

  // Contracts
  CREATE_CONTRACT: 'create_contract',
  SIGN_CONTRACT: 'sign_contract',
  APPROVE_CONTRACT: 'approve_contract',
  REJECT_CONTRACT: 'reject_contract',

  // Maintenance
  CREATE_MAINTENANCE: 'create_maintenance',
  UPDATE_MAINTENANCE: 'update_maintenance',
  COMPLETE_MAINTENANCE: 'complete_maintenance',

  // Payments
  CREATE_PAYMENT: 'create_payment',
  COMPLETE_PAYMENT: 'complete_payment',
  REFUND_PAYMENT: 'refund_payment',

  // Users
  CREATE_USER: 'create_user',
  UPDATE_USER: 'update_user',
  DELETE_USER: 'delete_user',
  VERIFY_USER: 'verify_user',
  APPROVE_USER: 'approve_user',
  REJECT_USER: 'reject_user',

  // Settings
  UPDATE_SETTINGS: 'update_settings',

  // Chat
  SEND_MESSAGE: 'send_message',
  READ_MESSAGE: 'read_message',

  // System
  VIEW_PAGE: 'view_page',
  EXPORT_DATA: 'export_data',
  GENERATE_REPORT: 'generate_report'
} as const;
