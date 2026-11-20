"use client";

import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Field } from "./field";
import { fieldControlClasses } from "./input";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

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

const WEEKDAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];
const MONTH_FORMATTER = new Intl.DateTimeFormat("es", {
  month: "long",
  year: "numeric",
});
const DISPLAY_FORMATTER = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const FULL_DATE_FORMATTER = new Intl.DateTimeFormat("es", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

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
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function addDays(date: Date, n: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
}

/** Mismo día del mes `n` meses después (el 31 cae en el último día). */
function addMonths(date: Date, n: number) {
  const first = new Date(date.getFullYear(), date.getMonth() + n, 1);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
  return new Date(
    first.getFullYear(),
    first.getMonth(),
    Math.min(date.getDate(), last.getDate()),
  );
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
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

/**
 * Calendario propio (D062): mes/año + grilla de días, sin librería de
 * calendario ni de fechas. El valor se guarda como string `YYYY-MM-DD`.
 *
 * Sobre Radix Popover (D115): clic fuera y Escape cierran, y al cerrar el
 * foco vuelve al campo. Al abrir, el foco va al día elegido (o a hoy); las
 * flechas mueven un día / una semana, Inicio/Fin al borde de la semana y
 * RePág/AvPág un mes (la grilla es una sola parada de Tab). Tab fuera del
 * panel lo cierra y devuelve el foco al campo. Dentro de un `Dialog`/`Drawer`
 * de MUI el panel se porta a ese `role="dialog"` (su trampa de foco lo
 * respeta) y Escape no llega a cerrar el modal.
 */
export function DateField({
  label,
  value,
  onChange,
  error,
  helperText,
  max,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = parseValue(value);
  const maxDate = max ? parseValue(max) : null;
  const [viewDate, setViewDate] = useState<Date>(selected ?? new Date());
  const [focusDate, setFocusDate] = useState<Date>(selected ?? new Date());
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const moveFocus = useRef(false);
  const valueId = useId();

  const isAfterMax = (day: Date) =>
    Boolean(maxDate && day > maxDate && !isSameDay(day, maxDate));

  function handleOpenChange(next: boolean) {
    if (next) {
      const today = new Date();
      let start = selected ?? today;
      if (isAfterMax(start) && maxDate) start = maxDate;
      setViewDate(start);
      setFocusDate(start);
      setContainer(
        triggerRef.current?.closest<HTMLElement>('[role="dialog"]') ?? null,
      );
    }
    setOpen(next);
  }

  // Tras mover con el teclado, el foco sigue al día (que puede ser de otro mes).
  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    contentRef.current
      ?.querySelector<HTMLElement>(`[data-date="${formatValue(focusDate)}"]`)
      ?.focus();
  }, [focusDate]);

  const today = new Date();
  const nextMonthStart = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth() + 1,
    1,
  );
  const days = buildMonthGrid(viewDate);
  const currentMonth = viewDate.getMonth();
  const monthLabel = MONTH_FORMATTER.format(viewDate);
  // Una sola parada de Tab en la grilla: el día enfocado si está a la vista,
  // si no el elegido, si no el primero del mes.
  const tabDate = isSameMonth(focusDate, viewDate)
    ? focusDate
    : selected && isSameMonth(selected, viewDate)
      ? selected
      : new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);

  function selectDay(day: Date) {
    onChange(formatValue(day));
    setOpen(false);
  }

  function shiftMonth(delta: number) {
    setViewDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1),
    );
  }

  function handleDayKeyDown(e: KeyboardEvent, day: Date) {
    let next: Date | null = null;
    switch (e.key) {
      case "ArrowLeft":
        next = addDays(day, -1);
        break;
      case "ArrowRight":
        next = addDays(day, 1);
        break;
      case "ArrowUp":
        next = addDays(day, -7);
        break;
      case "ArrowDown":
        next = addDays(day, 7);
        break;
      case "Home":
        next = addDays(day, -mondayIndex(day));
        break;
      case "End":
        next = addDays(day, 6 - mondayIndex(day));
        break;
      case "PageUp":
        next = addMonths(day, -1);
        break;
      case "PageDown":
        next = addMonths(day, 1);
        break;
      default:
        return;
    }
    e.preventDefault();
    if (isAfterMax(next)) return;
    moveFocus.current = true;
    setFocusDate(next);
    if (!isSameMonth(next, viewDate)) {
      setViewDate(new Date(next.getFullYear(), next.getMonth(), 1));
    }
  }

  function handleContentKeyDown(e: KeyboardEvent) {
    // Radix ya cerró el panel; sin esto el Escape sube por el árbol de React
    // hasta el `Dialog`/`Drawer` de MUI y lo cierra también.
    if (e.key === "Escape") {
      e.stopPropagation();
      return;
    }
    if (e.key !== "Tab") return;
    // El panel vive fuera del flujo del formulario: al salir por cualquiera
    // de sus extremos se cierra y el foco vuelve al campo.
    const stops = contentRef.current?.querySelectorAll<HTMLElement>(
      'button:not(:disabled):not([tabindex="-1"])',
    );
    if (!stops?.length) return;
    const first = stops[0];
    const last = stops[stops.length - 1];
    if (
      (e.shiftKey && document.activeElement === first) ||
      (!e.shiftKey && document.activeElement === last)
    ) {
      e.preventDefault();
      setOpen(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <Field label={label} error={error ? helperText || true : undefined}>
        {(control, { labelId }) => (
          <PopoverTrigger asChild>
            <button
              ref={triggerRef}
              type="button"
              {...control}
              aria-labelledby={`${labelId} ${valueId}`}
              className={cn(
                fieldControlClasses,
                "cursor-pointer justify-between gap-2 text-start",
              )}
            >
              <span
                id={valueId}
                className={cn(!selected && "text-muted-foreground")}
              >
                {selected
                  ? DISPLAY_FORMATTER.format(selected)
                  : "Seleccionar fecha"}
              </span>
              <Calendar
                aria-hidden
                className="size-5 shrink-0 text-muted-foreground"
              />
            </button>
          </PopoverTrigger>
        )}
      </Field>

      <PopoverContent
        ref={contentRef}
        container={container}
        align="start"
        aria-label={`${label} — elegir fecha`}
        onKeyDown={handleContentKeyDown}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          contentRef.current
            ?.querySelector<HTMLElement>('[data-date][tabindex="0"]')
            ?.focus({ preventScroll: true });
        }}
      >
        <div className="mb-3 flex items-center justify-between">
          <Button
            variant="plain"
            size="icon"
            className="size-7.5 p-1.25"
            onClick={() => shiftMonth(-1)}
            aria-label="Mes anterior"
          >
            <ChevronLeft aria-hidden className="size-5" />
          </Button>
          <span
            aria-live="polite"
            className="font-heading font-semibold text-13 text-foreground capitalize"
          >
            {monthLabel}
          </span>
          <Button
            variant="plain"
            size="icon"
            className="size-7.5 p-1.25"
            onClick={() => shiftMonth(1)}
            aria-label="Mes siguiente"
            disabled={isAfterMax(nextMonthStart)}
          >
            <ChevronRight aria-hidden className="size-5" />
          </Button>
        </div>

        <div className="mb-1 grid grid-cols-7 gap-1">
          {WEEKDAY_LABELS.map((day) => (
            <div
              key={day}
              className="py-1 text-center font-medium text-11 text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const inCurrentMonth = day.getMonth() === currentMonth;
            const isSelected = selected ? isSameDay(day, selected) : false;
            const isToday = isSameDay(day, today);
            const disabled = isAfterMax(day);
            return (
              <button
                key={day.toISOString()}
                type="button"
                data-date={formatValue(day)}
                tabIndex={isSameDay(day, tabDate) ? 0 : -1}
                onClick={() => selectDay(day)}
                onKeyDown={(e) => handleDayKeyDown(e, day)}
                disabled={disabled}
                aria-label={FULL_DATE_FORMATTER.format(day)}
                aria-pressed={isSelected}
                aria-current={isToday ? "date" : undefined}
                className={cn(
                  "aspect-square w-full cursor-pointer rounded-sm border-none font-body text-12",
                  "transition-[background-color,color] duration-150",
                  // Blanco sobre `secondary[700]` (5,31:1, AA): sobre el
                  // naranja `main` el blanco daba 2,77:1.
                  isSelected
                    ? "bg-secondary-700 font-medium text-white"
                    : cn(
                        "bg-transparent enabled:hover:bg-accent",
                        inCurrentMonth
                          ? "text-foreground"
                          : "text-muted-foreground opacity-40",
                        isToday
                          ? "font-bold outline-1 outline-border -outline-offset-1"
                          : "font-medium",
                      ),
                  disabled && "cursor-not-allowed opacity-25",
                )}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
