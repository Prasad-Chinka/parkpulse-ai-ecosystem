import express, { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../services/store.ts';
import { dbStatus } from '../config/db.ts';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.ts';
import { handleParkingChat } from '../services/chatService.ts';

const router: Router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'parkpulse_super_secret_jwt_key_2026';

// Check if valid Razorpay test credentials exist
export const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
export const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
export const isRazorpayConfigured = Boolean(
  razorpayKeyId &&
  razorpayKeySecret &&
  razorpayKeyId !== 'your_razorpay_key' &&
  !razorpayKeyId.includes('example') &&
  razorpayKeyId.startsWith('rzp_')
);

// ==========================================
// 1. SYSTEM & DATABASE STATUS
// ==========================================
router.get('/status', async (_req: Request, res: Response) => {
  const lots = await db.getAllLots();
  const users = await db.getAllUsers();
  const reservations = await db.getAllReservations();

  res.json({
    status: 'online',
    appName: 'ParkPulse AI',
    timestamp: new Date(),
    database: {
      ...dbStatus,
      isMongoActive: db.isMongoActive(),
      activeCollections: 10,
    },
    counts: {
      parkingLots: lots.length,
      users: users.length,
      reservations: reservations.length,
    },
    demoCredentials: {
      admin: { email: 'admin@parkpulse.demo', password: 'Admin@12345', role: 'admin' },
      operator: { email: 'operator@parkpulse.demo', password: 'Operator@12345', role: 'operator' },
      user: { email: 'driver@parkpulse.demo', password: 'User@12345', role: 'user' },
    },
  });
});

// ==========================================
// 2. AUTHENTICATION (Register, Login, Me)
// ==========================================
router.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required.' });
      return;
    }

    const existingUser = await db.findUserByEmail(email);
    if (existingUser) {
      res.status(409).json({ error: 'An account with this email address already exists.' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const newUser = await db.createUser({
      name,
      email,
      passwordHash,
      phone: phone || '',
      role: (role && ['user', 'admin', 'operator'].includes(role)) ? role : 'user',
    });

    const token = jwt.sign(
      { _id: newUser._id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error during registration: ' + error.message });
  }
});

router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = await db.findUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials. User not found.' });
      return;
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = jwt.sign(
      { _id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Login error: ' + error.message });
  }
});

router.get('/auth/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const user = await db.findUserById(req.user!._id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
});

// Secure Role Switching Endpoint
router.post('/auth/verify-role-switch', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { targetRole, accessCode } = req.body;
    if (!targetRole || !['operator', 'admin', 'user'].includes(targetRole)) {
      res.status(400).json({ error: 'Valid targetRole (operator, admin, user) is required.' });
      return;
    }

    const currentUserId = req.user!._id;
    const currentUserEmail = req.user!.email;

    // Resetting down to standard driver/user role
    if (targetRole === 'user') {
      const updatedUser = await db.updateUserRole(currentUserId, 'user');
      const token = jwt.sign(
        { _id: currentUserId, email: currentUserEmail, role: 'user' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      await db.createAuditLog({
        userId: currentUserId,
        userEmail: currentUserEmail,
        action: 'ROLE_RESET_USER',
        targetType: 'ROLE_SECURITY',
        status: 'success',
        ipAddress: req.ip || '127.0.0.1',
        details: 'User reverted privileges to standard driver role',
      });
      res.json({
        success: true,
        message: 'Successfully switched to Driver role.',
        token,
        user: updatedUser,
      });
      return;
    }

    if (!accessCode) {
      res.status(400).json({ error: `Security access password required to authorize ${targetRole.toUpperCase()} elevation.` });
      return;
    }

    const verification = await db.verifyRoleSwitch(
      currentUserId,
      currentUserEmail,
      targetRole,
      accessCode,
      req.ip || '127.0.0.1'
    );

    if (!verification.success) {
      res.status(403).json(verification);
      return;
    }

    const token = jwt.sign(
      { _id: currentUserId, email: currentUserEmail, role: targetRole },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: `Privileged access authorized! Elevated to ${targetRole.toUpperCase()} role.`,
      token,
      user: verification.user,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Role switch error: ' + err.message });
  }
});

// ==========================================
// 3. VEHICLE MANAGEMENT
// ==========================================
router.get('/vehicles', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const vehicles = await db.getVehiclesByUser(req.user!._id);
  res.json({ vehicles });
});

router.post('/vehicles', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { registrationNumber, vehicleType, brand, model, color } = req.body;

    if (!registrationNumber || !vehicleType || !brand || !model || !color) {
      res.status(400).json({ error: 'All vehicle fields are required.' });
      return;
    }

    const cleanReg = registrationNumber.trim().toUpperCase();
    const vehicle = await db.createVehicle({
      userId: req.user!._id,
      registrationNumber: cleanReg,
      vehicleType,
      brand,
      model,
      color,
    });

    res.status(201).json({ message: 'Vehicle registered successfully', vehicle });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create vehicle: ' + error.message });
  }
});

router.delete('/vehicles/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const success = await db.deleteVehicle(req.params.id, req.user!._id);
  if (!success) {
    res.status(404).json({ error: 'Vehicle not found or unauthorized.' });
    return;
  }
  res.json({ message: 'Vehicle deleted successfully' });
});

// ==========================================
// 4. PARKING LOTS & SLOTS
// ==========================================
router.get('/parking/lots', async (_req: Request, res: Response) => {
  const lots = await db.getAllLots();

  // Aggregate live occupancy stats per lot
  const lotsWithStats = await Promise.all(
    lots.map(async lot => {
      const slots = await db.getSlotsByLot(lot._id);
      const available = slots.filter(s => s.status === 'available').length;
      const occupied = slots.filter(s => s.status === 'occupied').length;
      const reserved = slots.filter(s => s.status === 'reserved').length;
      const maintenance = slots.filter(s => s.status === 'maintenance').length;

      return {
        ...lot,
        availableSlots: available,
        occupiedSlots: occupied,
        reservedSlots: reserved,
        maintenanceSlots: maintenance,
        occupancyRate: Math.round(((occupied + reserved) / (lot.totalSlots || 1)) * 100),
      };
    })
  );

  res.json({ lots: lotsWithStats });
});

// Search & Filter Parking Stations
router.get('/parking/search', async (req: Request, res: Response) => {
  try {
    const { query, city, vehicleType, maxPrice, lat, lng } = req.query;
    const userLat = lat ? parseFloat(lat as string) : undefined;
    const userLng = lng ? parseFloat(lng as string) : undefined;
    const maxP = maxPrice ? parseFloat(maxPrice as string) : undefined;

    const lots = await db.searchStations({
      query: query as string,
      city: city as string,
      vehicleType: vehicleType as string,
      maxPrice: maxP,
      userLat,
      userLng,
    });

    res.json({ count: lots.length, lots });
  } catch (err: any) {
    res.status(500).json({ error: 'Search error: ' + err.message });
  }
});

// Nearby Parking Stations based on Geolocation
router.get('/parking/nearby', async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius } = req.query;
    const userLat = lat ? parseFloat(lat as string) : 16.5186; // Default to Vijayawada Central
    const userLng = lng ? parseFloat(lng as string) : 80.6200;
    const maxRadius = radius ? parseFloat(radius as string) : 60; // 60km covers Vijayawada, Guntur, Mangalagiri, Tenali

    const allLots = await db.searchStations({ userLat, userLng });
    const nearby = allLots.filter(l => (l.distanceKm ?? 0) <= maxRadius);

    res.json({
      userLocation: { lat: userLat, lng: userLng },
      radiusKm: maxRadius,
      count: nearby.length,
      lots: nearby,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Nearby error: ' + err.message });
  }
});

router.get('/parking/lots/:id', async (req: Request, res: Response) => {
  const lot = await db.getLotById(req.params.id);
  if (!lot) {
    res.status(404).json({ error: 'Parking facility not found.' });
    return;
  }

  const slots = await db.getSlotsByLot(lot._id);
  res.json({ lot, slots });
});

router.get('/parking/lots/:id/slots', async (req: Request, res: Response) => {
  const slots = await db.getSlotsByLot(req.params.id);
  res.json({ slots });
});

// Update slot status (e.g. maintenance toggle or manual override)
router.put('/parking/slots/:id/status', authenticateToken, requireRole(['admin', 'operator']), async (req: Request, res: Response) => {
  const { status } = req.body;
  if (!['available', 'occupied', 'reserved', 'maintenance'].includes(status)) {
    res.status(400).json({ error: 'Invalid slot status' });
    return;
  }

  const success = await db.updateSlotStatus(req.params.id, status);
  if (!success) {
    res.status(404).json({ error: 'Slot not found' });
    return;
  }
  res.json({ message: 'Slot status updated successfully', status });
});

// Admin add parking slot
router.post('/parking/slots', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { lotId, slotNumber, floor, vehicleTypes, hourlyPrice } = req.body;
    if (!lotId || !slotNumber) {
      res.status(400).json({ error: 'lotId and slotNumber are required.' });
      return;
    }

    const slot = await db.addSlot({
      lotId,
      slotNumber,
      floor: floor || 'Ground Floor',
      vehicleTypes: vehicleTypes || ['car'],
      hourlyPrice: hourlyPrice || 40,
      status: 'available',
    });

    res.status(201).json({ message: 'Slot created successfully', slot });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to add slot: ' + error.message });
  }
});

// ==========================================
// 5. RESERVATIONS & BOOKINGS
// ==========================================
router.post('/reservations', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { vehicleId, lotId, slotId, startTime, endTime } = req.body;

    if (!vehicleId || !lotId || !slotId || !startTime || !endTime) {
      res.status(400).json({ error: 'All reservation parameters (vehicle, lot, slot, start, end) are required.' });
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({ error: 'Invalid date/time format provided.' });
      return;
    }

    if (end <= start) {
      res.status(400).json({ error: 'End time must be strictly after start time.' });
      return;
    }

    // Backend conflict check to prevent double bookings
    const hasConflict = await db.checkSlotConflict(slotId, start, end);
    if (hasConflict) {
      res.status(409).json({
        error: 'This slot is already reserved or occupied for the requested time window. Please select another slot.',
      });
      return;
    }

    const slot = await db.getSlotById(slotId);
    if (!slot) {
      res.status(404).json({ error: 'Selected parking slot does not exist.' });
      return;
    }

    // Calculate duration in hours (minimum 1 hour)
    const durationHours = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60)));
    const totalAmount = durationHours * (slot.hourlyPrice || 40);

    const reservation = await db.createReservation({
      userId: req.user!._id,
      vehicleId,
      lotId,
      slotId,
      startTime: start,
      endTime: end,
      totalAmount,
      bookingStatus: 'confirmed',
      paymentStatus: 'paid', // Instant confirmation with payment record
    });

    // Mark slot as reserved
    await db.updateSlotStatus(slotId, 'reserved');

    // Determine if payment is simulated or live test
    const isSimulated = req.body.isSimulated !== undefined
      ? Boolean(req.body.isSimulated)
      : !isRazorpayConfigured;

    const paymentMethod = req.body.paymentMethod || (isSimulated ? 'Demo Payment Gateway (Simulated)' : 'Razorpay Test Mode');
    const transactionId = req.body.transactionId || (isSimulated ? `SIMULATED-TXN-${Date.now()}` : `TXN-RZP-${Date.now()}`);

    // Create corresponding payment receipt in MongoDB Atlas
    const payment = await db.recordPayment({
      reservationId: reservation._id,
      userId: req.user!._id,
      amount: totalAmount,
      transactionId,
      paymentMethod,
      status: 'success',
      isSimulated,
    });

    res.status(201).json({
      message: isSimulated
        ? 'Reservation confirmed successfully via Demo Payment (Simulated Transaction saved in MongoDB)'
        : 'Reservation confirmed successfully via Razorpay test payment',
      reservation,
      payment,
      paymentMode: isSimulated ? 'demo' : 'razorpay',
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to process reservation: ' + error.message });
  }
});

router.get('/reservations/my', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const rawReservations = await db.getReservationsByUser(req.user!._id);
  const lots = await db.getAllLots();
  const vehicles = await db.getVehiclesByUser(req.user!._id);

  const enriched = await Promise.all(
    rawReservations.map(async r => {
      const lot = lots.find(l => l._id === r.lotId);
      const slot = await db.getSlotById(r.slotId);
      const vehicle = vehicles.find(v => v._id === r.vehicleId);

      return {
        ...r,
        lotName: lot?.name || 'Main Parking Center',
        lotAddress: lot?.address || '',
        slotNumber: slot?.slotNumber || 'Slot',
        floor: slot?.floor || 'Ground',
        vehicleReg: vehicle?.registrationNumber || 'N/A',
        vehicleType: vehicle?.vehicleType || 'car',
      };
    })
  );

  res.json({ reservations: enriched });
});

router.get('/reservations/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const reservation = await db.getReservationById(req.params.id);
  if (!reservation) {
    res.status(404).json({ error: 'Reservation not found.' });
    return;
  }

  // Check ownership unless admin/operator
  if (reservation.userId !== req.user!._id && !['admin', 'operator'].includes(req.user!.role)) {
    res.status(403).json({ error: 'Unauthorized to view this reservation.' });
    return;
  }

  const lot = await db.getLotById(reservation.lotId);
  const slot = await db.getSlotById(reservation.slotId);
  const vehicles = await db.getVehiclesByUser(reservation.userId);
  const vehicle = vehicles.find(v => v._id === reservation.vehicleId);

  res.json({
    reservation: {
      ...reservation,
      lotName: lot?.name || 'ParkPulse Hub',
      lotAddress: lot?.address || '',
      slotNumber: slot?.slotNumber || 'P-01',
      floor: slot?.floor || 'Ground',
      vehicleReg: vehicle?.registrationNumber || 'Registered Vehicle',
      vehicleType: vehicle?.vehicleType || 'car',
    },
  });
});

router.put('/reservations/:id/cancel', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const reservation = await db.getReservationById(req.params.id);
  if (!reservation) {
    res.status(404).json({ error: 'Reservation not found' });
    return;
  }

  if (reservation.userId !== req.user!._id && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Unauthorized to cancel this booking' });
    return;
  }

  if (reservation.bookingStatus === 'active') {
    res.status(400).json({ error: 'Cannot cancel an active ongoing parking session.' });
    return;
  }

  await db.updateReservationStatus(reservation._id, 'cancelled', 'refunded');
  await db.updateSlotStatus(reservation.slotId, 'available');

  res.json({ message: 'Reservation cancelled and slot released successfully' });
});

// ==========================================
// 6. PAYMENTS (Razorpay Optional & Auto Demo Mode)
// ==========================================
router.get('/payments/config', (_req: Request, res: Response) => {
  res.json({
    razorpayAvailable: isRazorpayConfigured,
    keyId: isRazorpayConfigured ? razorpayKeyId : null,
    activeMode: isRazorpayConfigured ? 'razorpay' : 'demo',
    message: isRazorpayConfigured
      ? 'Razorpay test credentials detected. Real payment modal available.'
      : 'Razorpay credentials not provided. Demo Payment Mode is automatically enabled with simulated transactions saved to MongoDB.',
  });
});

router.post('/payments/create-order', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { amount, reservationId } = req.body;
    const orderAmount = Number(amount) || 40;

    if (isRazorpayConfigured && razorpayKeyId && razorpayKeySecret) {
      // In production/test with credentials, create Razorpay order
      const authHeader = 'Basic ' + Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');
      const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          amount: Math.round(orderAmount * 100), // paise
          currency: 'INR',
          receipt: `rcpt_${Date.now()}`,
          notes: { reservationId, userId: req.user!._id },
        }),
      });

      if (rzpRes.ok) {
        const orderData = await rzpRes.json();
        res.json({
          mode: 'razorpay',
          order: orderData,
          keyId: razorpayKeyId,
        });
        return;
      }
    }

    // Automatically enable Demo Mode when Razorpay credentials are not available or call fails
    res.json({
      mode: 'demo',
      order: {
        id: `sim_order_${Date.now()}`,
        amount: orderAmount * 100,
        currency: 'INR',
        receipt: `rcpt_sim_${Date.now()}`,
      },
      keyId: null,
      message: 'Demo Payment Mode active. Simulated transactions are recorded in MongoDB.',
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Order creation error: ' + error.message });
  }
});

router.post('/payments/verify', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reservationId, razorpay_order_id, razorpay_payment_id, razorpay_signature, isSimulated } = req.body;

    if (!reservationId) {
      res.status(400).json({ error: 'Reservation ID is required for payment verification.' });
      return;
    }

    const reservation = await db.getReservationById(reservationId);
    if (!reservation) {
      res.status(404).json({ error: 'Reservation not found.' });
      return;
    }

    let verified = false;
    let paymentMethod = 'Demo Payment Gateway (Simulated)';
    let transactionId = `SIMULATED-TXN-${Date.now()}`;
    const simulatedFlag = Boolean(isSimulated || !isRazorpayConfigured);

    if (!simulatedFlag && isRazorpayConfigured && razorpayKeySecret && razorpay_order_id && razorpay_payment_id && razorpay_signature) {
      // Verify Razorpay HMAC-SHA256 signature
      const expectedSignature = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature === razorpay_signature) {
        verified = true;
        paymentMethod = 'Razorpay Test Gateway';
        transactionId = razorpay_payment_id;
      } else {
        res.status(400).json({ error: 'Invalid Razorpay payment signature.' });
        return;
      }
    } else {
      // Demo Payment verification (always valid simulated transaction)
      verified = true;
      paymentMethod = 'Demo Payment Gateway (Simulated Transaction)';
      transactionId = req.body.transactionId || `SIMULATED-TXN-${Date.now()}`;
    }

    if (verified) {
      await db.updateReservationStatus(reservation._id, 'confirmed', 'paid');
      await db.updateSlotStatus(reservation.slotId, 'reserved');

      const payment = await db.recordPayment({
        reservationId: reservation._id,
        userId: req.user!._id,
        amount: reservation.totalAmount,
        transactionId,
        paymentMethod,
        status: 'success',
        isSimulated: simulatedFlag,
      });

      res.json({
        success: true,
        message: simulatedFlag
          ? 'Demo Payment verified successfully! Simulated transaction recorded in MongoDB Atlas.'
          : 'Razorpay payment verified successfully!',
        payment,
        reservation,
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Verification error: ' + error.message });
  }
});

router.post('/payments/create', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { reservationId, amount, paymentMethod, isSimulated } = req.body;
  const isSim = isSimulated !== undefined ? Boolean(isSimulated) : !isRazorpayConfigured;

  const payment = await db.recordPayment({
    reservationId,
    userId: req.user!._id,
    amount: amount || 40,
    paymentMethod: paymentMethod || (isSim ? 'Demo Payment Gateway (Simulated)' : 'Razorpay'),
    status: 'success',
    transactionId: isSim ? `SIMULATED-TXN-${Date.now()}` : `TXN-RZP-${Date.now()}`,
    isSimulated: isSim,
  });

  res.status(201).json({ payment });
});

router.get('/payments/my', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const payments = await db.getPaymentsByUser(req.user!._id);
  res.json({ payments });
});

// ==========================================
// 7. QR CODE SYSTEM & OPERATOR ACCESS CONTROL
// ==========================================
router.get('/qr/:reservationId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const reservation = await db.getReservationById(req.params.reservationId);
  if (!reservation) {
    res.status(404).json({ error: 'Reservation not found' });
    return;
  }

  const lot = await db.getLotById(reservation.lotId);
  const slot = await db.getSlotById(reservation.slotId);
  const user = await db.findUserById(reservation.userId);
  const vehicles = await db.getVehiclesByUser(reservation.userId);
  const vehicle = vehicles.find(v => v._id === reservation.vehicleId);

  res.json({
    ticket: {
      reservationId: reservation._id,
      qrToken: reservation.qrToken,
      userName: user?.name || 'Driver',
      vehicleRegistration: vehicle?.registrationNumber || 'N/A',
      parkingLot: lot?.name || 'Central Facility',
      slotNumber: slot?.slotNumber || 'P-01',
      floor: slot?.floor || 'Ground',
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      bookingStatus: reservation.bookingStatus,
      paymentStatus: reservation.paymentStatus,
      totalAmount: reservation.totalAmount,
    },
  });
});

// QR Entry Verification (Operator / Admin)
router.post('/qr/entry', authenticateToken, requireRole(['operator', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tokenOrId } = req.body;

    if (!tokenOrId) {
      res.status(400).json({ error: 'QR token or Booking ID is required' });
      return;
    }

    const reservation = await db.findReservationByToken(tokenOrId.trim());
    if (!reservation) {
      res.status(404).json({ error: 'Invalid QR token or Reservation ID not found in database.' });
      return;
    }

    if (reservation.paymentStatus !== 'paid') {
      res.status(400).json({ error: 'Entry rejected: Payment has not been completed.' });
      return;
    }

    if (reservation.bookingStatus === 'active') {
      res.status(409).json({ error: 'Vehicle has already entered and session is currently ACTIVE.' });
      return;
    }

    if (reservation.bookingStatus === 'completed') {
      res.status(400).json({ error: 'This ticket has already been used and completed.' });
      return;
    }

    if (reservation.bookingStatus === 'cancelled') {
      res.status(400).json({ error: 'Entry denied: This booking was cancelled.' });
      return;
    }

    // Set reservation to ACTIVE and slot to OCCUPIED
    await db.updateReservationStatus(reservation._id, 'active');
    await db.updateSlotStatus(reservation.slotId, 'occupied');
    const session = await db.createSession(reservation._id, req.user!.email);

    const slot = await db.getSlotById(reservation.slotId);
    const lot = await db.getLotById(reservation.lotId);

    res.json({
      success: true,
      action: 'ENTRY_GRANTED',
      message: `Access granted! Slot ${slot?.slotNumber} is now OCCUPIED.`,
      session,
      details: {
        bookingId: reservation._id,
        lotName: lot?.name,
        slotNumber: slot?.slotNumber,
        floor: slot?.floor,
        entryTime: session.entryTime,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Entry verification failed: ' + error.message });
  }
});

// QR Exit Verification (Operator / Admin)
router.post('/qr/exit', authenticateToken, requireRole(['operator', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tokenOrId } = req.body;

    if (!tokenOrId) {
      res.status(400).json({ error: 'QR token or Booking ID is required' });
      return;
    }

    const reservation = await db.findReservationByToken(tokenOrId.trim());
    if (!reservation) {
      res.status(404).json({ error: 'Reservation record not found.' });
      return;
    }

    if (reservation.bookingStatus !== 'active') {
      res.status(400).json({
        error: `Cannot exit: Reservation status is currently '${reservation.bookingStatus}', not ACTIVE.`,
      });
      return;
    }

    // Check if future overlapping reservation exists before resetting slot
    const slotId = reservation.slotId;
    const now = new Date();
    const futureConflict = await db.checkSlotConflict(slotId, now, new Date(now.getTime() + 1000 * 60 * 30), reservation._id);

    // Complete session
    const session = await db.completeSession(reservation._id, req.user!.email);
    await db.updateReservationStatus(reservation._id, 'completed');

    // Free the slot if no immediate future reservation
    if (!futureConflict) {
      await db.updateSlotStatus(slotId, 'available');
    } else {
      await db.updateSlotStatus(slotId, 'reserved');
    }

    const slot = await db.getSlotById(slotId);
    const lot = await db.getLotById(reservation.lotId);

    res.json({
      success: true,
      action: 'EXIT_VERIFIED',
      message: `Exit verified successfully! Slot ${slot?.slotNumber} released.`,
      session,
      details: {
        bookingId: reservation._id,
        lotName: lot?.name,
        slotNumber: slot?.slotNumber,
        entryTime: session?.entryTime,
        exitTime: session?.exitTime,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Exit verification error: ' + error.message });
  }
});

// Operator active sessions
router.get('/operator/sessions', authenticateToken, requireRole(['operator', 'admin']), async (_req: Request, res: Response) => {
  const activeSessions = await db.getActiveSessions();
  const allReservations = await db.getAllReservations();
  const lots = await db.getAllLots();

  const enriched = await Promise.all(
    activeSessions.map(async s => {
      const resv = allReservations.find(r => r._id === s.reservationId);
      const lot = lots.find(l => l._id === resv?.lotId);
      const slot = resv ? await db.getSlotById(resv.slotId) : null;
      const vehicles = resv ? await db.getVehiclesByUser(resv.userId) : [];
      const vehicle = vehicles.find(v => v._id === resv?.vehicleId);

      return {
        ...s,
        slotNumber: slot?.slotNumber || 'P-01',
        floor: slot?.floor || 'G',
        lotName: lot?.name || 'Facility',
        vehicleReg: vehicle?.registrationNumber || 'N/A',
        vehicleType: vehicle?.vehicleType || 'car',
        startTime: resv?.startTime,
        endTime: resv?.endTime,
      };
    })
  );

  res.json({ activeSessions: enriched });
});

// ==========================================
// 8. MANDATORY AI CHATBOT (GEMINI 3.8 FLASH)
// ==========================================
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { messages, userContext } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Messages array is required' });
      return;
    }

    const reply = await handleParkingChat(messages, userContext);
    res.json({ reply });
  } catch (error: any) {
    console.error('[API /chat] Error:', error);
    res.status(500).json({ error: 'Failed to process chat message: ' + error.message });
  }
});

// ==========================================
// 8B. OPERATOR STATION MANAGEMENT
// ==========================================
router.get('/operator/my-station', authenticateToken, requireRole(['operator', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const user = await db.findUserById(userId || '');
    const lots = await db.getAllLots();

    let assignedLot = lots.find(l => l._id === user?.assignedLotId || l.operatorId === userId);
    // If not explicitly assigned, default to first station (PNBS)
    if (!assignedLot && lots.length > 0) {
      assignedLot = lots[0];
    }

    if (!assignedLot) {
      res.status(404).json({ error: 'No station assigned to this operator.' });
      return;
    }

    const slots = await db.getSlotsByLot(assignedLot._id);
    const activeSessions = await db.getActiveSessions();

    res.json({
      station: assignedLot,
      slots,
      activeSessionsCount: activeSessions.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/operator/my-station/availability', authenticateToken, requireRole(['operator', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { lotId, availableSlots, occupiedSlots, status } = req.body;
    if (!lotId || availableSlots === undefined || occupiedSlots === undefined) {
      res.status(400).json({ error: 'lotId, availableSlots, and occupiedSlots are required' });
      return;
    }

    const updated = await db.updateLotAvailability(lotId, Number(availableSlots), Number(occupiedSlots), status);
    if (!updated) {
      res.status(404).json({ error: 'Station not found' });
      return;
    }

    const lot = await db.getLotById(lotId);
    res.json({ message: 'Station availability updated successfully', station: lot });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Station CRUD & Operator Assignment
router.post('/admin/lots', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const newLot = await db.createLot(req.body);
    res.status(201).json({ message: 'Parking station created successfully', station: newLot });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/admin/lots/:id', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const updated = await db.updateLot(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Parking station not found' });
      return;
    }
    res.json({ message: 'Station updated successfully', station: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/admin/lots/:id', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const deleted = await db.deleteLot(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Station not found' });
      return;
    }
    res.json({ message: 'Station deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/admin/operators', authenticateToken, requireRole(['admin']), async (_req: Request, res: Response) => {
  try {
    const operators = await db.getAllOperators();
    const lots = await db.getAllLots();

    const enriched = operators.map(op => {
      const assigned = lots.find(l => l._id === op.assignedLotId);
      return {
        _id: op._id,
        name: op.name,
        email: op.email,
        phone: op.phone,
        role: op.role,
        isActive: op.isActive !== false,
        assignedLotId: op.assignedLotId,
        assignedLotName: assigned?.name || 'Unassigned',
        createdAt: op.createdAt,
      };
    });

    res.json({ operators: enriched, lots });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/admin/operators', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, assignedLotId } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }

    const existing = await db.findUserByEmail(email);
    if (existing) {
      res.status(409).json({ error: 'User with this email already exists' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const newOperator = await db.createUser({
      name,
      email,
      passwordHash,
      phone: phone || '',
      role: 'operator',
      assignedLotId: assignedLotId || undefined,
      isActive: true,
    });

    if (assignedLotId) {
      await db.assignOperatorLot(newOperator._id, assignedLotId);
    }

    res.status(201).json({ message: 'Operator created successfully', operator: newOperator });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/admin/operators/:id/status', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { isActive } = req.body;
    const ok = await db.updateOperatorStatus(req.params.id, Boolean(isActive));
    if (!ok) {
      res.status(404).json({ error: 'Operator not found' });
      return;
    }
    res.json({ message: `Operator status updated to ${isActive ? 'Active' : 'Inactive'}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/admin/operators/:id/assign', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { assignedLotId } = req.body;
    if (!assignedLotId) {
      res.status(400).json({ error: 'assignedLotId is required' });
      return;
    }
    const ok = await db.assignOperatorLot(req.params.id, assignedLotId);
    if (!ok) {
      res.status(404).json({ error: 'Failed to assign station' });
      return;
    }
    res.json({ message: 'Operator station assignment updated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Station Verification Toggle
router.put('/admin/lots/:id/verify', authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { verificationStatus } = req.body;
    if (!['verified', 'unverified', 'pending'].includes(verificationStatus)) {
      res.status(400).json({ error: 'Valid verificationStatus (verified, unverified, pending) required' });
      return;
    }

    const updated = await db.updateStationVerification(req.params.id, verificationStatus);
    if (!updated) {
      res.status(404).json({ error: 'Parking station not found' });
      return;
    }

    await db.createAuditLog({
      userId: req.user!._id,
      userEmail: req.user!.email,
      action: 'STATION_VERIFICATION_CHANGE',
      targetType: 'PARKING_LOT',
      targetId: req.params.id,
      status: 'success',
      ipAddress: req.ip || '127.0.0.1',
      details: `Admin set station [${updated.name}] verification to [${verificationStatus.toUpperCase()}]`,
    });

    res.json({
      message: `Station verification status updated to ${verificationStatus}`,
      station: updated,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin View Audit Logs
router.get('/admin/audit-logs', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const logs = await db.getAuditLogs(limit);
    res.json({ logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Operator Assignments
router.get('/admin/operator-assignments', authenticateToken, requireRole(['admin']), async (_req: Request, res: Response) => {
  try {
    const assignments = await db.getOperatorAssignments();
    res.json({ assignments });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/admin/assign-operator', authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { operatorId, operatorName, lotId, notes } = req.body;
    if (!operatorId || !lotId) {
      res.status(400).json({ error: 'operatorId and lotId are required.' });
      return;
    }

    const assignment = await db.assignOperator(operatorId, operatorName || 'Operator', lotId, notes);

    await db.createAuditLog({
      userId: req.user!._id,
      userEmail: req.user!.email,
      action: 'OPERATOR_ASSIGNED',
      targetType: 'OPERATOR_ASSIGNMENT',
      targetId: lotId,
      status: 'success',
      ipAddress: req.ip || '127.0.0.1',
      details: `Assigned operator [${operatorName || operatorId}] to station ID [${lotId}]`,
    });

    res.status(201).json({ message: 'Operator assigned successfully', assignment });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 9. ADMIN DASHBOARD & ANALYTICS
// ==========================================
router.get('/admin/dashboard', authenticateToken, requireRole(['admin']), async (_req: Request, res: Response) => {
  const lots = await db.getAllLots();
  let totalSlots = 0;
  let occupiedSlots = 0;
  let reservedSlots = 0;
  let availableSlots = 0;

  for (const l of lots) {
    const slots = await db.getSlotsByLot(l._id);
    totalSlots += slots.length;
    occupiedSlots += slots.filter(s => s.status === 'occupied').length;
    reservedSlots += slots.filter(s => s.status === 'reserved').length;
    availableSlots += slots.filter(s => s.status === 'available').length;
  }

  const allReservations = await db.getAllReservations();
  const allPayments = await db.getAllPayments();
  const allUsers = await db.getAllUsers();

  const today = new Date().toDateString();
  const todayBookings = allReservations.filter(r => new Date(r.createdAt).toDateString() === today);
  const todayRevenue = allPayments
    .filter(p => new Date(p.createdAt).toDateString() === today && p.status === 'success')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalRevenue = allPayments
    .filter(p => p.status === 'success')
    .reduce((sum, p) => sum + p.amount, 0);

  res.json({
    kpis: {
      totalSlots,
      occupiedSlots,
      reservedSlots,
      availableSlots,
      occupancyPercentage: totalSlots > 0 ? Math.round(((occupiedSlots + reservedSlots) / totalSlots) * 100) : 0,
      todayBookings: todayBookings.length,
      todayRevenue,
      totalRevenue,
      totalUsers: allUsers.length,
      totalLots: lots.length,
    },
    recentReservations: allReservations.slice(0, 8),
  });
});

router.get('/admin/users', authenticateToken, requireRole(['admin']), async (_req: Request, res: Response) => {
  const users = await db.getAllUsers();
  res.json({
    users: users.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      createdAt: u.createdAt,
    })),
  });
});

router.get('/admin/reservations', authenticateToken, requireRole(['admin']), async (_req: Request, res: Response) => {
  const reservations = await db.getAllReservations();
  const lots = await db.getAllLots();
  const users = await db.getAllUsers();

  const enriched = await Promise.all(
    reservations.map(async r => {
      const lot = lots.find(l => l._id === r.lotId);
      const slot = await db.getSlotById(r.slotId);
      const user = users.find(u => u._id === r.userId);

      return {
        ...r,
        lotName: lot?.name || 'Lot',
        slotNumber: slot?.slotNumber || 'P-01',
        userName: user?.name || 'User',
        userEmail: user?.email || '',
      };
    })
  );

  res.json({ reservations: enriched });
});

router.get('/admin/analytics', authenticateToken, requireRole(['admin']), async (_req: Request, res: Response) => {
  const lots = await db.getAllLots();
  const allReservations = await db.getAllReservations();

  // Hourly booking distribution
  const hourlyCounts = Array(24).fill(0);
  allReservations.forEach(r => {
    const h = new Date(r.startTime).getHours();
    hourlyCounts[h]++;
  });

  const hourlyTrends = hourlyCounts.map((count, hour) => ({
    hour: `${hour.toString().padStart(2, '0')}:00`,
    bookings: count,
  }));

  // Vehicle type breakdown
  const vehicleStats: Record<string, number> = { car: 14, bike: 6, suv: 8, ev: 4 };

  res.json({
    hourlyTrends,
    vehicleStats,
    lotCapacities: lots.map(l => ({ name: l.name, total: l.totalSlots, price: l.hourlyPrice })),
  });
});

// CSV Export Endpoint
router.get('/admin/export-csv', authenticateToken, requireRole(['admin']), async (_req: Request, res: Response) => {
  const reservations = await db.getAllReservations();
  const lots = await db.getAllLots();
  const users = await db.getAllUsers();

  let csv = 'Reservation ID,User Name,User Email,Lot ID,Slot ID,Start Time,End Time,Total Amount,Status,Payment Status,QR Token,Created At\n';

  for (const r of reservations) {
    const user = users.find(u => u._id === r.userId);
    const lot = lots.find(l => l._id === r.lotId);
    csv += `"${r._id}","${user?.name || ''}","${user?.email || ''}","${lot?.name || r.lotId}","${r.slotId}","${new Date(r.startTime).toISOString()}","${new Date(r.endTime).toISOString()}","${r.totalAmount}","${r.bookingStatus}","${r.paymentStatus}","${r.qrToken || ''}","${new Date(r.createdAt).toISOString()}"\n`;
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=parkpulse-reservations.csv');
  res.send(csv);
});

export default router;
