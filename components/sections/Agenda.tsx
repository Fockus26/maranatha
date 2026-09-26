"use client";

import EventRoundedIcon from "@mui/icons-material/EventRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { secondary } from "@/theme/tokens";

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
 * el tag dice "Próximo evento". Los eventos puntuales (`ONE_TIME_EVENTS`)
 * nunca llevan este destacado navy — solo conservan su tag naranja
 * "Evento especial" sobre el fondo bordeado normal, igual que cualquier
 * otra celda.
 *
 * La agenda sigue combinando dos tipos de evento:
 * - Recurrentes (`RECURRING_EVENTS`): servicios semanales sin fecha fija,
 *   se expanden a todas sus ocurrencias dentro del mes actual.
 * - Puntuales (`ONE_TIME_EVENTS`): eventos especiales de una sola fecha,
 *   definidos como offset en días desde hoy (no ISO fija) para que la
 *   vista previa siempre muestre contenido dentro del mes visible, sin
 *   importar qué día se abra el sitio.
 *
 * Ambos se combinan, se ordenan cronológicamente y se recortan a
 * `INITIAL_COUNT`; si hay más, aparece un botón de texto (sin naranja —
 * no es un CTA de alta prioridad, es solo un toggle de expandir/contraer
 * la propia agenda in-place) para ver el resto sin salir de la sección.
 *
 * NOTA DE CONTENIDO: los eventos (nombres, horarios, ubicaciones y el
 * offset de los puntuales) son placeholders — pendientes de que el
 * cliente entregue la agenda real. Cuando exista un dashboard/admin para
 * gestionarla (fuera de alcance de esta fase, solo visual), esta lista
 * pasaría a venir de esa fuente en vez de estar hardcodeada aquí.
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

const RECURRING_EVENTS = [
  {
    weekday: 0,
    title: "Servicio Dominical",
    schedule: "10:00 a.m.",
    location: "Templo principal",
  },
  {
    weekday: 3,
    title: "Reunión de oración",
    schedule: "7:00 p.m.",
    location: "Salón de oración",
  },
  {
    weekday: 5,
    title: "Reunión de jóvenes",
    schedule: "7:00 p.m.",
    location: "Salón de jóvenes",
  },
] as const;

const ONE_TIME_EVENTS = [
  {
    offsetDays: 4,
    title: "Noche de alabanza especial",
    schedule: "6:30 p.m.",
    location: "Templo principal",
  },
  {
    offsetDays: 9,
    title: "Bautismos",
    schedule: "11:00 a.m.",
    location: "Templo principal",
  },
  {
    offsetDays: 17,
    title: "Conferencia de matrimonios",
    schedule: "5:00 p.m.",
    location: "Salón multiusos",
  },
] as const;

const INITIAL_COUNT = 6;

type TileSize = "feature" | "wide" | "tall" | "sm";

interface AgendaEntry {
  key: string;
  date: Date;
  title: string;
  schedule: string;
  location: string;
  kind: "recurring" | "oneTime";
  weekday: number;
}

function buildMonthlyAgenda(): AgendaEntry[] {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const entries: AgendaEntry[] = [];

  for (let day = today.getDate(); day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const weekday = date.getDay();
    RECURRING_EVENTS.forEach((ev) => {
      if (ev.weekday === weekday) {
        entries.push({
          key: `${ev.title}-${date.toISOString()}`,
          date,
          title: ev.title,
          schedule: ev.schedule,
          location: ev.location,
          kind: "recurring",
          weekday,
        });
      }
    });
  }

  ONE_TIME_EVENTS.forEach((ev) => {
    const date = new Date(today);
    date.setDate(date.getDate() + ev.offsetDays);
    if (date.getMonth() === month && date.getFullYear() === year) {
      entries.push({
        key: `${ev.title}-${date.toISOString()}`,
        date,
        title: ev.title,
        schedule: ev.schedule,
        location: ev.location,
        kind: "oneTime",
        weekday: date.getDay(),
      });
    }
  });

  entries.sort((a, b) => a.date.getTime() - b.date.getTime());
  return entries;
}

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

const SPAN_BY_SIZE: Record<TileSize, { gridColumn: string; gridRow: string }> =
  {
    feature: { gridColumn: "span 2", gridRow: "span 2" },
    wide: { gridColumn: "span 2", gridRow: "span 1" },
    tall: { gridColumn: "span 1", gridRow: "span 2" },
    sm: { gridColumn: "span 1", gridRow: "span 1" },
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
  const theme = useTheme();
  const day = String(entry.date.getDate()).padStart(2, "0");
  const month = MONTH_ABBR[entry.date.getMonth()];
  const isFeature = size === "feature";
  const isCompact = size === "sm";
  // Fase 10 (QA) — contraste: el tag naranja de la celda "feature" vive
  // sobre `background.paper`, no sobre el navy fijo de las celdas
  // destacadas — en modo claro eso es blanco sólido, y `secondary.light`
  // (#FCA355, pastel) sobre blanco da ~2:1 de contraste, muy por debajo del
  // mínimo de 4.5:1 para texto de este tamaño (11px). En modo oscuro
  // `background.paper` es oscuro (`gray[800]`) y ahí sí funciona bien. Se
  // resuelve igual que el resto del sitio ante este mismo problema
  // (D047/D050/D057): un tono más oscuro/saturado de la escala
  // (`secondary[700]`) solo en modo claro, sin tocar el tratamiento en modo
  // oscuro ni el de las celdas destacadas (siempre sobre navy, sin este
  // problema).
  const tagColor =
    theme.palette.mode === "light"
      ? secondary[700]
      : theme.palette.secondary.light;
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

  return (
    <Box
      sx={{
        position: "relative",
        gridColumn: { xs: "span 2", sm: SPAN_BY_SIZE[size].gridColumn },
        gridRow: {
          xs: size === "tall" || size === "feature" ? "span 2" : "span 1",
          sm: SPAN_BY_SIZE[size].gridRow,
        },
        display: "flex",
        flexDirection: "column",
        justifyContent: isCompact ? "flex-start" : "space-between",
        gap: isCompact ? 0.5 : 1,
        borderRadius: "14px",
        border: isAccented ? "none" : "1px solid",
        borderColor: "divider",
        // Navy fijo (no `primary.main`, que en modo oscuro cae en un azul
        // claro "lavado" — mismo criterio de fondo fijo que el date block de
        // AgendaItem/DashboardSidebar, D014/D025) para que el tile destacado
        // se lea igual de sólido en ambos modos.
        backgroundColor: isAccented ? "#101B45" : "background.paper",
        p: isFeature || size === "tall" ? 2.75 : 2,
        transition:
          "box-shadow 0.2s ease, border-color 0.2s ease, background-color 0.2s ease",
        cursor: "default",
        "&:hover": isAccented
          ? {
              boxShadow: "0 10px 30px rgba(6,10,29,0.28)",
            }
          : {
              boxShadow: "0 8px 20px rgba(6,10,29,0.1)",
              borderColor: "secondary.main",
              backgroundColor: "action.hover",
            },
      }}
    >
      {tagLabel && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <EventRoundedIcon sx={{ fontSize: 16, color: tagColor }} />
          <Typography
            component="span"
            sx={{
              fontFamily: "var(--font-body)",
              fontWeight: 500,
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: tagColor,
            }}
          >
            {tagLabel}
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          gap: isCompact ? 0.75 : 1.25,
        }}
      >
        <Typography
          component="span"
          className="tile-day"
          sx={{
            fontFamily: "var(--font-heading)",
            fontWeight: 800,
            fontSize: isFeature
              ? "44px"
              : size === "tall"
                ? "34px"
                : isCompact
                  ? "20px"
                  : "26px",
            lineHeight: 1,
            // Blanco sólido, igual que el título — sin la opacidad reducida
            // que antes separaba día/título de mes/hora (fase 07, ajuste
            // post-entrega): en el tile destacado todo el texto es un mismo
            // blanco, la jerarquía la da el tamaño/peso, no el color.
            color: isAccented ? "#F5F6FA" : "text.primary",
            transition: "color 0.2s ease",
          }}
        >
          {day}
        </Typography>
        <Typography
          component="span"
          className="tile-month"
          sx={{
            fontFamily: "var(--font-body)",
            fontSize: isCompact ? "11px" : "12px",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: isAccented ? "#F5F6FA" : "text.secondary",
            transition: "color 0.2s ease",
          }}
        >
          {month}
        </Typography>
      </Box>

      <Box>
        <Typography
          className="tile-title"
          sx={{
            fontFamily: "var(--font-heading)",
            fontWeight: 600,
            fontSize: isFeature
              ? "20px"
              : size === "tall"
                ? "17px"
                : isCompact
                  ? "13.5px"
                  : "15px",
            lineHeight: 1.25,
            color: isAccented ? "#F5F6FA" : "text.primary",
            mb: isCompact ? 0.25 : 0.75,
            display: "-webkit-box",
            WebkitLineClamp: isCompact ? 2 : 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            transition: "color 0.2s ease",
          }}
        >
          {entry.title}
        </Typography>
        {!isCompact && (
          <Typography
            className="tile-meta"
            sx={{
              fontFamily: "var(--font-body)",
              fontSize: isFeature ? "13.5px" : "12.5px",
              color: isAccented ? "#F5F6FA" : "text.secondary",
              transition: "color 0.2s ease",
            }}
          >
            {entry.schedule} &nbsp;·&nbsp; {entry.location}
          </Typography>
        )}
        {isCompact && (
          <Typography
            className="tile-meta"
            sx={{
              fontFamily: "var(--font-body)",
              fontSize: "11.5px",
              color: isAccented ? "#F5F6FA" : "text.secondary",
              transition: "color 0.2s ease",
            }}
          >
            {entry.schedule}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

const AGENDA_GRID_SX = {
  display: "grid",
  gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" },
  gridAutoRows: { xs: "84px", sm: "108px" },
  gridAutoFlow: "dense",
  gap: { xs: 1.25, sm: 1.75 },
} as const;

export function Agenda() {
  const reduceMotion = useReducedMotion();
  const agenda = useMemo(() => buildMonthlyAgenda(), []);
  const tileSizes = useMemo(() => assignTileSizes(agenda), [agenda]);
  const accentKey = useMemo(() => findAccentKey(agenda), [agenda]);
  const [expanded, setExpanded] = useState(false);
  const hasMore = agenda.length > INITIAL_COUNT;
  const isToday = (entry: AgendaEntry) =>
    entry.date.toDateString() === new Date().toDateString();

  // Medidores ocultos: dos grillas invisibles (misma `gridAutoFlow: dense`,
  // así que la altura medida coincide con la real) que existen únicamente
  // para que `ResizeObserver` calcule la altura "colapsada" (primeros
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
    <Box component="section" id="agenda" sx={{ py: { xs: 8, md: 12 } }}>
      <Container maxWidth="lg">
        <Reveal>
          <Box
            sx={{
              maxWidth: 640,
              mx: { xs: "auto", md: 0 },
              textAlign: { xs: "center", md: "left" },
              mb: { xs: 5, md: 7 },
            }}
          >
            <Typography
              component="span"
              sx={{
                display: "block",
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                fontSize: 11,
                "@media (min-width:1920px)": { fontSize: "13px" },
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "secondary.main",
                mb: 1.5,
              }}
            >
              Agenda
            </Typography>

            <Typography
              component="h2"
              sx={{
                fontFamily: "var(--font-heading)",
                fontWeight: 700,
                fontSize: { xs: "28px", md: "38px" },
                "@media (min-width:1920px)": { fontSize: "46px" },
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
                color: "text.primary",
                mb: 2,
              }}
            >
              Lo que se viene este mes
            </Typography>

            <Typography
              sx={{
                fontFamily: "var(--font-body)",
                fontSize: 16,
                "@media (min-width:1920px)": { fontSize: "19px" },
                lineHeight: 1.6,
                color: "text.secondary",
              }}
            >
              Servicios de cada semana y eventos especiales, todo en un solo
              lugar.
            </Typography>
          </Box>
        </Reveal>

        <Reveal delay={0.12}>
          {/* Medidores ocultos — nunca visibles, `height: 0` + `overflow: hidden`
              los saca del flujo sin afectar el layout ni el ancho medido. */}
          <Box
            aria-hidden
            sx={{ height: 0, overflow: "hidden", visibility: "hidden" }}
          >
            <Box ref={collapsedRef} sx={AGENDA_GRID_SX}>
              {agenda.slice(0, INITIAL_COUNT).map((entry) => (
                <AgendaTile
                  key={entry.key}
                  entry={entry}
                  size={tileSizes.get(entry.key) ?? "sm"}
                  isAccented={entry.key === accentKey}
                  isToday={isToday(entry)}
                />
              ))}
            </Box>
            <Box ref={fullRef} sx={AGENDA_GRID_SX}>
              {agenda.map((entry) => (
                <AgendaTile
                  key={entry.key}
                  entry={entry}
                  size={tileSizes.get(entry.key) ?? "sm"}
                  isAccented={entry.key === accentKey}
                  isToday={isToday(entry)}
                />
              ))}
            </Box>
          </Box>

          {/* Grilla visible: siempre renderiza TODOS los eventos — lo que anima
              es la altura de este contenedor (medida arriba), para que abrir/
              cerrar se sienta como descubrir/tapar filas que ya estaban ahí, no
              como aparecer/desaparecer contenido (pedido explícito del usuario). */}
          <Box
            component={motion.div}
            animate={{ height: targetHeight ?? "auto" }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }
            }
            sx={{ overflow: "hidden" }}
          >
            <Box sx={AGENDA_GRID_SX}>
              {agenda.map((entry) => (
                <AgendaTile
                  key={entry.key}
                  entry={entry}
                  size={tileSizes.get(entry.key) ?? "sm"}
                  isAccented={entry.key === accentKey}
                  isToday={isToday(entry)}
                />
              ))}
            </Box>
          </Box>

          {hasMore && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <Button
                variant="text"
                color="primary"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                endIcon={
                  <motion.span
                    style={{ display: "inline-flex" }}
                    animate={{ rotate: expanded ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                  >
                    <ExpandMoreRoundedIcon fontSize="small" />
                  </motion.span>
                }
              >
                {expanded
                  ? "Ver menos"
                  : `Ver toda la agenda (${agenda.length})`}
              </Button>
            </Box>
          )}
        </Reveal>
      </Container>
    </Box>
  );
}
