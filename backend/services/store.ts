import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {
  IUser, IVehicle, IParkingLot, IParkingSlot, IReservation,
  IPayment, IParkingSession, IQRToken, IOccupancyHistory,
  IOperatorAssignment, IAuditLog, IChatHistory,
  UserModel, VehicleModel, ParkingLotModel, ParkingSlotModel,
  ReservationModel, PaymentModel, ParkingSessionModel, QRTokenModel,
  OccupancyHistoryModel, OperatorAssignmentModel, AuditLogModel, ChatHistoryModel
} from '../models/index.ts';

// In-memory fallback dataset
class MemoryStore {
  users: IUser[] = [];
  vehicles: IVehicle[] = [];
  lots: IParkingLot[] = [];
  slots: IParkingSlot[] = [];
  reservations: IReservation[] = [];
  payments: IPayment[] = [];
  sessions: IParkingSession[] = [];
  qrTokens: IQRToken[] = [];
  occupancyHistory: IOccupancyHistory[] = [];
  operatorAssignments: IOperatorAssignment[] = [];
  auditLogs: IAuditLog[] = [];
  chatHistory: IChatHistory[] = [];
  failedSwitchAttempts: Map<string, { count: number; lockUntil?: Date }> = new Map();

  constructor() {
    this.seedDefaults();
  }

  seedDefaults() {
    console.log('[Store] Initializing Vijayawada smart parking seed data...');
    const salt = bcrypt.genSaltSync(10);
    const hash = (p: string) => bcrypt.hashSync(p, salt);

    // Users & Operators (Seeded with required final demo credentials)
    this.users = [
      {
        _id: '67c000000000000000000001',
        name: 'System Administrator',
        email: 'admin@parkpulse.demo',
        passwordHash: hash('Admin@12345'),
        phone: '+91 866-242-9901',
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
      },
      {
        _id: '67c000000000000000000002',
        name: 'Station Operator',
        email: 'operator@parkpulse.demo',
        passwordHash: hash('Operator@12345'),
        phone: '+91 866-242-9902',
        role: 'operator',
        assignedLotId: '67c000000000000000000021',
        isActive: true,
        createdAt: new Date(),
      },
      {
        _id: '67c000000000000000000003',
        name: 'Alex Rivera (Driver)',
        email: 'driver@parkpulse.demo',
        passwordHash: hash('User@12345'),
        phone: '+91 98490-12345',
        role: 'user',
        isActive: true,
        createdAt: new Date(),
      },
      // Backward compatibility aliases
      {
        _id: '67c000000000000000000004',
        name: 'Admin Legacy',
        email: 'admin@parkpulse.io',
        passwordHash: hash('Admin@123'),
        phone: '+91 866-242-9901',
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
      },
      {
        _id: '67c000000000000000000005',
        name: 'Operator Legacy',
        email: 'operator@parkpulse.io',
        passwordHash: hash('Operator@123'),
        phone: '+91 866-242-9902',
        role: 'operator',
        assignedLotId: '67c000000000000000000022',
        isActive: true,
        createdAt: new Date(),
      },
      {
        _id: '67c000000000000000000006',
        name: 'Driver Legacy',
        email: 'alex@parkpulse.io',
        passwordHash: hash('User@123'),
        phone: '+91 98490-12345',
        role: 'user',
        isActive: true,
        createdAt: new Date(),
      },
    ];

    // Vehicles
    this.vehicles = [
      {
        _id: '67c000000000000000000011',
        userId: '67c000000000000000000003',
        registrationNumber: 'AP-16-CK-4455',
        vehicleType: 'car',
        brand: 'Hyundai',
        model: 'Verna SX',
        color: 'Starry Night Blue',
        createdAt: new Date(),
      },
      {
        _id: '67c000000000000000000012',
        userId: '67c000000000000000000003',
        registrationNumber: 'AP-16-EV-1008',
        vehicleType: 'ev',
        brand: 'Tata',
        model: 'Nexon EV Max',
        color: 'Teal Blue',
        createdAt: new Date(),
      },
      {
        _id: '67c000000000000000000013',
        userId: '67c000000000000000000003',
        registrationNumber: 'AP-16-BK-9909',
        vehicleType: 'bike',
        brand: 'Royal Enfield',
        model: 'Hunter 350',
        color: 'Dapper Ash',
        createdAt: new Date(),
      },
      {
        _id: '67c000000000000000000014',
        userId: '67c000000000000000000003',
        registrationNumber: 'AP-16-UV-7788',
        vehicleType: 'suv',
        brand: 'Mahindra',
        model: 'XUV700 AX7',
        color: 'Everest White',
        createdAt: new Date(),
      },
    ];

    // 20 Proposed Parking Stations across Vijayawada, Guntur, Mangalagiri, Tadepalle & Tenali
    this.lots = [
      // VIJAYAWADA (7 LOCATIONS)
      {
        _id: '67c000000000000000000021',
        name: 'Vijayawada Railway Station – Hanumanpet',
        address: 'Hanumanpet East Gate Entrance, Railway Station Road, Vijayawada, Andhra Pradesh 520003',
        area: 'Hanumanpet',
        city: 'Vijayawada',
        nearbyLandmark: 'East Gate Platform 1 Circulating Deck',
        latitude: 16.5186,
        longitude: 80.6200,
        totalSlots: 45,
        availableSlots: 26,
        occupiedSlots: 19,
        hourlyPrice: 40,
        operatingHours: '24/7 Mon-Sun',
        status: 'available',
        verificationStatus: 'unverified',
        isActive: true,
        vehicleCategories: ['car', 'bike', 'suv', 'ev'],
        googleMapsUrl: 'https://maps.google.com/?q=Vijayawada+Railway+Station+Hanumanpet',
        operatorId: '67c000000000000000000002',
        amenities: ['Direct Platform 1 Access', '24x7 CCTV', 'DC Fast EV Charging', 'Prepaid Counter'],
      },
      {
        _id: '67c000000000000000000022',
        name: 'Pandit Nehru Bus Station – Krishnalanka',
        address: 'PNBS Central Complex, Krishnalanka, Vijayawada, Andhra Pradesh 520013',
        area: 'Krishnalanka',
        city: 'Vijayawada',
        nearbyLandmark: 'PNBS Central Terminal / NH16 Interchange',
        latitude: 16.5074,
        longitude: 80.6272,
        totalSlots: 55,
        availableSlots: 32,
        occupiedSlots: 23,
        hourlyPrice: 30,
        operatingHours: '24/7 Mon-Sun',
        status: 'available',
        verificationStatus: 'unverified',
        isActive: true,
        vehicleCategories: ['car', 'bike', 'suv'],
        googleMapsUrl: 'https://maps.google.com/?q=Pandit+Nehru+Bus+Station+Vijayawada',
        amenities: ['Bus Terminal Connect', 'Automated Barrier', 'Luggage Bay', 'Attendant On-Site'],
      },
      {
        _id: '67c000000000000000000023',
        name: 'Benz Circle',
        address: 'Near Benz Circle Flyover, MG Road, Vijayawada, Andhra Pradesh 520010',
        area: 'Benz Circle / MG Road',
        city: 'Vijayawada',
        nearbyLandmark: 'Benz Circle Flyover / Trends Mall',
        latitude: 16.5003,
        longitude: 80.6508,
        totalSlots: 50,
        availableSlots: 21,
        occupiedSlots: 29,
        hourlyPrice: 40,
        operatingHours: '08:00 AM - 11:30 PM',
        status: 'available',
        verificationStatus: 'unverified',
        isActive: true,
        vehicleCategories: ['car', 'bike', 'suv', 'ev'],
        googleMapsUrl: 'https://maps.google.com/?q=Benz+Circle+Vijayawada',
        amenities: ['Valet Bay', 'EV Charging Spot', 'Multi-Level Stalls', 'Security Guard'],
      },
      {
        _id: '67c000000000000000000024',
        name: 'Governorpet',
        address: 'Gopala Reddy Road, Governorpet, Vijayawada, Andhra Pradesh 520002',
        area: 'Governorpet',
        city: 'Vijayawada',
        nearbyLandmark: 'Gandhi Park / Governorpet Market Arcade',
        latitude: 16.5120,
        longitude: 80.6250,
        totalSlots: 40,
        availableSlots: 18,
        occupiedSlots: 22,
        hourlyPrice: 30,
        operatingHours: '24/7 Mon-Sun',
        status: 'available',
        verificationStatus: 'unverified',
        isActive: true,
        vehicleCategories: ['car', 'bike', 'suv'],
        googleMapsUrl: 'https://maps.google.com/?q=Governorpet+Vijayawada',
        amenities: ['Covered Stalls', 'Security Guard', 'Two-Wheeler Dedicated Row'],
      },
      {
        _id: '67c000000000000000000025',
        name: 'Gannavaram Airport',
        address: 'Terminal 1 Canopy, National Highway 16, Gannavaram, Vijayawada, Andhra Pradesh 521102',
        area: 'Gannavaram',
        city: 'Vijayawada',
        nearbyLandmark: 'Airport Terminal 1 Gate / ATC Canopy',
        latitude: 16.5273,
        longitude: 80.7970,
        totalSlots: 80,
        availableSlots: 52,
        occupiedSlots: 28,
        hourlyPrice: 50,
        operatingHours: '24/7 Mon-Sun',
        status: 'available',
        verificationStatus: 'unverified',
        isActive: true,
        vehicleCategories: ['car', 'bike', 'suv', 'ev'],
        googleMapsUrl: 'https://maps.google.com/?q=Vijayawada+Airport+Gannavaram',
        amenities: ['Long-Term Terminal Parking', 'High-Speed EV Chargers', 'Automated ANPR', '24/7 Patrol'],
      },
      {
        _id: '67c000000000000000000026',
        name: 'Kanaka Durga Temple area',
        address: 'Indrakeeladri Hill Road, Durga Ghat, One Town, Vijayawada, Andhra Pradesh 520001',
        area: 'Indrakeeladri / One Town',
        city: 'Vijayawada',
        nearbyLandmark: 'Kanaka Durga Temple Toll Plaza / Durga Ghat',
        latitude: 16.5152,
        longitude: 80.6053,
        totalSlots: 60,
        availableSlots: 24,
        occupiedSlots: 36,
        hourlyPrice: 30,
        operatingHours: '04:00 AM - 10:30 PM',
        status: 'available',
        verificationStatus: 'unverified',
        isActive: true,
        vehicleCategories: ['car', 'bike', 'suv'],
        googleMapsUrl: 'https://maps.google.com/?q=Kanaka+Durga+Temple+Vijayawada',
        amenities: ['Pilgrim Deck', 'Footwear Storage', 'Temple Shuttle Stand', 'Security Escort'],
      },
      {
        _id: '67c000000000000000000027',
        name: 'PVP Square area',
        address: 'MG Road, Opposite PVP Square Mall, Vijayawada, Andhra Pradesh 520010',
        area: 'MG Road / Labbipet',
        city: 'Vijayawada',
        nearbyLandmark: 'PVP Square Mall / Cinepolis Complex',
        latitude: 16.5034,
        longitude: 80.6487,
        totalSlots: 45,
        availableSlots: 19,
        occupiedSlots: 26,
        hourlyPrice: 40,
        operatingHours: '09:00 AM - 11:30 PM',
        status: 'available',
        verificationStatus: 'unverified',
        isActive: true,
        vehicleCategories: ['car', 'bike', 'suv', 'ev'],
        googleMapsUrl: 'https://maps.google.com/?q=PVP+Square+Vijayawada',
        amenities: ['Mall Parking Link', 'Underground Cellar', 'CCTV Security', 'Digital Payments'],
      },

      // GUNTUR (6 LOCATIONS)
      {
        _id: '67c000000000000000000028',
        name: 'Guntur Railway Station',
        address: 'Station Road, Sambasiva Pet, Guntur, Andhra Pradesh 522001',
        area: 'Sambasiva Pet',
        city: 'Guntur',
        nearbyLandmark: 'Guntur Junction Main Terminal Gate',
        latitude: 16.2995,
        longitude: 80.4430,
        totalSlots: 65,
        availableSlots: 38,
        occupiedSlots: 27,
        hourlyPrice: 35,
        operatingHours: '24/7 Mon-Sun',
        status: 'available',
        verificationStatus: 'unverified',
        isActive: true,
        vehicleCategories: ['car', 'bike', 'suv'],
        googleMapsUrl: 'https://maps.google.com/?q=Guntur+Railway+Station',
        amenities: ['24/7 Gate Guard', 'Platform Walkway', 'Prepaid Ticket Counter', 'Luggage Ramp'],
      },
      {
        _id: '67c000000000000000000029',
        name: 'Guntur NTR Bus Station',
        address: 'NTR Bus Station Road, RTC Colony, Guntur, Andhra Pradesh 522004',
        area: 'RTC Colony',
        city: 'Guntur',
        nearbyLandmark: 'NTR Bus Station Main Concourse',
        latitude: 16.3075,
        longitude: 80.4350,
        totalSlots: 50,
        availableSlots: 28,
        occupiedSlots: 22,
        hourlyPrice: 25,
        operatingHours: '24/7 Mon-Sun',
        status: 'available',
        verificationStatus: 'unverified',
        isActive: true,
        vehicleCategories: ['car', 'bike', 'suv'],
        googleMapsUrl: 'https://maps.google.com/?q=NTR+Bus+Station+Guntur',
        amenities: ['Covered Canopy', 'Waiting Lounge Proximity', 'CCTV Security'],
      },
      {
        _id: '67c000000000000000000030',
        name: 'Lakshmipuram',
        address: 'Lakshmipuram Main Road, Guntur, Andhra Pradesh 522007',
        area: 'Lakshmipuram',
        city: 'Guntur',
        nearbyLandmark: 'Lakshmipuram Commercial Arcade / Super Market',
        latitude: 16.3125,
        longitude: 80.4280,
        totalSlots: 35,
        availableSlots: 15,
        occupiedSlots: 20,
        hourlyPrice: 30,
        operatingHours: '08:00 AM - 10:30 PM',
        status: 'available',
        verificationStatus: 'unverified',
        isActive: true,
        vehicleCategories: ['car', 'bike'],
        googleMapsUrl: 'https://maps.google.com/?q=Lakshmipuram+Guntur',
        amenities: ['Shopping District Parking', 'Guard on Site', 'Two-Wheeler Zone'],
      },
      {
        _id: '67c000000000000000000031',
        name: 'Arundelpet',
        address: '4th Lane, Arundelpet, Guntur, Andhra Pradesh 522002',
        area: 'Arundelpet',
        city: 'Guntur',
        nearbyLandmark: 'Hindu College / Arundelpet Post Office',
        latitude: 16.3020,
        longitude: 80.4480,
        totalSlots: 40,
        availableSlots: 22,
        occupiedSlots: 18,
        hourlyPrice: 25,
        operatingHours: '07:00 AM - 11:00 PM',
        status: 'available',
        verificationStatus: 'unverified',
        isActive: true,
        vehicleCategories: ['car', 'bike', 'suv'],
        googleMapsUrl: 'https://maps.google.com/?q=Arundelpet+Guntur',
        amenities: ['College Road Proximity', 'Shaded Bays', 'Security Attendant'],
      },
      {
        _id: '67c000000000000000000032',
        name: 'Brodipet',
        address: 'Brodipet 2/11, Guntur, Andhra Pradesh 522002',
        area: 'Brodipet',
        city: 'Guntur',
        nearbyLandmark: 'Brodipet Commercial Circle / Naaz Center',
        latitude: 16.3080,
        longitude: 80.4410,
        totalSlots: 45,
        availableSlots: 16,
        occupiedSlots: 29,
        hourlyPrice: 30,
        operatingHours: '08:00 AM - 11:00 PM',
        status: 'available',
        verificationStatus: 'unverified',
        isActive: true,
        vehicleCategories: ['car', 'bike', 'suv', 'ev'],
        googleMapsUrl: 'https://maps.google.com/?q=Brodipet+Guntur',
        amenities: ['EV Charger Spot', 'Commercial Hub Access', 'CCTV 24x7'],
      },
      {
        _id: '67c000000000000000000033',
        name: 'Chandramouli Nagar',
        address: 'Inner Ring Road, Chandramouli Nagar, Guntur, Andhra Pradesh 522007',
        area: 'Chandramouli Nagar',
        city: 'Guntur',
        nearbyLandmark: 'Inner Ring Road Junction / Multi-Speciality Row',
        latitude: 16.3200,
        longitude: 80.4210,
        totalSlots: 40,
        availableSlots: 25,
        occupiedSlots: 15,
        hourlyPrice: 30,
        operatingHours: '24/7 Mon-Sun',
        status: 'available',
        verificationStatus: 'unverified',
        isActive: true,
        vehicleCategories: ['car', 'bike', 'suv'],
        googleMapsUrl: 'https://maps.google.com/?q=Chandramouli+Nagar+Guntur',
        amenities: ['Ring Road Proximity', 'Wide Turn Bays', '24x7 Security Guard'],
      },

      // MANGALAGIRI AND TADEPALLE (2 LOCATIONS)
      {
        _id: '67c000000000000000000034',
        name: 'Mangalagiri town',
        address: 'Temple Road, Near Main Bazaar, Mangalagiri, Andhra Pradesh 522503',
        area: 'Temple Zone / Main Bazaar',
        city: 'Mangalagiri',
        nearbyLandmark: 'Panakala Narasimha Swamy Temple Foothills',
        latitude: 16.4320,
        longitude: 80.5600,
        totalSlots: 45,
        availableSlots: 27,
        occupiedSlots: 18,
        hourlyPrice: 25,
        operatingHours: '05:00 AM - 10:00 PM',
        status: 'available',
        verificationStatus: 'unverified',
        isActive: true,
        vehicleCategories: ['car', 'bike', 'suv'],
        googleMapsUrl: 'https://maps.google.com/?q=Mangalagiri+Temple+Road',
        amenities: ['Temple Shuttle Point', 'Handloom Market Access', 'Attendant On-Site'],
      },
      {
        _id: '67c000000000000000000035',
        name: 'Tadepalle town',
        address: 'Old Toll Plaza Highway, Tadepalle, Andhra Pradesh 522501',
        area: 'Highway Corridor',
        city: 'Tadepalle',
        nearbyLandmark: 'Prakasam Barrage South Entry / AIIMS Road',
        latitude: 16.4800,
        longitude: 80.6000,
        totalSlots: 50,
        availableSlots: 31,
        occupiedSlots: 19,
        hourlyPrice: 30,
        operatingHours: '24/7 Mon-Sun',
        status: 'available',
        verificationStatus: 'unverified',
        isActive: true,
        vehicleCategories: ['car', 'bike', 'suv', 'ev'],
        googleMapsUrl: 'https://maps.google.com/?q=Tadepalle+Highway',
        amenities: ['Highway Rest Stop', 'EV Fast Charger', 'Barrage Bypass Link'],
      },

      // TENALI (5 LOCATIONS)
      {
        _id: '67c000000000000000000036',
        name: 'Tenali Railway Station',
        address: 'Station Road, Tenali, Andhra Pradesh 522201',
        area: 'Station Road',
        city: 'Tenali',
        nearbyLandmark: 'Tenali Junction Platform 1 Circulating Deck',
        latitude: 16.2420,
        longitude: 80.6440,
        totalSlots: 50,
        availableSlots: 29,
        occupiedSlots: 21,
        hourlyPrice: 30,
        operatingHours: '24/7 Mon-Sun',
        status: 'available',
        verificationStatus: 'unverified',
        isActive: true,
        vehicleCategories: ['car', 'bike', 'suv'],
        googleMapsUrl: 'https://maps.google.com/?q=Tenali+Railway+Station',
        amenities: ['Platform Direct Entry', 'CCTV 24x7', 'Luggage Ramp', 'Ticket Counter'],
      },
      {
        _id: '67c000000000000000000037',
        name: 'Tenali APSRTC Bus Station',
        address: 'Central Bus Stand Road, Tenali, Andhra Pradesh 522201',
        area: 'Bus Stand Road',
        city: 'Tenali',
        nearbyLandmark: 'APSRTC Central Bus Stand Gate',
        latitude: 16.2400,
        longitude: 80.6470,
        totalSlots: 40,
        availableSlots: 23,
        occupiedSlots: 17,
        hourlyPrice: 20,
        operatingHours: '24/7 Mon-Sun',
        status: 'available',
        verificationStatus: 'unverified',
        isActive: true,
        vehicleCategories: ['car', 'bike', 'suv'],
        googleMapsUrl: 'https://maps.google.com/?q=Tenali+Bus+Station',
        amenities: ['Bus Concourse Link', 'Covered Parking', 'Guard on Duty'],
      },
      {
        _id: '67c000000000000000000038',
        name: 'Tenali Market area',
        address: 'Bose Road, Main Bazaar, Tenali, Andhra Pradesh 522201',
        area: 'Main Bazaar',
        city: 'Tenali',
        nearbyLandmark: 'Tenali Clock Tower Market / Vegetable Yard',
        latitude: 16.2380,
        longitude: 80.6420,
        totalSlots: 35,
        availableSlots: 14,
        occupiedSlots: 21,
        hourlyPrice: 25,
        operatingHours: '06:00 AM - 10:00 PM',
        status: 'available',
        verificationStatus: 'unverified',
        isActive: true,
        vehicleCategories: ['car', 'bike'],
        googleMapsUrl: 'https://maps.google.com/?q=Tenali+Clock+Tower+Market',
        amenities: ['Market Footpath Access', 'Two-Wheeler Priority Bays', 'Attendant'],
      },
      {
        _id: '67c000000000000000000039',
        name: 'Ganganamma Peta',
        address: 'Ganganamma Temple Street, Tenali, Andhra Pradesh 522201',
        area: 'Ganganamma Peta',
        city: 'Tenali',
        nearbyLandmark: 'Historic Sri Ganganamma Temple',
        latitude: 16.2450,
        longitude: 80.6390,
        totalSlots: 30,
        availableSlots: 17,
        occupiedSlots: 13,
        hourlyPrice: 20,
        operatingHours: '06:00 AM - 09:30 PM',
        status: 'available',
        verificationStatus: 'unverified',
        isActive: true,
        vehicleCategories: ['car', 'bike', 'suv'],
        googleMapsUrl: 'https://maps.google.com/?q=Ganganamma+Temple+Tenali',
        amenities: ['Temple Pilgrim Area', 'Shaded Stalls', 'Attendant on Site'],
      },
      {
        _id: '67c000000000000000000040',
        name: 'Tenali RTC Road',
        address: 'RTC Complex Road, Chenchupet Cross, Tenali, Andhra Pradesh 522201',
        area: 'Chenchupet',
        city: 'Tenali',
        nearbyLandmark: 'RTC Complex / Chenchupet Cross Road',
        latitude: 16.2410,
        longitude: 80.6490,
        totalSlots: 40,
        availableSlots: 26,
        occupiedSlots: 14,
        hourlyPrice: 25,
        operatingHours: '07:00 AM - 11:00 PM',
        status: 'available',
        verificationStatus: 'unverified',
        isActive: true,
        vehicleCategories: ['car', 'bike', 'suv', 'ev'],
        googleMapsUrl: 'https://maps.google.com/?q=Tenali+RTC+Complex+Road',
        amenities: ['Transit Corridor Bay', 'EV Charging Spot', 'CCTV Security'],
      },
    ];

    // Build interactive slots for each of the 20 facilities (12-20 slots each)
    this.slots = [];
    const typesPattern: ('car' | 'bike' | 'suv' | 'ev')[][] = [
      ['car', 'suv'],
      ['car'],
      ['bike'],
      ['car', 'bike', 'suv'],
      ['ev', 'car'],
    ];

    const lotSlotConfigs = [
      { id: '67c000000000000000000021', prefix: 'HNP', count: 16, floors: ['East Gate Ground', 'Deck A'], price: 40 },
      { id: '67c000000000000000000022', prefix: 'PNB', count: 16, floors: ['Terminal Level 1', 'Bay 2 Ground'], price: 30 },
      { id: '67c000000000000000000023', prefix: 'BNZ', count: 16, floors: ['Level 1 Plaza', 'Deck B'], price: 40 },
      { id: '67c000000000000000000024', prefix: 'GVP', count: 16, floors: ['Ground Court', 'Mezzanine'], price: 30 },
      { id: '67c000000000000000000025', prefix: 'AIR', count: 20, floors: ['Terminal 1 Canopy', 'Long-Stay Deck'], price: 50 },
      { id: '67c000000000000000000026', prefix: 'KDT', count: 16, floors: ['Hillside Ground', 'Durga Ghat Deck'], price: 30 },
      { id: '67c000000000000000000027', prefix: 'PVP', count: 16, floors: ['Basement Cellar 1', 'Basement Cellar 2'], price: 40 },
      { id: '67c000000000000000000028', prefix: 'GRS', count: 16, floors: ['Main Platform Concourse', 'East Gate'], price: 35 },
      { id: '67c000000000000000000029', prefix: 'GNTR', count: 14, floors: ['Bus Concourse Level', 'North Yard'], price: 25 },
      { id: '67c000000000000000000030', prefix: 'LKP', count: 14, floors: ['Market Arcade Ground', 'Stall Deck'], price: 30 },
      { id: '67c000000000000000000031', prefix: 'ARD', count: 14, floors: ['Arundelpet Ground', 'Deck 1'], price: 25 },
      { id: '67c000000000000000000032', prefix: 'BRP', count: 14, floors: ['Commercial Court', 'Level A'], price: 30 },
      { id: '67c000000000000000000033', prefix: 'CMN', count: 14, floors: ['Ring Road Bay', 'Inner Lane'], price: 30 },
      { id: '67c000000000000000000034', prefix: 'MNL', count: 14, floors: ['Temple Foothill', 'Shuttle Bay'], price: 25 },
      { id: '67c000000000000000000035', prefix: 'TDP', count: 14, floors: ['Highway Rest Bay', 'EV Deck'], price: 30 },
      { id: '67c000000000000000000036', prefix: 'TRS', count: 14, floors: ['Platform 1 Ground', 'East Bay'], price: 30 },
      { id: '67c000000000000000000037', prefix: 'TRTC', count: 12, floors: ['APSRTC Concourse', 'West Bay'], price: 20 },
      { id: '67c000000000000000000038', prefix: 'TMK', count: 12, floors: ['Clock Tower Ground', 'Bazaar Row'], price: 25 },
      { id: '67c000000000000000000039', prefix: 'GNP', count: 12, floors: ['Ganganamma Court', 'Shaded Bay'], price: 20 },
      { id: '67c000000000000000000040', prefix: 'TRD', count: 14, floors: ['Chenchupet Ground', 'Transit Deck'], price: 25 },
    ];

    lotSlotConfigs.forEach((cfg, lotIndex) => {
      for (let s = 1; s <= cfg.count; s++) {
        const typeSelection = typesPattern[(s - 1) % typesPattern.length];
        const floor = cfg.floors[s <= Math.ceil(cfg.count / 2) ? 0 : 1];
        let status: 'available' | 'occupied' | 'reserved' | 'maintenance' = 'available';
        if (s === 2 || s === 7) status = 'occupied';
        if (s === 4 || s === 11) status = 'reserved';
        if (s === cfg.count) status = 'maintenance';

        const lotNum = (lotIndex + 21).toString().padStart(2, '0');
        this.slots.push({
          _id: `67c00000000000000000${lotNum}${s.toString().padStart(2, '0')}`,
          lotId: cfg.id,
          slotNumber: `${cfg.prefix}-${s.toString().padStart(2, '0')}`,
          floor,
          status,
          vehicleTypes: typeSelection,
          hourlyPrice: cfg.price,
        });
      }
    });

    // Seed Operator Assignments
    this.operatorAssignments = [
      {
        _id: '67c000000000000000000801',
        operatorId: '67c000000000000000000002',
        operatorName: 'Station Operator',
        lotId: '67c000000000000000000021',
        assignedAt: new Date(Date.now() - 7 * 86400000),
        status: 'active',
        notes: 'Primary operator for Vijayawada Railway Station East Gate',
      },
      {
        _id: '67c000000000000000000802',
        operatorId: '67c000000000000000000002',
        operatorName: 'Station Operator',
        lotId: '67c000000000000000000028',
        assignedAt: new Date(Date.now() - 3 * 86400000),
        status: 'active',
        notes: 'Assigned operator for Guntur Railway Station',
      },
    ];

    // Seed Initial Audit Logs
    this.auditLogs = [
      {
        _id: '67c000000000000000000901',
        userId: '67c000000000000000000001',
        userEmail: 'admin@parkpulse.demo',
        action: 'SYSTEM_BOOT',
        targetType: 'PLATFORM',
        status: 'success',
        ipAddress: '127.0.0.1',
        details: 'ParkPulse AI Neon City Glassmorphism Platform initialized with 20 stations network',
        timestamp: new Date(Date.now() - 3600000),
      },
      {
        _id: '67c000000000000000000902',
        userId: '67c000000000000000000001',
        userEmail: 'admin@parkpulse.demo',
        action: 'STATION_VERIFY',
        targetType: 'PARKING_LOT',
        targetId: '67c000000000000000000021',
        status: 'success',
        ipAddress: '127.0.0.1',
        details: 'Admin verified Vijayawada Railway Station – Hanumanpet as live facility',
        timestamp: new Date(Date.now() - 1800000),
      },
    ];

    // Sample Reservations
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 3600 * 1000);
    const threeHoursAgo = new Date(now.getTime() - 3 * 3600 * 1000);
    const oneHourAgo = new Date(now.getTime() - 1 * 3600 * 1000);

    this.reservations = [
      {
        _id: '67c000000000000000000301',
        userId: '67c000000000000000000003',
        vehicleId: '67c000000000000000000011',
        lotId: '67c000000000000000000021',
        slotId: '67c000000000000000000102',
        startTime: threeHoursAgo,
        endTime: twoHoursLater,
        totalAmount: 90,
        bookingStatus: 'active',
        paymentStatus: 'paid',
        qrToken: 'QR-TOKEN-PNBS-P02-DEMO',
        createdAt: threeHoursAgo,
      },
      {
        _id: '67c000000000000000000302',
        userId: '67c000000000000000000003',
        vehicleId: '67c000000000000000000012',
        lotId: '67c000000000000000000023',
        slotId: '67c000000000000000000301',
        startTime: now,
        endTime: twoHoursLater,
        totalAmount: 100,
        bookingStatus: 'confirmed',
        paymentStatus: 'paid',
        qrToken: 'QR-TOKEN-TM01-CONFIRMED',
        createdAt: now,
      },
      {
        _id: '67c000000000000000000303',
        userId: '67c000000000000000000004',
        vehicleId: '67c000000000000000000013',
        lotId: '67c000000000000000000022',
        slotId: '67c000000000000000000203',
        startTime: threeHoursAgo,
        endTime: oneHourAgo,
        totalAmount: 80,
        bookingStatus: 'completed',
        paymentStatus: 'paid',
        qrToken: 'QR-TOKEN-RLY-R03-DONE',
        createdAt: threeHoursAgo,
      },
    ];

    // Payments
    this.payments = [
      {
        _id: '67c000000000000000000401',
        reservationId: '67c000000000000000000301',
        userId: '67c000000000000000000003',
        amount: 90,
        transactionId: 'SIMULATED-TXN-VJA-8812',
        paymentMethod: 'Demo Payment Gateway (Simulated)',
        status: 'success',
        receiptNumber: 'RCP-2026-VJA-001',
        isSimulated: true,
        createdAt: threeHoursAgo,
      },
      {
        _id: '67c000000000000000000402',
        reservationId: '67c000000000000000000302',
        userId: '67c000000000000000000003',
        amount: 100,
        transactionId: 'SIMULATED-TXN-VJA-8813',
        paymentMethod: 'Demo Payment Gateway (Simulated)',
        status: 'success',
        receiptNumber: 'RCP-2026-VJA-002',
        isSimulated: true,
        createdAt: now,
      },
    ];

    // Parking Sessions
    this.sessions = [
      {
        _id: '67c000000000000000000501',
        reservationId: '67c000000000000000000301',
        entryTime: threeHoursAgo,
        status: 'active',
        entryVerifiedBy: 'operator@parkpulse.io',
      },
      {
        _id: '67c000000000000000000502',
        reservationId: '67c000000000000000000303',
        entryTime: threeHoursAgo,
        exitTime: oneHourAgo,
        status: 'completed',
        entryVerifiedBy: 'operator@parkpulse.io',
        exitVerifiedBy: 'operator@parkpulse.io',
      },
    ];

    // QR Tokens
    this.qrTokens = [
      {
        _id: '67c000000000000000000601',
        reservationId: '67c000000000000000000301',
        tokenHash: 'QR-TOKEN-PNBS-P02-DEMO',
        expiresAt: twoHoursLater,
        usedAt: threeHoursAgo,
      },
      {
        _id: '67c000000000000000000602',
        reservationId: '67c000000000000000000302',
        tokenHash: 'QR-TOKEN-TM01-CONFIRMED',
        expiresAt: twoHoursLater,
      },
    ];

    // Occupancy History for PNBS Hub
    this.occupancyHistory = [];
    for (let h = 24; h >= 0; h--) {
      const time = new Date(now.getTime() - h * 3600 * 1000);
      const hour = time.getHours();
      const peakFactor = (hour >= 9 && hour <= 19) ? 0.72 : 0.35;
      const occupied1 = Math.round(60 * (peakFactor + (Math.sin(hour) * 0.1)));
      const reserved1 = Math.round(60 * 0.08);
      const available1 = Math.max(0, 60 - occupied1 - reserved1);

      this.occupancyHistory.push({
        _id: `67c0000000000000000007${h.toString().padStart(2, '0')}`,
        lotId: '67c000000000000000000021',
        timestamp: time,
        occupiedCount: occupied1,
        reservedCount: reserved1,
        availableCount: available1,
        dayOfWeek: time.getDay(),
        hourOfDay: hour,
      });
    }
  }
}

export const memoryStore = new MemoryStore();

// Shared Database Access Object (syncs with Mongoose if connected)
export const db = {
  isMongoActive(): boolean {
    return mongoose.connection.readyState === 1;
  },

  // Users
  async findUserByEmail(email: string): Promise<IUser | null> {
    if (this.isMongoActive()) {
      return await UserModel.findOne({ email }).lean();
    }
    return memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async findUserById(id: string): Promise<IUser | null> {
    if (this.isMongoActive()) {
      return await UserModel.findById(id).lean();
    }
    return memoryStore.users.find(u => u._id === id) || null;
  },

  async createUser(userData: Partial<IUser>): Promise<IUser> {
    const newUser: IUser = {
      _id: new mongoose.Types.ObjectId().toString(),
      name: userData.name || '',
      email: userData.email || '',
      passwordHash: userData.passwordHash || '',
      phone: userData.phone || '',
      role: userData.role || 'user',
      assignedLotId: userData.assignedLotId,
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      createdAt: new Date(),
    };
    if (this.isMongoActive()) {
      await UserModel.create(newUser);
    }
    memoryStore.users.push(newUser);
    return newUser;
  },

  async getAllUsers(): Promise<IUser[]> {
    if (this.isMongoActive()) {
      return await UserModel.find().lean();
    }
    return [...memoryStore.users];
  },

  async getAllOperators(): Promise<IUser[]> {
    if (this.isMongoActive()) {
      return await UserModel.find({ role: 'operator' }).lean();
    }
    return memoryStore.users.filter(u => u.role === 'operator');
  },

  async updateOperatorStatus(id: string, isActive: boolean): Promise<boolean> {
    if (this.isMongoActive()) {
      await UserModel.findByIdAndUpdate(id, { isActive });
    }
    const op = memoryStore.users.find(u => u._id === id);
    if (op) {
      op.isActive = isActive;
      return true;
    }
    return false;
  },

  async assignOperatorLot(id: string, assignedLotId: string): Promise<boolean> {
    if (this.isMongoActive()) {
      await UserModel.findByIdAndUpdate(id, { assignedLotId });
      await ParkingLotModel.findByIdAndUpdate(assignedLotId, { operatorId: id });
    }
    const op = memoryStore.users.find(u => u._id === id);
    if (op) {
      op.assignedLotId = assignedLotId;
    }
    const lot = memoryStore.lots.find(l => l._id === assignedLotId);
    if (lot) {
      lot.operatorId = id;
    }
    return true;
  },

  // Vehicles
  async getVehiclesByUser(userId: string): Promise<IVehicle[]> {
    if (this.isMongoActive()) {
      return await VehicleModel.find({ userId }).lean();
    }
    return memoryStore.vehicles.filter(v => v.userId === userId);
  },

  async createVehicle(vehicleData: Partial<IVehicle>): Promise<IVehicle> {
    const vehicle: IVehicle = {
      _id: new mongoose.Types.ObjectId().toString(),
      userId: vehicleData.userId || '',
      registrationNumber: vehicleData.registrationNumber || '',
      vehicleType: vehicleData.vehicleType || 'car',
      brand: vehicleData.brand || '',
      model: vehicleData.model || '',
      color: vehicleData.color || '',
      createdAt: new Date(),
    };
    if (this.isMongoActive()) {
      await VehicleModel.create(vehicle);
    }
    memoryStore.vehicles.push(vehicle);
    return vehicle;
  },

  async deleteVehicle(id: string, userId: string): Promise<boolean> {
    if (this.isMongoActive()) {
      const res = await VehicleModel.deleteOne({ _id: id, userId });
      return res.deletedCount > 0;
    }
    const idx = memoryStore.vehicles.findIndex(v => v._id === id && v.userId === userId);
    if (idx !== -1) {
      memoryStore.vehicles.splice(idx, 1);
      return true;
    }
    return false;
  },

  // Parking Lots
  async getAllLots(city?: string): Promise<IParkingLot[]> {
    if (this.isMongoActive()) {
      const query = city ? { city } : {};
      return await ParkingLotModel.find(query).lean();
    }
    if (city) {
      return memoryStore.lots.filter(l => l.city?.toLowerCase() === city.toLowerCase());
    }
    return [...memoryStore.lots];
  },

  async getLotById(id: string): Promise<IParkingLot | null> {
    if (this.isMongoActive()) {
      return await ParkingLotModel.findById(id).lean();
    }
    return memoryStore.lots.find(l => l._id === id) || null;
  },

  async createLot(lotData: Partial<IParkingLot>): Promise<IParkingLot> {
    const lot: IParkingLot = {
      _id: new mongoose.Types.ObjectId().toString(),
      name: lotData.name || 'New Station',
      address: lotData.address || 'Vijayawada, AP',
      area: lotData.area || 'Vijayawada Center',
      city: lotData.city || 'Vijayawada',
      latitude: lotData.latitude || 16.5062,
      longitude: lotData.longitude || 80.6480,
      totalSlots: lotData.totalSlots || 20,
      availableSlots: lotData.availableSlots || lotData.totalSlots || 20,
      occupiedSlots: lotData.occupiedSlots || 0,
      hourlyPrice: lotData.hourlyPrice || 30,
      operatingHours: lotData.operatingHours || '24/7 Mon-Sun',
      status: lotData.status || 'available',
      vehicleCategories: lotData.vehicleCategories || ['car', 'bike', 'suv'],
      googleMapsUrl: lotData.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(lotData.name || 'Vijayawada')}`,
      amenities: lotData.amenities || ['Security Patrol', 'Automated Barrier'],
      operatorId: lotData.operatorId,
    };
    if (this.isMongoActive()) {
      await ParkingLotModel.create(lot);
    }
    memoryStore.lots.push(lot);

    // Auto-generate slots for this new lot
    for (let i = 1; i <= Math.min(lot.totalSlots, 15); i++) {
      await this.addSlot({
        lotId: lot._id,
        slotNumber: `S-${i.toString().padStart(2, '0')}`,
        floor: 'Ground Floor',
        status: 'available',
        vehicleTypes: (lot.vehicleCategories as ('car' | 'bike' | 'suv' | 'ev')[]) || ['car'],
        hourlyPrice: lot.hourlyPrice,
      });
    }

    return lot;
  },

  async updateLot(id: string, lotData: Partial<IParkingLot>): Promise<IParkingLot | null> {
    if (this.isMongoActive()) {
      await ParkingLotModel.findByIdAndUpdate(id, lotData);
    }
    const lot = memoryStore.lots.find(l => l._id === id);
    if (lot) {
      Object.assign(lot, lotData);
      return lot;
    }
    return null;
  },

  async updateLotAvailability(id: string, availableSlots: number, occupiedSlots: number, status?: 'available' | 'full' | 'closed'): Promise<boolean> {
    const updateObj: any = { availableSlots, occupiedSlots };
    if (status) updateObj.status = status;

    if (this.isMongoActive()) {
      await ParkingLotModel.findByIdAndUpdate(id, updateObj);
    }
    const lot = memoryStore.lots.find(l => l._id === id);
    if (lot) {
      lot.availableSlots = availableSlots;
      lot.occupiedSlots = occupiedSlots;
      if (status) lot.status = status;
      return true;
    }
    return false;
  },

  async deleteLot(id: string): Promise<boolean> {
    if (this.isMongoActive()) {
      await ParkingLotModel.findByIdAndDelete(id);
      await ParkingSlotModel.deleteMany({ lotId: id });
    }
    const idx = memoryStore.lots.findIndex(l => l._id === id);
    if (idx !== -1) {
      memoryStore.lots.splice(idx, 1);
      memoryStore.slots = memoryStore.slots.filter(s => s.lotId !== id);
      return true;
    }
    return false;
  },

  // Parking Slots
  async getSlotsByLot(lotId: string): Promise<IParkingSlot[]> {
    if (this.isMongoActive()) {
      return await ParkingSlotModel.find({ lotId }).lean();
    }
    return memoryStore.slots.filter(s => s.lotId === lotId);
  },

  async getSlotById(id: string): Promise<IParkingSlot | null> {
    if (this.isMongoActive()) {
      return await ParkingSlotModel.findById(id).lean();
    }
    return memoryStore.slots.find(s => s._id === id) || null;
  },

  async updateSlotStatus(slotId: string, status: 'available' | 'occupied' | 'reserved' | 'maintenance'): Promise<boolean> {
    if (this.isMongoActive()) {
      await ParkingSlotModel.findByIdAndUpdate(slotId, { status });
    }
    const slot = memoryStore.slots.find(s => s._id === slotId);
    if (slot) {
      slot.status = status;
      return true;
    }
    return false;
  },

  async addSlot(slotData: Partial<IParkingSlot>): Promise<IParkingSlot> {
    const newSlot: IParkingSlot = {
      _id: new mongoose.Types.ObjectId().toString(),
      lotId: slotData.lotId || '',
      slotNumber: slotData.slotNumber || '',
      floor: slotData.floor || 'Ground',
      status: slotData.status || 'available',
      vehicleTypes: slotData.vehicleTypes || ['car'],
      hourlyPrice: slotData.hourlyPrice || 30,
    };
    if (this.isMongoActive()) {
      await ParkingSlotModel.create(newSlot);
    }
    memoryStore.slots.push(newSlot);
    return newSlot;
  },

  // Reservations & Conflicts
  async checkSlotConflict(slotId: string, start: Date, end: Date, excludeReservationId?: string): Promise<boolean> {
    const list = this.isMongoActive()
      ? await ReservationModel.find({
          slotId,
          bookingStatus: { $in: ['confirmed', 'active', 'pending'] },
        }).lean()
      : memoryStore.reservations.filter(
          r => r.slotId === slotId && ['confirmed', 'active', 'pending'].includes(r.bookingStatus)
        );

    for (const r of list) {
      if (excludeReservationId && r._id === excludeReservationId) continue;
      const rStart = new Date(r.startTime).getTime();
      const rEnd = new Date(r.endTime).getTime();
      const reqStart = start.getTime();
      const reqEnd = end.getTime();

      // Overlap formula: (StartA < EndB) and (EndA > StartB)
      if (reqStart < rEnd && reqEnd > rStart) {
        return true;
      }
    }
    return false;
  },

  async createReservation(resData: Partial<IReservation>): Promise<IReservation> {
    const token = `QR-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const newRes: IReservation = {
      _id: new mongoose.Types.ObjectId().toString(),
      userId: resData.userId || '',
      vehicleId: resData.vehicleId || '',
      lotId: resData.lotId || '',
      slotId: resData.slotId || '',
      startTime: resData.startTime ? new Date(resData.startTime) : new Date(),
      endTime: resData.endTime ? new Date(resData.endTime) : new Date(),
      totalAmount: resData.totalAmount || 0,
      bookingStatus: resData.bookingStatus || 'confirmed',
      paymentStatus: resData.paymentStatus || 'paid',
      qrToken: token,
      createdAt: new Date(),
    };

    if (this.isMongoActive()) {
      await ReservationModel.create(newRes);
    }
    memoryStore.reservations.push(newRes);

    // Save QR token
    const qr: IQRToken = {
      _id: new mongoose.Types.ObjectId().toString(),
      reservationId: newRes._id,
      tokenHash: token,
      expiresAt: newRes.endTime,
    };
    if (this.isMongoActive()) {
      await QRTokenModel.create(qr);
    }
    memoryStore.qrTokens.push(qr);

    return newRes;
  },

  async getReservationsByUser(userId: string): Promise<IReservation[]> {
    if (this.isMongoActive()) {
      return await ReservationModel.find({ userId }).sort({ createdAt: -1 }).lean();
    }
    return memoryStore.reservations.filter(r => r.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async getAllReservations(): Promise<IReservation[]> {
    if (this.isMongoActive()) {
      return await ReservationModel.find().sort({ createdAt: -1 }).lean();
    }
    return [...memoryStore.reservations].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async getReservationById(id: string): Promise<IReservation | null> {
    if (this.isMongoActive()) {
      return await ReservationModel.findById(id).lean();
    }
    return memoryStore.reservations.find(r => r._id === id) || null;
  },

  async findReservationByToken(token: string): Promise<IReservation | null> {
    if (this.isMongoActive()) {
      return await ReservationModel.findOne({ qrToken: token }).lean();
    }
    return memoryStore.reservations.find(r => r.qrToken === token || r._id === token) || null;
  },

  async updateReservationStatus(id: string, bookingStatus: IReservation['bookingStatus'], paymentStatus?: IReservation['paymentStatus']): Promise<boolean> {
    const updateObj: any = { bookingStatus };
    if (paymentStatus) updateObj.paymentStatus = paymentStatus;

    if (this.isMongoActive()) {
      await ReservationModel.findByIdAndUpdate(id, updateObj);
    }
    const r = memoryStore.reservations.find(res => res._id === id);
    if (r) {
      r.bookingStatus = bookingStatus;
      if (paymentStatus) r.paymentStatus = paymentStatus;
      return true;
    }
    return false;
  },

  // Payments
  async recordPayment(payData: Partial<IPayment>): Promise<IPayment> {
    const isSimulated = payData.isSimulated !== undefined ? payData.isSimulated : true;
    const payment: IPayment = {
      _id: new mongoose.Types.ObjectId().toString(),
      reservationId: payData.reservationId || '',
      userId: payData.userId || '',
      amount: payData.amount || 0,
      transactionId: payData.transactionId || (isSimulated ? `SIMULATED-TXN-${Date.now()}` : `TXN-RZP-${Date.now()}`),
      paymentMethod: payData.paymentMethod || (isSimulated ? 'Demo Payment Gateway (Simulated)' : 'Razorpay Test'),
      status: payData.status || 'success',
      receiptNumber: `RCP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      isSimulated,
      createdAt: new Date(),
    };
    if (this.isMongoActive()) {
      await PaymentModel.create(payment);
    }
    memoryStore.payments.push(payment);
    return payment;
  },

  async getPaymentsByUser(userId: string): Promise<IPayment[]> {
    if (this.isMongoActive()) {
      return await PaymentModel.find({ userId }).sort({ createdAt: -1 }).lean();
    }
    return memoryStore.payments.filter(p => p.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async getAllPayments(): Promise<IPayment[]> {
    if (this.isMongoActive()) {
      return await PaymentModel.find().sort({ createdAt: -1 }).lean();
    }
    return [...memoryStore.payments].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  // Parking Sessions (Entry & Exit)
  async createSession(reservationId: string, verifiedBy: string): Promise<IParkingSession> {
    const session: IParkingSession = {
      _id: new mongoose.Types.ObjectId().toString(),
      reservationId,
      entryTime: new Date(),
      status: 'active',
      entryVerifiedBy: verifiedBy,
    };
    if (this.isMongoActive()) {
      await ParkingSessionModel.create(session);
    }
    memoryStore.sessions.push(session);
    return session;
  },

  async completeSession(reservationId: string, verifiedBy: string): Promise<IParkingSession | null> {
    const now = new Date();
    if (this.isMongoActive()) {
      await ParkingSessionModel.findOneAndUpdate(
        { reservationId, status: 'active' },
        { exitTime: now, status: 'completed', exitVerifiedBy: verifiedBy }
      );
    }
    const session = memoryStore.sessions.find(s => s.reservationId === reservationId && s.status === 'active');
    if (session) {
      session.exitTime = now;
      session.status = 'completed';
      session.exitVerifiedBy = verifiedBy;
      return session;
    }
    return null;
  },

  async getActiveSessions(): Promise<IParkingSession[]> {
    if (this.isMongoActive()) {
      return await ParkingSessionModel.find({ status: 'active' }).sort({ entryTime: -1 }).lean();
    }
    return memoryStore.sessions.filter(s => s.status === 'active');
  },

  async getAllSessions(): Promise<IParkingSession[]> {
    if (this.isMongoActive()) {
      return await ParkingSessionModel.find().sort({ entryTime: -1 }).lean();
    }
    return [...memoryStore.sessions].sort((a, b) => (b.entryTime?.getTime() || 0) - (a.entryTime?.getTime() || 0));
  },

  // Occupancy History
  async getOccupancyHistory(lotId: string): Promise<IOccupancyHistory[]> {
    if (this.isMongoActive()) {
      return await OccupancyHistoryModel.find({ lotId }).sort({ timestamp: 1 }).lean();
    }
    return memoryStore.occupancyHistory.filter(h => h.lotId === lotId).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  },

  // Distance calculation (Haversine formula in KM)
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  },

  // Station Search & Geolocation Sorting
  async searchStations(opts: {
    query?: string;
    city?: string;
    vehicleType?: string;
    maxPrice?: number;
    userLat?: number;
    userLng?: number;
  }) {
    let lots = await this.getAllLots();

    if (opts.city && opts.city !== 'all') {
      lots = lots.filter(l => l.city.toLowerCase() === opts.city?.toLowerCase());
    }

    if (opts.query && opts.query.trim()) {
      const q = opts.query.toLowerCase().trim();
      lots = lots.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.area.toLowerCase().includes(q) ||
        (l.nearbyLandmark && l.nearbyLandmark.toLowerCase().includes(q)) ||
        l.city.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q)
      );
    }

    if (opts.vehicleType && opts.vehicleType !== 'all') {
      lots = lots.filter(l => l.vehicleCategories.includes(opts.vehicleType!));
    }

    if (opts.maxPrice && opts.maxPrice > 0) {
      lots = lots.filter(l => l.hourlyPrice <= opts.maxPrice!);
    }

    // Attach distance if coordinates provided
    const result = lots.map(lot => {
      let distanceKm: number | undefined;
      if (typeof opts.userLat === 'number' && typeof opts.userLng === 'number') {
        distanceKm = this.calculateDistance(opts.userLat, opts.userLng, lot.latitude, lot.longitude);
      }
      return {
        ...lot,
        distanceKm,
      };
    });

    if (typeof opts.userLat === 'number' && typeof opts.userLng === 'number') {
      result.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
    }

    return result;
  },

  // Secure Role Switching with Rate Limiting & Audit Logging
  async verifyRoleSwitch(
    userId: string,
    userEmail: string,
    targetRole: 'operator' | 'admin',
    accessCode: string,
    ipAddress: string = '127.0.0.1'
  ): Promise<{ success: boolean; error?: string; remainingAttempts?: number; locked?: boolean; user?: IUser }> {
    const now = new Date();
    const rateLimit = memoryStore.failedSwitchAttempts.get(userId) || { count: 0 };

    // Check if temporary lockout is active
    if (rateLimit.lockUntil && rateLimit.lockUntil.getTime() > now.getTime()) {
      const remainingSeconds = Math.ceil((rateLimit.lockUntil.getTime() - now.getTime()) / 1000);
      await this.createAuditLog({
        userId,
        userEmail,
        action: 'ROLE_SWITCH_BLOCKED_LOCKOUT',
        targetType: 'ROLE_SECURITY',
        status: 'failed',
        ipAddress,
        details: `Access attempt while under lockout. Remaining: ${remainingSeconds}s`,
      });
      return {
        success: false,
        error: `Temporary security lockout active due to repeated failed attempts. Please retry in ${Math.ceil(remainingSeconds / 60)} minute(s).`,
        locked: true,
      };
    }

    // Validate access codes
    const expectedOperatorCode = process.env.OPERATOR_ACCESS_CODE || '121826';
    const expectedAdminCode = process.env.ADMIN_ACCESS_CODE || '261218';
    const isValid = targetRole === 'operator'
      ? accessCode.trim() === expectedOperatorCode.trim()
      : targetRole === 'admin'
        ? accessCode.trim() === expectedAdminCode.trim()
        : false;

    if (!isValid) {
      rateLimit.count += 1;
      const remaining = Math.max(0, 5 - rateLimit.count);
      let locked = false;

      if (rateLimit.count >= 5) {
        rateLimit.lockUntil = new Date(now.getTime() + 5 * 60 * 1000); // 5 minute lockout
        locked = true;
      }
      memoryStore.failedSwitchAttempts.set(userId, rateLimit);

      await this.createAuditLog({
        userId,
        userEmail,
        action: 'ROLE_SWITCH_DENIED',
        targetType: 'ROLE_SECURITY',
        targetId: targetRole,
        status: 'failed',
        ipAddress,
        details: `Invalid security code entered for target role [${targetRole}]. Attempt ${rateLimit.count}/5.${locked ? ' User locked out for 5 mins.' : ''}`,
      });

      return {
        success: false,
        error: locked
          ? 'Maximum invalid attempts reached. Security lockout triggered for 5 minutes.'
          : `Invalid security code. ${remaining} attempt(s) remaining before temporary lockout.`,
        remainingAttempts: remaining,
        locked,
      };
    }

    // Correct code: reset rate limit counter
    memoryStore.failedSwitchAttempts.delete(userId);

    // Update user role
    const updatedUser = await this.updateUserRole(userId, targetRole);

    await this.createAuditLog({
      userId,
      userEmail,
      action: 'ROLE_SWITCH_AUTHORIZED',
      targetType: 'ROLE_SECURITY',
      targetId: targetRole,
      status: 'success',
      ipAddress,
      details: `User successfully elevated role to [${targetRole}] using verified access token.`,
    });

    return {
      success: true,
      user: updatedUser || undefined,
    };
  },

  async updateUserRole(userId: string, newRole: 'user' | 'operator' | 'admin'): Promise<IUser | null> {
    if (this.isMongoActive()) {
      await UserModel.findByIdAndUpdate(userId, { role: newRole });
    }
    const u = memoryStore.users.find(user => user._id === userId);
    if (u) {
      u.role = newRole;
      return u;
    }
    return null;
  },

  // Station Verification Management
  async updateStationVerification(lotId: string, verificationStatus: 'verified' | 'unverified' | 'pending'): Promise<IParkingLot | null> {
    if (this.isMongoActive()) {
      await ParkingLotModel.findByIdAndUpdate(lotId, { verificationStatus });
    }
    const lot = memoryStore.lots.find(l => l._id === lotId);
    if (lot) {
      lot.verificationStatus = verificationStatus;
      return lot;
    }
    return null;
  },

  // Operator Assignments
  async assignOperator(operatorId: string, operatorName: string, lotId: string, notes?: string): Promise<IOperatorAssignment> {
    const assignment: IOperatorAssignment = {
      _id: new mongoose.Types.ObjectId().toString(),
      operatorId,
      operatorName,
      lotId,
      assignedAt: new Date(),
      status: 'active',
      notes: notes || 'Assigned via Administrator Console',
    };

    if (this.isMongoActive()) {
      await OperatorAssignmentModel.create(assignment);
      await ParkingLotModel.findByIdAndUpdate(lotId, { operatorId });
    }

    const lot = memoryStore.lots.find(l => l._id === lotId);
    if (lot) lot.operatorId = operatorId;

    memoryStore.operatorAssignments.push(assignment);
    return assignment;
  },

  async getOperatorAssignments(): Promise<IOperatorAssignment[]> {
    if (this.isMongoActive()) {
      return await OperatorAssignmentModel.find({ status: 'active' }).sort({ assignedAt: -1 }).lean();
    }
    return memoryStore.operatorAssignments.filter(a => a.status === 'active');
  },

  // Audit Logs
  async createAuditLog(log: Partial<IAuditLog>): Promise<IAuditLog> {
    const entry: IAuditLog = {
      _id: new mongoose.Types.ObjectId().toString(),
      userId: log.userId,
      userEmail: log.userEmail,
      action: log.action || 'SECURITY_EVENT',
      targetType: log.targetType || 'GENERAL',
      targetId: log.targetId,
      status: log.status || 'success',
      ipAddress: log.ipAddress || '127.0.0.1',
      details: log.details || '',
      timestamp: new Date(),
    };
    if (this.isMongoActive()) {
      await AuditLogModel.create(entry);
    }
    memoryStore.auditLogs.unshift(entry);
    if (memoryStore.auditLogs.length > 500) memoryStore.auditLogs.pop();
    return entry;
  },

  async getAuditLogs(limit: number = 50): Promise<IAuditLog[]> {
    if (this.isMongoActive()) {
      return await AuditLogModel.find().sort({ timestamp: -1 }).limit(limit).lean();
    }
    return memoryStore.auditLogs.slice(0, limit);
  },

  // Chat History Persistence
  async saveChatMessage(userId: string, role: 'user' | 'assistant', message: string, metadata?: any): Promise<IChatHistory> {
    const item: IChatHistory = {
      _id: new mongoose.Types.ObjectId().toString(),
      userId,
      role,
      message,
      timestamp: new Date(),
      metadata,
    };
    if (this.isMongoActive()) {
      await ChatHistoryModel.create(item);
    }
    memoryStore.chatHistory.push(item);
    return item;
  },

  async getChatHistory(userId: string, limit: number = 30): Promise<IChatHistory[]> {
    if (this.isMongoActive()) {
      return await ChatHistoryModel.find({ userId }).sort({ timestamp: 1 }).limit(limit).lean();
    }
    return memoryStore.chatHistory.filter(c => c.userId === userId).slice(-limit);
  },
};

