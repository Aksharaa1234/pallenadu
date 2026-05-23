// localStorage data layer for PalleNadu

export type Role = "citizen" | "sarpanch" | "worker";
export type Session = { name: string; phone: string; role: Role } | null;

export type Complaint = {
  id: string;
  ticketId: string;
  citizenName: string;
  citizenPhone: string;
  type: string;
  description: string;
  location: string;
  photo?: string | null;
  status: "Pending" | "In Progress" | "Resolved";
  assignedWorker: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  resolutionNotes?: string | null;
};

export type Scheme = {
  id: string;
  name: string;
  nameTe: string;
  description: string;
  eligibility: string;
  status: "Active" | "Pending" | "Closed";
  beneficiaryCount: number;
  notes: string;
};

export type Fund = {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  approver: string;
  spent: boolean;
};

export type Worker = {
  id: string;
  name: string;
  phone: string;
  specialization: string;
};

export type Land = {
  id: string;
  ownerName: string;
  surveyNumber: string;
  area: number;
  village: string;
  mutationStatus: "Clear" | "Disputed";
};

const K = {
  users: "pn_users",
  complaints: "pn_complaints",
  schemes: "pn_schemes",
  funds: "pn_funds",
  workers: "pn_workers",
  land: "pn_land",
  session: "pn_session",
  seeded: "pn_seeded_v1",
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export const store = {
  getComplaints: () => read<Complaint[]>(K.complaints, []),
  setComplaints: (v: Complaint[]) => write(K.complaints, v),
  getSchemes: () => read<Scheme[]>(K.schemes, []),
  setSchemes: (v: Scheme[]) => write(K.schemes, v),
  getFunds: () => read<Fund[]>(K.funds, []),
  setFunds: (v: Fund[]) => write(K.funds, v),
  getWorkers: () => read<Worker[]>(K.workers, []),
  setWorkers: (v: Worker[]) => write(K.workers, v),
  getLand: () => read<Land[]>(K.land, []),
  setLand: (v: Land[]) => write(K.land, v),
  getSession: () => read<Session>(K.session, null),
  setSession: (v: Session) => write(K.session, v),
  clearSession: () => {
    if (typeof window !== "undefined") localStorage.removeItem(K.session);
  },
};

export function nextTicketId(): string {
  const all = store.getComplaints();
  const max = all.reduce((m, c) => {
    const n = parseInt(c.ticketId.split("-").pop() || "0", 10);
    return n > m ? n : m;
  }, 0);
  return `GRV-2025-${String(max + 1).padStart(3, "0")}`;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function seedIfNeeded() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(K.seeded)) return;

  const now = new Date().toISOString();
  const complaints: Complaint[] = [
    {
      id: uid(),
      ticketId: "GRV-2025-001",
      citizenName: "Ravi Kumar",
      citizenPhone: "9000000001",
      type: "Road",
      description: "Main road has potholes near temple",
      location: "Near Hanuman Temple",
      status: "Pending",
      assignedWorker: null,
      createdAt: now,
    },
    {
      id: uid(),
      ticketId: "GRV-2025-002",
      citizenName: "Savithramma",
      citizenPhone: "9000000002",
      type: "Pension",
      description: "Aasara pension not received for 3 months",
      location: "Ward 3",
      status: "In Progress",
      assignedWorker: "Suresh",
      createdAt: now,
    },
    {
      id: uid(),
      ticketId: "GRV-2025-003",
      citizenName: "Lakshmi Devi",
      citizenPhone: "9000000003",
      type: "Water",
      description: "No water supply for 5 days",
      location: "Ward 1",
      status: "Resolved",
      assignedWorker: "Ramesh",
      createdAt: now,
      resolvedAt: now,
      resolutionNotes: "Pipeline repaired, supply restored.",
    },
  ];

  const schemes: Scheme[] = [
    {
      id: uid(),
      name: "Rythu Bandhu",
      nameTe: "రైతు బంధు",
      description: "Investment support for farmers per season per acre.",
      eligibility: "Land-owning farmers with valid pattadar passbook",
      status: "Active",
      beneficiaryCount: 142,
      notes: "",
    },
    {
      id: uid(),
      name: "PM Awas Yojana",
      nameTe: "పీఎం ఆవాస్ యోజన",
      description: "Housing assistance for rural poor families.",
      eligibility: "BPL families without pucca house",
      status: "Active",
      beneficiaryCount: 38,
      notes: "",
    },
    {
      id: uid(),
      name: "Aasara Pension",
      nameTe: "ఆసరా పెన్షన్",
      description: "Monthly pension for old age, widows, disabled.",
      eligibility: "Age 57+, widows, disabled persons",
      status: "Active",
      beneficiaryCount: 96,
      notes: "",
    },
    {
      id: uid(),
      name: "Jal Jeevan Mission",
      nameTe: "జల్ జీవన్ మిషన్",
      description: "Tap water connection to every household.",
      eligibility: "All rural households",
      status: "Active",
      beneficiaryCount: 210,
      notes: "",
    },
    {
      id: uid(),
      name: "MGNREGA",
      nameTe: "ఎంజీఎన్‌ఆర్‌ఈజీఏ",
      description: "100 days of guaranteed wage employment per year.",
      eligibility: "Adult members of rural households willing to do unskilled work",
      status: "Active",
      beneficiaryCount: 178,
      notes: "",
    },
  ];

  const funds: Fund[] = [
    { id: uid(), category: "Roads", amount: 120000, description: "Road repair work", date: now, approver: "Sarpanch", spent: true },
    { id: uid(), category: "Water", amount: 80000, description: "New borewell", date: now, approver: "Sarpanch", spent: false },
    { id: uid(), category: "Sanitation", amount: 45000, description: "Drainage cleaning", date: now, approver: "Sarpanch", spent: true },
    { id: uid(), category: "Education", amount: 60000, description: "School supplies", date: now, approver: "Sarpanch", spent: false },
  ];

  const workers: Worker[] = [
    { id: uid(), name: "Suresh", phone: "9876543210", specialization: "Roads & Infrastructure" },
    { id: uid(), name: "Ramesh", phone: "9876543211", specialization: "Water & Sanitation" },
  ];

  const land: Land[] = [
    { id: uid(), ownerName: "Narsimha Reddy", surveyNumber: "127/2A", area: 3.5, village: "Mahabubnagar", mutationStatus: "Clear" },
    { id: uid(), ownerName: "Saidulu", surveyNumber: "88/1", area: 1.25, village: "Mahabubnagar", mutationStatus: "Disputed" },
  ];

  store.setComplaints(complaints);
  store.setSchemes(schemes);
  store.setFunds(funds);
  store.setWorkers(workers);
  store.setLand(land);
  localStorage.setItem(K.seeded, "1");
}
