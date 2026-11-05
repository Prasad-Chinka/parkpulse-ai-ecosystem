import { GoogleGenAI } from '@google/genai';
import { db } from './store.ts';

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function handleParkingChat(messages: ChatMessage[], userContext?: { name?: string; role?: string; email?: string }): Promise<string> {
  // Fetch live station status from store
  const lots = await db.getAllLots();
  const stationSummaries = await Promise.all(
    lots.map(async lot => {
      const slots = await db.getSlotsByLot(lot._id);
      const available = slots.filter(s => s.status === 'available').length;
      const occupied = slots.filter(s => s.status === 'occupied').length;
      const reserved = slots.filter(s => s.status === 'reserved').length;
      return `- ${lot.name} (${lot.area || 'Vijayawada'}): ₹${lot.hourlyPrice}/hr | Status: ${lot.status || 'available'} | Capacity: ${lot.totalSlots} | Avail: ${available} | Occupied: ${occupied} | Reserved: ${reserved} | Vehicles: ${(lot.vehicleCategories || ['car', 'bike']).join(', ')} | Hours: ${lot.operatingHours} | Address: ${lot.address}`;
    })
  );

  const systemPrompt = `You are "PulseAI", the official AI Mobility Assistant for ParkPulse AI – An AI-Powered Smart Parking Management System with Real-Time Slot Booking, QR-Based Vehicle Access and Location Intelligence across Vijayawada, Guntur, Mangalagiri, Tadepalle, and Tenali.
You are embedded directly in the ParkPulse AI Neon City Glassmorphism web platform.

Current 20 Smart Parking Facilities in Network:
${stationSummaries.join('\n')}

System Rules & Knowledge:
1. Provide accurate, real-time answers regarding parking stations across Vijayawada (7), Guntur (6), Mangalagiri (1), Tadepalle (1), and Tenali (5).
2. Live Tariffs: Range between ₹20/hr and ₹50/hr. Unverified capacities and availability are explicitly noted as DEMO DATA.
3. Booking flow: Users select a station from "Find Parking" (interactive map) or "Parking Stations" directory, choose an available green slot, select time duration, choose a vehicle, and complete checkout (Demo Payment or Razorpay).
4. Access Pass: Once booked, users receive an encrypted QR-ticket in "My Bookings". Operators scan the QR ticket or enter the booking code to verify check-in and release bays upon check-out.
5. Role Switching & Security:
   - Drivers/Users can switch to Operator using security code "121826" (or OPERATOR_ACCESS_CODE env).
   - Drivers/Users can switch to Administrator using security code "261218" (or ADMIN_ACCESS_CODE env).
   - Rate limiting is strictly enforced: 5 consecutive failed attempts trigger an automated 5-minute security lockout.
6. Demo Accounts:
   - Admin: admin@parkpulse.demo / Admin@12345
   - Operator: operator@parkpulse.demo / Operator@12345
   - Driver: driver@parkpulse.demo / User@12345
7. Tone: Futuristic, courteous, concise (under 160 words unless user requests step-by-step guidance).
8. Support: Central Control Room: support@parkpulse.demo or +91 866-242-9900.`;

  const ai = getAIClient();
  const lastUserMessage = messages[messages.length - 1]?.content || 'Hello';

  // If Gemini API is available, call gemini-3.8-flash
  if (ai) {
    try {
      // Build conversation history contents for Gemini
      const conversationPrompt = `${systemPrompt}\n\nUser Context: Name: ${userContext?.name || 'Guest Driver'}, Role: ${userContext?.role || 'user'}\n\nConversation History:\n${messages
        .slice(-6)
        .map(m => `${m.role === 'user' ? 'User' : 'PulseAI'}: ${m.content}`)
        .join('\n')}\nPulseAI:`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: conversationPrompt,
      });

      if (response.text && response.text.trim()) {
        return response.text.trim();
      }
    } catch (err: any) {
      console.warn('[Gemini Chatbot] API call error, falling back to heuristic engine:', err.message);
    }
  }

  // Graceful domain intelligence fallback (instant, works offline or without key)
  const q = lastUserMessage.toLowerCase();

  if (q.includes('gopala') || q.includes('governor') || q.includes('reddy')) {
    const lot = lots.find(l => l.name.toLowerCase().includes('gopala') || l.area.toLowerCase().includes('governor'));
    return `**Car Parking – Gopala Reddy Road, Governor Peta** is located in central Governor Peta, Vijayawada.
- **Hourly Tariff**: ₹${lot?.hourlyPrice || 30}/hr
- **Hours**: 24/7 Mon-Sun
- **Total Capacity**: ${lot?.totalSlots || 40} bays (DEMO DATA)
- **Features**: Covered stalls, 24/7 CCTV surveillance, automated barrier, and on-site attendant.
You can reserve a bay directly from the **Parking Stations – Vijayawada** tab!`;
  }

  if (q.includes('railway') || q.includes('junction') || q.includes('station') || q.includes('tarapet')) {
    const rly = lots.find(l => l.name.toLowerCase().includes('junction'));
    return `**Vijayawada Junction Railway Station Parking** is situated on Station Road, Tarapet, Vijayawada.
- **Tariff**: ₹${rly?.hourlyPrice || 40}/hr
- **Hours**: 24/7 Mon-Sun
- **Total Capacity**: ${rly?.totalSlots || 60} bays (DEMO DATA)
- **Vehicles**: Cars, Bikes, SUVs
- Direct concourse access to Platform 1. Guaranteed reserved bays prevent train departure delays!`;
  }

  if (q.includes('ntr') || q.includes('cellar')) {
    const ntr = lots.find(l => l.name.toLowerCase().includes('ntr'));
    return `**Dr. NTR Complex Cellar Parking** is situated at Dr. NTR Complex, near NTR Circle, Governor Peta.
- **Tariff**: ₹${ntr?.hourlyPrice || 30}/hr
- **Hours**: 08:00 AM - 10:30 PM
- **Features**: Secure underground cellar, elevator connectivity, and dedicated two-wheeler bays.`;
  }

  if (q.includes('kr market') || q.includes('kaleswara') || q.includes('market')) {
    const krm = lots.find(l => l.name.toLowerCase().includes('kr market') || l.name.toLowerCase().includes('kaleswara'));
    return `**KR Market Parking Complex – Kaleswara Rao Market** is located in Tarapet, One Town, Vijayawada.
- **Tariff**: ₹${krm?.hourlyPrice || 30}/hr
- **Hours**: 05:00 AM - 10:00 PM
- **Features**: Heavy commercial cargo bays, close proximity to wholesale markets, and shaded canopy.`;
  }

  if (q.includes('hanumanpet')) {
    const hnp = lots.find(l => l.name.toLowerCase().includes('hanumanpet'));
    return `**Railway Station Parking – Hanumanpet** is at the Hanumanpet Side Entrance of Vijayawada Railway Station.
- **Tariff**: ₹${hnp?.hourlyPrice || 40}/hr
- **Hours**: 24/7 Mon-Sun
- **Features**: East Gate entry, express passenger drop-off lane, and EV charging support.`;
  }

  if (q.includes('airport') || q.includes('gannavaram') || q.includes('flight')) {
    const air = lots.find(l => l.name.toLowerCase().includes('airport') || l.name.toLowerCase().includes('gannavaram'));
    return `**Airport Parking – Vijayawada Airport, Gannavaram** is located on National Highway 16, Gannavaram.
- **Tariff**: ₹${air?.hourlyPrice || 50}/hr
- **Hours**: 24/7 Mon-Sun
- **Total Capacity**: ${air?.totalSlots || 80} bays (DEMO DATA)
- **Features**: Terminal long-stay parking, 60kW DC EV fast chargers, ANPR boom barriers, and 24/7 security patrol.`;
  }

  if (q.includes('cheapest') || q.includes('rate') || q.includes('price') || q.includes('cost') || q.includes('tariff')) {
    return `**Vijayawada Parking Tariffs:**
- **₹30/hr**: Gopala Reddy Road (Governor Peta), Dr. NTR Complex Cellar, KR Market Parking Complex.
- **₹40/hr**: Vijayawada Junction Railway Station, Railway Station Hanumanpet.
- **₹50/hr**: Vijayawada Airport (Gannavaram).
All facilities offer Demo Digital Checkout and instant QR ticket generation!`;
  }

  if (q.includes('ev') || q.includes('charge') || q.includes('electric')) {
    return `**EV Charging Facilities in Vijayawada:**
1. **Airport Parking (Gannavaram)**: High-speed DC Fast Chargers available 24/7.
2. **Railway Station Parking (Hanumanpet)**: EV Charging dedicated bays with quick turnaround.
You can filter stations by **"EV Charging"** on the Parking Stations directory!`;
  }

  if (q.includes('qr') || q.includes('ticket') || q.includes('entry') || q.includes('exit') || q.includes('gate') || q.includes('how to')) {
    return `**How QR-Based Smart Access Works:**
1. **Book Online**: Pick your station and available slot (green bay) on the dashboard.
2. **Instant QR**: Go to **"My Bookings & QR"** to get your encrypted QR access ticket.
3. **Gate Entry**: Show the QR code to the station operator or gate camera; the boom barrier opens automatically.
4. **Exit Verification**: Show your QR upon departure. The session verifies your checkout with zero cash delay!`;
  }

  if (q.includes('operator') || q.includes('admin') || q.includes('login') || q.includes('demo access') || q.includes('credential')) {
    return `**Demo Access Credentials:**
- **Administrator**: \`admin@parkpulse.demo\` / \`Admin@12345\`
- **Station Operator**: \`operator@parkpulse.demo\` / \`Operator@12345\`
- **Driver / User**: \`driver@parkpulse.demo\` / \`User@12345\`
Click **"Sign In"** or the **DEMO ACCESS** helper on the login dialog for 1-click autofill!`;
  }

  return `Hello! I'm **PulseAI**, your smart mobility concierge for Vijayawada.
I can help you:
- Check real-time bay availability and tariffs for the **6 Vijayawada Stations**.
- Guide you through slot booking, QR ticket validation, and automated boom barriers.
- Find EV fast-charging facilities at **Airport Gannavaram** or **Hanumanpet**.
- Assist with **Admin** or **Operator** demo workflows.

How may I assist your journey in Vijayawada today?`;
}
