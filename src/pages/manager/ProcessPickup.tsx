import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Download } from 'lucide-react';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';
import { RentalCarInspectionWizard } from '../../components/inspection';
import { useBookingStore } from '../../store/bookingStore';
import { useCarStore } from '../../store/carStore';
import { useRentalCarInspectionStore } from '../../store/rentalCarInspectionStore';
import { useAuth } from '../../hooks/useAuth';
import { useModal } from '../../contexts/ModalContext';
import { Booking, Car } from '../../types';
import { createNewInspectionForm } from '../../utils/inspectionFormTemplates';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ManagerProcessPickup: React.FC = () => {
  const navigate = useNavigate();
  const { bookingId } = useParams<{ bookingId: string }>();
  const { user } = useAuth();
  const { bookings, loading: bookingLoading } = useBookingStore();
  const { cars } = useCarStore();
  const { showError, showSuccess } = useModal();
  const {
    getInspectionFormByBooking,
    createInspectionForm,
    updateInspectionForm,
  } = useRentalCarInspectionStore();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [car, setCar] = useState<Car | null>(null);
  const [inspectionForm, setInspectionForm] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Load booking and inspection form
  useEffect(() => {
    if (!bookingId || !user) return;

    const loadData = async () => {
      try {
        setIsLoading(true);

        // Find booking
        const foundBooking = bookings.find((b) => b.id === bookingId);
        if (!foundBooking) {
          showError('Boeking niet gevonden');
          navigate('/manager/bookings');
          return;
        }

        setBooking(foundBooking);

        // Find car
        const foundCar = cars.find((c) => c.id === foundBooking.car_id);
        setCar(foundCar || null);

        // Load or create inspection form
        let form = await getInspectionFormByBooking(bookingId, 'ophalen');
        if (!form) {
          const newFormData = createNewInspectionForm(
            bookingId,
            foundBooking.customer_id,
            foundBooking.car_id,
            'ophalen'
          );
          form = await createInspectionForm(newFormData);
        }
        setInspectionForm(form);
      } catch (error: any) {
        console.error('Error loading data:', error);
        showError('Er is een fout opgetreden bij het laden van de gegevens');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [bookingId, user, bookings, cars, getInspectionFormByBooking, createInspectionForm, showError, navigate]);

  const handleGeneratePDF = async () => {
    if (!booking || !car || !inspectionForm) return;

    try {
      setIsGeneratingPDF(true);

      // Create PDF content
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // Title
      doc.setFontSize(16);
      doc.text('OPHAALBEWIJS AUTO', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Line
      doc.setLineWidth(0.5);
      doc.line(20, yPosition, pageWidth - 20, yPosition);
      yPosition += 10;

      // Header info
      doc.setFontSize(11);
      doc.text(`Boeking ID: ${booking.id}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Datum: ${new Date().toLocaleDateString('nl-NL')}`, 20, yPosition);
      yPosition += 12;

      // Car Info
      doc.setFontSize(12);
      doc.text('AUTO INFORMATIE', 20, yPosition);
      yPosition += 8;
      doc.setFontSize(10);
      doc.text(`Merk: ${car.brand} ${car.model}`, 25, yPosition);
      yPosition += 6;
      doc.text(`Kenteken: ${car.license_plate}`, 25, yPosition);
      yPosition += 6;
      doc.text(`Jaar: ${car.year}`, 25, yPosition);
      yPosition += 12;

      // Customer Info
      doc.setFontSize(12);
      doc.text('KLANTGEGEVENS', 20, yPosition);
      yPosition += 8;
      doc.setFontSize(10);
      doc.text(`Naam: ${booking.customer_snapshot?.name || 'N/A'}`, 25, yPosition);
      yPosition += 6;
      doc.text(`Email: ${booking.customer_snapshot?.email || 'N/A'}`, 25, yPosition);
      yPosition += 6;
      doc.text(`Telefoon: ${booking.customer_snapshot?.phone || 'N/A'}`, 25, yPosition);
      yPosition += 12;

      // Inspection Form Data
      doc.setFontSize(12);
      doc.text('INSPECTIEGEGEVENS OPHALEN', 20, yPosition);
      yPosition += 8;
      doc.setFontSize(10);

      if (inspectionForm.odometer_reading_start) {
        doc.text(`Kilometerstand: ${inspectionForm.odometer_reading_start} km`, 25, yPosition);
        yPosition += 6;
      }

      if (inspectionForm.fuel_level) {
        doc.text(`Brandstofniveau: ${inspectionForm.fuel_level}`, 25, yPosition);
        yPosition += 6;
      }

      if (inspectionForm.admin_staff_member_name) {
        doc.text(`Medewerker: ${inspectionForm.admin_staff_member_name}`, 25, yPosition);
        yPosition += 6;
      }

      if (inspectionForm.admin_delivery_time) {
        doc.text(`Tijd: ${new Date(inspectionForm.admin_delivery_time).toLocaleString('nl-NL')}`, 25, yPosition);
        yPosition += 6;
      }

      if (inspectionForm.admin_delivery_location) {
        doc.text(`Locatie: ${inspectionForm.admin_delivery_location}`, 25, yPosition);
        yPosition += 12;
      }

      // Signature area
      yPosition += 10;
      doc.line(20, yPosition, 75, yPosition);
      doc.setFontSize(9);
      doc.text('Handtekening Medewerker', 20, yPosition + 5);

      doc.line(125, yPosition, 190, yPosition);
      doc.text('Handtekening Klant', 125, yPosition + 5);

      // Download PDF
      doc.save(`Ophaalbewijs_${booking.id}_${new Date().getTime()}.pdf`);
      showSuccess('PDF succesvol gegenereerd');
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      showError('Fout bij het genereren van PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSaveAndComplete = async () => {
    if (!inspectionForm) return;

    try {
      setIsLoading(true);
      // Update booking status
      // This will be handled by the form submission
      showSuccess('Ophalen succesvol geregistreerd');
    } finally {
      setIsLoading(false);
    }
  };

  if (bookingLoading || isLoading) {
    return (
      <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
          <Header title="Ophalen Verwerken" />
          <main className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <Loader2 className="h-12 w-12 animate-spin text-green-400 mb-4" />
              <p className="text-neutral-400">Laden...</p>
            </div>
          </main>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!booking || !car || !inspectionForm) {
    return (
      <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
          <Header title="Ophalen Verwerken" />
          <main className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <p className="text-neutral-400 mb-4">Boeking niet gevonden</p>
              <button
                onClick={() => navigate('/manager/bookings')}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-400"
              >
                Terug naar boekingen
              </button>
            </div>
          </main>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Header title="Ophalen Verwerken" />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => navigate('/manager/bookings')}
              className="mb-6 px-4 py-2 bg-neutral-700 text-white rounded hover:bg-neutral-600 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Terug
            </button>

            {/* Booking Summary */}
            <div className="vl-card p-6 rounded-lg shadow-sm border border-white/[0.1] mb-6">
              <h3 className="text-lg font-bold text-white mb-4">Boekingsgegevens</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-neutral-500">Auto</p>
                  <p className="font-medium text-white">{car.brand} {car.model}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Kenteken</p>
                  <p className="font-medium text-white">{car.license_plate}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Klant</p>
                  <p className="font-medium text-white">{booking.customer_snapshot?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Boeking ID</p>
                  <p className="font-medium text-white text-sm">{booking.id}</p>
                </div>
              </div>
            </div>

            {/* Inspection Form Wizard */}
            <RentalCarInspectionWizard
              inspection={inspectionForm}
              car={car}
              onSubmit={handleSaveAndComplete}
              onCancel={() => navigate('/manager/bookings')}
              isReadOnly={false}
              isReviewMode={false}
            />

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={handleGeneratePDF}
                disabled={isGeneratingPDF}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {isGeneratingPDF ? 'Generen...' : 'Download Ophaalbewijs PDF'}
              </button>
            </div>
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
};

export default ManagerProcessPickup;
