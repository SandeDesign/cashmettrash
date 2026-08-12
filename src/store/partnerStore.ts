import { create } from 'zustand';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PartnerContract, User, Car, ServiceChangeRequest } from '../types';

interface PartnerStore {
  // Partner applications (users with role 'partner' and verification_status 'pending')
  pendingPartners: User[];
  allPartners: User[];
  partnerContracts: PartnerContract[];
  partnerCars: Car[];
  serviceChangeRequests: ServiceChangeRequest[];
  loading: boolean;
  error: string | null;

  // Admin: fetch all partner applications
  fetchPendingPartners: () => Promise<void>;
  fetchAllPartners: () => Promise<void>;

  // Admin: approve/reject partner
  approvePartner: (partnerId: string, adminId: string) => Promise<void>;
  rejectPartner: (partnerId: string, adminId: string) => Promise<void>;

  // Partner contracts
  createPartnerContract: (contractData: Omit<PartnerContract, 'id' | 'created_at' | 'updated_at'>) => Promise<PartnerContract>;
  fetchPartnerContracts: (partnerId?: string) => Promise<void>;
  signPartnerContract: (contractId: string, signatureUrl: string) => Promise<void>;

  // Partner cars
  fetchPartnerCars: (partnerId: string) => Promise<void>;
  subscribeToPartnerCars: (partnerId: string) => () => void;

  // Service change requests
  createServiceChangeRequest: (data: Omit<ServiceChangeRequest, 'id' | 'status' | 'created_at' | 'updated_at'>) => Promise<ServiceChangeRequest>;
  fetchServiceChangeRequests: (partnerId?: string) => Promise<void>;
  approveServiceChangeRequest: (requestId: string, adminId: string) => Promise<void>;
  rejectServiceChangeRequest: (requestId: string, adminId: string, reason: string) => Promise<void>;
}

export const usePartnerStore = create<PartnerStore>((set, get) => ({
  pendingPartners: [],
  allPartners: [],
  partnerContracts: [],
  partnerCars: [],
  serviceChangeRequests: [],
  loading: false,
  error: null,

  fetchPendingPartners: async () => {
    try {
      set({ loading: true, error: null });
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'partner'),
        where('verification_status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      const partners = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
      })) as User[];
      set({ pendingPartners: partners, loading: false });
    } catch (error: any) {
      console.error('Error fetching pending partners:', error);
      set({ error: error.message, loading: false });
    }
  },

  fetchAllPartners: async () => {
    try {
      set({ loading: true, error: null });
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'partner')
      );
      const snapshot = await getDocs(q);
      const partners = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
      })) as User[];
      set({ allPartners: partners, loading: false });
    } catch (error: any) {
      console.error('Error fetching all partners:', error);
      set({ error: error.message, loading: false });
    }
  },

  approvePartner: async (partnerId: string, adminId: string) => {
    try {
      set({ loading: true, error: null });
      const userRef = doc(db, 'users', partnerId);
      await updateDoc(userRef, {
        verification_status: 'approved',
        updated_at: Timestamp.now(),
      });
      // Refresh lists
      await get().fetchPendingPartners();
      await get().fetchAllPartners();
      set({ loading: false });
    } catch (error: any) {
      console.error('Error approving partner:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  rejectPartner: async (partnerId: string, adminId: string) => {
    try {
      set({ loading: true, error: null });
      const userRef = doc(db, 'users', partnerId);
      await updateDoc(userRef, {
        verification_status: 'rejected',
        updated_at: Timestamp.now(),
      });
      await get().fetchPendingPartners();
      await get().fetchAllPartners();
      set({ loading: false });
    } catch (error: any) {
      console.error('Error rejecting partner:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  createPartnerContract: async (contractData) => {
    try {
      set({ loading: true, error: null });
      const contractRef = doc(collection(db, 'partner_contracts'));
      const contract: PartnerContract = {
        ...contractData,
        id: contractRef.id,
        signed: false,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await setDoc(contractRef, contract);
      set({ loading: false });
      return contract;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchPartnerContracts: async (partnerId?: string) => {
    try {
      set({ loading: true, error: null });
      let q;
      if (partnerId) {
        q = query(
          collection(db, 'partner_contracts'),
          where('partner_id', '==', partnerId),
          orderBy('created_at', 'desc')
        );
      } else {
        q = query(
          collection(db, 'partner_contracts'),
          orderBy('created_at', 'desc')
        );
      }
      const snapshot = await getDocs(q);
      const contracts = snapshot.docs.map(doc => doc.data() as PartnerContract);
      set({ partnerContracts: contracts, loading: false });
    } catch (error: any) {
      console.error('Error fetching partner contracts:', error);
      set({ error: error.message, loading: false });
    }
  },

  signPartnerContract: async (contractId: string, signatureUrl: string) => {
    try {
      set({ loading: true, error: null });
      const contractRef = doc(db, 'partner_contracts', contractId);
      await updateDoc(contractRef, {
        partner_signature_url: signatureUrl,
        signed: true,
        signed_at: new Date().toISOString(),
        status: 'signed',
        updated_at: new Date().toISOString(),
      });
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchPartnerCars: async (partnerId: string) => {
    try {
      set({ loading: true, error: null });
      const q = query(
        collection(db, 'cars'),
        where('submitted_by_partner', '==', partnerId),
        orderBy('created_at', 'desc')
      );
      const snapshot = await getDocs(q);
      const cars = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        updated_at: doc.data().updated_at?.toDate?.()?.toISOString() || new Date().toISOString(),
      })) as Car[];
      set({ partnerCars: cars, loading: false });
    } catch (error: any) {
      console.error('Error fetching partner cars:', error);
      set({ error: error.message, loading: false });
    }
  },

  subscribeToPartnerCars: (partnerId: string) => {
    const q = query(
      collection(db, 'cars'),
      where('submitted_by_partner', '==', partnerId),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const cars = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
          updated_at: doc.data().updated_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        })) as Car[];
        set({ partnerCars: cars, loading: false, error: null });
      },
      (error) => {
        console.error('Error in partner cars subscription:', error);
        set({ error: error.message, loading: false });
      }
    );

    return unsubscribe;
  },

  createServiceChangeRequest: async (data) => {
    try {
      set({ loading: true, error: null });
      const requestRef = doc(collection(db, 'service_change_requests'));
      const request: ServiceChangeRequest = {
        ...data,
        id: requestRef.id,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await setDoc(requestRef, request);

      // Mark pending on user profile
      const userRef = doc(db, 'users', data.partner_id);
      await updateDoc(userRef, {
        pending_service_change: requestRef.id,
        updated_at: Timestamp.now(),
      });

      set({ loading: false });
      return request;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchServiceChangeRequests: async (partnerId?: string) => {
    try {
      set({ loading: true, error: null });
      let q;
      if (partnerId) {
        q = query(
          collection(db, 'service_change_requests'),
          where('partner_id', '==', partnerId),
          orderBy('created_at', 'desc')
        );
      } else {
        q = query(
          collection(db, 'service_change_requests'),
          orderBy('created_at', 'desc')
        );
      }
      const snapshot = await getDocs(q);
      const requests = snapshot.docs.map(d => d.data() as ServiceChangeRequest);
      set({ serviceChangeRequests: requests, loading: false });
    } catch (error: any) {
      console.error('Error fetching service change requests:', error);
      set({ error: error.message, loading: false });
    }
  },

  approveServiceChangeRequest: async (requestId: string, adminId: string) => {
    try {
      set({ loading: true, error: null });
      const requestRef = doc(db, 'service_change_requests', requestId);
      const requestDoc = await getDoc(requestRef);
      if (!requestDoc.exists()) throw new Error('Wijzigingsverzoek niet gevonden');

      const request = requestDoc.data() as ServiceChangeRequest;

      // Update the request status
      await updateDoc(requestRef, {
        status: 'approved',
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Apply changes to user profile
      const userRef = doc(db, 'users', request.partner_id);
      await updateDoc(userRef, {
        partner_type: request.requested_partner_type,
        offers_maintenance: request.requested_offers_maintenance,
        garage_services: request.requested_garage_services,
        pending_service_change: null,
        updated_at: Timestamp.now(),
      });

      // Check if new agreements need to be signed
      const needsDealer = (request.requested_partner_type === 'dealer' || request.requested_partner_type === 'both');
      const needsGarage = (request.requested_partner_type === 'garage' || request.requested_partner_type === 'both');
      const hadDealer = (request.current_partner_type === 'dealer' || request.current_partner_type === 'both');
      const hadGarage = (request.current_partner_type === 'garage' || request.current_partner_type === 'both');

      // Get partner user data for contract
      const userDoc = await getDoc(doc(db, 'users', request.partner_id));
      const partnerData = userDoc.exists() ? userDoc.data() : null;

      if (needsDealer && !hadDealer && partnerData) {
        // Create unsigned dealer agreement
        const contractRef = doc(collection(db, 'contracts'));
        await setDoc(contractRef, {
          id: contractRef.id,
          booking_id: '',
          customer_id: request.partner_id,
          customer_name: request.partner_name,
          customer_email: partnerData.company_email || partnerData.email || '',
          customer_phone: partnerData.company_phone || partnerData.phone || '',
          car_id: '',
          car_info: request.partner_company,
          start_date: new Date().toISOString(),
          weeks_rented: 0,
          weekly_rate: 0,
          total_price: 0,
          contract_html: '',
          customer_signature_url: '',
          admin_signature_url: '',
          signed: false,
          signed_at: null,
          status: 'pending',
          contract_type: 'dealer_agreement',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        // Send notification
        const notifRef = doc(collection(db, 'notifications'));
        await setDoc(notifRef, {
          id: notifRef.id,
          user_id: request.partner_id,
          type: 'general',
          title: 'Nieuwe overeenkomst beschikbaar',
          message: 'Je diensten zijn gewijzigd. Teken de dealer overeenkomst in je documenten.',
          link: '/partner/documents',
          read: false,
          created_at: new Date().toISOString(),
        });
      }

      if (needsGarage && !hadGarage && partnerData) {
        // Create unsigned garage agreement
        const contractRef = doc(collection(db, 'contracts'));
        await setDoc(contractRef, {
          id: contractRef.id,
          booking_id: '',
          customer_id: request.partner_id,
          customer_name: request.partner_name,
          customer_email: partnerData.company_email || partnerData.email || '',
          customer_phone: partnerData.company_phone || partnerData.phone || '',
          car_id: '',
          car_info: request.partner_company,
          start_date: new Date().toISOString(),
          weeks_rented: 0,
          weekly_rate: 0,
          total_price: 0,
          contract_html: '',
          customer_signature_url: '',
          admin_signature_url: '',
          signed: false,
          signed_at: null,
          status: 'pending',
          contract_type: 'garage_agreement',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        const notifRef = doc(collection(db, 'notifications'));
        await setDoc(notifRef, {
          id: notifRef.id,
          user_id: request.partner_id,
          type: 'general',
          title: 'Nieuwe overeenkomst beschikbaar',
          message: 'Je diensten zijn gewijzigd. Teken de garage overeenkomst in je documenten.',
          link: '/partner/documents',
          read: false,
          created_at: new Date().toISOString(),
        });
      }

      await get().fetchServiceChangeRequests();
      await get().fetchAllPartners();
      set({ loading: false });
    } catch (error: any) {
      console.error('Error approving service change request:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  rejectServiceChangeRequest: async (requestId: string, adminId: string, reason: string) => {
    try {
      set({ loading: true, error: null });
      const requestRef = doc(db, 'service_change_requests', requestId);
      const requestDoc = await getDoc(requestRef);
      if (!requestDoc.exists()) throw new Error('Wijzigingsverzoek niet gevonden');

      const request = requestDoc.data() as ServiceChangeRequest;

      await updateDoc(requestRef, {
        status: 'rejected',
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        rejection_reason: reason,
        updated_at: new Date().toISOString(),
      });

      // Remove pending flag from user
      const userRef = doc(db, 'users', request.partner_id);
      await updateDoc(userRef, {
        pending_service_change: null,
        updated_at: Timestamp.now(),
      });

      await get().fetchServiceChangeRequests();
      set({ loading: false });
    } catch (error: any) {
      console.error('Error rejecting service change request:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));
