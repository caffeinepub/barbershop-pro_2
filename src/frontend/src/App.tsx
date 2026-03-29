import type { Appointment, Service } from "@/backend.d";
import { AdminPanel } from "@/components/AdminPanel";
import { BookingModal } from "@/components/BookingModal";
import { MyAppointmentsScreen } from "@/components/MyAppointmentsScreen";
import { ServicesScreen } from "@/components/ServicesScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActor } from "@/hooks/useActor";
import {
  CheckCircle,
  Clock,
  Facebook,
  Instagram,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Phone,
  Scissors,
  Star,
  Twitter,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

// ── Admin credentials ──────────────────────────────────────────────────────────
const ADMIN_EMAIL = "admin@labarberia.com";
const ADMIN_PASSWORD = "Admin2024!";

// ── Types ──────────────────────────────────────────────────────────────────────
interface UserData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface Session {
  name: string;
  email: string;
  phone: string;
  isAdmin?: boolean;
}

// ── LocalStorage helpers ───────────────────────────────────────────────────────
const USERS_KEY = "barberia_users";
const SESSION_KEY = "barberia_session";
const APPOINTMENTS_KEY = "barberia_appointments";

function getUsers(): UserData[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveUsers(users: UserData[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(session: Session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function getLocalAppointments(): Appointment[] {
  try {
    const raw = localStorage.getItem(APPOINTMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalAppointments(appts: Appointment[]) {
  localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(appts));
}

// ── Validation helpers ─────────────────────────────────────────────────────────
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── Data ───────────────────────────────────────────────────────────────────────
const highlights = [
  {
    icon: <Scissors className="w-6 h-6" />,
    title: "Maestros Barberos",
    desc: "Más de 10 años de experiencia en el arte del corte y arreglo",
  },
  {
    icon: <Star className="w-6 h-6" />,
    title: "Productos Premium",
    desc: "Utilizamos las mejores marcas internacionales para tu cuidado",
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: "Sin Esperas",
    desc: "Reserva tu turno en línea y llega a tu hora exacta",
  },
];

const stats = [
  { num: "14+", label: "Años de experiencia" },
  { num: "8K+", label: "Clientes satisfechos" },
  { num: "5★", label: "Calificación promedio" },
];

const footerServiceNames = [
  "Corte Clásico",
  "Corte + Barba",
  "Arreglo de Barba",
  "Afeitado Tradicional",
  "Tratamiento Capilar",
];

const footerLinks = ["Inicio", "Servicios", "Galería", "Nosotros", "Reservar"];

// ── Auth Panel ─────────────────────────────────────────────────────────────────
function AuthPanel({
  session,
  onLogin,
  onLogout,
  onReservar,
}: {
  session: Session | null;
  onLogin: (s: Session) => void;
  onLogout: () => void;
  onReservar: () => void;
}) {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState(false);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError("Por favor completa todos los campos");
      return;
    }
    if (!isValidEmail(loginEmail)) {
      setLoginError("Ingresa un correo electrónico válido");
      return;
    }

    const users = getUsers();
    const found = users.find(
      (u) => u.email === loginEmail && u.password === loginPassword,
    );
    if (!found) {
      setLoginError("Correo o contraseña incorrectos");
      return;
    }

    const isAdminUser =
      loginEmail === ADMIN_EMAIL && loginPassword === ADMIN_PASSWORD;

    const s: Session = {
      name: found.name,
      email: found.email,
      phone: found.phone,
      isAdmin: isAdminUser,
    };
    saveSession(s);
    onLogin(s);
  }

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegError("");
    setRegSuccess(false);

    if (
      !regName.trim() ||
      !regEmail.trim() ||
      !regPhone.trim() ||
      !regPassword.trim() ||
      !regConfirm.trim()
    ) {
      setRegError("Por favor completa todos los campos");
      return;
    }
    if (!isValidEmail(regEmail)) {
      setRegError("Ingresa un correo electrónico válido");
      return;
    }
    if (regPassword.length < 6) {
      setRegError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (regPassword !== regConfirm) {
      setRegError("Las contraseñas no coinciden");
      return;
    }

    const users = getUsers();
    if (users.find((u) => u.email === regEmail)) {
      setRegError("Este correo ya está registrado");
      return;
    }

    const newUser: UserData = {
      name: regName,
      email: regEmail,
      phone: regPhone,
      password: regPassword,
    };
    saveUsers([...users, newUser]);

    const s: Session = { name: regName, email: regEmail, phone: regPhone };
    saveSession(s);
    setRegSuccess(true);
    setTimeout(() => onLogin(s), 1000);
  }

  if (session) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-charcoal-card border border-charcoal-border rounded-lg p-8"
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gold/20 border-2 border-gold flex items-center justify-center">
            <User className="w-8 h-8 text-gold" />
          </div>
          <div>
            <p className="text-muted-foreground text-sm uppercase tracking-widest mb-1">
              Bienvenido de vuelta
            </p>
            <h3 className="font-display text-2xl text-gold">{session.name}</h3>
            <p className="text-muted-foreground text-sm mt-1">
              {session.email}
            </p>
          </div>
          <div className="w-full border-t border-charcoal-border pt-4">
            <p className="text-muted-foreground text-sm mb-4">
              ¿Listo para tu próxima visita?
            </p>
            <Button
              className="w-full bg-gold text-charcoal hover:bg-gold-light font-semibold tracking-wider uppercase mb-3"
              onClick={onReservar}
              data-ocid="booking.primary_button"
            >
              RESERVAR TURNO
            </Button>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground hover:text-foreground flex items-center gap-2"
              onClick={onLogout}
              data-ocid="auth.button"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div
      className="bg-charcoal-card border border-charcoal-border rounded-lg overflow-hidden"
      data-ocid="auth.panel"
    >
      <Tabs defaultValue="login">
        <TabsList className="w-full grid grid-cols-2 bg-charcoal-panel rounded-none border-b border-charcoal-border h-12">
          <TabsTrigger
            value="login"
            className="uppercase tracking-widest text-xs font-semibold rounded-none data-[state=active]:bg-transparent data-[state=active]:text-gold data-[state=active]:border-b-2 data-[state=active]:border-gold"
            data-ocid="auth.tab"
          >
            Iniciar Sesión
          </TabsTrigger>
          <TabsTrigger
            value="register"
            className="uppercase tracking-widest text-xs font-semibold rounded-none data-[state=active]:bg-transparent data-[state=active]:text-gold data-[state=active]:border-b-2 data-[state=active]:border-gold"
            data-ocid="auth.tab"
          >
            Registrarse
          </TabsTrigger>
        </TabsList>

        {/* LOGIN */}
        <TabsContent value="login" className="p-6 mt-0">
          <form
            onSubmit={handleLogin}
            className="flex flex-col gap-4"
            data-ocid="login.panel"
          >
            <div>
              <p className="font-display text-xl text-gold mb-1">
                Iniciar Sesión
              </p>
              <p className="text-muted-foreground text-sm">
                Accede a tu cuenta para reservar
              </p>
            </div>

            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                Correo electrónico
              </Label>
              <Input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="bg-charcoal-panel border-charcoal-border focus:border-gold text-foreground placeholder:text-muted-foreground"
                data-ocid="login.input"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                Contraseña
              </Label>
              <Input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-charcoal-panel border-charcoal-border focus:border-gold text-foreground placeholder:text-muted-foreground"
                data-ocid="login.input"
              />
            </div>

            <button
              type="button"
              className="text-gold text-xs text-left hover:underline"
              data-ocid="login.link"
            >
              ¿Olvidé mi contraseña?
            </button>

            <AnimatePresence>
              {loginError && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded px-3 py-2"
                  data-ocid="login.error_state"
                >
                  {loginError}
                </motion.p>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              className="bg-gold text-charcoal hover:bg-gold-light font-semibold tracking-wider uppercase"
              data-ocid="login.submit_button"
            >
              INICIAR SESIÓN
            </Button>
          </form>
        </TabsContent>

        {/* REGISTER */}
        <TabsContent value="register" className="p-6 mt-0">
          <form
            onSubmit={handleRegister}
            className="flex flex-col gap-4"
            data-ocid="register.panel"
          >
            <div>
              <p className="font-display text-xl text-gold mb-1">
                Crear Cuenta
              </p>
              <p className="text-muted-foreground text-sm">
                Únete y reserva con facilidad
              </p>
            </div>

            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                Nombre completo
              </Label>
              <Input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Carlos García"
                className="bg-charcoal-panel border-charcoal-border focus:border-gold text-foreground placeholder:text-muted-foreground"
                data-ocid="register.input"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                Correo electrónico
              </Label>
              <Input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="bg-charcoal-panel border-charcoal-border focus:border-gold text-foreground placeholder:text-muted-foreground"
                data-ocid="register.input"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                Teléfono
              </Label>
              <Input
                type="tel"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="+52 55 1234 5678"
                className="bg-charcoal-panel border-charcoal-border focus:border-gold text-foreground placeholder:text-muted-foreground"
                data-ocid="register.input"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                Contraseña
              </Label>
              <Input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="bg-charcoal-panel border-charcoal-border focus:border-gold text-foreground placeholder:text-muted-foreground"
                data-ocid="register.input"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                Confirmar contraseña
              </Label>
              <Input
                type="password"
                value={regConfirm}
                onChange={(e) => setRegConfirm(e.target.value)}
                placeholder="Repite tu contraseña"
                className="bg-charcoal-panel border-charcoal-border focus:border-gold text-foreground placeholder:text-muted-foreground"
                data-ocid="register.input"
              />
            </div>

            <AnimatePresence>
              {regError && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded px-3 py-2"
                  data-ocid="register.error_state"
                >
                  {regError}
                </motion.p>
              )}
              {regSuccess && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="flex items-center gap-2 text-sm text-green-400 bg-green-400/10 border border-green-400/20 rounded px-3 py-2"
                  data-ocid="register.success_state"
                >
                  <CheckCircle className="w-4 h-4" />
                  ¡Registro exitoso! Bienvenido...
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              className="bg-gold text-charcoal hover:bg-gold-light font-semibold tracking-wider uppercase"
              data-ocid="register.submit_button"
            >
              REGISTRARSE
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────────
export default function App() {
  const { actor } = useActor();
  const [session, setSession] = useState<Session | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bookingService, setBookingService] = useState<Service | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState<"main" | "admin">("main");

  // Pre-seed/update admin user on mount (always ensure correct credentials)
  useEffect(() => {
    const users = getUsers();
    const withoutAdmin = users.filter((u) => u.email !== ADMIN_EMAIL);
    saveUsers([
      ...withoutAdmin,
      {
        name: "Administrador",
        email: ADMIN_EMAIL,
        phone: "+52 55 0000 0000",
        password: ADMIN_PASSWORD,
      },
    ]);
  }, []);

  // Restore session + appointments from localStorage on mount
  useEffect(() => {
    const s = getSession();
    if (s) {
      setSession(s);
      if (s.isAdmin) setIsAdmin(true);
    }
    setAppointments(getLocalAppointments());
  }, []);

  // Sync appointments from backend when actor is ready and user is logged in
  useEffect(() => {
    if (!actor || !session) return;
    setAppointmentsLoading(true);
    actor
      .getMyAppointments()
      .then((appts) => {
        const typed = appts as unknown as import("@/backend.d").Appointment[];
        saveLocalAppointments(typed);
        setAppointments(typed);
      })
      .catch(() => {
        // Fall back to local cache silently
      })
      .finally(() => setAppointmentsLoading(false));
  }, [actor, session]);

  // Check admin status when actor is ready (for Internet Identity-based admin)
  useEffect(() => {
    if (!actor) return;
    actor
      .isCallerAdmin()
      .then((adminResult) => {
        if (adminResult) setIsAdmin(true);
      })
      .catch(() => {});
  }, [actor]);

  function handleLogin(s: Session) {
    setSession(s);
    if (s.isAdmin) {
      setIsAdmin(true);
      setView("admin");
    }
  }

  function handleLogout() {
    clearSession();
    setSession(null);
    setAppointments([]);
    setIsAdmin(false);
    setView("main");
  }

  function handleReservar(service?: Service) {
    if (service) setBookingService(service);
    setBookingOpen(true);
  }

  function handleBooked() {
    setAppointments(getLocalAppointments());
    setTimeout(() => {
      if (!actor) return;
      actor
        .getMyAppointments()
        .then((appts) => {
          const typed = appts as unknown as import("@/backend.d").Appointment[];
          saveLocalAppointments(typed);
          setAppointments(typed);
        })
        .catch(() => {});
    }, 1500);
  }

  function handleAppointmentsChange(appts: Appointment[]) {
    saveLocalAppointments(appts);
    setAppointments(appts);
    // Also re-sync from backend after a moment
    setTimeout(() => {
      if (!actor) return;
      actor
        .getMyAppointments()
        .then((fresh) => {
          const typed = fresh as unknown as import("@/backend.d").Appointment[];
          saveLocalAppointments(typed);
          setAppointments(typed);
        })
        .catch(() => {});
    }, 1000);
  }

  const navLinks = [
    { label: "Inicio", href: "#inicio" },
    { label: "Servicios", href: "#servicios" },
    { label: "Galería", href: "#galeria" },
    { label: "Nosotros", href: "#nosotros" },
    { label: "Mi Cuenta", href: "#cuenta" },
  ];

  const socialLinks = [
    {
      href: "https://instagram.com",
      label: "Instagram",
      icon: <Instagram className="w-5 h-5" />,
    },
    {
      href: "https://facebook.com",
      label: "Facebook",
      icon: <Facebook className="w-5 h-5" />,
    },
    {
      href: "https://twitter.com",
      label: "Twitter",
      icon: <Twitter className="w-5 h-5" />,
    },
  ];

  if (view === "admin") {
    return (
      <div className="min-h-screen bg-background">
        <Toaster richColors position="top-right" />
        <AnimatePresence mode="wait">
          <AdminPanel actor={actor as any} onBack={() => setView("main")} />
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-right" />

      {/* ── Booking Modal ── */}
      <BookingModal
        service={bookingService}
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        onBooked={handleBooked}
      />

      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-charcoal/95 backdrop-blur-sm border-b border-charcoal-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a
            href="#inicio"
            className="flex items-center gap-3"
            data-ocid="nav.link"
          >
            <img
              src="/assets/generated/barberia-logo-transparent.dim_120x120.png"
              alt="La Barbería"
              className="w-8 h-8 object-contain"
            />
            <span className="font-display text-lg font-bold text-gold tracking-widest uppercase">
              La Barbería
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-gold transition-colors text-xs uppercase tracking-widest font-medium"
                data-ocid="nav.link"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {session && (
              <span className="text-xs text-muted-foreground">
                Hola,{" "}
                <span className="text-gold">{session.name.split(" ")[0]}</span>
              </span>
            )}
            {isAdmin && (
              <Button
                size="sm"
                variant="outline"
                className="border-gold/50 text-gold hover:bg-gold/10 font-semibold tracking-widest uppercase text-xs px-4 flex items-center gap-1.5"
                onClick={() => setView("admin")}
                data-ocid="nav.admin_button"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Panel Admin
              </Button>
            )}
            <Button
              size="sm"
              className="bg-gold text-charcoal hover:bg-gold-light font-semibold tracking-widest uppercase text-xs px-5"
              onClick={() => handleReservar()}
              data-ocid="nav.primary_button"
            >
              RESERVAR
            </Button>
          </div>

          <button
            type="button"
            className="md:hidden text-foreground"
            onClick={() => setMenuOpen(!menuOpen)}
            data-ocid="nav.toggle"
          >
            {menuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-charcoal-card border-t border-charcoal-border"
            >
              <div className="px-4 py-4 flex flex-col gap-3">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-muted-foreground hover:text-gold text-sm uppercase tracking-widest py-2 border-b border-charcoal-border last:border-0"
                    onClick={() => setMenuOpen(false)}
                    data-ocid="nav.link"
                  >
                    {link.label}
                  </a>
                ))}
                {isAdmin && (
                  <Button
                    variant="outline"
                    className="border-gold/50 text-gold hover:bg-gold/10 font-semibold tracking-wider uppercase mt-1 flex items-center gap-2"
                    onClick={() => {
                      setMenuOpen(false);
                      setView("admin");
                    }}
                    data-ocid="nav.admin_button"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Panel Admin
                  </Button>
                )}
                <Button
                  className="bg-gold text-charcoal hover:bg-gold-light font-semibold tracking-wider uppercase mt-2"
                  onClick={() => handleReservar()}
                  data-ocid="nav.primary_button"
                >
                  RESERVAR
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Hero ── */}
      <section
        id="inicio"
        className="relative h-[85vh] min-h-[560px] flex items-center pt-16"
        style={{
          backgroundImage:
            "url('/assets/generated/hero-barbershop.dim_1400x800.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/90 via-charcoal/70 to-charcoal/30" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-xl"
          >
            <p className="text-gold text-xs uppercase tracking-[0.3em] font-medium mb-4">
              Desde 2010 · Ciudad de México
            </p>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-none mb-6">
              El Arte del
              <span className="block text-gold">Caballero</span>
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-8 max-w-md">
              Donde cada visita es una experiencia de lujo. Cortes de precisión,
              barba impecable y el ambiente que mereces.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                className="bg-gold text-charcoal hover:bg-gold-light font-semibold tracking-widest uppercase px-8 py-6 text-sm"
                onClick={() => handleReservar()}
                data-ocid="hero.primary_button"
              >
                RESERVAR EN LÍNEA
              </Button>
              <Button
                variant="outline"
                className="border-foreground/30 text-foreground hover:bg-foreground/10 tracking-widest uppercase px-8 py-6 text-sm"
                onClick={() => {
                  document
                    .getElementById("servicios")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                data-ocid="hero.secondary_button"
              >
                VER SERVICIOS
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Highlight Cards ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 -mt-16">
          {highlights.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.15, duration: 0.6 }}
              className="bg-charcoal-card border border-charcoal-border rounded-lg p-6 flex items-start gap-4 shadow-xl"
            >
              <div className="text-gold mt-1 flex-shrink-0">{item.icon}</div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Services Section ── */}
      <section id="servicios" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="mb-10">
          <p className="text-gold text-xs uppercase tracking-[0.3em] font-medium mb-2">
            Lo que ofrecemos
          </p>
          <h2 className="font-display text-4xl font-bold text-foreground">
            Servicios & Precios
          </h2>
        </div>
        <ServicesScreen onReservar={handleReservar} />
      </section>

      {/* ── Gallery Banner ── */}
      <section
        id="galeria"
        className="relative py-24 overflow-hidden"
        style={{
          backgroundImage:
            "url('/assets/generated/hero-barbershop.dim_1400x800.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-charcoal/75" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-gold text-xs uppercase tracking-[0.3em] font-medium mb-3">
            Nuestro trabajo
          </p>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Resultado que Habla
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
            Cada corte es una obra de arte. Visita nuestro local y descúbrelo
            por ti mismo.
          </p>
          <Button
            className="bg-gold text-charcoal hover:bg-gold-light font-semibold tracking-widest uppercase px-10 py-6"
            data-ocid="gallery.primary_button"
          >
            VER GALERÍA
          </Button>
        </div>
      </section>

      {/* ── About ── */}
      <section id="nosotros" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-gold text-xs uppercase tracking-[0.3em] font-medium mb-2">
              Nuestra historia
            </p>
            <h2 className="font-display text-4xl font-bold text-foreground mb-6">
              Tradición y Modernidad
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Fundada en 2010, La Barbería nació con una visión: combinar las
              técnicas clásicas del barbero tradicional con las tendencias
              contemporáneas del grooming masculino.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Nuestro equipo de maestros barberos cuenta con más de 10 años de
              experiencia, capacitados en técnicas internacionales y
              comprometidos con la excelencia en cada corte.
            </p>
            <div className="grid grid-cols-3 gap-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="text-center p-4 bg-charcoal-card border border-charcoal-border rounded-lg"
                >
                  <p className="font-display text-2xl font-bold text-gold">
                    {stat.num}
                  </p>
                  <p className="text-muted-foreground text-xs mt-1 leading-tight">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/5] overflow-hidden rounded-lg">
              <img
                src="/assets/generated/hero-barbershop.dim_1400x800.jpg"
                alt="Nuestro local"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 bg-gold text-charcoal p-5 rounded-lg shadow-gold">
              <p className="font-display text-3xl font-bold">2010</p>
              <p className="text-xs uppercase tracking-wider font-medium">
                Fundada
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Account Section ── */}
      <section
        id="cuenta"
        className="bg-charcoal-card border-y border-charcoal-border py-20"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-gold text-xs uppercase tracking-[0.3em] font-medium mb-2">
                Tu cuenta
              </p>
              <h2 className="font-display text-4xl font-bold text-foreground mb-4">
                {session ? "Bienvenido" : "Accede o Regístrate"}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Crea tu cuenta para gestionar tus reservas, ver el historial de
                visitas y recibir ofertas exclusivas para clientes frecuentes.
              </p>
              <div className="flex items-start gap-4 p-5 bg-charcoal-panel border border-charcoal-border rounded-lg">
                <Clock className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-foreground font-medium text-sm mb-1">
                    Horarios de atención
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Lun–Vie 9:00–20:00 · Sáb 9:00–18:00 · Dom Cerrado
                  </p>
                </div>
              </div>
            </div>
            <div id="auth">
              <AuthPanel
                session={session}
                onLogin={handleLogin}
                onLogout={handleLogout}
                onReservar={() => handleReservar()}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Mis Reservas (visible only when logged in) ── */}
      <AnimatePresence>
        {session && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border-b border-charcoal-border"
          >
            <MyAppointmentsScreen
              appointments={appointments}
              loading={appointmentsLoading}
              onReservar={() => handleReservar()}
              actor={actor as any}
              onAppointmentsChange={handleAppointmentsChange}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Footer ── */}
      <footer className="bg-charcoal-card border-t border-charcoal-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img
                  src="/assets/generated/barberia-logo-transparent.dim_120x120.png"
                  alt="La Barbería"
                  className="w-8 h-8 object-contain"
                />
                <span className="font-display text-lg font-bold text-gold tracking-widest uppercase">
                  La Barbería
                </span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                El mejor barbershop de la ciudad. Donde la tradición se
                encuentra con el estilo moderno.
              </p>
              <div className="flex gap-3 mt-4">
                {socialLinks.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-gold transition-colors"
                    aria-label={s.label}
                    data-ocid="social.link"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-foreground font-semibold uppercase tracking-widest text-xs mb-4">
                Navegación
              </h4>
              <ul className="space-y-2">
                {footerLinks.map((link) => (
                  <li key={link}>
                    <a
                      href={`#${link.toLowerCase()}`}
                      className="text-muted-foreground hover:text-gold text-sm transition-colors"
                      data-ocid="footer.link"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-foreground font-semibold uppercase tracking-widest text-xs mb-4">
                Servicios
              </h4>
              <ul className="space-y-2">
                {footerServiceNames.map((name) => (
                  <li key={name}>
                    <span className="text-muted-foreground text-sm">
                      {name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-foreground font-semibold uppercase tracking-widest text-xs mb-4">
                Contacto
              </h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground text-sm">
                    Av. Insurgentes Sur 1234, Col. Del Valle, CDMX
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gold flex-shrink-0" />
                  <a
                    href="tel:+525512345678"
                    className="text-muted-foreground hover:text-gold text-sm transition-colors"
                  >
                    +52 55 1234 5678
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground text-sm">
                    Lun–Vie 9:00–20:00
                    <br />
                    Sáb 9:00–18:00
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-charcoal-border mt-10 pt-6 text-center">
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} La Barbería. Todos los derechos
              reservados. Construido con ❤️ usando{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:underline"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
