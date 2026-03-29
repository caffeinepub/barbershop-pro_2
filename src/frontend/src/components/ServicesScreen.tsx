import type { Service } from "@/backend.d";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useActor } from "@/hooks/useActor";
import { Clock, Scissors } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const CATEGORIES = [
  { label: "Todos", value: "todos" },
  { label: "Corte", value: "corte" },
  { label: "Tinte", value: "tinte" },
  { label: "Peinado", value: "peinado" },
  { label: "Barba", value: "barba" },
  { label: "Tratamiento", value: "tratamiento" },
];

const SKELETON_KEYS = ["sk1", "sk2", "sk3", "sk4", "sk5", "sk6"];

const CATEGORY_COLORS: Record<string, string> = {
  corte: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  tinte: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  peinado: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  barba: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  tratamiento: "bg-green-500/20 text-green-300 border-green-500/30",
};

type DurationFilter = "all" | "under30" | "30to60" | "over60";
type PriceFilter = "all" | "under150" | "150to300" | "over300";

function filterByDuration(minutes: number, filter: DurationFilter): boolean {
  if (filter === "all") return true;
  if (filter === "under30") return minutes <= 30;
  if (filter === "30to60") return minutes > 30 && minutes <= 60;
  return minutes > 60;
}

function filterByPrice(price: number, filter: PriceFilter): boolean {
  if (filter === "all") return true;
  if (filter === "under150") return price <= 150;
  if (filter === "150to300") return price > 150 && price <= 300;
  return price > 300;
}

interface ServicesScreenProps {
  onReservar: (service: Service) => void;
}

export function ServicesScreen({ onReservar }: ServicesScreenProps) {
  const { actor, isFetching } = useActor();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("todos");
  const [duration, setDuration] = useState<DurationFilter>("all");
  const [price, setPrice] = useState<PriceFilter>("all");

  useEffect(() => {
    if (!actor || isFetching) return;
    actor
      .getServices()
      .then((data) =>
        setServices(data as unknown as import("@/backend.d").Service[]),
      )
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [actor, isFetching]);

  const filtered = services.filter((svc) => {
    const catMatch =
      category === "todos" ||
      svc.category.toLowerCase() === category.toLowerCase();
    const durMatch = filterByDuration(Number(svc.durationMinutes), duration);
    const priceMatch = filterByPrice(Number(svc.priceAmount), price);
    return catMatch && durMatch && priceMatch;
  });

  return (
    <div className="w-full">
      {/* Filter Bar */}
      <div className="mb-8 space-y-4">
        {/* Category Chips */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={`px-4 py-1.5 text-xs uppercase tracking-widest font-semibold rounded-full border transition-all duration-200 ${
                category === cat.value
                  ? "bg-gold text-charcoal border-gold"
                  : "bg-transparent text-muted-foreground border-charcoal-border hover:border-gold/50 hover:text-foreground"
              }`}
              data-ocid="services.filter.tab"
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Duration + Price Dropdowns */}
        <div className="flex flex-wrap gap-3">
          <Select
            value={duration}
            onValueChange={(v) => setDuration(v as DurationFilter)}
          >
            <SelectTrigger
              className="w-48 bg-charcoal-panel border-charcoal-border text-foreground text-sm"
              data-ocid="services.select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-charcoal-card border-charcoal-border">
              <SelectItem
                value="all"
                className="text-foreground focus:bg-charcoal-panel focus:text-gold"
              >
                Cualquier duración
              </SelectItem>
              <SelectItem
                value="under30"
                className="text-foreground focus:bg-charcoal-panel focus:text-gold"
              >
                Hasta 30 min
              </SelectItem>
              <SelectItem
                value="30to60"
                className="text-foreground focus:bg-charcoal-panel focus:text-gold"
              >
                31–60 min
              </SelectItem>
              <SelectItem
                value="over60"
                className="text-foreground focus:bg-charcoal-panel focus:text-gold"
              >
                Más de 60 min
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={price}
            onValueChange={(v) => setPrice(v as PriceFilter)}
          >
            <SelectTrigger
              className="w-48 bg-charcoal-panel border-charcoal-border text-foreground text-sm"
              data-ocid="services.select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-charcoal-card border-charcoal-border">
              <SelectItem
                value="all"
                className="text-foreground focus:bg-charcoal-panel focus:text-gold"
              >
                Cualquier precio
              </SelectItem>
              <SelectItem
                value="under150"
                className="text-foreground focus:bg-charcoal-panel focus:text-gold"
              >
                Hasta $150
              </SelectItem>
              <SelectItem
                value="150to300"
                className="text-foreground focus:bg-charcoal-panel focus:text-gold"
              >
                $150 – $300
              </SelectItem>
              <SelectItem
                value="over300"
                className="text-foreground focus:bg-charcoal-panel focus:text-gold"
              >
                Más de $300
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SKELETON_KEYS.map((key) => (
            <div
              key={key}
              className="bg-charcoal-card border border-charcoal-border rounded-lg p-5 space-y-3"
              data-ocid="services.loading_state"
            >
              <Skeleton className="h-4 w-3/4 bg-charcoal-panel" />
              <Skeleton className="h-3 w-1/3 bg-charcoal-panel" />
              <Skeleton className="h-10 w-full bg-charcoal-panel" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-1/4 bg-charcoal-panel" />
                <Skeleton className="h-5 w-1/4 bg-charcoal-panel" />
              </div>
              <Skeleton className="h-9 w-full bg-charcoal-panel" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
          data-ocid="services.empty_state"
        >
          <Scissors className="w-12 h-12 text-charcoal-border mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">
            No hay servicios con esos filtros
          </p>
          <button
            type="button"
            onClick={() => {
              setCategory("todos");
              setDuration("all");
              setPrice("all");
            }}
            className="mt-4 text-gold text-sm hover:underline"
          >
            Limpiar filtros
          </button>
        </motion.div>
      )}

      {/* Service Cards */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {filtered.map((svc, idx) => {
              const catKey = svc.category.toLowerCase();
              const badgeClass =
                CATEGORY_COLORS[catKey] ||
                "bg-muted/20 text-muted-foreground border-muted/30";
              return (
                <motion.div
                  key={String(svc.id)}
                  layout
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05, duration: 0.4 }}
                  className="group bg-charcoal-card border border-charcoal-border rounded-lg p-5 flex flex-col gap-3 hover:border-gold/40 transition-colors duration-300"
                  data-ocid={`services.item.${idx + 1}`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground group-hover:text-gold transition-colors text-base leading-tight">
                      {svc.name}
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${badgeClass}`}
                    >
                      {svc.category}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground text-sm leading-relaxed flex-1">
                    {svc.description}
                  </p>

                  {/* Duration + Price Row */}
                  <div className="flex items-center justify-between pt-1 border-t border-charcoal-border">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{Number(svc.durationMinutes)} min</span>
                    </div>
                    <span className="font-display text-gold font-bold text-xl">
                      ${Number(svc.priceAmount)}
                    </span>
                  </div>

                  {/* CTA */}
                  <Button
                    className="w-full bg-gold text-charcoal hover:bg-gold-light font-semibold uppercase tracking-widest text-xs mt-1"
                    onClick={() => onReservar(svc)}
                    data-ocid="services.primary_button"
                  >
                    Reservar
                  </Button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
