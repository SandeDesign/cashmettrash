// src/pages/klant/Profiel.tsx
import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { KLANT_NAV } from '../../components/layout/navItems';
import Loading from '../../components/shared/Loading';
import { useAuth } from '../../hooks/useAuth';
import { useCustomerStore } from '../../store/customerStore';
import { validateDutchPhone, validateDutchPostcode } from '../../utils/validation';

const Profiel: React.FC = () => {
  const { user } = useAuth();
  const { customer, loading, loadCustomer, updateCustomer } = useCustomerStore();

  const [velden, setVelden] = useState({ adres: '', postcode: '', plaats: '', telefoon: '' });
  const [fout, setFout] = useState<string | null>(null);
  const [opgeslagen, setOpgeslagen] = useState(false);
  const [bezig, setBezig] = useState(false);

  useEffect(() => {
    if (user) loadCustomer(user.uid);
  }, [user, loadCustomer]);

  useEffect(() => {
    if (customer) {
      setVelden({
        adres: customer.adres,
        postcode: customer.postcode,
        plaats: customer.plaats,
        telefoon: customer.telefoon,
      });
    }
  }, [customer]);

  const zet = (sleutel: keyof typeof velden) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setVelden((v) => ({ ...v, [sleutel]: e.target.value }));
    setOpgeslagen(false);
  };

  const verstuur = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!velden.adres.trim()) return setFout('Vul je straat en huisnummer in');
    if (!validateDutchPostcode(velden.postcode)) return setFout('Vul een geldige postcode in');
    if (!velden.plaats.trim()) return setFout('Vul je woonplaats in');
    if (!validateDutchPhone(velden.telefoon)) return setFout('Vul een geldig telefoonnummer in');

    setFout(null);
    setBezig(true);

    try {
      await updateCustomer(user.uid, {
        adres: velden.adres.trim(),
        postcode: velden.postcode,
        plaats: velden.plaats.trim(),
        telefoon: velden.telefoon.trim(),
      });
      setOpgeslagen(true);
    } catch (error: unknown) {
      setFout(error instanceof Error ? error.message : 'Opslaan mislukt');
    } finally {
      setBezig(false);
    }
  };

  return (
    <AppLayout nav={KLANT_NAV} title="Mijn gegevens">
      <div className="max-w-md">
        {loading && !customer ? (
          <Loading />
        ) : (
          <form onSubmit={verstuur} className="cmt-card cmt-animate-in">
            <p className="text-sm mb-5" style={{ color: 'var(--cmt-ink-soft)' }}>
              Op dit adres komt Jayce langs.
            </p>

            {fout && (
              <div className="cmt-alert cmt-alert-error mb-4">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{fout}</span>
              </div>
            )}

            {opgeslagen && (
              <div className="cmt-alert cmt-alert-success mb-4">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span>Je gegevens zijn opgeslagen.</span>
              </div>
            )}

            <div className="mb-4">
              <label className="cmt-label" htmlFor="adres">
                Straat en huisnummer
              </label>
              <input id="adres" className="cmt-input" value={velden.adres} onChange={zet('adres')} />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="cmt-label" htmlFor="postcode">
                  Postcode
                </label>
                <input
                  id="postcode"
                  className="cmt-input"
                  value={velden.postcode}
                  onChange={zet('postcode')}
                />
              </div>
              <div>
                <label className="cmt-label" htmlFor="plaats">
                  Plaats
                </label>
                <input
                  id="plaats"
                  className="cmt-input"
                  value={velden.plaats}
                  onChange={zet('plaats')}
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="cmt-label" htmlFor="telefoon">
                Telefoonnummer
              </label>
              <input
                id="telefoon"
                type="tel"
                className="cmt-input"
                value={velden.telefoon}
                onChange={zet('telefoon')}
              />
            </div>

            <button type="submit" className="cmt-btn-primary" disabled={bezig}>
              {bezig ? 'Opslaan...' : 'Opslaan'}
            </button>
          </form>
        )}
      </div>
    </AppLayout>
  );
};

export default Profiel;
