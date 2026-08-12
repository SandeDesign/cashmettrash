import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { validateEmail, validatePassword } from '../../utils/validation';
import PublicHeader from '../layout/PublicHeader';

const SimpleRegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const { register, loading, error } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errors: Record<string, string> = {};

    if (!formData.firstName) {
      errors.firstName = 'Naam is verplicht';
    }

    if (!formData.email) {
      errors.email = 'E-mailadres is verplicht';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Ongeldig e-mailadres';
    }

    if (!formData.password) {
      errors.password = 'Wachtwoord is verplicht';
    } else if (!validatePassword(formData.password)) {
      errors.password = 'Wachtwoord moet minimaal 8 karakters zijn';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Bevestig uw wachtwoord';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Wachtwoorden komen niet overeen';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await register({
        firstName: formData.firstName,
        email: formData.email,
        password: formData.password
      });
      // After successful registration, redirect to onboarding wizard
      navigate('/onboarding');
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      <PublicHeader />
      <div className="flex items-center justify-center p-4 pt-32">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Maak een account aan</h1>
          <p className="text-neutral-500">
            Start met het huren van premium auto's
          </p>
        </div>

        <div className="vl-card p-6 lg:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-white mb-2">
                Naam
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  autoComplete="given-name"
                  className={`vl-input !pl-12 ${formErrors.firstName ? 'border-red-500' : ''}`}
                  placeholder="Jouw naam"
                />
              </div>
              {formErrors.firstName && (
                <p className="mt-1 text-sm text-red-500">{formErrors.firstName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                E-mailadres
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  className={`vl-input !pl-12 ${formErrors.email ? 'border-red-500' : ''}`}
                  placeholder="jouw@email.nl"
                />
              </div>
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Wachtwoord
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className={`vl-input !pl-12 pr-12 ${formErrors.password ? 'border-red-500' : ''}`}
                  placeholder="Minimaal 8 karakters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-white transition-colors z-10"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formErrors.password && (
                <p className="mt-1 text-sm text-red-500">{formErrors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2">
                Bevestig wachtwoord
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className={`vl-input !pl-12 pr-12 ${formErrors.confirmPassword ? 'border-red-500' : ''}`}
                  placeholder="Herhaal wachtwoord"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-white transition-colors z-10"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">{formErrors.confirmPassword}</p>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="vl-alert vl-alert-error">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="vl-btn-primary w-full"
            >
              {loading ? 'Account aanmaken...' : 'Account aanmaken'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-neutral-500">Heb je al een account? </span>
            <Link to="/login" className="text-green-400 hover:text-green-300 font-medium transition-colors">
              Inloggen
            </Link>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default SimpleRegisterForm;
