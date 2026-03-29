import type {
  Appointment,
  Barber,
  BusinessConfig,
  GalleryItem,
  IncomeStats,
  Promotion,
  Service,
} from "@/backend.d";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useActor } from "@/hooks/useActor";
import {
  BarChart2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Image,
  Loader2,
  LogOut,
  Megaphone,
  Pencil,
  Plus,
  Scissors,
  Settings,
  Trash2,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmt(amount: bigint | number): string {
  const n = typeof amount === "bigint" ? Number(amount) : amount;
  return `$${n.toLocaleString("es-MX")}`;
}

const MONTHS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const CATEGORIES = [
  { value: "", label: "Todos" },
  { value: "corte", label: "Corte" },
  { value: "tinte", label: "Tinte" },
  { value: "barba", label: "Barba" },
  { value: "peinado", label: "Peinado" },
  { value: "tratamiento", label: "Tratamiento" },
];

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  scheduled: {
    label: "Pendiente",
    className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  confirmed: {
    label: "Confirmada",
    className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  completed: {
    label: "Completada",
    className: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  cancelled: {
    label: "Cancelada",
    className: "bg-red-500/20 text-red-400 border-red-500/30",
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

type Section =
  | "dashboard"
  | "reservas"
  | "servicios"
  | "barberos"
  | "config"
  | "facturacion"
  | "galeria"
  | "promociones";

const NAV_ITEMS: { id: Section; label: string; icon: React.ReactNode }[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <BarChart2 className="w-5 h-5" />,
  },
  { id: "reservas", label: "Reservas", icon: <Calendar className="w-5 h-5" /> },
  {
    id: "servicios",
    label: "Servicios",
    icon: <Scissors className="w-5 h-5" />,
  },
  { id: "barberos", label: "Barberos", icon: <Users className="w-5 h-5" /> },
  {
    id: "config",
    label: "Configuración",
    icon: <Settings className="w-5 h-5" />,
  },
  {
    id: "facturacion",
    label: "Facturación",
    icon: <DollarSign className="w-5 h-5" />,
  },
  { id: "galeria", label: "Galería", icon: <Image className="w-5 h-5" /> },
  {
    id: "promociones",
    label: "Promociones",
    icon: <Megaphone className="w-5 h-5" />,
  },
];

// ── AdminPanel ─────────────────────────────────────────────────────────────────
interface AdminPanelProps {
  actor: any;
  onBack: () => void;
}

export function AdminPanel({ actor: _actor, onBack }: AdminPanelProps) {
  const { actor } = useActor();
  const [section, setSection] = useState<Section>("dashboard");

  const currentNav = NAV_ITEMS.find((n) => n.id === section)!;

  return (
    <div
      className="flex h-screen bg-[oklch(0.08_0.003_240)] overflow-hidden"
      data-ocid="admin.panel"
    >
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-[oklch(0.11_0.004_240)] border-r border-charcoal-border shrink-0">
        <div className="px-5 py-5 border-b border-charcoal-border">
          <div className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-gold" />
            <span className="font-display text-gold font-bold tracking-wider text-sm uppercase">
              La Barbería
            </span>
          </div>
          <p className="text-muted-foreground text-xs mt-1">Panel Admin</p>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              data-ocid={`admin.${item.id}.tab`}
              className={[
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                section === item.id
                  ? "bg-gold/15 text-gold"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5",
              ].join(" ")}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-charcoal-border">
          <button
            type="button"
            onClick={onBack}
            data-ocid="admin.back.button"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Salir del Panel
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-4 border-b border-charcoal-border bg-[oklch(0.11_0.004_240)] shrink-0">
          <h1 className="font-display text-foreground font-semibold text-base md:text-lg">
            {currentNav.label}
          </h1>
          <button
            type="button"
            onClick={onBack}
            className="md:hidden flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors"
            data-ocid="admin.back.button"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </header>

        {/* Section content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {section === "dashboard" && <DashboardSection actor={actor} />}
          {section === "reservas" && <ReservasSection actor={actor} />}
          {section === "servicios" && <ServiciosSection actor={actor} />}
          {section === "barberos" && <BarberosSection actor={actor} />}
          {section === "config" && <ConfigSection actor={actor} />}
          {section === "facturacion" && <FacturacionSection actor={actor} />}
          {section === "galeria" && <GaleriaSection actor={actor} />}
          {section === "promociones" && <PromocionesSection actor={actor} />}
        </main>
      </div>

      {/* Bottom nav — mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[oklch(0.11_0.004_240)] border-t border-charcoal-border z-50">
        <div className="grid grid-cols-4 h-16">
          {NAV_ITEMS.slice(0, 4).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              data-ocid={`admin.${item.id}.tab`}
              className={[
                "flex flex-col items-center justify-center gap-1 text-xs transition-colors",
                section === item.id ? "text-gold" : "text-muted-foreground",
              ].join(" ")}
            >
              {item.icon}
              <span className="text-[10px]">{item.label}</span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-4 h-14 border-t border-charcoal-border">
          {NAV_ITEMS.slice(4).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              data-ocid={`admin.${item.id}.tab`}
              className={[
                "flex flex-col items-center justify-center gap-1 text-xs transition-colors",
                section === item.id ? "text-gold" : "text-muted-foreground",
              ].join(" ")}
            >
              {item.icon}
              <span className="text-[10px]">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

// ── Dashboard Section ─────────────────────────────────────────────────────────
function DashboardSection({ actor }: { actor: any }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [category, setCategory] = useState("");
  const [barberId, setBarberId] = useState(0n);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [stats, setStats] = useState<{ day: number; reservas: number }[]>([]);
  const [income, setIncome] = useState<IncomeStats | null>(null);
  const [totalReservas, setTotalReservas] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const todayDate = new Date().toISOString().split("T")[0];
      const [dayStats, incomeData, barberList] = await Promise.all([
        actor.getAppointmentStats(
          BigInt(month),
          BigInt(year),
          category,
          barberId,
        ),
        actor.getIncomeStats(todayDate),
        actor.getBarbers(),
      ]);
      const chartData = Array.from({ length: 31 }, (_, i) => ({
        day: i + 1,
        reservas: 0,
      }));
      for (const stat of dayStats) {
        const idx = Number(stat.day) - 1;
        if (idx >= 0 && idx < 31) chartData[idx].reservas = Number(stat.count);
      }
      const daysInMonth = new Date(year, month, 0).getDate();
      setStats(chartData.slice(0, daysInMonth));
      setTotalReservas(
        dayStats.reduce((s: number, d: any) => s + Number(d.count), 0),
      );
      setIncome(incomeData);
      setBarbers(barberList);
    } catch {
      toast.error("Error al cargar estadísticas");
    } finally {
      setLoading(false);
    }
  }, [actor, month, year, category, barberId]);

  useEffect(() => {
    load();
  }, [load]);

  function prevMonth() {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  }

  return (
    <div className="space-y-6 pb-32 md:pb-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Ingresos Hoy"
          value={income ? fmt(income.daily) : "--"}
          icon={<DollarSign />}
          color="gold"
        />
        <KpiCard
          title="Ingresos del Mes"
          value={income ? fmt(income.monthly) : "--"}
          icon={<DollarSign />}
          color="teal"
        />
        <KpiCard
          title="Ingresos del Año"
          value={income ? fmt(income.annual) : "--"}
          icon={<DollarSign />}
          color="purple"
        />
        <KpiCard
          title="Reservas del Mes"
          value={String(totalReservas)}
          icon={<Calendar />}
          color="amber"
        />
      </div>

      {/* Chart */}
      <div className="bg-[oklch(0.13_0.004_240)] border border-charcoal-border rounded-xl p-5">
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-foreground font-semibold text-sm min-w-[100px] text-center">
              {MONTHS_ES[month - 1]} {year}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger
                className="h-8 text-xs w-36 bg-charcoal-panel border-charcoal-border"
                data-ocid="dashboard.category.select"
              >
                <SelectValue placeholder="Servicio" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(barberId)}
              onValueChange={(v) => setBarberId(BigInt(v))}
            >
              <SelectTrigger
                className="h-8 text-xs w-36 bg-charcoal-panel border-charcoal-border"
                data-ocid="dashboard.barber.select"
              >
                <SelectValue placeholder="Barbero" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Todos</SelectItem>
                {barbers.map((b) => (
                  <SelectItem key={String(b.id)} value={String(b.id)}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div
            className="h-48 flex items-center justify-center"
            data-ocid="dashboard.loading_state"
          >
            <Loader2 className="w-6 h-6 animate-spin text-gold" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={stats}
              margin={{ top: 4, right: 4, bottom: 4, left: -20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.22 0.005 240)"
              />
              <XAxis
                dataKey="day"
                tick={{ fill: "oklch(0.72 0.005 80)", fontSize: 11 }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "oklch(0.72 0.005 80)", fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.14 0.004 240)",
                  border: "1px solid oklch(0.22 0.005 240)",
                  borderRadius: 8,
                }}
                labelStyle={{ color: "oklch(0.95 0.005 80)" }}
                itemStyle={{ color: "oklch(0.69 0.115 72)" }}
                formatter={(val: number) => [`${val} reservas`, ""]}
                labelFormatter={(d: number) => `Día ${d}`}
              />
              <Bar
                dataKey="reservas"
                fill="oklch(0.69 0.115 72)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon,
  color,
}: { title: string; value: string; icon: React.ReactNode; color: string }) {
  const colorMap: Record<string, string> = {
    gold: "text-gold bg-gold/10",
    teal: "text-teal-400 bg-teal-400/10",
    purple: "text-purple-400 bg-purple-400/10",
    amber: "text-amber-400 bg-amber-400/10",
  };
  return (
    <div className="bg-[oklch(0.13_0.004_240)] border border-charcoal-border rounded-xl p-4">
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colorMap[color] ?? colorMap.gold}`}
      >
        <span className="w-4 h-4">{icon}</span>
      </div>
      <p className="text-2xl font-bold font-display text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{title}</p>
    </div>
  );
}

// ── Reservas Section ──────────────────────────────────────────────────────────
function ReservasSection({ actor }: { actor: any }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterBarber, setFilterBarber] = useState("");
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [actionLoading, setActionLoading] = useState<bigint | null>(null);

  const load = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const [appts, barberList] = await Promise.all([
        actor.getAllAppointments(),
        actor.getBarbers(),
      ]);
      setAppointments(appts);
      setBarbers(barberList);
    } catch {
      toast.error("Error al cargar reservas");
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = appointments.filter((a) => {
    if (filterDate && a.date !== filterDate) return false;
    if (filterStatus && a.status !== filterStatus) return false;
    if (filterCategory && !a.serviceName.toLowerCase().includes(filterCategory))
      return false;
    if (filterBarber && a.barberName !== filterBarber) return false;
    return true;
  });

  async function handleConfirm(id: bigint) {
    if (!actor) return;
    setActionLoading(id);
    try {
      const r = await actor.confirmAppointment(id);
      if (r.__kind__ === "ok") {
        toast.success("Reserva confirmada");
        setAppointments((prev) => prev.map((a) => (a.id === id ? r.ok : a)));
      } else {
        toast.error(r.err);
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleComplete(id: bigint) {
    if (!actor) return;
    setActionLoading(id);
    try {
      const r = await actor.completeAppointment(id);
      if (r.__kind__ === "ok") {
        toast.success("Reserva completada");
        setAppointments((prev) => prev.map((a) => (a.id === id ? r.ok : a)));
      } else {
        toast.error(r.err);
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancel(id: bigint) {
    if (!actor) return;
    setActionLoading(id);
    try {
      const r = await actor.cancelAppointment(id);
      if (r.__kind__ === "ok") {
        toast.success("Reserva cancelada");
        setAppointments((prev) => prev.map((a) => (a.id === id ? r.ok : a)));
      } else {
        toast.error(r.err);
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-4 pb-32 md:pb-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="h-9 rounded-md bg-charcoal-panel border border-charcoal-border px-3 text-sm text-foreground [color-scheme:dark] focus:outline-none focus:border-gold transition-colors"
          data-ocid="reservas.date.input"
        />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger
            className="h-9 w-36 bg-charcoal-panel border-charcoal-border text-sm"
            data-ocid="reservas.status.select"
          >
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="scheduled">Pendiente</SelectItem>
            <SelectItem value="confirmed">Confirmada</SelectItem>
            <SelectItem value="completed">Completada</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger
            className="h-9 w-36 bg-charcoal-panel border-charcoal-border text-sm"
            data-ocid="reservas.category.select"
          >
            <SelectValue placeholder="Servicio" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterBarber} onValueChange={setFilterBarber}>
          <SelectTrigger
            className="h-9 w-36 bg-charcoal-panel border-charcoal-border text-sm"
            data-ocid="reservas.barber.select"
          >
            <SelectValue placeholder="Barbero" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            {barbers.map((b) => (
              <SelectItem key={String(b.id)} value={b.name}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div
          className="flex items-center justify-center py-16"
          data-ocid="reservas.loading_state"
        >
          <Loader2 className="w-7 h-7 animate-spin text-gold" />
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="reservas.empty_state"
        >
          No hay reservas con esos filtros.
        </div>
      ) : (
        <div
          className="overflow-x-auto rounded-xl border border-charcoal-border"
          data-ocid="reservas.table"
        >
          <Table>
            <TableHeader>
              <TableRow className="border-charcoal-border hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs uppercase">
                  Cliente
                </TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase">
                  Servicio
                </TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase hidden md:table-cell">
                  Barbero
                </TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase">
                  Fecha/Hora
                </TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase">
                  Estado
                </TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase text-right">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((appt, idx) => (
                <TableRow
                  key={String(appt.id)}
                  className="border-charcoal-border"
                  data-ocid={`reservas.item.${idx + 1}`}
                >
                  <TableCell className="text-sm font-medium">
                    {appt.clientName}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {appt.serviceName}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                    {appt.barberName || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {appt.date} {appt.time}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={appt.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {actionLoading === appt.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-gold" />
                      ) : (
                        <>
                          {appt.status === "scheduled" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
                              onClick={() => handleConfirm(appt.id)}
                              data-ocid={`reservas.confirm.button.${idx + 1}`}
                            >
                              Confirmar
                            </Button>
                          )}
                          {appt.status === "confirmed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs border-green-500/40 text-green-400 hover:bg-green-500/10"
                              onClick={() => handleComplete(appt.id)}
                              data-ocid={`reservas.complete.button.${idx + 1}`}
                            >
                              Completar
                            </Button>
                          )}
                          {(appt.status === "scheduled" ||
                            appt.status === "confirmed") && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs border-red-500/40 text-red-400 hover:bg-red-500/10"
                              onClick={() => handleCancel(appt.id)}
                              data-ocid={`reservas.delete_button.${idx + 1}`}
                            >
                              Cancelar
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ── Servicios Section ─────────────────────────────────────────────────────────
interface ServiceForm {
  name: string;
  description: string;
  category: string;
  durationMinutes: string;
  priceAmount: string;
}

const EMPTY_SERVICE_FORM: ServiceForm = {
  name: "",
  description: "",
  category: "corte",
  durationMinutes: "30",
  priceAmount: "150",
};

function ServiciosSection({ actor }: { actor: any }) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceForm>(EMPTY_SERVICE_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      setServices(await actor.getServices());
    } catch {
      toast.error("Error al cargar servicios");
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setEditTarget(null);
    setForm(EMPTY_SERVICE_FORM);
    setDialogOpen(true);
  }

  function openEdit(s: Service) {
    setEditTarget(s);
    setForm({
      name: s.name,
      description: s.description,
      category: s.category,
      durationMinutes: String(s.durationMinutes),
      priceAmount: String(s.priceAmount),
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!actor || !form.name) return;
    setSaving(true);
    try {
      let r: any;
      if (editTarget) {
        r = await actor.updateService(
          editTarget.id,
          form.name,
          form.description,
          BigInt(form.durationMinutes || 30),
          BigInt(form.priceAmount || 0),
        );
      } else {
        r = await actor.addService(
          form.name,
          form.description,
          BigInt(form.durationMinutes || 30),
          BigInt(form.priceAmount || 0),
          form.category,
        );
      }
      if (r.__kind__ === "ok") {
        toast.success(
          editTarget ? "Servicio actualizado" : "Servicio agregado",
        );
        setDialogOpen(false);
        load();
      } else {
        toast.error(r.err);
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!actor || !deleteTarget) return;
    setDeleting(true);
    try {
      const r = await actor.deleteService(deleteTarget.id);
      if (r.__kind__ === "ok") {
        toast.success("Servicio eliminado");
        setDeleteTarget(null);
        load();
      } else {
        toast.error(r.err);
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggle(s: Service) {
    if (!actor) return;
    try {
      const r = await actor.toggleServiceActive(s.id);
      if (r.__kind__ === "ok") {
        setServices((prev) => prev.map((x) => (x.id === s.id ? r.ok : x)));
      } else {
        toast.error(r.err);
      }
    } catch {
      toast.error("Error de conexión");
    }
  }

  return (
    <div className="space-y-4 pb-32 md:pb-6">
      <div className="flex justify-end">
        <Button
          onClick={openAdd}
          className="bg-gold text-charcoal hover:bg-gold-light font-semibold gap-2"
          data-ocid="servicios.add_button"
        >
          <Plus className="w-4 h-4" /> Agregar Servicio
        </Button>
      </div>

      {loading ? (
        <div
          className="flex items-center justify-center py-16"
          data-ocid="servicios.loading_state"
        >
          <Loader2 className="w-7 h-7 animate-spin text-gold" />
        </div>
      ) : services.length === 0 ? (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="servicios.empty_state"
        >
          No hay servicios.
        </div>
      ) : (
        <div className="grid gap-3">
          {services.map((s, idx) => (
            <div
              key={String(s.id)}
              className="bg-[oklch(0.13_0.004_240)] border border-charcoal-border rounded-xl p-4 flex items-start gap-4"
              data-ocid={`servicios.item.${idx + 1}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-foreground">{s.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-charcoal-panel border border-charcoal-border text-muted-foreground capitalize">
                    {s.category}
                  </span>
                  {!s.active && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                      Inactivo
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {s.description}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-gold font-bold font-display">
                    {fmt(s.priceAmount)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {String(s.durationMinutes)} min
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch
                  checked={s.active}
                  onCheckedChange={() => handleToggle(s)}
                  data-ocid={`servicios.switch.${idx + 1}`}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 border-charcoal-border"
                  onClick={() => openEdit(s)}
                  data-ocid={`servicios.edit_button.${idx + 1}`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 border-red-500/40 text-red-400 hover:bg-red-500/10"
                  onClick={() => setDeleteTarget(s)}
                  data-ocid={`servicios.delete_button.${idx + 1}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="bg-charcoal-card border-charcoal-border text-foreground"
          data-ocid="servicios.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-gold">
              {editTarget ? "Editar Servicio" : "Nuevo Servicio"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="bg-charcoal-panel border-charcoal-border"
                data-ocid="servicios.name.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                className="bg-charcoal-panel border-charcoal-border resize-none"
                rows={3}
                data-ocid="servicios.description.textarea"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Categoría</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                >
                  <SelectTrigger
                    className="bg-charcoal-panel border-charcoal-border"
                    data-ocid="servicios.category.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.filter((c) => c.value).map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Duración (min)</Label>
                <Input
                  type="number"
                  value={form.durationMinutes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, durationMinutes: e.target.value }))
                  }
                  className="bg-charcoal-panel border-charcoal-border"
                  data-ocid="servicios.duration.input"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Precio ($)</Label>
              <Input
                type="number"
                value={form.priceAmount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, priceAmount: e.target.value }))
                }
                className="bg-charcoal-panel border-charcoal-border"
                data-ocid="servicios.price.input"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-charcoal-border"
              data-ocid="servicios.cancel_button"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gold text-charcoal hover:bg-gold-light font-semibold"
              data-ocid="servicios.save_button"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Guardar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <DialogContent
          className="bg-charcoal-card border-charcoal-border text-foreground"
          data-ocid="servicios.delete.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-red-400">
              Eliminar Servicio
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            ¿Estás seguro de eliminar{" "}
            <strong className="text-foreground">{deleteTarget?.name}</strong>?
            Esta acción no se puede deshacer.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="border-charcoal-border"
              data-ocid="servicios.delete.cancel_button"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600 text-white"
              data-ocid="servicios.delete.confirm_button"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Eliminar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Barberos Section ──────────────────────────────────────────────────────────
interface BarberForm {
  name: string;
  workDays: number[];
  startTime: string;
  endTime: string;
}

const EMPTY_BARBER_FORM: BarberForm = {
  name: "",
  workDays: [1, 2, 3, 4, 5, 6],
  startTime: "09:00",
  endTime: "19:00",
};

function BarberosSection({ actor }: { actor: any }) {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Barber | null>(null);
  const [form, setForm] = useState<BarberForm>(EMPTY_BARBER_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      setBarbers(await actor.getBarbers());
    } catch {
      toast.error("Error al cargar barberos");
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setEditTarget(null);
    setForm(EMPTY_BARBER_FORM);
    setDialogOpen(true);
  }

  function openEdit(b: Barber) {
    setEditTarget(b);
    setForm({
      name: b.name,
      workDays: b.workDays.map(Number),
      startTime: b.startTime,
      endTime: b.endTime,
    });
    setDialogOpen(true);
  }

  function toggleDay(day: number) {
    setForm((f) => ({
      ...f,
      workDays: f.workDays.includes(day)
        ? f.workDays.filter((d) => d !== day)
        : [...f.workDays, day],
    }));
  }

  async function handleSave() {
    if (!actor || !form.name) return;
    setSaving(true);
    try {
      const wds = form.workDays.map(BigInt);
      let r: any;
      if (editTarget) {
        r = await actor.updateBarber(
          editTarget.id,
          form.name,
          wds,
          form.startTime,
          form.endTime,
        );
      } else {
        r = await actor.addBarber(form.name, wds, form.startTime, form.endTime);
      }
      if (r.__kind__ === "ok") {
        toast.success(editTarget ? "Barbero actualizado" : "Barbero agregado");
        setDialogOpen(false);
        load();
      } else {
        toast.error(r.err);
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(b: Barber) {
    if (!actor) return;
    try {
      const r = await actor.toggleBarberActive(b.id);
      if (r.__kind__ === "ok") {
        setBarbers((prev) => prev.map((x) => (x.id === b.id ? r.ok : x)));
      } else {
        toast.error(r.err);
      }
    } catch {
      toast.error("Error de conexión");
    }
  }

  return (
    <div className="space-y-4 pb-32 md:pb-6">
      <div className="flex justify-end">
        <Button
          onClick={openAdd}
          className="bg-gold text-charcoal hover:bg-gold-light font-semibold gap-2"
          data-ocid="barberos.add_button"
        >
          <Plus className="w-4 h-4" /> Agregar Barbero
        </Button>
      </div>

      {loading ? (
        <div
          className="flex items-center justify-center py-16"
          data-ocid="barberos.loading_state"
        >
          <Loader2 className="w-7 h-7 animate-spin text-gold" />
        </div>
      ) : barbers.length === 0 ? (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="barberos.empty_state"
        >
          No hay barberos registrados.
        </div>
      ) : (
        <div className="grid gap-3">
          {barbers.map((b, idx) => (
            <div
              key={String(b.id)}
              className="bg-[oklch(0.13_0.004_240)] border border-charcoal-border rounded-xl p-4 flex items-start gap-4"
              data-ocid={`barberos.item.${idx + 1}`}
            >
              <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0">
                <span className="text-gold font-bold font-display text-sm">
                  {b.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-foreground">{b.name}</span>
                  {!b.active && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                      Inactivo
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {b.workDays.map((d) => DAY_LABELS[Number(d)]).join(", ")} ·{" "}
                  {b.startTime}–{b.endTime}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch
                  checked={b.active}
                  onCheckedChange={() => handleToggle(b)}
                  data-ocid={`barberos.switch.${idx + 1}`}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 border-charcoal-border"
                  onClick={() => openEdit(b)}
                  data-ocid={`barberos.edit_button.${idx + 1}`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="bg-charcoal-card border-charcoal-border text-foreground"
          data-ocid="barberos.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-gold">
              {editTarget ? "Editar Barbero" : "Nuevo Barbero"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="bg-charcoal-panel border-charcoal-border"
                data-ocid="barberos.name.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Días de Trabajo</Label>
              <div className="flex flex-wrap gap-2">
                {DAY_LABELS.map((label, i) => (
                  <div
                    key={DAY_LABELS[i]}
                    className="flex items-center gap-1.5 cursor-pointer"
                  >
                    <Checkbox
                      checked={form.workDays.includes(i)}
                      onCheckedChange={() => toggleDay(i)}
                      className="border-charcoal-border"
                    />
                    <span className="text-sm text-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Hora Inicio</Label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startTime: e.target.value }))
                  }
                  className="bg-charcoal-panel border-charcoal-border [color-scheme:dark]"
                  data-ocid="barberos.start_time.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Hora Fin</Label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, endTime: e.target.value }))
                  }
                  className="bg-charcoal-panel border-charcoal-border [color-scheme:dark]"
                  data-ocid="barberos.end_time.input"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-charcoal-border"
              data-ocid="barberos.cancel_button"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gold text-charcoal hover:bg-gold-light font-semibold"
              data-ocid="barberos.save_button"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Guardar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Config Section ────────────────────────────────────────────────────────────
function ConfigSection({ actor }: { actor: any }) {
  const [_config, setConfig] = useState<BusinessConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("19:00");
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [newDate, setNewDate] = useState("");

  const load = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const c = await actor.getBusinessConfig();
      setConfig(c);
      setWorkDays(c.workDays.map(Number));
      setStartTime(c.startTime);
      setEndTime(c.endTime);
      setBlockedDates(c.blockedDates);
    } catch {
      toast.error("Error al cargar configuración");
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    load();
  }, [load]);

  function toggleDay(d: number) {
    setWorkDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );
  }

  function addBlockedDate() {
    if (!newDate || blockedDates.includes(newDate)) return;
    setBlockedDates((prev) => [...prev, newDate].sort());
    setNewDate("");
  }

  async function handleSave() {
    if (!actor) return;
    setSaving(true);
    try {
      const r = await actor.updateBusinessConfig(
        workDays.map(BigInt),
        startTime,
        endTime,
        blockedDates,
      );
      if (r.__kind__ === "ok") {
        toast.success("Configuración guardada");
        setConfig(r.ok);
      } else {
        toast.error(r.err);
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div
        className="flex items-center justify-center py-16"
        data-ocid="config.loading_state"
      >
        <Loader2 className="w-7 h-7 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl pb-32 md:pb-6">
      <div className="bg-[oklch(0.13_0.004_240)] border border-charcoal-border rounded-xl p-5 space-y-5">
        <h3 className="font-display text-foreground font-semibold">
          Horario del Negocio
        </h3>

        <div className="space-y-2">
          <Label>Días de Atención</Label>
          <div className="flex flex-wrap gap-2">
            {DAY_LABELS.map((label, i) => (
              <div
                key={DAY_LABELS[i]}
                className="flex items-center gap-1.5 cursor-pointer"
              >
                <Checkbox
                  checked={workDays.includes(i)}
                  onCheckedChange={() => toggleDay(i)}
                  className="border-charcoal-border"
                />
                <span className="text-sm text-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Hora de Apertura</Label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="bg-charcoal-panel border-charcoal-border [color-scheme:dark]"
              data-ocid="config.start_time.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Hora de Cierre</Label>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="bg-charcoal-panel border-charcoal-border [color-scheme:dark]"
              data-ocid="config.end_time.input"
            />
          </div>
        </div>
      </div>

      <div className="bg-[oklch(0.13_0.004_240)] border border-charcoal-border rounded-xl p-5 space-y-4">
        <h3 className="font-display text-foreground font-semibold">
          Días Bloqueados
        </h3>
        <div className="flex gap-2">
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="flex-1 h-9 rounded-md bg-charcoal-panel border border-charcoal-border px-3 text-sm text-foreground [color-scheme:dark] focus:outline-none focus:border-gold transition-colors"
            data-ocid="config.blocked_date.input"
          />
          <Button
            onClick={addBlockedDate}
            disabled={!newDate}
            size="sm"
            className="bg-gold text-charcoal hover:bg-gold-light shrink-0"
            data-ocid="config.add_blocked.button"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {blockedDates.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin días bloqueados.</p>
        ) : (
          <div className="space-y-2">
            {blockedDates.map((d) => (
              <div
                key={d}
                className="flex items-center justify-between bg-charcoal-panel border border-charcoal-border rounded-lg px-3 py-2"
              >
                <span className="text-sm text-foreground">{d}</span>
                <button
                  type="button"
                  onClick={() =>
                    setBlockedDates((prev) => prev.filter((x) => x !== d))
                  }
                  className="text-red-400 hover:text-red-300 transition-colors"
                  data-ocid="config.remove_blocked.button"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-gold text-charcoal hover:bg-gold-light font-semibold"
        data-ocid="config.save_button"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Guardar Configuración
      </Button>
    </div>
  );
}

// ── Facturación Section ───────────────────────────────────────────────────────
function FacturacionSection({ actor }: { actor: any }) {
  const [income, setIncome] = useState<IncomeStats | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const load = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const todayDate = new Date().toISOString().split("T")[0];
      const [incomeData, appts] = await Promise.all([
        actor.getIncomeStats(todayDate),
        actor.getAllAppointments(),
      ]);
      setIncome(incomeData);
      setAppointments(appts);
    } catch {
      toast.error("Error al cargar facturación");
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    load();
  }, [load]);

  const billed = appointments.filter((a) => {
    if (a.status !== "confirmed" && a.status !== "completed") return false;
    if (filterFrom && a.date < filterFrom) return false;
    if (filterTo && a.date > filterTo) return false;
    return true;
  });

  if (loading) {
    return (
      <div
        className="flex items-center justify-center py-16"
        data-ocid="facturacion.loading_state"
      >
        <Loader2 className="w-7 h-7 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-32 md:pb-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[oklch(0.13_0.004_240)] border border-charcoal-border rounded-xl p-5 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
            Hoy
          </p>
          <p className="font-display text-3xl font-bold text-gold">
            {income ? fmt(income.daily) : "--"}
          </p>
        </div>
        <div className="bg-[oklch(0.13_0.004_240)] border border-charcoal-border rounded-xl p-5 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
            Este Mes
          </p>
          <p className="font-display text-3xl font-bold text-teal-400">
            {income ? fmt(income.monthly) : "--"}
          </p>
        </div>
        <div className="bg-[oklch(0.13_0.004_240)] border border-charcoal-border rounded-xl p-5 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
            Este Año
          </p>
          <p className="font-display text-3xl font-bold text-purple-400">
            {income ? fmt(income.annual) : "--"}
          </p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input
          type="date"
          value={filterFrom}
          onChange={(e) => setFilterFrom(e.target.value)}
          className="h-9 rounded-md bg-charcoal-panel border border-charcoal-border px-3 text-sm text-foreground [color-scheme:dark] focus:outline-none focus:border-gold transition-colors"
          data-ocid="facturacion.from.input"
        />
        <input
          type="date"
          value={filterTo}
          onChange={(e) => setFilterTo(e.target.value)}
          className="h-9 rounded-md bg-charcoal-panel border border-charcoal-border px-3 text-sm text-foreground [color-scheme:dark] focus:outline-none focus:border-gold transition-colors"
          data-ocid="facturacion.to.input"
        />
      </div>

      {billed.length === 0 ? (
        <div
          className="text-center py-10 text-muted-foreground"
          data-ocid="facturacion.empty_state"
        >
          No hay ingresos en ese rango.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-charcoal-border">
          <Table data-ocid="facturacion.table">
            <TableHeader>
              <TableRow className="border-charcoal-border hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs uppercase">
                  Fecha
                </TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase">
                  Cliente
                </TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase hidden md:table-cell">
                  Servicio
                </TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase hidden md:table-cell">
                  Barbero
                </TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase text-right">
                  Monto
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {billed.map((a, idx) => (
                <TableRow
                  key={String(a.id)}
                  className="border-charcoal-border"
                  data-ocid={`facturacion.item.${idx + 1}`}
                >
                  <TableCell className="text-sm">{a.date}</TableCell>
                  <TableCell className="text-sm">{a.clientName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                    {a.serviceName}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                    {a.barberName || "—"}
                  </TableCell>
                  <TableCell className="text-right text-gold font-bold font-display">
                    --
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ── Galería Section ───────────────────────────────────────────────────────────
function GaleriaSection({ actor }: { actor: any }) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);

  const load = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      setItems(await actor.getGalleryItems());
    } catch {
      toast.error("Error al cargar galería");
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd() {
    if (!actor || !url || !title) return;
    setAdding(true);
    try {
      const r = await actor.addGalleryItem(url, title);
      if (r.__kind__ === "ok") {
        toast.success("Imagen agregada");
        setUrl("");
        setTitle("");
        load();
      } else {
        toast.error(r.err);
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: bigint) {
    if (!actor) return;
    setDeleteId(id);
    try {
      const r = await actor.deleteGalleryItem(id);
      if (r.__kind__ === "ok") {
        toast.success("Imagen eliminada");
        setItems((prev) => prev.filter((i) => i.id !== id));
      } else {
        toast.error(r.err);
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-5 pb-32 md:pb-6">
      <div className="bg-[oklch(0.13_0.004_240)] border border-charcoal-border rounded-xl p-5 space-y-3">
        <h3 className="font-display text-foreground font-semibold">
          Agregar Imagen
        </h3>
        <Input
          placeholder="URL de la imagen"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="bg-charcoal-panel border-charcoal-border"
          data-ocid="galeria.url.input"
        />
        <Input
          placeholder="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-charcoal-panel border-charcoal-border"
          data-ocid="galeria.title.input"
        />
        <Button
          onClick={handleAdd}
          disabled={adding || !url || !title}
          className="bg-gold text-charcoal hover:bg-gold-light font-semibold gap-2"
          data-ocid="galeria.add_button"
        >
          {adding ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Agregar
        </Button>
      </div>

      {loading ? (
        <div
          className="flex items-center justify-center py-16"
          data-ocid="galeria.loading_state"
        >
          <Loader2 className="w-7 h-7 animate-spin text-gold" />
        </div>
      ) : items.length === 0 ? (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="galeria.empty_state"
        >
          La galería está vacía.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {items.map((item, idx) => (
            <div
              key={String(item.id)}
              className="relative group rounded-xl overflow-hidden border border-charcoal-border"
              data-ocid={`galeria.item.${idx + 1}`}
            >
              <div className="aspect-square bg-charcoal-panel">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "/assets/generated/hero-barbershop.dim_1400x800.jpg";
                  }}
                />
              </div>
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <p className="text-white text-xs font-medium px-2 text-center">
                  {item.title}
                </p>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  disabled={deleteId === item.id}
                  className="p-2 rounded-full bg-red-500/80 hover:bg-red-500 text-white transition-colors"
                  data-ocid={`galeria.delete_button.${idx + 1}`}
                >
                  {deleteId === item.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Promociones Section ───────────────────────────────────────────────────────
interface PromoForm {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
}

const EMPTY_PROMO_FORM: PromoForm = {
  title: "",
  description: "",
  startDate: "",
  endDate: "",
};

function PromocionesSection({ actor }: { actor: any }) {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Promotion | null>(null);
  const [form, setForm] = useState<PromoForm>(EMPTY_PROMO_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);

  const load = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      setPromos(await actor.getPromotions());
    } catch {
      toast.error("Error al cargar promociones");
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setEditTarget(null);
    setForm(EMPTY_PROMO_FORM);
    setDialogOpen(true);
  }

  function openEdit(p: Promotion) {
    setEditTarget(p);
    setForm({
      title: p.title,
      description: p.description,
      startDate: p.startDate,
      endDate: p.endDate,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!actor || !form.title) return;
    setSaving(true);
    try {
      let r: any;
      if (editTarget) {
        r = await actor.updatePromotion(
          editTarget.id,
          form.title,
          form.description,
          editTarget.active,
          form.startDate,
          form.endDate,
        );
      } else {
        r = await actor.addPromotion(
          form.title,
          form.description,
          form.startDate,
          form.endDate,
        );
      }
      if (r.__kind__ === "ok") {
        toast.success(
          editTarget ? "Promoción actualizada" : "Promoción agregada",
        );
        setDialogOpen(false);
        load();
      } else {
        toast.error(r.err);
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: bigint) {
    if (!actor) return;
    setDeleteId(id);
    try {
      const r = await actor.deletePromotion(id);
      if (r.__kind__ === "ok") {
        toast.success("Promoción eliminada");
        setPromos((prev) => prev.filter((p) => p.id !== id));
      } else {
        toast.error(r.err);
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setDeleteId(null);
    }
  }

  async function handleToggle(p: Promotion) {
    if (!actor) return;
    try {
      const r = await actor.updatePromotion(
        p.id,
        p.title,
        p.description,
        !p.active,
        p.startDate,
        p.endDate,
      );
      if (r.__kind__ === "ok") {
        setPromos((prev) => prev.map((x) => (x.id === p.id ? r.ok : x)));
      } else {
        toast.error(r.err);
      }
    } catch {
      toast.error("Error de conexión");
    }
  }

  return (
    <div className="space-y-4 pb-32 md:pb-6">
      <div className="flex justify-end">
        <Button
          onClick={openAdd}
          className="bg-gold text-charcoal hover:bg-gold-light font-semibold gap-2"
          data-ocid="promociones.add_button"
        >
          <Plus className="w-4 h-4" /> Nueva Promoción
        </Button>
      </div>

      {loading ? (
        <div
          className="flex items-center justify-center py-16"
          data-ocid="promociones.loading_state"
        >
          <Loader2 className="w-7 h-7 animate-spin text-gold" />
        </div>
      ) : promos.length === 0 ? (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="promociones.empty_state"
        >
          No hay promociones.
        </div>
      ) : (
        <div className="grid gap-3">
          {promos.map((p, idx) => (
            <div
              key={String(p.id)}
              className="bg-[oklch(0.13_0.004_240)] border border-charcoal-border rounded-xl p-4"
              data-ocid={`promociones.item.${idx + 1}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground">
                      {p.title}
                    </span>
                    {p.active ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                        Activa
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-charcoal-border">
                        Inactiva
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {p.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {p.startDate} → {p.endDate}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={p.active}
                    onCheckedChange={() => handleToggle(p)}
                    data-ocid={`promociones.switch.${idx + 1}`}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 border-charcoal-border"
                    onClick={() => openEdit(p)}
                    data-ocid={`promociones.edit_button.${idx + 1}`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 border-red-500/40 text-red-400 hover:bg-red-500/10"
                    onClick={() => handleDelete(p.id)}
                    disabled={deleteId === p.id}
                    data-ocid={`promociones.delete_button.${idx + 1}`}
                  >
                    {deleteId === p.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="bg-charcoal-card border-charcoal-border text-foreground"
          data-ocid="promociones.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-gold">
              {editTarget ? "Editar Promoción" : "Nueva Promoción"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                className="bg-charcoal-panel border-charcoal-border"
                data-ocid="promociones.title.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                className="bg-charcoal-panel border-charcoal-border resize-none"
                rows={3}
                data-ocid="promociones.description.textarea"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Inicio</Label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startDate: e.target.value }))
                  }
                  className="w-full h-9 rounded-md bg-charcoal-panel border border-charcoal-border px-3 text-sm text-foreground [color-scheme:dark] focus:outline-none focus:border-gold"
                  data-ocid="promociones.start_date.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Fin</Label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, endDate: e.target.value }))
                  }
                  className="w-full h-9 rounded-md bg-charcoal-panel border border-charcoal-border px-3 text-sm text-foreground [color-scheme:dark] focus:outline-none focus:border-gold"
                  data-ocid="promociones.end_date.input"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-charcoal-border"
              data-ocid="promociones.cancel_button"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gold text-charcoal hover:bg-gold-light font-semibold"
              data-ocid="promociones.save_button"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Guardar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
