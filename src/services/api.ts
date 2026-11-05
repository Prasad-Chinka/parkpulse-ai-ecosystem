/**
 * ParkPulse AI Frontend API Client
 * Centralized API calls with auto-attached JWT headers
 */

const getHeaders = () => {
  const token = localStorage.getItem('parkpulse_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  // System Status
  async getSystemStatus() {
    const res = await fetch('/api/status');
    return res.json();
  },

  // Vehicles
  async getVehicles() {
    const res = await fetch('/api/vehicles', { headers: getHeaders() });
    return res.json();
  },

  async addVehicle(vehicle: { registrationNumber: string; vehicleType: string; brand: string; model: string; color: string }) {
    const res = await fetch('/api/vehicles', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(vehicle),
    });
    return res.json();
  },

  async deleteVehicle(id: string) {
    const res = await fetch(`/api/vehicles/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.json();
  },

  // Parking Facilities & Slots
  async getLots() {
    const res = await fetch('/api/parking/lots', { headers: getHeaders() });
    return res.json();
  },

  async getLotDetails(lotId: string) {
    const res = await fetch(`/api/parking/lots/${lotId}`, { headers: getHeaders() });
    return res.json();
  },

  async updateSlotStatus(slotId: string, status: string) {
    const res = await fetch(`/api/parking/slots/${slotId}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  async addSlot(data: { lotId: string; slotNumber: string; floor?: string; vehicleTypes?: string[]; hourlyPrice?: number }) {
    const res = await fetch('/api/parking/slots', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Reservations
  async createReservation(data: { vehicleId: string; lotId: string; slotId: string; startTime: string; endTime: string; isSimulated?: boolean; paymentMethod?: string }) {
    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getMyReservations() {
    const res = await fetch('/api/reservations/my', { headers: getHeaders() });
    return res.json();
  },

  async getReservation(id: string) {
    const res = await fetch(`/api/reservations/${id}`, { headers: getHeaders() });
    return res.json();
  },

  async cancelReservation(id: string) {
    const res = await fetch(`/api/reservations/${id}/cancel`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    return res.json();
  },

  // Payments
  async getPaymentConfig() {
    const res = await fetch('/api/payments/config');
    return res.json();
  },

  async createPaymentOrder(amount: number, reservationId?: string) {
    const res = await fetch('/api/payments/create-order', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ amount, reservationId }),
    });
    return res.json();
  },

  async verifyPayment(data: {
    reservationId: string;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    isSimulated?: boolean;
    transactionId?: string;
  }) {
    const res = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getMyPayments() {
    const res = await fetch('/api/payments/my', { headers: getHeaders() });
    return res.json();
  },

  // QR Access
  async getQRTicket(reservationId: string) {
    const res = await fetch(`/api/qr/${reservationId}`, { headers: getHeaders() });
    return res.json();
  },

  async verifyQREntry(tokenOrId: string) {
    const res = await fetch('/api/qr/entry', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ tokenOrId }),
    });
    return res.json();
  },

  async verifyQRExit(tokenOrId: string) {
    const res = await fetch('/api/qr/exit', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ tokenOrId }),
    });
    return res.json();
  },

  async getOperatorSessions() {
    const res = await fetch('/api/operator/sessions', { headers: getHeaders() });
    return res.json();
  },

  // Operator Station Management
  async getOperatorStation() {
    const res = await fetch('/api/operator/my-station', { headers: getHeaders() });
    return res.json();
  },

  async updateStationAvailability(data: { lotId: string; availableSlots: number; occupiedSlots: number; status?: string }) {
    const res = await fetch('/api/operator/my-station/availability', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Admin Stations & Operators
  async getAdminLots() {
    const res = await fetch('/api/parking/lots', { headers: getHeaders() });
    return res.json();
  },

  async createStation(data: any) {
    const res = await fetch('/api/admin/lots', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateStation(id: string, data: any) {
    const res = await fetch(`/api/admin/lots/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteStation(id: string) {
    const res = await fetch(`/api/admin/lots/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.json();
  },

  async getAdminOperators() {
    const res = await fetch('/api/admin/operators', { headers: getHeaders() });
    return res.json();
  },

  async createAdminOperator(data: any) {
    const res = await fetch('/api/admin/operators', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateOperatorStatus(id: string, isActive: boolean) {
    const res = await fetch(`/api/admin/operators/${id}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ isActive }),
    });
    return res.json();
  },

  async assignOperatorStation(id: string, assignedLotId: string) {
    const res = await fetch(`/api/admin/operators/${id}/assign`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ assignedLotId }),
    });
    return res.json();
  },

  // Admin Dashboard
  async getAdminDashboard() {
    const res = await fetch('/api/admin/dashboard', { headers: getHeaders() });
    return res.json();
  },

  async getAdminUsers() {
    const res = await fetch('/api/admin/users', { headers: getHeaders() });
    return res.json();
  },

  async getAdminReservations() {
    const res = await fetch('/api/admin/reservations', { headers: getHeaders() });
    return res.json();
  },

  async getAdminAnalytics() {
    const res = await fetch('/api/admin/analytics', { headers: getHeaders() });
    return res.json();
  },

  // Role Switching & Privileged Security
  async verifyRoleSwitch(data: { targetRole: 'operator' | 'admin' | 'user'; accessCode?: string }) {
    const res = await fetch('/api/auth/verify-role-switch', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Station Search & Geolocation Nearby
  async searchStations(params: {
    query?: string;
    city?: string;
    vehicleType?: string;
    maxPrice?: number;
    lat?: number;
    lng?: number;
  }) {
    const q = new URLSearchParams();
    if (params.query) q.set('query', params.query);
    if (params.city && params.city !== 'all') q.set('city', params.city);
    if (params.vehicleType && params.vehicleType !== 'all') q.set('vehicleType', params.vehicleType);
    if (params.maxPrice) q.set('maxPrice', params.maxPrice.toString());
    if (params.lat !== undefined) q.set('lat', params.lat.toString());
    if (params.lng !== undefined) q.set('lng', params.lng.toString());

    const res = await fetch(`/api/parking/search?${q.toString()}`, { headers: getHeaders() });
    return res.json();
  },

  async getNearbyStations(lat?: number, lng?: number, radius?: number) {
    const q = new URLSearchParams();
    if (lat !== undefined) q.set('lat', lat.toString());
    if (lng !== undefined) q.set('lng', lng.toString());
    if (radius !== undefined) q.set('radius', radius.toString());

    const res = await fetch(`/api/parking/nearby?${q.toString()}`, { headers: getHeaders() });
    return res.json();
  },

  // Admin Station Verification & Audit Logs
  async adminVerifyStation(lotId: string, verificationStatus: 'verified' | 'unverified' | 'pending') {
    const res = await fetch(`/api/admin/lots/${lotId}/verify`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ verificationStatus }),
    });
    return res.json();
  },

  async adminGetAuditLogs(limit: number = 50) {
    const res = await fetch(`/api/admin/audit-logs?limit=${limit}`, { headers: getHeaders() });
    return res.json();
  },

  async adminGetOperatorAssignments() {
    const res = await fetch('/api/admin/operator-assignments', { headers: getHeaders() });
    return res.json();
  },

  async adminAssignOperator(data: { operatorId: string; operatorName: string; lotId: string; notes?: string }) {
    const res = await fetch('/api/admin/assign-operator', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
};

