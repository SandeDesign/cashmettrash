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
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Contract } from '../types';

interface ContractStore {
  contracts: Contract[];
  loading: boolean;
  error: string | null;

  // CRUD operations
  createContract: (contractData: Omit<Contract, 'id' | 'created_at' | 'updated_at'>) => Promise<Contract>;
  getContract: (contractId: string) => Promise<Contract | null>;
  getContractByBooking: (bookingId: string) => Promise<Contract | null>;
  updateContract: (contractId: string, updates: Partial<Contract>) => Promise<void>;
  signContract: (contractId: string, customerSignatureUrl: string) => Promise<void>;
  terminateContract: (contractId: string, reason: string, userId: string) => Promise<void>;
  generateContractPDF: (contractId: string) => Promise<string>; // Returns PDF URL
  createExtensionContract: (bookingId: string, customerId: string, extensionType: '6_months' | '12_months') => Promise<Contract>;

  // Queries
  fetchCustomerContracts: (customerId: string) => Promise<void>;
  fetchAllContracts: () => Promise<void>;
}

export const useContractStore = create<ContractStore>((set, get) => ({
  contracts: [],
  loading: false,
  error: null,

  createContract: async (contractData) => {
    try {
      set({ loading: true, error: null });

      const contractRef = doc(collection(db, 'contracts'));
      const contract: Contract = {
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

  getContract: async (contractId) => {
    try {
      set({ loading: true, error: null });

      const contractRef = doc(db, 'contracts', contractId);
      const contractSnap = await getDoc(contractRef);

      set({ loading: false });

      if (contractSnap.exists()) {
        return contractSnap.data() as Contract;
      }
      return null;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  getContractByBooking: async (bookingId) => {
    try {
      set({ loading: true, error: null });

      const q = query(
        collection(db, 'contracts'),
        where('booking_id', '==', bookingId)
      );

      const querySnapshot = await getDocs(q);

      set({ loading: false });

      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data() as Contract;
      }
      return null;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateContract: async (contractId, updates) => {
    try {
      set({ loading: true, error: null });

      const contractRef = doc(db, 'contracts', contractId);
      await updateDoc(contractRef, {
        ...updates,
        updated_at: new Date().toISOString(),
      });

      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  signContract: async (contractId, customerSignatureUrl) => {
    try {
      set({ loading: true, error: null });

      const contractRef = doc(db, 'contracts', contractId);
      const contractSnap = await getDoc(contractRef);
      const signedAt = new Date().toISOString();

      await updateDoc(contractRef, {
        customer_signature_url: customerSignatureUrl,
        signed: true,
        signed_at: signedAt,
        status: 'signed',
        updated_at: signedAt,
      });

      // Also mark the car as having a signed contract
      if (contractSnap.exists()) {
        const contractData = contractSnap.data() as Contract;
        if (contractData.car_id) {
          await updateDoc(doc(db, 'cars', contractData.car_id), {
            contract_signed: true,
            contract_signed_at: signedAt,
            active_contract_id: contractId,
            updated_at: Timestamp.now(),
          });
        }
      }

      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  terminateContract: async (contractId, reason, userId) => {
    try {
      set({ loading: true, error: null });

      const contractRef = doc(db, 'contracts', contractId);
      await updateDoc(contractRef, {
        status: 'terminated',
        terminated_at: new Date().toISOString(),
        terminated_by: userId,
        termination_reason: reason,
        updated_at: new Date().toISOString(),
      });

      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  generateContractPDF: async (contractId) => {
    try {
      set({ loading: true, error: null });

      const contract = await get().getContract(contractId);
      if (!contract) {
        throw new Error('Contract niet gevonden');
      }

      // PDF generatie gebeurt in een utility functie
      // Hier alleen de URL opslaan
      const pdfUrl = `https://internedata.nl/uploads/vlottr/contracts/${contractId}.pdf`;

      await get().updateContract(contractId, {
        pdf_url: pdfUrl,
        status: 'completed',
      });

      set({ loading: false });
      return pdfUrl;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchCustomerContracts: async (customerId) => {
    try {
      set({ loading: true, error: null });

      const q = query(
        collection(db, 'contracts'),
        where('customer_id', '==', customerId),
        orderBy('created_at', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const contracts = querySnapshot.docs.map(doc => doc.data() as Contract);

      set({ contracts, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchAllContracts: async () => {
    try {
      set({ loading: true, error: null });

      const q = query(
        collection(db, 'contracts'),
        orderBy('created_at', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const contracts = querySnapshot.docs.map(doc => doc.data() as Contract);

      set({ contracts, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  createExtensionContract: async (bookingId, customerId, extensionType) => {
    try {
      set({ loading: true, error: null });

      const extensionContractData = {
        booking_id: bookingId,
        customer_id: customerId,
        type: 'extension' as const,
        extension_type: extensionType,
        contract_number: `EXT-${Date.now()}`,
        signed: false,
        status: 'pending' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const contract = await get().createContract(extensionContractData);
      set({ loading: false });
      return contract;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));
