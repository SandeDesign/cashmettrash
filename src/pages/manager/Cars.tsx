import React, { useState, useEffect } from 'react';
import { Car as CarIcon, Plus, Search, Filter, Edit, Trash2, Eye, Loader2, Wrench, Calendar, Shield, AlertCircle, CheckCircle, FileSignature } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';
import CarFormModal from '../../components/manager/CarFormModal';
import { useCarStore } from '../../store/carStore';
import { useAuth } from '../../hooks/useAuth';
import { useModal } from '../../contexts/ModalContext';
import { Car } from '../../types';

const ManagerCars: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { cars, loading, fetchCars, subscribeToCars, deleteCar } = useCarStore();
  const { showConfirm, showError } = useModal();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [deletingCarId, setDeletingCarId] = useState<string | null>(null);

  // Fetch cars on mount - managers/admins see ALL cars
  useEffect(() => {
    if (user && (user.role === 'manager' || user.role === 'admin')) {
      // Subscribe to ALL cars, no filter
      const unsubscribe = subscribeToCars();
      return () => unsubscribe();
    }
  }, [user, subscribeToCars]);

  // Filter cars based on search and status
  const filteredCars = cars.filter(car => {
    const matchesSearch = !searchTerm ||
      car.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.license_plate?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || car.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleAddCar = () => {
    setEditingCar(null);
    setIsModalOpen(true);
  };

  const handleEditCar = (car: Car) => {
    setEditingCar(car);
    setIsModalOpen(true);
  };

  const handleDeleteCar = async (carId: string) => {
    const confirmed = await showConfirm(
      'Auto verwijderen',
      'Weet u zeker dat u deze auto wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.',
      async () => {
        setDeletingCarId(carId);
        try {
          await deleteCar(carId);
        } catch (error) {
          console.error('Error deleting car:', error);
          showError('Er is een fout opgetreden bij het verwijderen van de auto. Probeer het opnieuw.');
        } finally {
          setDeletingCarId(null);
        }
      },
      'error'
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'rented': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-white';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Beschikbaar';
      case 'rented': return 'Verhuurd';
      case 'maintenance': return 'Onderhoud';
      default: return status;
    }
  };

  const getMaintenanceStatus = (car: Car) => {
    const now = new Date();
    const warnings = [];

    // Check APK
    if (car.apk_expiry_date) {
      const apkDate = new Date(car.apk_expiry_date);
      const daysUntilExpiry = Math.floor((apkDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry < 0) warnings.push('APK verlopen!');
      else if (daysUntilExpiry < 30) warnings.push('APK verloopt binnenkort');
    }

    // Check Insurance
    if (car.insurance_expiry_date) {
      const insuranceDate = new Date(car.insurance_expiry_date);
      const daysUntilExpiry = Math.floor((insuranceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry < 0) warnings.push('Verzekering verlopen!');
      else if (daysUntilExpiry < 30) warnings.push('Verzekering verloopt binnenkort');
    }

    return warnings;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Niet ingesteld';
    return new Date(dateString).toLocaleDateString('nl-NL');
  };

  const isExpired = (dateString?: string) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  const isExpiringSoon = (dateString?: string) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    const daysUntilExpiry = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry >= 0 && daysUntilExpiry < 30;
  };

  return (
    <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Header title="Auto Beheer" />

        <main data-tour="cars-page" className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
          <div className="max-w-7xl mx-auto">
            {/* Add Car Button */}
            <div className="flex justify-end mb-6">
              <button
                onClick={handleAddCar}
                className="bg-green-500 text-white px-3 py-2 lg:px-4 lg:py-2 rounded-md hover:bg-green-400 transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 lg:mr-2" />
                <span className="hidden lg:inline ml-2">Auto toevoegen</span>
              </button>
            </div>

            {/* Search and Filters */}
            <div className="vl-card p-6 rounded-lg shadow-sm border border-white/[0.1] mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-4 lg:space-y-0">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-600" />
                  <input
                    type="text"
                    placeholder="Zoek op merk, model, kenteken..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="vl-input !pl-12 pr-4"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-black/20 border border-white/[0.1] rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white" style={{ colorScheme: 'dark' }}
                >
                  <option value="all">Alle statussen</option>
                  <option value="available">Beschikbaar</option>
                  <option value="rented">Verhuurd</option>
                  <option value="maintenance">Onderhoud</option>
                </select>
              </div>
            </div>

            {/* Cars Grid */}
            {loading && cars.length === 0 ? (
              <div className="vl-card rounded-lg shadow-sm border border-white/[0.1] p-12">
                <div className="flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-green-400" />
                  <span className="ml-3 text-neutral-500">Auto's laden...</span>
                </div>
              </div>
            ) : filteredCars.length === 0 ? (
              <div className="vl-card rounded-lg shadow-sm border border-white/[0.1]">
                <div className="p-6">
                  <div className="text-center py-12">
                    <CarIcon className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">
                      {cars.length === 0 ? 'Nog geen auto\'s toegevoegd' : 'Geen auto\'s gevonden'}
                    </h3>
                    <p className="text-neutral-500 mb-6">
                      {cars.length === 0
                        ? 'Begin met het toevoegen van auto\'s aan uw vloot om ze hier te kunnen beheren.'
                        : 'Pas uw zoekcriteria aan om resultaten te zien.'
                      }
                    </p>
                    {cars.length === 0 && (
                      <button
                        onClick={handleAddCar}
                        className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-400 transition-colors flex items-center mx-auto"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Eerste auto toevoegen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCars.map(car => (
                  <div
                    key={car.id}
                    className="vl-card rounded-lg shadow-sm border border-white/[0.1] overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Car Image */}
                    <div className="relative h-48 bg-gray-200">
                      {car.images && car.images.length > 0 ? (
                        <img
                          src={car.images[0]}
                          alt={`${car.brand} ${car.model}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <CarIcon className="w-16 h-16 text-neutral-600" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(car.status)}`}>
                          {getStatusText(car.status)}
                        </span>
                      </div>
                      {!car.published && (
                        <div className="absolute top-2 left-2">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-gray-800 text-white">
                            Niet gepubliceerd
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Car Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-1 gap-2">
                        <h3 className="font-bold text-lg text-white">
                          {car.brand} {car.model}
                        </h3>
                        {(car as any).contract_signed && car.status !== 'rented' && (
                          <span className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
                            <FileSignature className="w-3 h-3" /> Getekend
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-neutral-500 mb-2">
                        {car.year} • {car.license_plate}
                      </p>
                      <p className="text-sm text-neutral-500 mb-3">
                        {car.specs?.transmission || 'N/A'} • {car.specs?.fuel_type || 'N/A'}
                      </p>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-2xl font-bold text-green-400">
                          €{car.weekly_rate}
                        </span>
                        <span className="text-sm text-neutral-500">per week</span>
                      </div>

                      {/* Maintenance Status Table */}
                      <div className="mb-4 border-t border-white/[0.1] pt-4">
                        <h4 className="text-xs font-semibold text-neutral-400 uppercase mb-3 flex items-center gap-2">
                          <Wrench className="w-4 h-4" />
                          Onderhoud Status
                        </h4>
                        <div className="space-y-2">
                          {/* APK Status */}
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              {isExpired(car.apk_expiry_date) ? (
                                <AlertCircle className="w-4 h-4 text-red-500" />
                              ) : isExpiringSoon(car.apk_expiry_date) ? (
                                <AlertCircle className="w-4 h-4 text-yellow-500" />
                              ) : (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                              <span className="text-neutral-400">APK:</span>
                            </div>
                            <span className={`font-medium ${
                              isExpired(car.apk_expiry_date) ? 'text-red-500' :
                              isExpiringSoon(car.apk_expiry_date) ? 'text-yellow-500' :
                              'text-white'
                            }`}>
                              {formatDate(car.apk_expiry_date)}
                            </span>
                          </div>

                          {/* Insurance Status */}
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              {isExpired(car.insurance_expiry_date) ? (
                                <AlertCircle className="w-4 h-4 text-red-500" />
                              ) : isExpiringSoon(car.insurance_expiry_date) ? (
                                <AlertCircle className="w-4 h-4 text-yellow-500" />
                              ) : (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                              <span className="text-neutral-400">Verzekering:</span>
                            </div>
                            <span className={`font-medium ${
                              isExpired(car.insurance_expiry_date) ? 'text-red-500' :
                              isExpiringSoon(car.insurance_expiry_date) ? 'text-yellow-500' :
                              'text-white'
                            }`}>
                              {formatDate(car.insurance_expiry_date)}
                            </span>
                          </div>

                          {/* Last Maintenance */}
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-neutral-500" />
                              <span className="text-neutral-400">Laatste onderhoud:</span>
                            </div>
                            <span className="text-white font-medium">
                              {formatDate(car.last_maintenance_date)}
                            </span>
                          </div>

                          {/* Next Maintenance */}
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-neutral-500" />
                              <span className="text-neutral-400">Volgend onderhoud:</span>
                            </div>
                            <span className="text-white font-medium">
                              {formatDate(car.next_maintenance_date)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2 mb-2">
                        <button
                          onClick={() => handleEditCar(car)}
                          className="flex-1 px-3 py-2 bg-black/20 border border-white/[0.1] text-green-400 rounded-md hover:bg-black/30 transition-colors flex items-center justify-center"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Bewerken
                        </button>
                        <button
                          onClick={() => navigate(`/manager/cars/${car.id}/maintenance`)}
                          className="flex-1 px-3 py-2 bg-green-500/10 text-green-400 rounded-md hover:bg-green-500/20 transition-colors flex items-center justify-center"
                        >
                          <Wrench className="w-4 h-4 mr-1" />
                          Onderhoud
                        </button>
                        <button
                          onClick={() => handleDeleteCar(car.id)}
                          disabled={deletingCarId === car.id}
                          className="px-3 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          {deletingCarId === car.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      <BottomNav />

      {/* Car Form Modal */}
      <CarFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCar(null);
        }}
        car={editingCar}
      />
    </div>
  );
};

export default ManagerCars;