"use client";

import { useId, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Popper from "@mui/material/Popper";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import IconButton from "@mui/material/IconButton";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { motion } from "framer-motion";
import { radius, typography } from "@/theme/tokens";

export interface DateFieldProps {
  label: string;
  value: string; // "YYYY-MM-DD"
  onChange: (value: string) => void;
  error?: boolean;
  /** Fase 09 (D067) — mensaje bajo el campo cuando `error` está activo, mismo
   * tratamiento (borde rojo + texto bajo el campo) que el resto de los
   * `TextField` del sitio. */
  helperText?: string;
  /** Fecha máxima elegible ("YYYY-MM-DD"); los días posteriores se deshabilitan. */
  max?: string;
}

const EASE = [0.2, 0.8, 0.2, 1] as const;
const WEEKDAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];
const MONTH_FORMATTER = new Intl.DateTimeFormat("es", { month: "long", year: "numeric" });
const DISPLAY_FORMATTER = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", year: "numeric" });
const FULL_DATE_FORMATTER = new Intl.DateTimeFormat("es", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

function parseValue(value: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// La semana arranca en lunes (convención en español) — a diferencia de
// `Date.getDay()` (0 = domingo), se remapea a 0 = lunes … 6 = domingo.
function mondayIndex(date: Date) {
  return (date.getDay() + 6) % 7;
}

function buildMonthGrid(viewDate: Date): Date[] {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = mondayIndex(firstOfMonth);
  const gridStart = new Date(year, month, 1 - startOffset);
  return Array.from({ length: 42 }, (_, i) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
}

/**
 * Calendario propio (revisión — reemplaza la primera versión, D062): esa
 * primera versión mantenía el `<input type="date">` nativo con un contenedor
 * estilizado alrededor, pero al hacer click seguía abriendo el picker del
 * sistema operativo/navegador — el cliente aclaró que quería un calendario
 * con estilo propio, no solo un trigger estilizado sobre el picker nativo.
 *
 * Se construye un dropdown propio (mes/año + grilla de días) usando
 * `Popper`/`ClickAwayListener`, ya disponibles en MUI — sin sumar ninguna
 * librería de calendario ni de fechas nueva (mismo criterio que evitar
 * `@mui/x-date-pickers`, documentado en D062: esta sesión no puede correr
 * `npm install` en la máquina del cliente). La matemática de fechas es
 * simple (sin `date-fns`/`dayjs`). El valor se sigue guardando como string
 * `YYYY-MM-DD`, igual que antes — no cambia nada para quien consume
 * `DashboardProjectForm`.
 */
export function DateField({ label, value, onChange, error, helperText, max }: DateFieldProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const selected = parseValue(value);
  const [viewDate, setViewDate] = useState<Date>(selected ?? new Date());
  const anchorRef = useRef<HTMLButtonElement>(null);
  const labelId = useId();

  function toggleOpen(e: MouseEvent) {
    e.stopPropagation();
    setOpen((prev) => {
      const next = !prev;
      if (next) setViewDate(selected ?? new Date());
      return next;
    });
  }

  function handleTriggerKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape" && open) {
      e.stopPropagation();
      setOpen(false);
    }
  }

  const today = new Date();
  const maxDate = max ? parseValue(max) : null;
  const isAfterMax = (day: Date) => Boolean(maxDate && day > maxDate && !isSameDay(day, maxDate));
  const nextMonthStart = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
  const days = buildMonthGrid(viewDate);
  const currentMonth = viewDate.getMonth();
  const monthLabel = MONTH_FORMATTER.format(viewDate);

  function selectDay(day: Date) {
    onChange(formatValue(day));
    setOpen(false);
  }

  function shiftMonth(delta: number) {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  return (
    <Box>
      <Box
        component="span"
        id={labelId}
        sx={{
          display: "block",
          fontSize: "12px",
          fontWeight: 500,
          color: error ? theme.palette.error.main : theme.palette.text.secondary,
          mb: 0.75,
        }}
      >
        {label}
      </Box>

      <Box
        ref={anchorRef}
        component="button"
        type="button"
        onClick={toggleOpen}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={labelId}
        aria-invalid={error || undefined}
        aria-describedby={error && helperText ? `${labelId}-error` : undefined}
        sx={{
          display: "flex",
          width: "100%",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          border: `1px solid ${error ? theme.palette.error.main : open ? theme.palette.primary.main : theme.palette.divider}`,
          borderRadius: `${radius.sm}px`,
          backgroundColor: theme.palette.background.paper,
          px: 1.75,
          height: 40,
          cursor: "pointer",
          transition: theme.transitions.create(["border-color"], { duration: theme.transitions.duration.shortest }),
          "&:hover": { borderColor: error ? theme.palette.error.main : theme.palette.text.secondary },
        }}
      >
        <Box
          component="span"
          sx={{
            fontFamily: typography.fontFamily.body,
            fontSize: "14px",
            color: selected ? theme.palette.text.primary : theme.palette.text.secondary,
          }}
        >
          {selected ? DISPLAY_FORMATTER.format(selected) : "Seleccionar fecha"}
        </Box>
        <CalendarMonthRoundedIcon fontSize="small" sx={{ color: theme.palette.text.secondary, flexShrink: 0 }} />
      </Box>

      {error && helperText && (
        <Box
          component="p"
          id={`${labelId}-error`}
          role="alert"
          sx={{ m: 0, mt: 0.75, ml: 1.75, fontSize: "12px", color: theme.palette.error.main }}
        >
          {helperText}
        </Box>
      )}

      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        sx={{ zIndex: (t) => t.zIndex.modal + 10 }}
        modifiers={[{ name: "offset", options: { offset: [0, 6] } }]}
      >
        <ClickAwayListener onClickAway={() => setOpen(false)}>
          <Box
            component={motion.div}
            role="dialog"
            aria-label={`${label} — elegir fecha`}
            onKeyDown={(e: KeyboardEvent) => {
              if (e.key === "Escape") {
                setOpen(false);
                anchorRef.current?.focus();
              }
            }}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.16, ease: EASE }}
            sx={{
              width: 280,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: `${radius.md}px`,
              backgroundColor: theme.palette.background.paper,
              boxShadow: theme.shadows[8],
              p: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
              <IconButton type="button" size="small" onClick={() => shiftMonth(-1)} aria-label="Mes anterior">
                <ChevronLeftRoundedIcon fontSize="small" />
              </IconButton>
              <Box
                component="span"
                sx={{
                  fontFamily: typography.fontFamily.heading,
                  fontWeight: 600,
                  fontSize: "13px",
                  color: theme.palette.text.primary,
                  textTransform: "capitalize",
                }}
              >
                {monthLabel}
              </Box>
              <IconButton
                type="button"
                size="small"
                onClick={() => shiftMonth(1)}
                aria-label="Mes siguiente"
                disabled={isAfterMax(nextMonthStart)}
              >
                <ChevronRightRoundedIcon fontSize="small" />
              </IconButton>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5, mb: 0.5 }}>
              {WEEKDAY_LABELS.map((day) => (
                <Box
                  key={day}
                  sx={{ textAlign: "center", fontSize: "11px", fontWeight: 500, color: theme.palette.text.secondary, py: 0.5 }}
                >
                  {day}
                </Box>
              ))}
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5 }}>
              {days.map((day) => {
                const inCurrentMonth = day.getMonth() === currentMonth;
                const isSelected = selected ? isSameDay(day, selected) : false;
                const isToday = isSameDay(day, today);
                const disabled = isAfterMax(day);
                return (
                  <Box
                    key={day.toISOString()}
                    component="button"
                    type="button"
                    onClick={() => selectDay(day)}
                    disabled={disabled}
                    aria-label={FULL_DATE_FORMATTER.format(day)}
                    aria-pressed={isSelected}
                    aria-current={isToday ? "date" : undefined}
                    sx={{
                      width: "100%",
                      aspectRatio: "1 / 1",
                      border: "none",
                      borderRadius: `${radius.sm}px`,
                      backgroundColor: isSelected ? theme.palette.secondary.main : "transparent",
                      color: isSelected
                        ? theme.palette.secondary.contrastText
                        : inCurrentMonth
                          ? theme.palette.text.primary
                          : theme.palette.text.secondary,
                      opacity: disabled ? 0.25 : inCurrentMonth ? 1 : 0.4,
                      fontSize: "12px",
                      fontFamily: typography.fontFamily.body,
                      fontWeight: isToday && !isSelected ? 700 : 500,
                      cursor: disabled ? "not-allowed" : "pointer",
                      outline: isToday && !isSelected ? `1px solid ${theme.palette.divider}` : "none",
                      outlineOffset: -1,
                      transition: theme.transitions.create(["background-color", "color"], {
                        duration: theme.transitions.duration.shortest,
                      }),
                      "&:hover:not(:disabled)": {
                        backgroundColor: isSelected ? theme.palette.secondary.main : theme.palette.action.hover,
                      },
                    }}
                  >
                    {day.getDate()}
                  </Box>
                );
              })}
            </Box>
          </Box>
        </ClickAwayListener>
      </Popper>
    </Box>
  );
}
