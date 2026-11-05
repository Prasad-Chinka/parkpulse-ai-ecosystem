import mongoose, { Schema, Document } from 'mongoose';

// 1. User
export interface IUser {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
  role: 'user' | 'admin' | 'operator';
  assignedLotId?: string;
  isActive?: boolean;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  phone: { type: String },
  role: { type: String, enum: ['user', 'admin', 'operator'], default: 'user' },
  assignedLotId: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

// 2. Vehicle
export interface IVehicle {
  _id: string;
  userId: string;
  registrationNumber: string;
  vehicleType: 'car' | 'bike' | 'suv' | 'ev';
  brand: string;
  model: string;
  color: string;
  createdAt: Date;
}

const VehicleSchema = new Schema<IVehicle>({
  userId: { type: String, required: true, index: true },
  registrationNumber: { type: String, required: true, unique: true },
  vehicleType: { type: String, enum: ['car', 'bike', 'suv', 'ev'], required: true },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  color: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// 3. ParkingLot
export interface IParkingLot {
  _id: string;
  name: string;
  address: string;
  area: string;
  city: string;
  nearbyLandmark?: string;
  latitude: number;
  longitude: number;
  totalSlots: number;
  availableSlots?: number;
  occupiedSlots?: number;
  hourlyPrice: number;
  operatingHours: string;
  status: 'available' | 'full' | 'closed';
  googleMapsUrl: string;
  vehicleCategories: string[];
  amenities: string[];
  operatorId?: string;
  verificationStatus?: 'verified' | 'unverified' | 'pending';
  isActive?: boolean;
}

const ParkingLotSchema = new Schema<IParkingLot>({
  name: { type: String, required: true },
  address: { type: String, required: true },
  area: { type: String, default: 'Central' },
  city: { type: String, default: 'Vijayawada' },
  nearbyLandmark: { type: String, default: '' },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  totalSlots: { type: Number, required: true },
  hourlyPrice: { type: Number, required: true },
  operatingHours: { type: String, default: '24/7' },
  status: { type: String, enum: ['available', 'full', 'closed'], default: 'available' },
  googleMapsUrl: { type: String, default: '' },
  vehicleCategories: [{ type: String }],
  amenities: [{ type: String }],
  operatorId: { type: String },
  verificationStatus: { type: String, enum: ['verified', 'unverified', 'pending'], default: 'unverified' },
  isActive: { type: Boolean, default: true },
});

// 4. ParkingSlot
export interface IParkingSlot {
  _id: string;
  lotId: string;
  slotNumber: string;
  floor: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  vehicleTypes: ('car' | 'bike' | 'suv' | 'ev')[];
  hourlyPrice: number;
}

const ParkingSlotSchema = new Schema<IParkingSlot>({
  lotId: { type: String, required: true, index: true },
  slotNumber: { type: String, required: true },
  floor: { type: String, default: 'Ground' },
  status: { type: String, enum: ['available', 'occupied', 'reserved', 'maintenance'], default: 'available' },
  vehicleTypes: [{ type: String }],
  hourlyPrice: { type: Number, required: true },
});

// 5. Reservation
export interface IReservation {
  _id: string;
  userId: string;
  vehicleId: string;
  lotId: string;
  slotId: string;
  startTime: Date;
  endTime: Date;
  totalAmount: number;
  bookingStatus: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  qrToken?: string;
  createdAt: Date;
}

const ReservationSchema = new Schema<IReservation>({
  userId: { type: String, required: true, index: true },
  vehicleId: { type: String, required: true },
  lotId: { type: String, required: true, index: true },
  slotId: { type: String, required: true, index: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  totalAmount: { type: Number, required: true },
  bookingStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  qrToken: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// 6. Payment
export interface IPayment {
  _id: string;
  reservationId: string;
  userId: string;
  amount: number;
  transactionId: string;
  paymentMethod: string;
  status: 'success' | 'failed' | 'pending';
  receiptNumber: string;
  isSimulated: boolean;
  createdAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
  reservationId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  transactionId: { type: String, required: true },
  paymentMethod: { type: String, default: 'Demo Payment Gateway' },
  status: { type: String, enum: ['success', 'failed', 'pending'], default: 'success' },
  receiptNumber: { type: String, required: true },
  isSimulated: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// 7. ParkingSession
export interface IParkingSession {
  _id: string;
  reservationId: string;
  entryTime: Date;
  exitTime?: Date;
  status: 'active' | 'completed';
  entryVerifiedBy?: string;
  exitVerifiedBy?: string;
}

const ParkingSessionSchema = new Schema<IParkingSession>({
  reservationId: { type: String, required: true, unique: true },
  entryTime: { type: Date, required: true },
  exitTime: { type: Date },
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  entryVerifiedBy: { type: String },
  exitVerifiedBy: { type: String },
});

// 8. QRToken
export interface IQRToken {
  _id: string;
  reservationId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
}

const QRTokenSchema = new Schema<IQRToken>({
  reservationId: { type: String, required: true, unique: true },
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  usedAt: { type: Date },
});

// 9. OccupancyHistory
export interface IOccupancyHistory {
  _id: string;
  lotId: string;
  timestamp: Date;
  occupiedCount: number;
  reservedCount: number;
  availableCount: number;
  dayOfWeek: number;
  hourOfDay: number;
}

const OccupancyHistorySchema = new Schema<IOccupancyHistory>({
  lotId: { type: String, required: true, index: true },
  timestamp: { type: Date, required: true },
  occupiedCount: { type: Number, required: true },
  reservedCount: { type: Number, required: true },
  availableCount: { type: Number, required: true },
  dayOfWeek: { type: Number, required: true },
  hourOfDay: { type: Number, required: true },
});

// 10. OperatorAssignment
export interface IOperatorAssignment {
  _id: string;
  operatorId: string;
  operatorName: string;
  lotId: string;
  assignedAt: Date;
  status: 'active' | 'revoked';
  notes?: string;
}

const OperatorAssignmentSchema = new Schema<IOperatorAssignment>({
  operatorId: { type: String, required: true, index: true },
  operatorName: { type: String, required: true },
  lotId: { type: String, required: true, index: true },
  assignedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'revoked'], default: 'active' },
  notes: { type: String },
});

// 11. AuditLog
export interface IAuditLog {
  _id: string;
  userId?: string;
  userEmail?: string;
  action: string;
  targetType: string;
  targetId?: string;
  status: 'success' | 'failed';
  ipAddress?: string;
  details?: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  userId: { type: String },
  userEmail: { type: String },
  action: { type: String, required: true, index: true },
  targetType: { type: String, required: true },
  targetId: { type: String },
  status: { type: String, enum: ['success', 'failed'], default: 'success' },
  ipAddress: { type: String },
  details: { type: String },
  timestamp: { type: Date, default: Date.now, index: true },
});

// 12. ChatHistory
export interface IChatHistory {
  _id: string;
  userId: string;
  role: 'user' | 'assistant';
  message: string;
  timestamp: Date;
  metadata?: any;
}

const ChatHistorySchema = new Schema<IChatHistory>({
  userId: { type: String, required: true, index: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  metadata: { type: Schema.Types.Mixed },
});

// Register Mongoose models safely
export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const VehicleModel = mongoose.models.Vehicle || mongoose.model<IVehicle>('Vehicle', VehicleSchema);
export const ParkingLotModel = mongoose.models.ParkingLot || mongoose.model<IParkingLot>('ParkingLot', ParkingLotSchema);
export const ParkingSlotModel = mongoose.models.ParkingSlot || mongoose.model<IParkingSlot>('ParkingSlot', ParkingSlotSchema);
export const ReservationModel = mongoose.models.Reservation || mongoose.model<IReservation>('Reservation', ReservationSchema);
export const PaymentModel = mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
export const ParkingSessionModel = mongoose.models.ParkingSession || mongoose.model<IParkingSession>('ParkingSession', ParkingSessionSchema);
export const QRTokenModel = mongoose.models.QRToken || mongoose.model<IQRToken>('QRToken', QRTokenSchema);
export const OccupancyHistoryModel = mongoose.models.OccupancyHistory || mongoose.model<IOccupancyHistory>('OccupancyHistory', OccupancyHistorySchema);
export const OperatorAssignmentModel = mongoose.models.OperatorAssignment || mongoose.model<IOperatorAssignment>('OperatorAssignment', OperatorAssignmentSchema);
export const AuditLogModel = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
export const ChatHistoryModel = mongoose.models.ChatHistory || mongoose.model<IChatHistory>('ChatHistory', ChatHistorySchema);


