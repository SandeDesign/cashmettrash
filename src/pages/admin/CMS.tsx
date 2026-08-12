import React, { useState, useEffect } from 'react';
import { FileText, Save, Loader2, AlertCircle } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';

const AdminCMS: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [content, setContent] = useState({
    home_title: '',
    home_subtitle: '',
    home_description: '',
    about_text: '',
    contact_email: '',
    contact_phone: '',
  });

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'settings', 'cms');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setContent({
          home_title: docSnap.data().home_title || '',
          home_subtitle: docSnap.data().home_subtitle || '',
          home_description: docSnap.data().home_description || '',
          about_text: docSnap.data().about_text || '',
          contact_email: docSnap.data().contact_email || '',
          contact_phone: docSnap.data().contact_phone || '',
        });
      }
    } catch (err: any) {
      console.error('Error loading CMS content:', err);
      setError('Fout bij laden van content');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const docRef = doc(db, 'settings', 'cms');
      await updateDoc(docRef, {
        ...content,
        updated_at: new Date().toISOString(),
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving CMS content:', err);
      setError(err.message || 'Fout bij opslaan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Header />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-2">
                Content Management
              </h1>
              <p className="text-neutral-500">
                Beheer de content van de website
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-green-400 mr-3" />
                <span className="text-neutral-500">Content laden...</span>
              </div>
            ) : (
              <>
                {/* Messages */}
                {success && (
                  <div className="mb-6 vl-alert vl-alert-success">
                    <AlertCircle className="w-5 h-5" />
                    <span>Content succesvol opgeslagen!</span>
                  </div>
                )}

                {error && (
                  <div className="mb-6 vl-alert vl-alert-error">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Content Form */}
                <div className="space-y-6">
                  {/* Homepage */}
                  <div className="vl-card p-6 rounded-lg shadow-sm border border-white/[0.1]">
                    <h2 className="text-lg font-medium text-white mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Homepage Content
                    </h2>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Titel
                        </label>
                        <input
                          type="text"
                          value={content.home_title}
                          onChange={(e) => setContent({ ...content, home_title: e.target.value })}
                          className="vl-input w-full"
                          placeholder="Bijv. Welkom bij Vlottr"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Subtitel
                        </label>
                        <input
                          type="text"
                          value={content.home_subtitle}
                          onChange={(e) => setContent({ ...content, home_subtitle: e.target.value })}
                          className="vl-input w-full"
                          placeholder="Bijv. Premium auto verhuur per week"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Beschrijving
                        </label>
                        <textarea
                          value={content.home_description}
                          onChange={(e) => setContent({ ...content, home_description: e.target.value })}
                          className="vl-textarea w-full"
                          placeholder="Beschrijving van de service..."
                          rows={4}
                        />
                      </div>
                    </div>
                  </div>

                  {/* About */}
                  <div className="vl-card p-6 rounded-lg shadow-sm border border-white/[0.1]">
                    <h2 className="text-lg font-medium text-white mb-4">
                      Over Ons
                    </h2>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Over ons tekst
                      </label>
                      <textarea
                        value={content.about_text}
                        onChange={(e) => setContent({ ...content, about_text: e.target.value })}
                        className="vl-textarea w-full"
                        placeholder="Beschrijf het bedrijf..."
                        rows={6}
                      />
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="vl-card p-6 rounded-lg shadow-sm border border-white/[0.1]">
                    <h2 className="text-lg font-medium text-white mb-4">
                      Contact Informatie
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={content.contact_email}
                          onChange={(e) => setContent({ ...content, contact_email: e.target.value })}
                          className="vl-input w-full"
                          placeholder="info@vlottr.nl"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Telefoonnummer
                        </label>
                        <input
                          type="tel"
                          value={content.contact_phone}
                          onChange={(e) => setContent({ ...content, contact_phone: e.target.value })}
                          className="vl-input w-full"
                          placeholder="+31 6 12345678"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={loadContent}
                      className="vl-btn-secondary"
                      disabled={saving}
                    >
                      Reset
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="vl-btn-primary"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Opslaan...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Opslaan
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
};

export default AdminCMS;
