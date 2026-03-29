import type { Appointment, Barber, Service } from "@/backend.d";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useActor } from "@/hooks/useActor";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Loader2,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const SESSION_KEY = "barberia_session";
const APPOINTMENTS_KEY = "barberia_appointments";

function formatDisplay12h(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${suffix}`;
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return "";
  const [y, mo, d] = dateStr.split("-").map(Number);
  const months = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  return `${d} ${months[mo - 1]} ${y}`;
}

function getStoredSession(): {
  name: string;
  email: string;
  phone: string;
} | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveAppointmentLocal(appt: Appointment) {
  try {
    const raw = localStorage.getItem(APPOINTMENTS_KEY);
    const list: Appointment[] = raw ? JSON.parse(raw) : [];
    list.unshift(appt);
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

function generateSlots(startTime: string, endTime: string): string[] {
  const slots: string[] = [];
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh] = endTime.split(":").map(Number);
  let h = sh;
  let m = sm || 0;
  while (h < eh) {
    slots.push(
      `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`,
    );
    m += 60;
    if (m >= 60) {
      h += Math.floor(m / 60);
      m = m % 60;
    }
  }
  return slots;
}

const DEFAULT_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
];

type Step = "date" | "barber" | "time" | "confirm" | "success";

interface BookingModalProps {
  service: Service | null;
  open: boolean;
  onClose: () => void;
  onBooked?: () => void;
}

export function BookingModal({
  service,
  open,
  onClose,
  onBooked,
}: BookingModalProps) {
  const { actor: _actorRaw } = useActor();
  const actor = _actorRaw as any;
  const [step, setStep] = useState<Step>("date");
  const [date, setDate] = useState("");
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loadingBarbers, setLoadingBarbers] = useState(false);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);

  const session = getStoredSession();
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!open) {
      setStep("date");
      setDate("");
      setSelectedBarber(null);
      setSelectedTime("");
      setAvailability({});
      setError("");
      setSubmitting(false);
    }
  }, [open]);

  // Load barbers and blocked dates on open
  useEffect(() => {
    if (!open || !actor) return;
    setLoadingBarbers(true);
    Promise.all([
      actor.getBarbers().catch(() => [] as Barber[]),
      actor.getBusinessConfig().catch(() => null),
    ])
      .then(([bs, cfg]) => {
        setBarbers(bs.filter((b: Barber) => b.active));
        if (cfg) setBlockedDates(cfg.blockedDates);
      })
      .finally(() => setLoadingBarbers(false));
  }, [open, actor]);

  function handleDateNext() {
    if (!date) return;
    if (blockedDates.includes(date)) {
      setError("Este día está bloqueado. Por favor elige otra fecha.");
      return;
    }
    setError("");
    setStep("barber");
  }

  async function handleBarberSelect(barber: Barber) {
    setSelectedBarber(barber);
    setStep("time");
    await checkAvailabilityForBarber(date, barber);
  }

  async function checkAvailabilityForBarber(d: string, barber: Barber) {
    if (!actor) return;
    setLoadingSlots(true);
    setAvailability({});
    const slots = generateSlots(barber.startTime, barber.endTime);
    const effectiveSlots = slots.length > 0 ? slots : DEFAULT_SLOTS;
    try {
      const results = await Promise.all(
        effectiveSlots.map((t) =>
          actor.checkSlotAvailableForBarber(d, t, barber.id),
        ),
      );
      const map: Record<string, boolean> = {};
      effectiveSlots.forEach((t, i) => {
        map[t] = results[i];
      });
      setAvailability(map);
    } catch {
      setError("No se pudo verificar disponibilidad. Intenta de nuevo.");
    } finally {
      setLoadingSlots(false);
    }
  }

  function handleTimeSelect(t: string) {
    if (availability[t] === false) return;
    setSelectedTime(t);
    setStep("confirm");
  }

  async function handleConfirm() {
    if (!actor || !service || !session || !selectedBarber) return;
    setSubmitting(true);
    setError("");
    try {
      const result = await actor.createAppointment(
        service.id,
        service.name,
        session.name,
        date,
        selectedTime,
        selectedBarber.id,
        selectedBarber.name,
      );
      if (result.__kind__ === "ok") {
        saveAppointmentLocal(result.ok);
        onBooked?.();
        setStep("success");
      } else {
        setError(result.err || "Error al crear la reserva");
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  const displayPrice = service ? `$${Number(service.priceAmount)}` : "";
  const timeSlots = selectedBarber
    ? generateSlots(selectedBarber.startTime, selectedBarber.endTime).length > 0
      ? generateSlots(selectedBarber.startTime, selectedBarber.endTime)
      : DEFAULT_SLOTS
    : DEFAULT_SLOTS;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="bg-charcoal-card border border-charcoal-border text-foreground max-w-md w-full"
        data-ocid="booking.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-gold">
            Reservar Cita
          </DialogTitle>
          {service && (
            <div className="flex items-center justify-between mt-2 bg-charcoal-panel border border-charcoal-border rounded px-4 py-3">
              <span className="text-foreground font-medium text-sm">
                {service.name}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {Number(service.durationMinutes)} min
                </span>
                <span className="text-gold font-display font-bold text-lg">
                  {displayPrice}
                </span>
              </div>
            </div>
          )}
        </DialogHeader>

        {/* Not logged in */}
        {!session ? (
          <div
            className="flex flex-col items-center gap-4 py-8 text-center"
            data-ocid="booking.error_state"
          >
            <AlertCircle className="w-10 h-10 text-gold" />
            <p className="text-foreground font-medium">
              Inicia sesión para reservar
            </p>
            <p className="text-muted-foreground text-sm">
              Necesitas una cuenta para agendar tu cita.
            </p>
            <Button
              className="bg-gold text-charcoal hover:bg-gold-light font-semibold uppercase tracking-wider"
              onClick={() => {
                onClose();
                document
                  .getElementById("cuenta")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              data-ocid="booking.primary_button"
            >
              Ir a Mi Cuenta
            </Button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* Step: success */}
            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4 py-8 text-center"
                data-ocid="booking.success_state"
              >
                <div className="w-16 h-16 rounded-full bg-gold/20 border-2 border-gold flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-gold" />
                </div>
                <p className="font-display text-xl text-gold">
                  ¡Reserva confirmada!
                </p>
                <div className="bg-charcoal-panel border border-charcoal-border rounded-lg px-5 py-4 text-left w-full space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <span className="text-foreground font-medium">
                      {service?.name}
                    </span>
                  </p>
                  {selectedBarber && (
                    <p className="text-sm text-muted-foreground">
                      ✂️ {selectedBarber.name}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    📅 {formatDateDisplay(date)} ·{" "}
                    {formatDisplay12h(selectedTime)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    👤 {session.name}
                  </p>
                </div>
                <Button
                  className="bg-gold text-charcoal hover:bg-gold-light font-semibold uppercase tracking-wider mt-2"
                  onClick={onClose}
                  data-ocid="booking.close_button"
                >
                  Cerrar
                </Button>
              </motion.div>
            )}

            {/* Step: date */}
            {step === "date" && (
              <motion.div
                key="date"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-4 mt-2"
              >
                <div className="flex items-center gap-2 text-gold text-sm uppercase tracking-widest font-medium">
                  <Calendar className="w-4 h-4" />
                  Selecciona la Fecha
                </div>
                <input
                  type="date"
                  value={date}
                  min={today}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setError("");
                  }}
                  className="w-full bg-charcoal-panel border border-charcoal-border rounded-md px-4 py-3 text-foreground focus:outline-none focus:border-gold transition-colors [color-scheme:dark] text-base"
                  data-ocid="booking.input"
                />
                {error && (
                  <div
                    className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded px-3 py-2"
                    data-ocid="booking.error_state"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}
                <div className="flex gap-3 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-charcoal-border text-muted-foreground hover:text-foreground hover:bg-charcoal-panel"
                    onClick={onClose}
                    data-ocid="booking.cancel_button"
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1 bg-gold text-charcoal hover:bg-gold-light font-semibold uppercase tracking-wider"
                    disabled={!date}
                    onClick={handleDateNext}
                    data-ocid="booking.primary_button"
                  >
                    Elegir Barbero
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step: barber */}
            {step === "barber" && (
              <motion.div
                key="barber"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-4 mt-2"
              >
                <div className="flex items-center gap-2 text-gold text-sm uppercase tracking-widest font-medium">
                  <User className="w-4 h-4" />
                  Selecciona el Barbero
                </div>
                {loadingBarbers ? (
                  <div
                    className="flex items-center justify-center py-8"
                    data-ocid="booking.loading_state"
                  >
                    <Loader2 className="w-6 h-6 animate-spin text-gold" />
                  </div>
                ) : barbers.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    No hay barberos disponibles para esta fecha.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {barbers.map((b) => {
                      const dateDay = new Date(`${date}T12:00:00`).getDay();
                      const worksToday = b.workDays
                        .map(Number)
                        .includes(dateDay);
                      return (
                        <button
                          key={String(b.id)}
                          type="button"
                          disabled={!worksToday}
                          onClick={() => handleBarberSelect(b)}
                          className={[
                            "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all text-center",
                            worksToday
                              ? "bg-charcoal-panel border-charcoal-border hover:border-gold hover:text-gold cursor-pointer"
                              : "bg-charcoal-panel/30 border-charcoal-border/30 text-muted-foreground/40 cursor-not-allowed",
                          ].join(" ")}
                          data-ocid="booking.toggle"
                        >
                          <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
                            <span className="text-gold font-bold font-display">
                              {b.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm font-medium">{b.name}</span>
                          {!worksToday && (
                            <span className="text-xs text-muted-foreground/40">
                              No disponible
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {b.startTime}–{b.endTime}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="border-charcoal-border text-muted-foreground hover:text-foreground hover:bg-charcoal-panel"
                  onClick={() => setStep("date")}
                  data-ocid="booking.cancel_button"
                >
                  ← Cambiar Fecha
                </Button>
              </motion.div>
            )}

            {/* Step: time */}
            {step === "time" && (
              <motion.div
                key="time"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-4 mt-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gold text-sm uppercase tracking-widest font-medium">
                    <Clock className="w-4 h-4" />
                    Selecciona la Hora
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {formatDateDisplay(date)}
                  </span>
                </div>
                {selectedBarber && (
                  <div className="flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-lg px-3 py-2">
                    <span className="text-gold text-xs">✂️</span>
                    <span className="text-foreground text-sm font-medium">
                      {selectedBarber.name}
                    </span>
                  </div>
                )}
                {loadingSlots ? (
                  <div
                    className="flex flex-col items-center gap-3 py-8"
                    data-ocid="booking.loading_state"
                  >
                    <Loader2 className="w-7 h-7 animate-spin text-gold" />
                    <p className="text-muted-foreground text-sm">
                      Verificando disponibilidad...
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {timeSlots.map((t) => {
                      const available = availability[t] !== false;
                      const noData = availability[t] === undefined;
                      return (
                        <button
                          key={t}
                          type="button"
                          disabled={!available || noData}
                          onClick={() => handleTimeSelect(t)}
                          className={[
                            "rounded-md px-2 py-3 text-xs font-semibold transition-all border",
                            available && !noData
                              ? "bg-charcoal-panel border-charcoal-border text-foreground hover:border-gold hover:text-gold cursor-pointer"
                              : "bg-charcoal-panel/40 border-charcoal-border/40 text-muted-foreground/40 cursor-not-allowed line-through",
                          ].join(" ")}
                          data-ocid="booking.toggle"
                        >
                          {formatDisplay12h(t)}
                        </button>
                      );
                    })}
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="border-charcoal-border text-muted-foreground hover:text-foreground hover:bg-charcoal-panel"
                  onClick={() => setStep("barber")}
                  data-ocid="booking.cancel_button"
                >
                  ← Cambiar Barbero
                </Button>
              </motion.div>
            )}

            {/* Step: confirm */}
            {step === "confirm" && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-4 mt-2"
              >
                <p className="text-gold text-sm uppercase tracking-widest font-medium">
                  Confirmar Reserva
                </p>
                <div className="bg-charcoal-panel border border-charcoal-border rounded-lg p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground text-xs uppercase tracking-wider">
                      Servicio
                    </span>
                    <span className="text-foreground font-medium text-sm text-right">
                      {service?.name}
                    </span>
                  </div>
                  <div className="h-px bg-charcoal-border" />
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground text-xs uppercase tracking-wider">
                      Barbero
                    </span>
                    <span className="text-foreground text-sm">
                      {selectedBarber?.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground text-xs uppercase tracking-wider">
                      Fecha
                    </span>
                    <span className="text-foreground text-sm">
                      {formatDateDisplay(date)}
                    </span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground text-xs uppercase tracking-wider">
                      Hora
                    </span>
                    <span className="text-foreground text-sm">
                      {formatDisplay12h(selectedTime)}
                    </span>
                  </div>
                  <div className="h-px bg-charcoal-border" />
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground text-xs uppercase tracking-wider">
                      Cliente
                    </span>
                    <span className="text-foreground text-sm">
                      {session.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground text-xs uppercase tracking-wider">
                      Precio
                    </span>
                    <span className="text-gold font-display font-bold text-lg">
                      {displayPrice}
                    </span>
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded px-3 py-2"
                      data-ocid="booking.error_state"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-charcoal-border text-muted-foreground hover:text-foreground hover:bg-charcoal-panel"
                    onClick={() => {
                      setStep("time");
                      setError("");
                    }}
                    disabled={submitting}
                    data-ocid="booking.cancel_button"
                  >
                    Atrás
                  </Button>
                  <Button
                    className="flex-1 bg-gold text-charcoal hover:bg-gold-light font-semibold uppercase tracking-wider"
                    onClick={handleConfirm}
                    disabled={submitting}
                    data-ocid="booking.confirm_button"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Reservando...
                      </>
                    ) : (
                      "Confirmar Reserva"
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </DialogContent>
    </Dialog>
  );
}
