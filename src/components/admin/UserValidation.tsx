import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { User, DriverLicense } from '../../types';
import { CheckCircle, XCircle, Loader2, Calendar, CreditCard, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { logActivity } from '../../utils/activityLogger';

interface UserWithLicense extends User {
  driver_license: DriverLicense;
}

const UserValidation: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<UserWithLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithLicense | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'users'),
        where('verification_status', '==', 'pending')
      );

      const snapshot = await getDocs(q);
      const users = snapshot.docs
        .map(doc => ({ ...doc.data(), uid: doc.id } as UserWithLicense))
        .filter(user => user.driver_license && user.role !== 'partner');

      setPendingUsers(users);
    } catch (error) {
      console.error('Error loading pending users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    if (!currentUser) return;

    setProcessing(userId);
    try {
      await updateDoc(doc(db, 'users', userId), {
        verification_status: 'approved',
        'driver_license.verified': true,
        'driver_license.verified_at': new Date().toISOString(),
        'driver_license.verified_by': currentUser.uid,
        updated_at: new Date().toISOString()
      });

      const approvedUser = pendingUsers.find(u => u.uid === userId);
      await logActivity({
        user_id: currentUser.uid,
        user_name: currentUser.name,
        user_email: currentUser.email,
        user_role: 'admin',
        action: 'approve_user',
        description: `Gebruiker ${approvedUser?.name || userId} goedgekeurd en geverifieerd`,
        entity_type: 'user',
        entity_id: userId,
      });

      // Remove from pending list
      setPendingUsers(prev => prev.filter(u => u.uid !== userId));
      setSelectedUser(null);
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Fout bij goedkeuren gebruiker');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (userId: string) => {
    if (!currentUser) return;

    const reason = prompt('Reden voor afwijzing:');
    if (!reason) return;

    setProcessing(userId);
    try {
      await updateDoc(doc(db, 'users', userId), {
        verification_status: 'rejected',
        rejection_reason: reason,
        updated_at: new Date().toISOString()
      });

      const rejectedUser = pendingUsers.find(u => u.uid === userId);
      await logActivity({
        user_id: currentUser.uid,
        user_name: currentUser.name,
        user_email: currentUser.email,
        user_role: 'admin',
        action: 'reject_user',
        description: `Gebruiker ${rejectedUser?.name || userId} afgewezen: ${reason}`,
        entity_type: 'user',
        entity_id: userId,
      });

      // Remove from pending list
      setPendingUsers(prev => prev.filter(u => u.uid !== userId));
      setSelectedUser(null);
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert('Fout bij afwijzen gebruiker');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (pendingUsers.length === 0) {
    return (
      <div className="vl-card rounded-lg shadow-sm border border-white/[0.1] p-8 text-center">
        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">
          Geen wachtende gebruikers
        </h3>
        <p className="text-neutral-500">
          Er zijn op dit moment geen gebruikers die wachten op validatie.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="vl-card rounded-lg shadow-sm border border-white/[0.1]">
        <div className="px-6 py-4 border-b border-white/[0.1]">
          <h3 className="text-lg font-semibold text-white">
            Wachtende gebruikers ({pendingUsers.length})
          </h3>
        </div>

        <div className="divide-y divide-white/[0.05]">
          {pendingUsers.map(user => (
            <div
              key={user.uid}
              onClick={() => navigate(`/admin/users/${user.uid}/verify`)}
              className="px-6 py-4 hover:bg-white/[0.04] transition-colors cursor-pointer flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold mr-3 flex-shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-white truncate">{user.name}</h4>
                    <p className="text-sm text-neutral-500 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-4 text-sm ml-[52px]">
                  <div className="flex items-center text-neutral-500">
                    <Calendar className="w-4 h-4 mr-1 flex-shrink-0" />
                    Aangemeld: {new Date(user.created_at).toLocaleDateString('nl-NL')}
                  </div>
                  <div className="flex items-center text-neutral-500">
                    <CreditCard className="w-4 h-4 mr-1 flex-shrink-0" />
                    Rijbewijs: {user.driver_license.number}
                  </div>
                </div>
              </div>
              <Shield className="w-5 h-5 text-green-400 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="vl-card rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-white/[0.1] flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Gebruikersdetails</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-neutral-600 hover:text-neutral-500"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Personal Info */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Persoonlijke gegevens</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-neutral-500">Naam</label>
                    <p className="text-white">{selectedUser.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-500">Email</label>
                    <p className="text-white">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-500">Telefoon</label>
                    <p className="text-white">{selectedUser.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-500">Geboortedatum</label>
                    <p className="text-white">{selectedUser.date_of_birth}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-neutral-500">Adres</label>
                    <p className="text-white">{selectedUser.address}</p>
                  </div>
                </div>
              </div>

              {/* Driver License Info */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Rijbewijs informatie</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium text-neutral-500">Rijbewijsnummer</label>
                    <p className="text-white">{selectedUser.driver_license.number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-500">Naam op rijbewijs</label>
                    <p className="text-white">
                      {selectedUser.driver_license.first_name} {selectedUser.driver_license.last_name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-500">Geboortedatum</label>
                    <p className="text-white">{selectedUser.driver_license.date_of_birth || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-500">Vervaldatum</label>
                    <p className="text-white">{selectedUser.driver_license.expiry_date || '-'}</p>
                  </div>
                </div>

                {/* License Image */}
                {selectedUser.driver_license.front_image_url && (
                  <div>
                    <label className="text-sm font-medium text-neutral-500 block mb-2">
                      Rijbewijs foto (voorkant)
                    </label>
                    <img
                      src={selectedUser.driver_license.front_image_url}
                      alt="Rijbewijs voorkant"
                      className="max-w-full h-auto rounded-lg border border-white/[0.12]"
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-white/[0.1]">
                <button
                  onClick={() => handleApprove(selectedUser.uid)}
                  disabled={processing === selectedUser.uid}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center disabled:opacity-50"
                >
                  {processing === selectedUser.uid ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Bezig...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Gebruiker goedkeuren
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleReject(selectedUser.uid)}
                  disabled={processing === selectedUser.uid}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center justify-center disabled:opacity-50"
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  Afwijzen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserValidation;
