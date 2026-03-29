import type { Appointment } from "@/backend.d";

interface ActorWithCancel {
  cancelAppointment(
    id: bigint,
  ): Promise<
    { __kind__: "ok"; ok: Appointment } | { __kind__: "err"; err: string }
  >;
  getMyAppointments(): Promise<Appointment[]>;
}
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  CalendarX,
  ChevronDown,
  ChevronUp,
  Filter,
  Loader2,
  Plus,
  Scissors,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface Props {
  appointments: Appointment[];
  loading?: boolean;
  onReservar: () => void;
  actor: ActorWithCancel | null;
  onAppointmentsChange: (appts: Appointment[]) => void;
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return "";
  const [y, mo, d] = dateStr.split("-").map(Number);
  const months = [
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
  return `${d} de ${months[mo - 1]}, ${y}`;
}

function formatDisplay12h(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${suffix}`;
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === "confirmed" || s === "confirmada") {
    return (
      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs font-medium">
        Confirmada
      </Badge>
    );
  }
  if (s === "completed" || s === "completada") {
    return (
      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs font-medium">
        Completada
      </Badge>
    );
  }
  if (s === "cancelled" || s === "cancelada") {
    return (
      <Badge className="bg-red-500/15 text-red-400 border-red-500/20 text-xs font-medium">
        Cancelada
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs font-medium">
      Pendiente
    </Badge>
  );
}

function canCancel(status: string): boolean {
  const s = status.toLowerCase();
  return (
    s !== "completed" &&
    s !== "completada" &&
    s !== "cancelled" &&
    s !== "cancelada"
  );
}

function AppointmentCardSkeleton() {
  return (
    <div className="bg-charcoal-card border border-charcoal-border rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-5 w-32 bg-charcoal-border" />
        <Skeleton className="h-5 w-20 bg-charcoal-border" />
      </div>
      <Skeleton className="h-4 w-28 bg-charcoal-border" />
      <Skeleton className="h-4 w-20 bg-charcoal-border" />
      <Skeleton className="h-8 w-full bg-charcoal-border mt-1" />
    </div>
  );
}

export function MyAppointmentsScreen({
  appointments,
  loading = false,
  onReservar,
  actor,
  onAppointmentsChange,
}: Props) {
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterService, setFilterService] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<bigint | null>(null);

  // Unique service names for filter dropdown
  const serviceNames = useMemo(() => {
    const names = [...new Set(appointments.map((a) => a.serviceName))];
    return names.sort();
  }, [appointments]);

  // Filter + sort logic
  const filtered = useMemo(() => {
    let list = [...appointments];

    if (filterDate) {
      list = list.filter((a) => a.date === filterDate);
    }
    if (filterStatus !== "all") {
      list = list.filter((a) => a.status.toLowerCase() === filterStatus);
    }
    if (filterService !== "all") {
      list = list.filter((a) => a.serviceName === filterService);
    }

    // Sort: upcoming first (ascending), then past
    const today = new Date().toISOString().split("T")[0];
    const upcoming = list
      .filter((a) => a.date >= today)
      .sort((a, b) =>
        a.date === b.date
          ? a.time.localeCompare(b.time)
          : a.date.localeCompare(b.date),
      );
    const past = list
      .filter((a) => a.date < today)
      .sort((a, b) => b.date.localeCompare(a.date));

    return [...upcoming, ...past];
  }, [appointments, filterDate, filterStatus, filterService]);

  const hasActiveFilters =
    filterDate !== "" || filterStatus !== "all" || filterService !== "all";

  function clearFilters() {
    setFilterDate("");
    setFilterStatus("all");
    setFilterService("all");
  }

  async function handleCancel(appt: Appointment) {
    if (!actor) return;
    setCancellingId(appt.id);
    try {
      const result = await actor.cancelAppointment(appt.id);
      if (result.__kind__ === "ok") {
        const updated = appointments.map((a) =>
          a.id === appt.id ? { ...a, status: "cancelled" } : a,
        );
        onAppointmentsChange(updated);
        toast.success("Reserva cancelada exitosamente");
      } else {
        toast.error(`Error: ${result.err}`);
      }
    } catch {
      toast.error("No se pudo cancelar la reserva. Inténtalo de nuevo.");
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <section
      id="reservas"
      className="max-w-6xl mx-auto px-4 sm:px-6 py-16"
      data-ocid="reservas.section"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8 gap-4">
        <div>
          <p className="text-gold text-xs uppercase tracking-[0.3em] font-medium mb-1">
            Tu historial
          </p>
          <h2 className="font-display text-3xl font-bold text-foreground">
            Mis Reservas
          </h2>
          {appointments.length > 0 && (
            <p className="text-muted-foreground text-sm mt-1">
              {appointments.length} reserva
              {appointments.length !== 1 ? "s" : ""} en total
            </p>
          )}
        </div>
        <Button
          className="bg-gold text-charcoal hover:bg-gold-light font-semibold tracking-widest uppercase text-xs px-5 gap-1.5 flex-shrink-0"
          onClick={onReservar}
          data-ocid="reservas.primary_button"
        >
          <Plus className="w-3.5 h-3.5" />
          Nueva Reserva
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6">
        {/* Mobile: collapsible toggle */}
        <button
          type="button"
          className="flex sm:hidden items-center gap-2 text-muted-foreground hover:text-foreground text-xs uppercase tracking-wider mb-3"
          onClick={() => setFiltersOpen(!filtersOpen)}
          data-ocid="reservas.toggle"
        >
          <Filter className="w-3.5 h-3.5" />
          Filtros
          {hasActiveFilters && (
            <span className="bg-gold text-charcoal text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
              !
            </span>
          )}
          {filtersOpen ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        <AnimatePresence initial={false}>
          {(filtersOpen ||
            (typeof window !== "undefined" && window.innerWidth >= 640)) && (
            <motion.div
              key="filters"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden sm:!opacity-100 sm:!h-auto"
            >
              <div className="bg-charcoal-card border border-charcoal-border rounded-xl p-4 flex flex-wrap gap-3 items-end">
                {/* Date filter */}
                <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                    Fecha
                  </Label>
                  <Input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="bg-charcoal-panel border-charcoal-border focus:border-gold text-foreground text-sm h-9"
                    data-ocid="reservas.input"
                  />
                </div>

                {/* Status filter */}
                <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                    Estado
                  </Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger
                      className="bg-charcoal-panel border-charcoal-border text-sm h-9"
                      data-ocid="reservas.filter_status"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-charcoal-card border-charcoal-border">
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="scheduled">Pendiente</SelectItem>
                      <SelectItem value="confirmed">Confirmada</SelectItem>
                      <SelectItem value="completed">Completada</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Service filter */}
                <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                    Servicio
                  </Label>
                  <Select
                    value={filterService}
                    onValueChange={setFilterService}
                  >
                    <SelectTrigger
                      className="bg-charcoal-panel border-charcoal-border text-sm h-9"
                      data-ocid="reservas.select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-charcoal-card border-charcoal-border">
                      <SelectItem value="all">Todos los servicios</SelectItem>
                      {serviceNames.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear filters */}
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-gold hover:bg-transparent gap-1.5 text-xs uppercase tracking-wider h-9 flex-shrink-0"
                    onClick={clearFilters}
                    data-ocid="reservas.secondary_button"
                  >
                    <X className="w-3.5 h-3.5" />
                    Limpiar
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop filters always visible */}
        <div className="hidden sm:block">
          {/* This is handled by the AnimatePresence above with sm: overrides */}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          data-ocid="reservas.loading_state"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
            <AppointmentCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-5 py-20 text-center bg-charcoal-card border border-charcoal-border rounded-xl"
          data-ocid="reservas.empty_state"
        >
          {hasActiveFilters ? (
            <>
              <CalendarX className="w-14 h-14 text-gold/30" />
              <div>
                <p className="text-foreground font-medium mb-1">
                  Sin resultados
                </p>
                <p className="text-muted-foreground text-sm">
                  No hay reservas que coincidan con tus filtros
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-charcoal-border text-muted-foreground hover:text-gold hover:border-gold text-xs uppercase tracking-wider"
                onClick={clearFilters}
                data-ocid="reservas.secondary_button"
              >
                Limpiar filtros
              </Button>
            </>
          ) : (
            <>
              <Calendar className="w-14 h-14 text-gold/30" />
              <div>
                <p className="text-foreground font-medium mb-1">
                  Aún no tienes reservas
                </p>
                <p className="text-muted-foreground text-sm">
                  Reserva tu primera cita y aparecerá aquí
                </p>
              </div>
              <Button
                className="bg-gold text-charcoal hover:bg-gold-light font-semibold uppercase tracking-wider text-xs"
                onClick={onReservar}
                data-ocid="reservas.primary_button"
              >
                Reservar mi primera cita
              </Button>
            </>
          )}
        </motion.div>
      ) : (
        <div className="space-y-8">
          {/* Upcoming section */}
          {(() => {
            const today = new Date().toISOString().split("T")[0];
            const upcoming = filtered.filter((a) => a.date >= today);
            const past = filtered.filter((a) => a.date < today);

            return (
              <>
                {upcoming.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-[0.25em] mb-4 flex items-center gap-2">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold" />
                      Próximas ({upcoming.length})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <AnimatePresence mode="popLayout">
                        {upcoming.map((appt, idx) => (
                          <AppointmentCard
                            key={String(appt.id)}
                            appt={appt}
                            idx={idx}
                            cancellingId={cancellingId}
                            onCancel={handleCancel}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {past.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-[0.25em] mb-4 flex items-center gap-2">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                      Anteriores ({past.length})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <AnimatePresence mode="popLayout">
                        {past.map((appt, idx) => (
                          <AppointmentCard
                            key={String(appt.id)}
                            appt={appt}
                            idx={upcoming.length + idx}
                            cancellingId={cancellingId}
                            onCancel={handleCancel}
                            dimmed
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
    </section>
  );
}

function AppointmentCard({
  appt,
  idx,
  cancellingId,
  onCancel,
  dimmed = false,
}: {
  appt: Appointment;
  idx: number;
  cancellingId: bigint | null;
  onCancel: (appt: Appointment) => Promise<void>;
  dimmed?: boolean;
}) {
  const isCancelling = cancellingId === appt.id;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: dimmed ? 0.55 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: idx * 0.05, duration: 0.3 }}
      className="bg-charcoal-card border border-charcoal-border rounded-xl p-5 flex flex-col gap-3 hover:border-gold/30 transition-colors"
      data-ocid={`reservas.card.${idx + 1}`}
    >
      {/* Service name + status */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Scissors className="w-3.5 h-3.5 text-gold flex-shrink-0" />
          <p className="font-semibold text-foreground text-sm leading-tight truncate">
            {appt.serviceName}
          </p>
        </div>
        <StatusBadge status={appt.status} />
      </div>

      {/* Date */}
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <Calendar className="w-3.5 h-3.5 text-gold flex-shrink-0" />
        <span>{formatDateDisplay(appt.date)}</span>
      </div>

      {/* Time */}
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <svg
          className="w-3.5 h-3.5 text-gold flex-shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span>{formatDisplay12h(appt.time)}</span>
      </div>

      {/* Cancel button */}
      {canCancel(appt.status) && (
        <div className="mt-1 pt-3 border-t border-charcoal-border">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isCancelling}
                className="w-full text-red-400/70 hover:text-red-400 hover:bg-red-400/10 text-xs uppercase tracking-wider h-8 gap-1.5"
                data-ocid={`reservas.cancel_btn.${idx + 1}`}
              >
                {isCancelling ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <X className="w-3.5 h-3.5" />
                )}
                {isCancelling ? "Cancelando..." : "Cancelar reserva"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-charcoal-card border-charcoal-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-foreground font-display">
                  ¿Cancelar esta reserva?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  Se cancelará tu cita de{" "}
                  <span className="text-foreground font-medium">
                    {appt.serviceName}
                  </span>{" "}
                  el{" "}
                  <span className="text-foreground font-medium">
                    {formatDateDisplay(appt.date)}
                  </span>{" "}
                  a las{" "}
                  <span className="text-foreground font-medium">
                    {formatDisplay12h(appt.time)}
                  </span>
                  . Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  className="bg-transparent border-charcoal-border text-muted-foreground hover:text-foreground"
                  data-ocid={`reservas.cancel_btn.${idx + 1}`}
                >
                  Mantener reserva
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                  onClick={() => onCancel(appt)}
                  data-ocid="reservas.confirm_button"
                >
                  Sí, cancelar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </motion.div>
  );
}
