"use client";

import { motion } from "framer-motion";
import { Calendar, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/Reveal";
import { type AgendaEntry, buildMonthlyAgenda } from "@/lib/agenda/monthly";
import type { AgendaEvent } from "@/lib/agenda/schema";
import { useHydratedReducedMotion } from "@/lib/useHydratedReducedMotion";
import { cn } from "@/lib/utils";

/**
 * Sección "Agenda" (fase 06) — componente + datos en un solo archivo
 * (D030). Heading — mismo patrón izquierda/centrado que las secciones
 * anteriores (D032).
 *
 * Revisión (D037): en vez de una lista vertical uniforme (como
 * `AgendaItem`, D014, pensado para un dashboard), esta sección usa un
 * **grid tipo "bento"**: mosaico asimétrico donde cada evento ocupa una
 * celda de distinto tamaño según su naturaleza, no una lista pareja.
 * - El evento puntual más próximo es la celda **"feature"** (2x2, fondo
 *   navy sólido) — la más grande, para el evento especial más cercano.
 * - Los demás eventos puntuales son celdas **"wide"** (2x1, bordeadas) —
 *   más anchas que las recurrentes, pero sin el peso del feature.
 * - El Servicio Dominical (recurrente ancla de la semana) es una celda
 *   **"tall"** (1x2) — más alta que las demás recurrentes.
 * - Oración y Jóvenes (recurrentes secundarias) son celdas **"sm"** (1x1),
 *   compactas y repetidas a lo largo del mes.
 * `grid-auto-flow: dense` hace que el mosaico rellene los huecos en vez
 * de dejar celdas vacías. Pedido explícito del usuario: que la sección
 * se sienta como un calendario dinámico, no una lista estática.
 *
 * Revisión (D039, reemplaza a D038): el hover vuelve a ser el de D037
 * (lift + sombra + borde naranja), sumándole ahora un fondo sutil
 * (`action.hover`, el token estándar de MUI para este propósito) — pero
 * ya NO imita el navy sólido de ningún estado "destacado".
 *
 * Revisión (fase 07, rework de animación expandir/contraer): el enfoque
 * anterior (montar/desmontar tiles con `AnimatePresence` + `layout`) se
 * sentía abrupto — al abrir aparecía de golpe y al cerrar los tiles se
 * desvanecían y luego colapsaba, en vez de sentirse como una sola
 * revelación continua. Ahora la grilla VISIBLE siempre renderiza TODOS los
 * eventos (sin `.slice()`); lo único que anima es la altura de un
 * contenedor `overflow: hidden` que envuelve esa grilla, entre una altura
 * "colapsada" y una "completa" medidas con `ResizeObserver` sobre dos
 * grillas ocultas idénticas (mismo `gridAutoFlow: dense`, para que la
 * altura medida sea exacta y no un cálculo manual). Esto logra el efecto
 * pedido: los tiles "siempre estuvieron ahí" y se van descubriendo (o
 * tapando) a medida que el contenedor crece o se encoge — nunca aparecen
 * ni desaparecen por sí mismos.
 *
 * El "destacado" (fondo navy sólido, texto claro) queda reservado a **un
 * único evento recurrente por mes: el próximo servicio/reunión que toca**
 * — el de fecha más próxima entre los recurrentes (nunca un puntual).
 * Si ese evento es hoy, el tag dice "Hoy"; si el próximo cae más
 * adelante (p. ej. hoy es 6 y no hay servicio ese día, pero sí el 7),
 * el tag dice "Próximo evento". Los eventos puntuales nunca llevan este
 * destacado navy — solo conservan su tag naranja "Evento especial" sobre el
 * fondo bordeado normal, igual que cualquier otra celda.
 *
 * Los eventos llegan por prop desde el home (tabla `agenda_events`, se
 * editan en `/dashboard/agenda`) y `buildMonthlyAgenda`
 * (`lib/agenda/monthly.ts`) los expande al resto del mes:
 * - Recurrentes: servicios semanales, una ocurrencia por cada semana.
 * - Puntuales: eventos especiales de una sola fecha.
 *
 * Ambos se combinan, se ordenan cronológicamente y se recortan a
 * `INITIAL_COUNT`; si hay más, aparece un botón de texto (sin naranja —
 * no es un CTA de alta prioridad, es solo un toggle de expandir/contraer
 * la propia agenda in-place) para ver el resto sin salir de la sección.
 */

const MONTH_ABBR = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
] as const;

const INITIAL_COUNT = 6;

type TileSize = "feature" | "wide" | "tall" | "sm";

/** Asigna el tamaño de celda del mosaico: el puntual más próximo es el
 * "feature" (el más grande), el resto de puntuales son "wide", el
 * Servicio Dominical es "tall", y las demás recurrentes son "sm". */
function assignTileSizes(entries: AgendaEntry[]): Map<string, TileSize> {
  const sizes = new Map<string, TileSize>();
  const firstOneTimeKey = entries.find((e) => e.kind === "oneTime")?.key;

  entries.forEach((entry) => {
    if (entry.kind === "oneTime") {
      sizes.set(entry.key, entry.key === firstOneTimeKey ? "feature" : "wide");
    } else if (entry.weekday === 0) {
      sizes.set(entry.key, "tall");
    } else {
      sizes.set(entry.key, "sm");
    }
  });

  return sizes;
}

/** El "destacado" es un único evento por mes: el recurrente de fecha más
 * próxima (nunca un puntual) — el próximo servicio/reunión que toca,
 * sea hoy o más adelante (D039). */
function findAccentKey(entries: AgendaEntry[]): string | undefined {
  return entries.find((e) => e.kind === "recurring")?.key;
}

// Celda del mosaico por tamaño (clases literales para que Tailwind las vea).
// En móvil (2 columnas) todas ocupan el ancho; "tall" y "feature" siguen
// siendo de 2 filas.
const SPAN_BY_SIZE: Record<TileSize, string> = {
  feature: "col-span-2 row-span-2",
  wide: "col-span-2 row-span-1",
  tall: "col-span-2 row-span-2 sm:col-span-1",
  sm: "col-span-2 row-span-1 sm:col-span-1",
};

function AgendaTile({
  entry,
  size,
  isAccented,
  isToday,
}: {
  entry: AgendaEntry;
  size: TileSize;
  isAccented: boolean;
  isToday: boolean;
}) {
  const day = String(entry.date.getDate()).padStart(2, "0");
  const month = MONTH_ABBR[entry.date.getMonth()];
  const isFeature = size === "feature";
  const isCompact = size === "sm";
  // Fase 10 (QA) — contraste: el tag naranja de la celda "feature" vive
  // sobre `card`, no sobre el navy fijo de las celdas destacadas — en modo
  // claro eso es blanco sólido, y `secondary-light` (#FCA355, pastel) sobre
  // blanco da ~2:1 de contraste, muy por debajo del mínimo de 4.5:1 para
  // texto de este tamaño (11px). En modo oscuro la card es oscura y ahí sí
  // funciona bien. Se resuelve igual que el resto del sitio ante este mismo
  // problema (D047/D050/D057): un tono más oscuro/saturado de la escala
  // (`secondary-700`) solo en modo claro, sin tocar el tratamiento en modo
  // oscuro ni el de las celdas destacadas (siempre sobre navy, sin este
  // problema).
  // Las celdas destacadas son navy (`primary-700`) en los dos modos: ahí el
  // tag va en `secondary-300` (8.3:1). `secondary-700` sobre navy daba
  // 3.1:1 en modo claro (QA 19-10-2026).
  const tagColor = isAccented
    ? "text-secondary-300"
    : "text-secondary-700 dark:text-secondary-light";
  // "Destacado" (fondo navy sólido) — solo el próximo evento recurrente
  // (D039). Los puntuales ("feature"/"wide") nunca lo llevan, solo su
  // tag naranja "Evento especial".
  const tagLabel = isFeature
    ? "Evento especial"
    : isAccented
      ? isToday
        ? "Hoy"
        : "Próximo evento"
      : null;
  // Blanco sólido, igual que el título — sin la opacidad reducida que antes
  // separaba día/título de mes/hora (fase 07, ajuste post-entrega): en el tile
  // destacado todo el texto es un mismo blanco, la jerarquía la da el
  // tamaño/peso, no el color.
  const onAccent = "text-gray-50";

  return (
    <div
      className={cn(
        "relative flex cursor-default flex-col rounded-lg transition-[box-shadow,border-color,background-color] duration-200",
        SPAN_BY_SIZE[size],
        isCompact ? "justify-start gap-0.5" : "justify-between gap-1",
        isFeature || size === "tall" ? "p-2.75" : "p-2",
        // Navy fijo (no `primary`, que en modo oscuro cae en un azul claro
        // "lavado" — mismo criterio de fondo fijo que el date block de
        // AgendaItem/DashboardSidebar, D014/D025) para que el tile destacado
        // se lea igual de sólido en ambos modos.
        isAccented
          ? "bg-primary-700 hover:shadow-hover-navy"
          : "border border-border bg-card hover:border-secondary hover:bg-accent hover:shadow-hover",
      )}
    >
      {tagLabel && (
        <div className="flex items-center gap-0.75">
          <Calendar aria-hidden className={cn("size-4 shrink-0", tagColor)} />
          <span
            className={cn(
              "font-body font-medium text-11 uppercase tracking-[0.14em]",
              tagColor,
            )}
          >
            {tagLabel}
          </span>
        </div>
      )}

      <div
        className={cn(
          "flex items-baseline",
          isCompact ? "gap-0.75" : "gap-1.25",
        )}
      >
        <span
          className={cn(
            "font-extrabold font-heading leading-none transition-colors duration-200",
            isFeature
              ? "text-[44px]"
              : size === "tall"
                ? "text-34"
                : isCompact
                  ? "text-20"
                  : "text-26",
            isAccented ? onAccent : "text-foreground",
          )}
        >
          {day}
        </span>
        <span
          className={cn(
            "font-body font-semibold uppercase tracking-[0.06em] transition-colors duration-200",
            isCompact ? "text-11" : "text-12",
            isAccented ? onAccent : "text-muted-foreground",
          )}
        >
          {month}
        </span>
      </div>

      <div>
        <p
          className={cn(
            "overflow-hidden font-heading font-semibold leading-h4 transition-colors duration-200",
            isFeature
              ? "text-20"
              : size === "tall"
                ? "text-17"
                : isCompact
                  ? "text-[13.5px]"
                  : "text-15",
            isCompact ? "mb-px line-clamp-2" : "mb-0.75 line-clamp-3",
            isAccented ? onAccent : "text-foreground",
          )}
        >
          {entry.title}
        </p>
        {isCompact ? (
          <p
            className={cn(
              "font-body text-11.5 transition-colors duration-200",
              isAccented ? onAccent : "text-muted-foreground",
            )}
          >
            {entry.schedule}
          </p>
        ) : (
          <p
            className={cn(
              "font-body transition-colors duration-200",
              isFeature ? "text-[13.5px]" : "text-[12.5px]",
              isAccented ? onAccent : "text-muted-foreground",
            )}
          >
            {entry.schedule} &nbsp;·&nbsp; {entry.location}
          </p>
        )}
      </div>
    </div>
  );
}

const AGENDA_GRID_CLASS =
  "grid auto-rows-[84px] grid-cols-2 grid-flow-dense gap-1.25 sm:auto-rows-[108px] sm:grid-cols-4 sm:gap-1.75";

export function Agenda({ events }: { events: AgendaEvent[] }) {
  const reduceMotion = useHydratedReducedMotion();
  const agenda = useMemo(() => buildMonthlyAgenda(events), [events]);
  const tileSizes = useMemo(() => assignTileSizes(agenda), [agenda]);
  const accentKey = useMemo(() => findAccentKey(agenda), [agenda]);
  const [expanded, setExpanded] = useState(false);
  const hasMore = agenda.length > INITIAL_COUNT;
  const isToday = (entry: AgendaEntry) =>
    entry.date.toDateString() === new Date().toDateString();

  // Medidores ocultos: dos grillas invisibles (misma `grid-flow-dense`, así
  // que la altura medida coincide con la real) que existen únicamente para
  // que `ResizeObserver` calcule la altura "colapsada" (primeros
  // `INITIAL_COUNT`) y "completa" (todos) — ver nota arriba de `AgendaTile`.
  const collapsedRef = useRef<HTMLDivElement>(null);
  const fullRef = useRef<HTMLDivElement>(null);
  const [collapsedHeight, setCollapsedHeight] = useState<number>();
  const [fullHeight, setFullHeight] = useState<number>();

  useEffect(() => {
    const collapsedEl = collapsedRef.current;
    const fullEl = fullRef.current;
    if (!collapsedEl || !fullEl) return;

    const measure = () => {
      setCollapsedHeight(collapsedEl.getBoundingClientRect().height);
      setFullHeight(fullEl.getBoundingClientRect().height);
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(collapsedEl);
    observer.observe(fullEl);
    return () => observer.disconnect();
  }, []);

  const targetHeight = !hasMore
    ? fullHeight
    : expanded
      ? fullHeight
      : collapsedHeight;

  return (
    <section id="agenda" className="py-8 md:py-12">
      <Container maxWidth="lg">
        <Reveal>
          <div className="mx-auto mb-5 max-w-160 text-center md:mx-0 md:mb-7 md:text-left">
            <span className="mb-1.5 block font-body font-medium text-11 text-secondary uppercase tracking-[0.18em] wide:text-13">
              Agenda
            </span>

            <h2 className="mb-2 font-bold font-heading text-28 text-foreground leading-h3 tracking-[-0.01em] md:text-[38px] wide:text-46">
              Lo que se viene este mes
            </h2>

            <p className="font-body text-16 text-muted-foreground leading-body wide:text-19">
              Servicios de cada semana y eventos especiales, todo en un solo
              lugar.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          {agenda.length === 0 && (
            <p className="text-center font-body text-16 text-muted-foreground md:text-left">
              No hay más eventos programados este mes.
            </p>
          )}
          {/* Medidores ocultos — nunca visibles, `h-0` + `overflow-hidden` los
              sacan del flujo sin afectar el layout ni el ancho medido. */}
          <div aria-hidden className="invisible h-0 overflow-hidden">
            <div ref={collapsedRef} className={AGENDA_GRID_CLASS}>
              {agenda.slice(0, INITIAL_COUNT).map((entry) => (
                <AgendaTile
                  key={entry.key}
                  entry={entry}
                  size={tileSizes.get(entry.key) ?? "sm"}
                  isAccented={entry.key === accentKey}
                  isToday={isToday(entry)}
                />
              ))}
            </div>
            <div ref={fullRef} className={AGENDA_GRID_CLASS}>
              {agenda.map((entry) => (
                <AgendaTile
                  key={entry.key}
                  entry={entry}
                  size={tileSizes.get(entry.key) ?? "sm"}
                  isAccented={entry.key === accentKey}
                  isToday={isToday(entry)}
                />
              ))}
            </div>
          </div>

          {/* Grilla visible: siempre renderiza TODOS los eventos — lo que anima
              es la altura de este contenedor (medida arriba), para que abrir/
              cerrar se sienta como descubrir/tapar filas que ya estaban ahí, no
              como aparecer/desaparecer contenido (pedido explícito del usuario). */}
          <motion.div
            animate={{ height: targetHeight ?? "auto" }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }
            }
            className="overflow-hidden"
          >
            <div className={AGENDA_GRID_CLASS}>
              {agenda.map((entry) => (
                <AgendaTile
                  key={entry.key}
                  entry={entry}
                  size={tileSizes.get(entry.key) ?? "sm"}
                  isAccented={entry.key === accentKey}
                  isToday={isToday(entry)}
                />
              ))}
            </div>
          </motion.div>

          {hasMore && (
            <div className="mt-3 flex justify-center">
              {/* En modo oscuro `primary` (`primary-400`) da 3.8:1 sobre el
                  fondo; `primary-light` (`primary-300`) da 6.6:1. */}
              <Button
                variant="text"
                color="primary"
                className="dark:text-primary-light"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
              >
                {expanded
                  ? "Ver menos"
                  : `Ver toda la agenda (${agenda.length})`}
                <motion.span
                  aria-hidden
                  style={{ display: "inline-flex" }}
                  animate={{ rotate: expanded ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                >
                  <ChevronDown className="size-5" />
                </motion.span>
              </Button>
            </div>
          )}
        </Reveal>
      </Container>
    </section>
  );
}
