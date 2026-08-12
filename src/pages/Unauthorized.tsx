import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--vl-bg-primary)' }}>
      <div className="max-w-md w-full text-center">
        <div className="vl-card p-8 rounded-lg shadow-md">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            Geen toegang
          </h1>
          <p className="text-neutral-500 mb-6">
            U heeft geen toestemming om deze pagina te bekijken. Neem contact op met een beheerder als u denkt dat dit een vergissing is.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Terug naar dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;