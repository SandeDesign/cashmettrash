import React, { useState, useEffect } from 'react';
import { Loader2, Search, FileText, Camera, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';
import BookingDetailModal from '../../components/booking/BookingDetailModal';
import { InspectionDetailModal } from '../../components/inspection/InspectionDetailModal';
import { useRentalCarInspectionStore } from '../../store/rentalCarInspectionStore';
import { useBookingStore } from '../../store/bookingStore';
import { useCarStore } from '../../store/carStore';
import { useAuth } from '../../hooks/useAuth';
import { RentalCarInspectionForm, Booking } from '../../types';

const PROXY_URL = 'https://internedata.nl/vlottr.php?url=';

const AdminInspections: React.FC = () => {
  const { user } = useAuth();
  const { inspectionForms, loading, fetchAllInspectionForms } = useRentalCarInspectionStore();
  const { bookings } = useBookingStore();
  const { cars } = useCarStore();
  const [activeTab, setActiveTab] = useState<'ophalen' | 'inleveren'>('ophalen');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedFormId, setExpandedFormId] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<RentalCarInspectionForm | null>(null);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);

  useEffect(() => {
    fetchAllInspectionForms();
  }, [fetchAllInspectionForms]);

  // Filter by tab and search
  const filteredForms = inspectionForms.filter(form => {
    if (form.type !== activeTab) return false;
    if (statusFilter !== 'all' && form.status !== statusFilter) return false;
    if (!searchTerm) return true;

    const booking = bookings.find(b => b.id === form.booking_id);
    const car = cars.find(c => c.id === form.car_id);

    return (
      booking?.customer_snapshot?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking?.customer_snapshot?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car?.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car?.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'voeg_fotos_toe':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'in_behandeling':
        return 'bg-blue-500/20 text-blue-400';
      case 'goedgekeurd':
        return 'bg-green-500/20 text-green-400';
      case 'afgekeurd':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-neutral-500/20 text-neutral-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'voeg_fotos_toe':
        return 'Fotos toevoegen';
      case 'in_behandeling':
        return 'In behandeling';
      case 'goedgekeurd':
        return 'Goedgekeurd';
      case 'afgekeurd':
        return 'Afgekeurd';
      default:
        return status;
    }
  };

  const getPhotoCount = (form: RentalCarInspectionForm): number => {
    return form.photo_tabs.reduce((total, tab) => {
      return total + tab.items.filter(item => item.url).length;
    }, 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsBookingModalOpen(true);
  };

  const handleViewInspection = (inspection: RentalCarInspectionForm) => {
    setSelectedInspection(inspection);
    setIsInspectionModalOpen(true);
  };

  // Group inspections by customer
  const groupedByCustomer = filteredForms.reduce((acc, form) => {
    const booking = bookings.find(b => b.id === form.booking_id);
    const customerName = booking?.customer_snapshot?.name || 'Unknown';
    const customerId = form.customer_id;

    if (!acc[customerId]) {
      acc[customerId] = {
        id: customerId,
        name: customerName,
        inspections: [],
      };
    }

    acc[customerId].inspections.push(form);
    return acc;
  }, {} as Record<string, { id: string; name: string; inspections: RentalCarInspectionForm[] }>);

  const sortedCustomers = Object.values(groupedByCustomer).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Header title="Inspectie Formulieren" />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
          <div className="max-w-7xl mx-auto">
            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-white/[0.1]">
              <button
                onClick={() => setActiveTab('ophalen')}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                  activeTab === 'ophalen'
                    ? 'border-green-500 text-green-400'
                    : 'border-transparent text-neutral-500 hover:text-white'
                }`}
              >
                Ophaal Inspectie ({inspectionForms.filter(f => f.type === 'ophalen').length})
              </button>
              <button
                onClick={() => setActiveTab('inleveren')}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                  activeTab === 'inleveren'
                    ? 'border-green-500 text-green-400'
                    : 'border-transparent text-neutral-500 hover:text-white'
                }`}
              >
                Inlever Inspectie ({inspectionForms.filter(f => f.type === 'inleveren').length})
              </button>
            </div>

            {/* Search and Filter */}
            <div className="vl-card p-6 rounded-lg shadow-sm border border-white/[0.1] mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-4 lg:space-y-0">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-600" />
                  <input
                    type="text"
                    placeholder="Zoek op klant, auto, formulier ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="vl-input !pl-12 pr-4"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-black/20 border border-white/[0.1] rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="all">Alle statussen</option>
                  <option value="voeg_fotos_toe">Fotos toevoegen</option>
                  <option value="in_behandeling">In behandeling</option>
                  <option value="goedgekeurd">Goedgekeurd</option>
                  <option value="afgekeurd">Afgekeurd</option>
                </select>
              </div>
            </div>

            {/* Table */}
            {loading && inspectionForms.length === 0 ? (
              <div className="vl-card rounded-lg shadow-sm border border-white/[0.1] p-12">
                <div className="flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-green-400" />
                  <span className="ml-3 text-neutral-500">Formulieren laden...</span>
                </div>
              </div>
            ) : filteredForms.length === 0 ? (
              <div className="vl-card rounded-lg shadow-sm border border-white/[0.1]">
                <div className="p-6">
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">
                      {inspectionForms.length === 0 ? 'Nog geen inspectieformulieren' : 'Geen formulieren gevonden'}
                    </h3>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block vl-card rounded-lg shadow-sm border border-white/[0.1] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="vl-table">
                      <thead>
                        <tr>
                          <th style={{ width: '40px' }}></th>
                          <th>KLANT</th>
                          <th>AUTO</th>
                          <th>FOTOS</th>
                          <th>INGEDIEND</th>
                          <th>STATUS</th>
                          <th className="text-right">ACTIES</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedCustomers.map((customer, customerIndex) => (
                          <React.Fragment key={customer.id}>
                            {/* Customer Header Row */}
                            <tr className="bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer">
                              <td
                                className="px-6 py-4"
                                onClick={() =>
                                  setExpandedFormId(
                                    expandedFormId === customer.id ? null : customer.id
                                  )
                                }
                              >
                                <button className="text-neutral-400 hover:text-white transition-colors">
                                  {expandedFormId === customer.id ? (
                                    <ChevronUp className="w-5 h-5" />
                                  ) : (
                                    <ChevronDown className="w-5 h-5" />
                                  )}
                                </button>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-medium text-neutral-700">
                                      {customer.name[0] || '?'}
                                    </span>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-white">
                                      {customer.name}
                                    </div>
                                    <div className="text-sm text-neutral-500">
                                      {customer.inspections.length} inspectie(s)
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td colSpan={5}></td>
                            </tr>

                            {/* Inspection Rows */}
                            {expandedFormId === customer.id &&
                              customer.inspections.map(form => {
                                const booking = bookings.find(b => b.id === form.booking_id);
                                const car = cars.find(c => c.id === form.car_id);
                                const photoCount = getPhotoCount(form);

                                return (
                                  <tr
                                    key={form.id}
                                    className="border-t border-white/[0.05] hover:bg-white/[0.02] cursor-pointer"
                                    onClick={() => handleViewInspection(form)}
                                  >
                                    <td></td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <span className="text-sm text-neutral-400">
                                          {form.type === 'ophalen' ? '🚗' : '🔑'}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <span className="text-sm text-white">
                                          {car ? `${car.brand} ${car.model}` : 'Onbekend'}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center gap-1 text-sm text-neutral-400">
                                        <Camera className="w-4 h-4" />
                                        {photoCount}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                                      {formatDate(form.created_at)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(form.status)}`}>
                                        {getStatusText(form.status)}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleViewInspection(form);
                                        }}
                                        className="text-green-400 hover:text-green-300 transition-colors"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-3">
                  {sortedCustomers.map(customer => {
                    const isExpanded = expandedFormId === customer.id;

                    return (
                      <div key={customer.id}>
                        {/* Customer Header */}
                        <button
                          onClick={() =>
                            setExpandedFormId(isExpanded ? null : customer.id)
                          }
                          className="w-full vl-card rounded-lg shadow-sm border border-white/[0.1] p-4 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
                        >
                          <div className="flex items-center flex-1 min-w-0">
                            <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                              <span className="text-sm font-medium text-neutral-700">
                                {customer.name[0] || '?'}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 text-left">
                              <p className="font-semibold text-white truncate text-sm">
                                {customer.name}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {customer.inspections.length} inspectie(s)
                              </p>
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-green-400 flex-shrink-0 ml-2" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-neutral-400 flex-shrink-0 ml-2" />
                          )}
                        </button>

                        {/* Inspection Cards */}
                        {isExpanded && (
                          <div className="mt-2 space-y-2 ml-4">
                            {customer.inspections.map(form => {
                              const booking = bookings.find(b => b.id === form.booking_id);
                              const car = cars.find(c => c.id === form.car_id);
                              const photoCount = getPhotoCount(form);

                              return (
                                <div
                                  key={form.id}
                                  onClick={() => handleViewInspection(form)}
                                  className="vl-card rounded-lg shadow-sm border border-white/[0.1] p-4 hover:bg-white/[0.03] transition-colors cursor-pointer"
                                >
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium text-white">
                                        {form.type === 'ophalen' ? '🚗 Ophalen' : '🔑 Inleveren'}
                                      </span>
                                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getStatusColor(form.status)}`}>
                                        {getStatusText(form.status)}
                                      </span>
                                    </div>

                                    <div className="text-sm text-neutral-400">
                                      {car ? `${car.brand} ${car.model}` : 'Onbekend'}
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-neutral-500">
                                      <span className="flex items-center gap-1">
                                        <Camera className="w-3 h-3" />
                                        {photoCount} foto's
                                      </span>
                                      <span>{formatDate(form.created_at)}</span>
                                    </div>
                                  </div>

                                  <div className="mt-3 pt-3 border-t border-white/[0.05]">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewInspection(form);
                                      }}
                                      className="w-full px-3 py-2 bg-green-500/10 text-green-400 text-sm font-medium rounded-md hover:bg-green-500/20 transition-colors flex items-center justify-center gap-2"
                                    >
                                      <Eye className="w-4 h-4" />
                                      Details
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
      <BottomNav />

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          car={cars.find(c => c.id === selectedBooking.car_id) ?? null}
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
        />
      )}

      {/* Inspection Detail Modal */}
      {selectedInspection && (
        <InspectionDetailModal
          inspection={selectedInspection}
          isOpen={isInspectionModalOpen}
          onClose={() => setIsInspectionModalOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminInspections;
