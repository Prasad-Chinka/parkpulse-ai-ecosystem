import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { Sidebar, ActiveTab } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { AIChatbot } from './components/AIChatbot.tsx';
import { LandingPage } from './pages/LandingPage.tsx';
import { FindParkingPage } from './pages/FindParkingPage.tsx';
import { VijayawadaStationsPage } from './pages/VijayawadaStationsPage.tsx';
import { SlotGridView } from './pages/SlotGridView.tsx';
import { UserDashboard } from './pages/UserDashboard.tsx';
import { ReservationModal } from './pages/ReservationModal.tsx';
import { QRTicketPage } from './pages/QRTicketPage.tsx';
import { OperatorScannerPage } from './pages/OperatorScannerPage.tsx';
import { VehiclesPage } from './pages/VehiclesPage.tsx';
import { PaymentsPage } from './pages/PaymentsPage.tsx';
import { AdminDashboard } from './pages/AdminDashboard.tsx';
import { AuthModal } from './pages/AuthModal.tsx';
import { IParkingLot } from '../backend/models/index.ts';

function MainApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('find-parking');
  const [selectedLotId, setSelectedLotId] = useState<string>('');
  const [slotToBook, setSlotToBook] = useState<{ slot: any; lot: any } | null>(null);
  const [viewTicketId, setViewTicketId] = useState<string | undefined>(undefined);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalRegisterMode, setAuthModalRegisterMode] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleOpenAuth = (isRegister: boolean = false) => {
    setAuthModalRegisterMode(isRegister);
    setShowAuthModal(true);
  };

  const handleSelectSlotToBook = (slot: any, lot: any) => {
    setSlotToBook({ slot, lot });
  };

  const handleBookingSuccess = (reservationId: string) => {
    setViewTicketId(reservationId);
    setActiveTab('my-bookings');
  };

  const handleNavigateToSlots = (lotId: string) => {
    setSelectedLotId(lotId);
    setActiveTab('slot-grid');
  };

  const handleDirectStationBooking = (station: IParkingLot) => {
    const syntheticSlot = {
      _id: `slot-auto-${station._id}`,
      lotId: station._id,
      slotNumber: `${station.name.split(' ')[0]}-01`,
      floor: 'Ground Level',
      status: 'available',
      vehicleTypes: station.vehicleCategories || ['car', 'bike', 'suv', 'ev'],
      hourlyPrice: station.hourlyPrice,
    };
    setSlotToBook({ slot: syntheticSlot, lot: station });
  };

  return (
    <div className="min-h-screen text-[var(--text-primary)] flex flex-col lg:flex-row relative selection:bg-purple-600 selection:text-white transition-colors duration-300">
      {/* Background ambient neon glow blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px] animate-ambient-drift" />
        <div className="absolute top-1/3 -right-40 w-[550px] h-[550px] bg-cyan-500/10 rounded-full blur-[150px]" />
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-[140px]" />
      </div>

      {/* Responsive Glassmorphism Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedLotId={selectedLotId}
        setSelectedLotId={setSelectedLotId}
        onOpenAuthModal={() => handleOpenAuth(false)}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <main className="flex-1 lg:pl-64 z-10 min-h-screen flex flex-col">
        {/* Top Header with Theme Switcher, Navigation, Profile Dropdown */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenAuthModal={handleOpenAuth}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        {/* Viewport Content */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1">
          {activeTab === 'find-parking' && (
            <FindParkingPage
              onSelectLot={handleNavigateToSlots}
              onBookLot={handleDirectStationBooking}
            />
          )}

          {activeTab === 'stations-directory' && (
            <VijayawadaStationsPage
              onSelectStation={(lot) => handleNavigateToSlots(lot._id)}
              onOpenBooking={(lot) => handleDirectStationBooking(lot)}
            />
          )}

          {activeTab === 'user-dashboard' && (
            <UserDashboard
              onNavigateToBooking={() => setActiveTab('find-parking')}
              onNavigateToTickets={(id) => {
                setViewTicketId(id);
                setActiveTab('my-bookings');
              }}
              onNavigateToVehicles={() => setActiveTab('vehicles')}
              onNavigateToPayments={() => setActiveTab('payments')}
              onNavigateToAI={() => setActiveTab('find-parking')}
            />
          )}

          {activeTab === 'slot-grid' && (
            <SlotGridView
              selectedLotId={selectedLotId}
              onSelectSlotToBook={handleSelectSlotToBook}
              onNavigateToStations={() => setActiveTab('stations-directory')}
            />
          )}

          {activeTab === 'my-bookings' && (
            <QRTicketPage
              reservationId={viewTicketId}
              onNavigateToScanner={() => setActiveTab('operator-scanner')}
            />
          )}

          {activeTab === 'vehicles' && <VehiclesPage />}

          {activeTab === 'payments' && <PaymentsPage />}

          {activeTab === 'operator-scanner' && <OperatorScannerPage />}

          {activeTab === 'admin-dashboard' && (
            <AdminDashboard
              onNavigateToSlots={handleNavigateToSlots}
            />
          )}

          {activeTab === 'home' && (
            <LandingPage
              onGetStarted={() => setActiveTab('find-parking')}
              onExploreStations={() => setActiveTab('stations-directory')}
              onOpenScanner={() => setActiveTab('operator-scanner')}
            />
          )}
        </div>
      </main>

      {/* Mandatory Floating AI Chatbot Concierge (Powered by Gemini 3.8 Flash) */}
      <AIChatbot />

      {/* Reservation & Payment Modal */}
      {slotToBook && (
        <ReservationModal
          slot={slotToBook.slot}
          lot={slotToBook.lot}
          onClose={() => setSlotToBook(null)}
          onSuccess={handleBookingSuccess}
        />
      )}

      {/* Auth Modal with Role Selection & Dev Helper */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          initialRegisterMode={authModalRegisterMode}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
