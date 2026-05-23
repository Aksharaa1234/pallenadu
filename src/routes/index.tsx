import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  store,
  seedIfNeeded,
  nextTicketId,
  uid,
  type Complaint,
  type Fund,
  type Land,
  type Role,
  type Scheme,
  type Session,
  type Worker,
} from "@/lib/pn-store";

export const Route = createFileRoute("/")({
  component: App,
});

/* ============================ Helpers ============================ */

const T = ({ en, te, className = "" }: { en: string; te: string; className?: string }) => (
  <span className={className}>
    {en} <span className="te text-muted-foreground">· {te}</span>
  </span>
);

const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = "", ...p }) => (
  <div
    className={`bg-card border border-primary/15 rounded-[14px] shadow-sm ${className}`}
    {...p}
  />
);

const Btn: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "accent" | "ghost" | "danger" }
> = ({ className = "", variant = "primary", ...p }) => {
  const styles = {
    primary: "bg-primary text-primary-foreground hover:opacity-90",
    accent: "bg-accent text-accent-foreground hover:opacity-90",
    outline: "border border-primary/30 text-primary bg-card hover:bg-secondary",
    ghost: "text-primary hover:bg-secondary",
    danger: "bg-destructive text-destructive-foreground hover:opacity-90",
  }[variant];
  return (
    <button
      className={`px-4 py-2.5 rounded-[12px] text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50 ${styles} ${className}`}
      {...p}
    />
  );
};

const Field: React.FC<{ label: React.ReactNode; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block space-y-1.5">
    <span className="text-xs font-medium text-foreground/80">{label}</span>
    {children}
  </label>
);

const inputCls =
  "w-full px-3 py-2.5 rounded-[10px] border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition";

const StatusBadge = ({ status }: { status: Complaint["status"] }) => {
  const map = {
    Pending: "bg-warning/20 text-warning-foreground border-warning/40",
    "In Progress": "bg-info/15 text-info border-info/40",
    Resolved: "bg-success/15 text-success border-success/40",
  } as const;
  const te = { Pending: "పెండింగ్", "In Progress": "జరుగుతోంది", Resolved: "పరిష్కరించబడింది" }[status];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${map[status]}`}
      style={
        status === "Pending"
          ? { background: "rgba(232,160,32,0.15)", color: "#8a5a05", borderColor: "rgba(232,160,32,0.4)" }
          : status === "In Progress"
            ? { background: "rgba(37,99,235,0.12)", color: "#1d4ed8", borderColor: "rgba(37,99,235,0.35)" }
            : { background: "rgba(15,92,58,0.12)", color: "#0f5c3a", borderColor: "rgba(15,92,58,0.35)" }
      }
    >
      {status} · <span className="te ml-1">{te}</span>
    </span>
  );
};

const Stat = ({ label, te, value, accent }: { label: string; te: string; value: React.ReactNode; accent?: boolean }) => (
  <Card className="p-3.5">
    <div className="text-[11px] font-medium text-muted-foreground">
      {label} <span className="te">· {te}</span>
    </div>
    <div className={`text-2xl font-bold mt-1 ${accent ? "text-accent" : "text-primary"}`}>{value}</div>
  </Card>
);

const Empty = ({ en, te }: { en: string; te: string }) => (
  <div className="text-center py-12 text-muted-foreground">
    <div className="text-5xl mb-3 opacity-40">◌</div>
    <div className="text-sm">{en}</div>
    <div className="text-sm te">{te}</div>
  </div>
);

/* ============================ Root App ============================ */

function App() {
  const [session, setSession] = useState<Session>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedIfNeeded();
    setSession(store.getSession());
    setReady(true);
  }, []);

  const login = (s: NonNullable<Session>) => {
    store.setSession(s);
    setSession(s);
  };
  const logout = () => {
    store.clearSession();
    setSession(null);
  };

  if (!ready) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[480px] mx-auto bg-background min-h-screen relative">
        {!session ? (
          <Login onLogin={login} />
        ) : session.role === "citizen" ? (
          <CitizenApp session={session} onLogout={logout} />
        ) : session.role === "sarpanch" ? (
          <SarpanchApp session={session} onLogout={logout} />
        ) : (
          <WorkerApp session={session} onLogout={logout} />
        )}
      </div>
    </div>
  );
}

/* ============================ Login ============================ */

function Login({ onLogin }: { onLogin: (s: NonNullable<Session>) => void }) {
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const roles: { key: Role; en: string; te: string; emoji: string; desc: string }[] = [
    { key: "citizen", en: "Citizen", te: "పౌరుడు", emoji: "👤", desc: "File complaints, track schemes" },
    { key: "sarpanch", en: "Sarpanch", te: "సర్పంచ్", emoji: "🏛️", desc: "Manage village governance" },
    { key: "worker", en: "Worker", te: "కార్మికుడు", emoji: "🔧", desc: "Resolve assigned tasks" },
  ];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!role || !name.trim() || !phone.trim()) return;
    onLogin({ name: name.trim(), phone: phone.trim(), role });
  };

  return (
    <div className="px-5 py-8 min-h-screen flex flex-col">
      <div className="text-center mb-8">
        <div className="text-3xl font-bold text-primary">PalleNadu</div>
        <div className="text-2xl te font-semibold text-primary mt-1">పల్లెనాడు</div>
        <div className="text-xs text-muted-foreground mt-2">
          Digital Gram Panchayat · <span className="te">డిజిటల్ గ్రామ పంచాయతీ</span>
        </div>
        <div className="text-[11px] text-muted-foreground mt-1">
          Mahabubnagar · <span className="te">మహబూబ్‌నగర్</span>
        </div>
      </div>

      {!role ? (
        <div className="space-y-3">
          <div className="text-sm font-medium text-foreground/80 mb-2">
            Choose your role · <span className="te">మీ పాత్రను ఎంచుకోండి</span>
          </div>
          {roles.map((r) => (
            <button
              key={r.key}
              onClick={() => setRole(r.key)}
              className="w-full text-left p-4 bg-card border border-primary/20 rounded-[14px] hover:border-primary hover:shadow-md transition-all active:scale-[0.99] flex items-center gap-4"
            >
              <div className="text-4xl">{r.emoji}</div>
              <div className="flex-1">
                <div className="font-semibold text-primary">{r.en}</div>
                <div className="te text-base font-medium text-foreground">{r.te}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{r.desc}</div>
              </div>
              <div className="text-primary text-xl">›</div>
            </button>
          ))}
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Card className="p-4 flex items-center gap-3">
            <div className="text-3xl">{roles.find((r) => r.key === role)!.emoji}</div>
            <div className="flex-1">
              <div className="font-semibold text-primary">{roles.find((r) => r.key === role)!.en}</div>
              <div className="te text-sm">{roles.find((r) => r.key === role)!.te}</div>
            </div>
            <button type="button" className="text-xs text-primary underline" onClick={() => setRole(null)}>
              Change
            </button>
          </Card>

          <Field label={<T en="Full Name" te="పూర్తి పేరు" />}>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
          </Field>
          <Field label={<T en="Phone Number" te="ఫోన్ నంబర్" />}>
            <input
              className={inputCls}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="10-digit mobile"
              inputMode="numeric"
              required
            />
          </Field>
          <Btn type="submit" className="w-full !py-3">
            Continue · <span className="te">కొనసాగించు</span>
          </Btn>
        </form>
      )}
    </div>
  );
}

/* ============================ Shared Shell ============================ */

function Header({ session, onLogout }: { session: NonNullable<Session>; onLogout: () => void }) {
  const roleTe = { citizen: "పౌరుడు", sarpanch: "సర్పంచ్", worker: "కార్మికుడు" }[session.role];
  return (
    <div className="bg-primary text-primary-foreground px-4 pt-5 pb-4 rounded-b-[20px]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-bold text-lg leading-tight">PalleNadu</div>
          <div className="te text-sm opacity-90">పల్లెనాడు</div>
          <div className="text-[10px] opacity-80 mt-1">
            Mahabubnagar · <span className="te">మహబూబ్‌నగర్</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium leading-tight">{session.name}</div>
          <div className="text-[10px] opacity-80 capitalize">
            {session.role} · <span className="te">{roleTe}</span>
          </div>
          <button
            onClick={onLogout}
            className="mt-1.5 text-[10px] bg-white/15 hover:bg-white/25 px-2 py-1 rounded-md transition"
          >
            Logout · <span className="te">లాగౌట్</span>
          </button>
        </div>
      </div>
    </div>
  );
}

type NavItem = { key: string; en: string; te: string; icon: string };

function BottomNav<K extends string>({
  items,
  active,
  onChange,
}: {
  items: (NavItem & { key: K })[];
  active: K;
  onChange: (k: K) => void;
}) {
  return (
    <div className="sticky bottom-0 left-0 right-0 bg-card border-t border-border">
      <div className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0,1fr))` }}>
        {items.map((it) => {
          const on = it.key === active;
          return (
            <button
              key={it.key}
              onClick={() => onChange(it.key)}
              className={`py-2.5 flex flex-col items-center gap-0.5 transition ${
                on ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div className="text-lg leading-none">{it.icon}</div>
              <div className="text-[10px] font-medium leading-tight">{it.en}</div>
              <div className="te text-[10px] leading-tight">{it.te}</div>
              {on && <div className="w-6 h-0.5 bg-primary rounded-full mt-0.5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PageWrap({ children }: { children: React.ReactNode }) {
  return <div className="px-4 py-4 space-y-4 pb-6">{children}</div>;
}

function SectionTitle({ en, te }: { en: string; te: string }) {
  return (
    <div className="mb-1">
      <div className="text-lg font-semibold text-primary">{en}</div>
      <div className="te text-sm text-muted-foreground">{te}</div>
    </div>
  );
}

/* ============================ CITIZEN ============================ */

function CitizenApp({ session, onLogout }: { session: NonNullable<Session>; onLogout: () => void }) {
  type Tab = "home" | "file" | "track" | "schemes" | "funds";
  const [tab, setTab] = useState<Tab>("home");

  const items = [
    { key: "home" as const, en: "Home", te: "హోమ్", icon: "🏠" },
    { key: "file" as const, en: "File", te: "ఫిర్యాదు", icon: "📝" },
    { key: "track" as const, en: "Track", te: "స్థితి", icon: "🔍" },
    { key: "schemes" as const, en: "Schemes", te: "పథకాలు", icon: "📋" },
    { key: "funds" as const, en: "Funds", te: "నిధులు", icon: "💰" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header session={session} onLogout={onLogout} />
      <div className="flex-1 animate-in fade-in duration-200" key={tab}>
        {tab === "home" && <CitizenHome session={session} go={setTab} />}
        {tab === "file" && <FileComplaint session={session} />}
        {tab === "track" && <TrackComplaint session={session} />}
        {tab === "schemes" && <SchemeList />}
        {tab === "funds" && <FundView readonly />}
      </div>
      <BottomNav items={items} active={tab} onChange={setTab} />
    </div>
  );
}

function CitizenHome({ session, go }: { session: NonNullable<Session>; go: (t: any) => void }) {
  const complaints = store.getComplaints();
  const schemes = store.getSchemes();
  const funds = store.getFunds();
  const open = complaints.filter((c) => c.status !== "Resolved").length;
  const thisMonth = funds
    .filter((f) => new Date(f.date).getMonth() === new Date().getMonth())
    .reduce((s, f) => s + f.amount, 0);

  return (
    <PageWrap>
      <Card className="p-4 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="te text-lg font-semibold text-primary">నమస్కారం, {session.name} 🙏</div>
        <div className="text-xs text-muted-foreground mt-1">Welcome to your village dashboard</div>
      </Card>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Open" te="తెరిచిన" value={open} />
        <Stat label="Schemes" te="పథకాలు" value={schemes.length} />
        <Stat label="Funds" te="నిధులు" value={`₹${(thisMonth / 1000).toFixed(0)}k`} accent />
      </div>
      <SectionTitle en="Quick Actions" te="త్వరిత చర్యలు" />
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 cursor-pointer hover:border-primary transition" onClick={() => go("file")}>
          <div className="text-2xl">📝</div>
          <div className="font-semibold text-sm mt-2">File Complaint</div>
          <div className="te text-xs text-muted-foreground">ఫిర్యాదు</div>
        </Card>
        <Card className="p-4 cursor-pointer hover:border-primary transition" onClick={() => go("track")}>
          <div className="text-2xl">🔍</div>
          <div className="font-semibold text-sm mt-2">Track Status</div>
          <div className="te text-xs text-muted-foreground">స్థితి</div>
        </Card>
        <Card className="p-4 cursor-pointer hover:border-primary transition" onClick={() => go("schemes")}>
          <div className="text-2xl">📋</div>
          <div className="font-semibold text-sm mt-2">Schemes</div>
          <div className="te text-xs text-muted-foreground">పథకాలు</div>
        </Card>
        <Card className="p-4 cursor-pointer hover:border-primary transition" onClick={() => go("funds")}>
          <div className="text-2xl">💰</div>
          <div className="font-semibold text-sm mt-2">Funds</div>
          <div className="te text-xs text-muted-foreground">నిధులు</div>
        </Card>
      </div>
    </PageWrap>
  );
}

function FileComplaint({ session }: { session: NonNullable<Session> }) {
  const [type, setType] = useState("Road");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(f);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const ticketId = nextTicketId();
    const c: Complaint = {
      id: uid(),
      ticketId,
      citizenName: session.name,
      citizenPhone: session.phone,
      type,
      description,
      location,
      photo,
      status: "Pending",
      assignedWorker: null,
      createdAt: new Date().toISOString(),
    };
    store.setComplaints([c, ...store.getComplaints()]);
    setSuccess(ticketId);
  };

  if (success) {
    return (
      <PageWrap>
        <Card className="p-6 text-center">
          <div className="text-5xl mb-2">✅</div>
          <div className="font-semibold text-lg text-primary">Complaint Registered</div>
          <div className="te text-sm text-muted-foreground">మీ ఫిర్యాదు నమోదు అయింది</div>
          <div className="mt-4 p-3 bg-secondary rounded-[10px]">
            <div className="text-xs text-muted-foreground">Your ticket number</div>
            <div className="font-bold text-xl text-primary mt-1">{success}</div>
          </div>
          <Btn
            className="mt-4 w-full"
            onClick={() => {
              setSuccess(null);
              setDescription("");
              setLocation("");
              setPhoto(null);
            }}
          >
            File Another · <span className="te">మరొకటి దాఖలు చేయి</span>
          </Btn>
        </Card>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <SectionTitle en="File Complaint" te="ఫిర్యాదు దాఖలు చేయి" />
      <Card className="p-4 space-y-3">
        <form onSubmit={submit} className="space-y-3">
          <Field label={<T en="Complaint Type" te="ఫిర్యాదు రకం" />}>
            <select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>
              {["Road", "Water", "Electricity", "Pension", "Other"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label={<T en="Description" te="వివరణ" />}>
            <textarea
              className={`${inputCls} min-h-24`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </Field>
          <Field label={<T en="Location" te="ప్రాంతం" />}>
            <input className={inputCls} value={location} onChange={(e) => setLocation(e.target.value)} required />
          </Field>
          <Field label={<T en="Photo (optional)" te="ఫోటో (ఐచ్ఛికం)" />}>
            <input type="file" accept="image/*" onChange={handlePhoto} className="text-xs" />
            {photo && <img src={photo} alt="" className="mt-2 max-h-32 rounded-md border" />}
          </Field>
          <Btn type="submit" className="w-full">
            Submit · <span className="te">సమర్పించు</span>
          </Btn>
        </form>
      </Card>
    </PageWrap>
  );
}

function TrackComplaint({ session }: { session: NonNullable<Session> }) {
  const [query, setQuery] = useState("");
  const all = store.getComplaints();
  const mine = all.filter((c) => c.citizenPhone === session.phone);
  const list = query.trim()
    ? all.filter((c) => c.ticketId.toLowerCase().includes(query.trim().toLowerCase()))
    : mine;

  return (
    <PageWrap>
      <SectionTitle en="Track Complaint" te="ఫిర్యాదు స్థితి" />
      <Card className="p-3">
        <input
          className={inputCls}
          placeholder="Search by ticket ID (e.g. GRV-2025-001)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </Card>
      {list.length === 0 ? (
        <Empty en="No complaints yet" te="ఫిర్యాదులు లేవు" />
      ) : (
        <div className="space-y-2.5">
          {list.map((c) => (
            <Card key={c.id} className="p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-sm text-primary">{c.ticketId}</div>
                  <div className="text-xs text-muted-foreground">{c.type} · {c.location}</div>
                </div>
                <StatusBadge status={c.status} />
              </div>
              <div className="text-sm mt-2">{c.description}</div>
              <div className="text-[11px] text-muted-foreground mt-2 flex flex-wrap gap-x-3">
                <span>Filed: {new Date(c.createdAt).toLocaleDateString()}</span>
                {c.assignedWorker && (
                  <span>
                    Worker: <span className="font-medium text-foreground">{c.assignedWorker}</span>
                  </span>
                )}
                {c.resolvedAt && <span>Resolved: {new Date(c.resolvedAt).toLocaleDateString()}</span>}
              </div>
              {c.resolutionNotes && (
                <div className="mt-2 p-2 bg-success/10 rounded text-xs text-success">{c.resolutionNotes}</div>
              )}
            </Card>
          ))}
        </div>
      )}
    </PageWrap>
  );
}

/* ============================ Schemes (shared) ============================ */

function SchemeList() {
  const [schemes, setSchemes] = useState<Scheme[]>(() => store.getSchemes());

  return (
    <PageWrap>
      <SectionTitle en="Government Schemes" te="ప్రభుత్వ పథకాలు" />
      <div className="space-y-2.5">
        {schemes.map((s) => (
          <Card key={s.id} className="p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold text-primary">{s.name}</div>
                <div className="te text-sm font-medium">{s.nameTe}</div>
              </div>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{
                  background: s.status === "Active" ? "rgba(15,92,58,0.12)" : s.status === "Pending" ? "rgba(232,160,32,0.15)" : "rgba(100,100,100,0.15)",
                  color: s.status === "Active" ? "#0f5c3a" : s.status === "Pending" ? "#8a5a05" : "#444",
                }}
              >
                {s.status}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-2">{s.description}</div>
            <div className="text-[11px] mt-2">
              <span className="font-medium">Eligibility: </span>
              {s.eligibility}
            </div>
            <div className="text-[11px] mt-1 text-primary">
              Beneficiaries · <span className="te">లబ్ధిదారులు</span>: <b>{s.beneficiaryCount}</b>
            </div>
            {s.notes && <div className="text-[11px] mt-1 italic text-muted-foreground">Note: {s.notes}</div>}
          </Card>
        ))}
      </div>
    </PageWrap>
  );
}

/* ============================ Funds ============================ */

function FundView({ readonly, sarpanchName }: { readonly?: boolean; sarpanchName?: string }) {
  const [funds, setFunds] = useState<Fund[]>(() => store.getFunds());
  const [category, setCategory] = useState("Roads");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [spent, setSpent] = useState(false);

  const total = funds.reduce((s, f) => s + f.amount, 0);
  const spentTotal = funds.filter((f) => f.spent).reduce((s, f) => s + f.amount, 0);
  const balance = total - spentTotal;
  const pct = total ? (spentTotal / total) * 100 : 0;

  const persist = (next: Fund[]) => {
    store.setFunds(next);
    setFunds(next);
  };

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const f: Fund = {
      id: uid(),
      category,
      amount: Number(amount),
      description,
      date,
      approver: sarpanchName ?? "Sarpanch",
      spent,
    };
    persist([f, ...funds]);
    setAmount("");
    setDescription("");
  };

  const toggleSpent = (id: string) =>
    persist(funds.map((f) => (f.id === id ? { ...f, spent: !f.spent } : f)));
  const remove = (id: string) => persist(funds.filter((f) => f.id !== id));

  return (
    <PageWrap>
      <SectionTitle en="Fund Dashboard" te="నిధుల పారదర్శకత" />
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Allocated" te="కేటాయించిన" value={`₹${(total / 1000).toFixed(0)}k`} />
        <Stat label="Spent" te="ఖర్చు" value={`₹${(spentTotal / 1000).toFixed(0)}k`} accent />
        <Stat label="Balance" te="మిగిలిన" value={`₹${(balance / 1000).toFixed(0)}k`} />
      </div>
      <Card className="p-3.5">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="font-medium">Utilization · <span className="te">వినియోగం</span></span>
          <span className="text-primary font-bold">{pct.toFixed(0)}%</span>
        </div>
        <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </Card>

      {!readonly && (
        <Card className="p-4">
          <div className="font-semibold text-sm mb-2 text-primary">
            Add Entry · <span className="te">కొత్త నమోదు</span>
          </div>
          <form onSubmit={add} className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Category">
                <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
                  {["Roads", "Water", "Sanitation", "Education", "Health", "Other"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Amount (₹)">
                <input
                  className={inputCls}
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </Field>
            </div>
            <Field label="Description">
              <input className={inputCls} value={description} onChange={(e) => setDescription(e.target.value)} required />
            </Field>
            <div className="grid grid-cols-2 gap-2 items-end">
              <Field label="Date">
                <input className={inputCls} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>
              <label className="flex items-center gap-2 text-sm pb-2.5">
                <input type="checkbox" checked={spent} onChange={(e) => setSpent(e.target.checked)} />
                Spent · <span className="te">ఖర్చు చేయబడింది</span>
              </label>
            </div>
            <Btn type="submit" className="w-full">
              Add Entry · <span className="te">జోడించు</span>
            </Btn>
          </form>
        </Card>
      )}

      <SectionTitle en="All Entries" te="అన్ని నమోదులు" />
      {funds.length === 0 ? (
        <Empty en="No fund entries" te="నిధి నమోదులు లేవు" />
      ) : (
        <div className="space-y-2">
          {funds.map((f) => (
            <Card key={f.id} className="p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{f.category}</span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{
                      background: f.spent ? "rgba(15,92,58,0.12)" : "rgba(232,160,32,0.15)",
                      color: f.spent ? "#0f5c3a" : "#8a5a05",
                    }}
                  >
                    {f.spent ? "Spent" : "Unspent"}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground truncate">{f.description}</div>
                <div className="text-[10px] text-muted-foreground">
                  {new Date(f.date).toLocaleDateString()} · {f.approver}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-primary">₹{f.amount.toLocaleString()}</div>
                {!readonly && (
                  <div className="flex gap-1 mt-1 justify-end">
                    <button className="text-[10px] text-primary underline" onClick={() => toggleSpent(f.id)}>
                      Toggle
                    </button>
                    <button className="text-[10px] text-destructive underline" onClick={() => remove(f.id)}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageWrap>
  );
}

/* ============================ SARPANCH ============================ */

function SarpanchApp({ session, onLogout }: { session: NonNullable<Session>; onLogout: () => void }) {
  type Tab = "home" | "complaints" | "schemes" | "funds" | "workers" | "land";
  const [tab, setTab] = useState<Tab>("home");

  const items = [
    { key: "home" as const, en: "Home", te: "హోమ్", icon: "🏠" },
    { key: "complaints" as const, en: "Issues", te: "ఫిర్యాదులు", icon: "📋" },
    { key: "funds" as const, en: "Funds", te: "నిధులు", icon: "💰" },
    { key: "workers" as const, en: "Workers", te: "కార్మికులు", icon: "👷" },
    { key: "land" as const, en: "Land", te: "భూమి", icon: "🌾" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header session={session} onLogout={onLogout} />
      <div className="flex-1 animate-in fade-in duration-200" key={tab}>
        {tab === "home" && <SarpanchHome go={setTab} />}
        {tab === "complaints" && <ComplaintsManager />}
        {tab === "schemes" && <SchemeManager />}
        {tab === "funds" && <FundView sarpanchName={session.name} />}
        {tab === "workers" && <WorkerManagement />}
        {tab === "land" && <LandRecords />}
      </div>
      <BottomNav items={items} active={tab} onChange={setTab} />
    </div>
  );
}

function SarpanchHome({ go }: { go: (t: any) => void }) {
  const complaints = store.getComplaints();
  const funds = store.getFunds();
  const pending = complaints.filter((c) => c.status === "Pending").length;
  const resolvedThisMonth = complaints.filter(
    (c) => c.status === "Resolved" && c.resolvedAt && new Date(c.resolvedAt).getMonth() === new Date().getMonth(),
  ).length;
  const total = funds.reduce((s, f) => s + f.amount, 0);

  return (
    <PageWrap>
      <Card className="p-4 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="te text-base font-semibold text-primary">సర్పంచ్ డాష్‌బోర్డ్</div>
        <div className="text-xs text-muted-foreground">Full administrative access</div>
      </Card>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Total Issues" te="మొత్తం" value={complaints.length} />
        <Stat label="Pending" te="పెండింగ్" value={pending} accent />
        <Stat label="Resolved (mo)" te="పరిష్కరించబడిన" value={resolvedThisMonth} />
        <Stat label="Funds" te="నిధులు" value={`₹${(total / 1000).toFixed(0)}k`} accent />
      </div>
      <SectionTitle en="Modules" te="మాడ్యూల్స్" />
      <div className="grid grid-cols-2 gap-3">
        {[
          { k: "complaints", en: "Complaints", te: "ఫిర్యాదులు", i: "📋" },
          { k: "schemes", en: "Schemes", te: "పథకాలు", i: "📜" },
          { k: "funds", en: "Funds", te: "నిధులు", i: "💰" },
          { k: "workers", en: "Workers", te: "కార్మికులు", i: "👷" },
          { k: "land", en: "Land Records", te: "భూ రికార్డులు", i: "🌾" },
        ].map((m) => (
          <Card key={m.k} className="p-4 cursor-pointer hover:border-primary transition" onClick={() => go(m.k)}>
            <div className="text-2xl">{m.i}</div>
            <div className="font-semibold text-sm mt-2">{m.en}</div>
            <div className="te text-xs text-muted-foreground">{m.te}</div>
          </Card>
        ))}
      </div>
    </PageWrap>
  );
}

function ComplaintsManager() {
  const [complaints, setComplaints] = useState<Complaint[]>(() => store.getComplaints());
  const workers = store.getWorkers();
  const [status, setStatus] = useState<string>("All");
  const [type, setType] = useState<string>("All");
  const [open, setOpen] = useState<Complaint | null>(null);

  const filtered = complaints.filter(
    (c) => (status === "All" || c.status === status) && (type === "All" || c.type === type),
  );

  const save = (next: Complaint) => {
    const all = complaints.map((c) => (c.id === next.id ? next : c));
    store.setComplaints(all);
    setComplaints(all);
    setOpen(next);
  };

  return (
    <PageWrap>
      <SectionTitle en="Complaints Manager" te="ఫిర్యాదుల నిర్వహణ" />
      <Card className="p-3 grid grid-cols-2 gap-2">
        <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
          {["All", "Pending", "In Progress", "Resolved"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>
          {["All", "Road", "Water", "Electricity", "Pension", "Other"].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </Card>

      {filtered.length === 0 ? (
        <Empty en="No complaints match" te="ఫిర్యాదులు లేవు" />
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <Card key={c.id} className="p-3 cursor-pointer hover:border-primary" onClick={() => setOpen(c)}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-primary">{c.ticketId}</div>
                  <div className="text-xs">{c.citizenName} · {c.type}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{c.location}</div>
                </div>
                <StatusBadge status={c.status} />
              </div>
              <div className="text-[11px] text-muted-foreground mt-1.5">
                {c.assignedWorker ? `Assigned: ${c.assignedWorker}` : "Unassigned"} · {new Date(c.createdAt).toLocaleDateString()}
              </div>
            </Card>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-2" onClick={() => setOpen(null)}>
          <div
            className="bg-card w-full max-w-[460px] rounded-[16px] p-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold text-primary">{open.ticketId}</div>
                <div className="text-xs text-muted-foreground">{open.citizenName} · {open.citizenPhone}</div>
              </div>
              <button onClick={() => setOpen(null)} className="text-2xl leading-none">×</button>
            </div>
            <div className="mt-3 text-sm">{open.description}</div>
            <div className="text-xs text-muted-foreground mt-1">Type: {open.type} · {open.location}</div>
            {open.photo && <img src={open.photo} alt="" className="mt-2 max-h-40 rounded border" />}

            <div className="mt-4 space-y-3">
              <Field label={<T en="Status" te="స్థితి" />}>
                <select
                  className={inputCls}
                  value={open.status}
                  onChange={(e) => {
                    const next: Complaint = { ...open, status: e.target.value as Complaint["status"] };
                    if (next.status === "Resolved") next.resolvedAt = new Date().toISOString();
                    save(next);
                  }}
                >
                  {["Pending", "In Progress", "Resolved"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label={<T en="Assign Worker" te="కార్మికుడిని కేటాయించు" />}>
                <select
                  className={inputCls}
                  value={open.assignedWorker ?? ""}
                  onChange={(e) => save({ ...open, assignedWorker: e.target.value || null })}
                >
                  <option value="">— Unassigned —</option>
                  {workers.map((w) => (
                    <option key={w.id} value={w.name}>
                      {w.name} ({w.specialization})
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Btn className="w-full mt-4" onClick={() => setOpen(null)}>
              Done · <span className="te">పూర్తయింది</span>
            </Btn>
          </div>
        </div>
      )}
    </PageWrap>
  );
}

function SchemeManager() {
  const [schemes, setSchemes] = useState<Scheme[]>(() => store.getSchemes());
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", nameTe: "", description: "", eligibility: "" });

  const persist = (next: Scheme[]) => {
    store.setSchemes(next);
    setSchemes(next);
  };

  const update = (id: string, patch: Partial<Scheme>) =>
    persist(schemes.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    persist([
      ...schemes,
      { id: uid(), ...form, status: "Active", beneficiaryCount: 0, notes: "" } as Scheme,
    ]);
    setForm({ name: "", nameTe: "", description: "", eligibility: "" });
    setAdding(false);
  };

  return (
    <PageWrap>
      <div className="flex justify-between items-center">
        <SectionTitle en="Scheme Manager" te="పథకాల నిర్వహణ" />
        <Btn variant="accent" onClick={() => setAdding((v) => !v)}>
          {adding ? "Cancel" : "+ New"}
        </Btn>
      </div>

      {adding && (
        <Card className="p-4">
          <form onSubmit={add} className="space-y-2.5">
            <Field label="Name (English)">
              <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Field>
            <Field label="పేరు (Telugu)">
              <input className={inputCls} value={form.nameTe} onChange={(e) => setForm({ ...form, nameTe: e.target.value })} required />
            </Field>
            <Field label="Description">
              <textarea className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <Field label="Eligibility">
              <input className={inputCls} value={form.eligibility} onChange={(e) => setForm({ ...form, eligibility: e.target.value })} />
            </Field>
            <Btn type="submit" className="w-full">Save</Btn>
          </form>
        </Card>
      )}

      <div className="space-y-2.5">
        {schemes.map((s) => (
          <Card key={s.id} className="p-3.5 space-y-2">
            <div>
              <div className="font-semibold text-primary">{s.name}</div>
              <div className="te text-sm">{s.nameTe}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.description}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Status">
                <select
                  className={inputCls}
                  value={s.status}
                  onChange={(e) => update(s.id, { status: e.target.value as Scheme["status"] })}
                >
                  {["Active", "Pending", "Closed"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>
              <Field label="Beneficiaries">
                <input
                  className={inputCls}
                  type="number"
                  value={s.beneficiaryCount}
                  onChange={(e) => update(s.id, { beneficiaryCount: Number(e.target.value) })}
                />
              </Field>
            </div>
            <Field label="Notes">
              <input className={inputCls} value={s.notes} onChange={(e) => update(s.id, { notes: e.target.value })} />
            </Field>
          </Card>
        ))}
      </div>
    </PageWrap>
  );
}

function WorkerManagement() {
  const [workers, setWorkers] = useState<Worker[]>(() => store.getWorkers());
  const complaints = store.getComplaints();
  const [form, setForm] = useState({ name: "", phone: "", specialization: "" });

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const next = [...workers, { id: uid(), ...form }];
    store.setWorkers(next);
    setWorkers(next);
    setForm({ name: "", phone: "", specialization: "" });
  };

  return (
    <PageWrap>
      <SectionTitle en="Worker Management" te="కార్మికుల నిర్వహణ" />
      <Card className="p-4">
        <form onSubmit={add} className="grid grid-cols-1 gap-2">
          <input className={inputCls} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input
            className={inputCls}
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
            required
          />
          <input
            className={inputCls}
            placeholder="Specialization"
            value={form.specialization}
            onChange={(e) => setForm({ ...form, specialization: e.target.value })}
            required
          />
          <Btn type="submit">
            + Add Worker · <span className="te">కార్మికుడిని జోడించు</span>
          </Btn>
        </form>
      </Card>

      {workers.length === 0 ? (
        <Empty en="No workers" te="కార్మికులు లేరు" />
      ) : (
        <div className="space-y-2">
          {workers.map((w) => {
            const assigned = complaints.filter((c) => c.assignedWorker === w.name).length;
            const resolved = complaints.filter((c) => c.assignedWorker === w.name && c.status === "Resolved").length;
            return (
              <Card key={w.id} className="p-3.5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-primary">{w.name}</div>
                    <div className="text-xs text-muted-foreground">{w.specialization}</div>
                    <div className="text-[11px] text-muted-foreground">📞 {w.phone}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground">Assigned / Resolved</div>
                    <div className="font-bold text-primary">{assigned} / {resolved}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </PageWrap>
  );
}

function LandRecords() {
  const [records, setRecords] = useState<Land[]>(() => store.getLand());
  const [q, setQ] = useState("");
  const [form, setForm] = useState({
    ownerName: "",
    surveyNumber: "",
    area: "",
    village: "Mahabubnagar",
    mutationStatus: "Clear" as Land["mutationStatus"],
  });

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const next = [
      { id: uid(), ...form, area: Number(form.area) } as Land,
      ...records,
    ];
    store.setLand(next);
    setRecords(next);
    setForm({ ownerName: "", surveyNumber: "", area: "", village: "Mahabubnagar", mutationStatus: "Clear" });
  };

  const filtered = records.filter(
    (r) =>
      !q.trim() ||
      r.ownerName.toLowerCase().includes(q.toLowerCase()) ||
      r.surveyNumber.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <PageWrap>
      <SectionTitle en="Land Records" te="భూ రికార్డులు" />
      <Card className="p-4">
        <form onSubmit={add} className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input className={inputCls} placeholder="Owner Name" value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} required />
            <input className={inputCls} placeholder="Survey No." value={form.surveyNumber} onChange={(e) => setForm({ ...form, surveyNumber: e.target.value })} required />
            <input className={inputCls} placeholder="Area (acres)" type="number" step="0.01" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} required />
            <input className={inputCls} placeholder="Village" value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })} required />
          </div>
          <select className={inputCls} value={form.mutationStatus} onChange={(e) => setForm({ ...form, mutationStatus: e.target.value as Land["mutationStatus"] })}>
            <option>Clear</option>
            <option>Disputed</option>
          </select>
          <Btn type="submit" className="w-full">+ Add Record</Btn>
        </form>
      </Card>

      <Card className="p-3">
        <input className={inputCls} placeholder="Search owner or survey no." value={q} onChange={(e) => setQ(e.target.value)} />
      </Card>

      {filtered.length === 0 ? (
        <Empty en="No land records" te="భూ రికార్డులు లేవు" />
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <Card key={r.id} className="p-3 flex items-center justify-between">
              <div>
                <div className="font-semibold">{r.ownerName}</div>
                <div className="text-xs text-muted-foreground">Survey {r.surveyNumber} · {r.area} ac · {r.village}</div>
              </div>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={
                  r.mutationStatus === "Clear"
                    ? { background: "rgba(15,92,58,0.12)", color: "#0f5c3a" }
                    : { background: "rgba(220,38,38,0.12)", color: "#b91c1c" }
                }
              >
                {r.mutationStatus}
              </span>
            </Card>
          ))}
        </div>
      )}
    </PageWrap>
  );
}

/* ============================ WORKER ============================ */

function WorkerApp({ session, onLogout }: { session: NonNullable<Session>; onLogout: () => void }) {
  type Tab = "home" | "tasks" | "history" | "schemes";
  const [tab, setTab] = useState<Tab>("home");

  const items = [
    { key: "home" as const, en: "Home", te: "హోమ్", icon: "🏠" },
    { key: "tasks" as const, en: "My Tasks", te: "నా పనులు", icon: "🛠️" },
    { key: "history" as const, en: "History", te: "చరిత్ర", icon: "📚" },
    { key: "schemes" as const, en: "Schemes", te: "పథకాలు", icon: "📋" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header session={session} onLogout={onLogout} />
      <div className="flex-1 animate-in fade-in duration-200" key={tab}>
        {tab === "home" && <WorkerHome session={session} />}
        {tab === "tasks" && <MyTasks session={session} />}
        {tab === "history" && <WorkHistory session={session} />}
        {tab === "schemes" && <SchemeList />}
      </div>
      <BottomNav items={items} active={tab} onChange={setTab} />
    </div>
  );
}

function workerComplaints(name: string) {
  return store.getComplaints().filter((c) => c.assignedWorker === name);
}

function WorkerHome({ session }: { session: NonNullable<Session> }) {
  const mine = workerComplaints(session.name);
  const resolved = mine.filter((c) => c.status === "Resolved").length;
  const pending = mine.filter((c) => c.status !== "Resolved").length;

  return (
    <PageWrap>
      <Card className="p-4 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="te text-base font-semibold text-primary">
          నమస్కారం, {session.name} 🙏
        </div>
        <div className="te text-sm text-muted-foreground mt-1">
          మీ సేవ గ్రామానికి విలువైనది
        </div>
        <div className="text-xs text-muted-foreground italic">Your work makes our village better</div>
      </Card>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Assigned" te="కేటాయించిన" value={mine.length} />
        <Stat label="Pending" te="పెండింగ్" value={pending} accent />
        <Stat label="Resolved" te="పూర్తయిన" value={resolved} />
      </div>
    </PageWrap>
  );
}

function MyTasks({ session }: { session: NonNullable<Session> }) {
  const [tasks, setTasks] = useState<Complaint[]>(() => workerComplaints(session.name).filter((c) => c.status !== "Resolved"));
  const [resolving, setResolving] = useState<Complaint | null>(null);
  const [notes, setNotes] = useState("");

  const refresh = () => setTasks(workerComplaints(session.name).filter((c) => c.status !== "Resolved"));

  const updateStatus = (c: Complaint, status: Complaint["status"], extra: Partial<Complaint> = {}) => {
    const all = store.getComplaints().map((x) => (x.id === c.id ? { ...x, status, ...extra } : x));
    store.setComplaints(all);
    refresh();
  };

  const submitResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolving) return;
    updateStatus(resolving, "Resolved", {
      resolvedAt: new Date().toISOString(),
      resolutionNotes: notes,
    });
    setResolving(null);
    setNotes("");
  };

  return (
    <PageWrap>
      <SectionTitle en="My Tasks" te="నా పనులు" />
      {tasks.length === 0 ? (
        <Empty en="No active tasks 🎉" te="ప్రస్తుతం పనులు లేవు" />
      ) : (
        <div className="space-y-2.5">
          {tasks.map((c) => (
            <Card key={c.id} className="p-3.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-sm text-primary">{c.ticketId}</div>
                  <div className="text-xs">{c.type} · {c.citizenName}</div>
                  <div className="text-[11px] text-muted-foreground">{c.location}</div>
                </div>
                <StatusBadge status={c.status} />
              </div>
              <div className="text-sm">{c.description}</div>
              <div className="flex gap-2">
                {c.status === "Pending" && (
                  <Btn variant="outline" className="flex-1" onClick={() => updateStatus(c, "In Progress")}>
                    Mark In Progress
                  </Btn>
                )}
                <Btn className="flex-1" onClick={() => setResolving(c)}>
                  Resolve · <span className="te">పరిష్కరించు</span>
                </Btn>
              </div>
            </Card>
          ))}
        </div>
      )}

      {resolving && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-2" onClick={() => setResolving(null)}>
          <div className="bg-card w-full max-w-[460px] rounded-[16px] p-4" onClick={(e) => e.stopPropagation()}>
            <div className="font-semibold text-primary">
              Resolve {resolving.ticketId}
            </div>
            <form onSubmit={submitResolve} className="space-y-3 mt-3">
              <Field label={<T en="Resolution Notes" te="పరిష్కార వివరాలు" />}>
                <textarea className={`${inputCls} min-h-24`} value={notes} onChange={(e) => setNotes(e.target.value)} required />
              </Field>
              <Field label={<T en="Photo (optional)" te="ఫోటో (ఐచ్ఛికం)" />}>
                <input type="file" accept="image/*" className="text-xs" />
              </Field>
              <div className="flex gap-2">
                <Btn type="button" variant="outline" className="flex-1" onClick={() => setResolving(null)}>
                  Cancel
                </Btn>
                <Btn type="submit" className="flex-1">
                  Confirm
                </Btn>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageWrap>
  );
}

function WorkHistory({ session }: { session: NonNullable<Session> }) {
  const resolved = useMemo(
    () => workerComplaints(session.name).filter((c) => c.status === "Resolved"),
    [session.name],
  );

  return (
    <PageWrap>
      <SectionTitle en="Work History" te="పని చరిత్ర" />
      {resolved.length === 0 ? (
        <Empty en="No resolved tasks yet" te="ఇంకా పూర్తయిన పనులు లేవు" />
      ) : (
        <div className="space-y-2">
          {resolved.map((c) => {
            const days = c.resolvedAt
              ? Math.max(1, Math.round((+new Date(c.resolvedAt) - +new Date(c.createdAt)) / 86400000))
              : 0;
            return (
              <Card key={c.id} className="p-3.5">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-sm text-primary">{c.ticketId}</div>
                    <div className="text-xs">{c.type} · {c.citizenName}</div>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
                <div className="text-xs mt-2">{c.description}</div>
                {c.resolutionNotes && (
                  <div className="mt-2 p-2 bg-success/10 rounded text-xs text-success">
                    ✓ {c.resolutionNotes}
                  </div>
                )}
                <div className="text-[11px] text-muted-foreground mt-2">
                  Resolved {c.resolvedAt ? new Date(c.resolvedAt).toLocaleDateString() : "—"} · Took ~{days} day(s)
                </div>
                <div className="text-[11px] text-muted-foreground italic mt-1">
                  Citizen feedback: <span className="te">ధన్యవాదాలు 🙏</span> (placeholder)
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </PageWrap>
  );
}
