import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ActivityLog } from '../types';

interface LogActivityParams {
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: 'customer' | 'manager' | 'admin';
  action: string;
  description: string;
  entity_type?: 'car' | 'booking' | 'user' | 'contract' | 'settings';
  entity_id?: string;
  metadata?: Record<string, any>;
}

/**
 * Log user activity to Firestore
 */
export const logActivity = async (params: LogActivityParams): Promise<void> => {
  try {
    const log: any = {
      user_id: params.user_id,
      user_name: params.user_name,
      user_email: params.user_email,
      user_role: params.user_role,
      action: params.action,
      description: params.description,
      created_at: new Date().toISOString(),
    };

    // Only add optional fields if they have values (Firebase doesn't accept undefined)
    if (params.entity_type) log.entity_type = params.entity_type;
    if (params.entity_id) log.entity_id = params.entity_id;
    if (params.metadata) log.metadata = params.metadata;

    await addDoc(collection(db, 'activity_logs'), log);
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw - logging failures shouldn't break the app
  }
};

/**
 * Convenience functions for common actions
 */
export const logUserLogin = (user_id: string, user_name: string, user_email: string, user_role: 'customer' | 'manager' | 'admin') => {
  return logActivity({
    user_id,
    user_name,
    user_email,
    user_role,
    action: 'login',
    description: `${user_name} logged in`,
  });
};

export const logUserLogout = (user_id: string, user_name: string, user_email: string, user_role: 'customer' | 'manager' | 'admin') => {
  return logActivity({
    user_id,
    user_name,
    user_email,
    user_role,
    action: 'logout',
    description: `${user_name} logged out`,
  });
};

export const logCarCreated = (user_id: string, user_name: string, user_email: string, user_role: 'customer' | 'manager' | 'admin', car_id: string, car_name: string) => {
  return logActivity({
    user_id,
    user_name,
    user_email,
    user_role,
    action: 'created_car',
    description: `${user_name} created car: ${car_name}`,
    entity_type: 'car',
    entity_id: car_id,
  });
};

export const logCarUpdated = (user_id: string, user_name: string, user_email: string, user_role: 'customer' | 'manager' | 'admin', car_id: string, car_name: string) => {
  return logActivity({
    user_id,
    user_name,
    user_email,
    user_role,
    action: 'updated_car',
    description: `${user_name} updated car: ${car_name}`,
    entity_type: 'car',
    entity_id: car_id,
  });
};

export const logCarDeleted = (user_id: string, user_name: string, user_email: string, user_role: 'customer' | 'manager' | 'admin', car_id: string, car_name: string) => {
  return logActivity({
    user_id,
    user_name,
    user_email,
    user_role,
    action: 'deleted_car',
    description: `${user_name} deleted car: ${car_name}`,
    entity_type: 'car',
    entity_id: car_id,
  });
};

export const logBookingCreated = (user_id: string, user_name: string, user_email: string, user_role: 'customer' | 'manager' | 'admin', booking_id: string, car_name: string) => {
  return logActivity({
    user_id,
    user_name,
    user_email,
    user_role,
    action: 'created_booking',
    description: `${user_name} created booking for ${car_name}`,
    entity_type: 'booking',
    entity_id: booking_id,
  });
};

export const logBookingUpdated = (user_id: string, user_name: string, user_email: string, user_role: 'customer' | 'manager' | 'admin', booking_id: string, status: string) => {
  return logActivity({
    user_id,
    user_name,
    user_email,
    user_role,
    action: 'updated_booking',
    description: `${user_name} updated booking status to ${status}`,
    entity_type: 'booking',
    entity_id: booking_id,
    metadata: { new_status: status },
  });
};

export const logBookingCancelled = (user_id: string, user_name: string, user_email: string, user_role: 'customer' | 'manager' | 'admin', booking_id: string, reason?: string) => {
  return logActivity({
    user_id,
    user_name,
    user_email,
    user_role,
    action: 'cancelled_booking',
    description: `${user_name} cancelled booking${reason ? `: ${reason}` : ''}`,
    entity_type: 'booking',
    entity_id: booking_id,
    metadata: reason ? { reason } : undefined,
  });
};

export const logContractSigned = (user_id: string, user_name: string, user_email: string, user_role: 'customer' | 'manager' | 'admin', contract_id: string) => {
  return logActivity({
    user_id,
    user_name,
    user_email,
    user_role,
    action: 'signed_contract',
    description: `${user_name} signed contract`,
    entity_type: 'contract',
    entity_id: contract_id,
  });
};

export const logUserVerified = (admin_id: string, admin_name: string, admin_email: string, user_id: string, user_name: string, status: 'approved' | 'rejected') => {
  return logActivity({
    user_id: admin_id,
    user_name: admin_name,
    user_email: admin_email,
    user_role: 'admin',
    action: `user_${status}`,
    description: `${admin_name} ${status} user: ${user_name}`,
    entity_type: 'user',
    entity_id: user_id,
  });
};

export const logSettingsUpdated = (user_id: string, user_name: string, user_email: string, user_role: 'customer' | 'manager' | 'admin', settings_type: string) => {
  return logActivity({
    user_id,
    user_name,
    user_email,
    user_role,
    action: 'updated_settings',
    description: `${user_name} updated ${settings_type} settings`,
    entity_type: 'settings',
  });
};
