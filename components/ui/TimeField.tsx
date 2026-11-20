"use client";

import { Clock } from "lucide-react";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import {
  composeTime24,
  formatTime12,
  HOURS_12,
  MINUTE_STEPS,
  PERIOD_LABEL,
  type Period,
  parseTime24,
} from "@/lib/timeOfDay";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Field } from "./field";
import { fieldControlClasses } from "./input";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export interface TimeFieldProps {
  label: string;
  value: string; // "HH:MM" 24 h
  onChange: (value: string) => void;
  error?: boolean;
  /** Mensaje bajo el campo cuando `error` está activo (igual que `DateField`). */
  helperText?: string;
  required?: boolean;
}

// Altura táctil mínima de cada opción (≥ 44 px = `min-h-11`) y filas visibles
// por columna (5 × 44 = `max-h-55`).
const OPTION_HEIGHT = 44;

interface ColumnOption {
  key: string;
  text: string;
  selected: boolean;
  select: () => void;
}

interface ColumnProps {
  label: string;
  options: ColumnOption[];
  onChoose: (closeAfter: boolean) => void;
}

/** Columna `listbox`: una sola parada de Tab (la opción marcada o la primera),
 * flechas arriba/abajo para moverse, Espacio elige, Enter elige y cierra. */
function Column({ label, options, onChoose }: ColumnProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const selectedIndex = options.findIndex((o) => o.selected);
  const tabStop = selectedIndex >= 0 ? selectedIndex : 0;

  // Al abrir, la opción marcada queda a la vista dentro de la columna.
  // biome-ignore lint/correctness/useExhaustiveDependencies: solo al montar
  useEffect(() => {
    const list = listRef.current;
    if (!list || selectedIndex < 0) return;
    list.scrollTop = Math.max(
      0,
      selectedIndex * OPTION_HEIGHT - (list.clientHeight - OPTION_HEIGHT) / 2,
    );
  }, []);

  function focusOption(index: number) {
    const items =
      listRef.current?.querySelectorAll<HTMLElement>('[role="option"]');
    items?.[Math.max(0, Math.min(options.length - 1, index))]?.focus();
  }

  function handleKeyDown(e: KeyboardEvent, index: number) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        focusOption(index + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        focusOption(index - 1);
        break;
      case "Home":
        e.preventDefault();
        focusOption(0);
        break;
      case "End":
        e.preventDefault();
        focusOption(options.length - 1);
        break;
      case " ":
        e.preventDefault();
        options[index].select();
        onChoose(false);
        break;
      case "Enter":
        e.preventDefault();
        options[index].select();
        onChoose(true);
        break;
    }
  }

  return (
    <div
      ref={listRef}
      role="listbox"
      aria-label={label}
      // `overscroll-contain`: el scroll de la columna no arrastra la página.
      className="flex max-h-55 min-w-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain"
    >
      {options.map((option, index) => (
        <div
          key={option.key}
          role="option"
          aria-selected={option.selected}
          tabIndex={index === tabStop ? 0 : -1}
          onClick={() => {
            option.select();
            onChoose(false);
          }}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className={cn(
            "flex min-h-11 shrink-0 cursor-pointer items-center justify-center rounded-sm border",
            "font-body text-14 transition-[background-color] duration-150",
            // Marcada: relleno + peso + borde, no solo color. Texto blanco
            // en claro y oscuro (pedido de César): sobre `secondary[500]` el
            // blanco da 2,77:1; sobre `secondary[700]`, 5,31:1 (AA). Mismo
            // par que el día elegido de `DateField`.
            option.selected
              ? "border-foreground bg-secondary-700 font-bold text-white"
              : "border-transparent bg-transparent font-medium text-foreground hover:bg-accent",
          )}
        >
          {option.text}
        </div>
      ))}
    </div>
  );
}

/**
 * Selector de hora propio (D089, mismo patrón y estilo que `DateField`):
 * columnas Hora (1–12), Minutos (de 5 en 5) y a. m./p. m. El valor sigue
 * siendo "HH:MM" en 24 h, así que el servidor no cambia. Un valor con minutos
 * fuera de la grilla (p. ej. 19:07) se muestra tal cual y la columna de
 * minutos no marca ninguno hasta que se elija.
 *
 * Sobre Radix Popover (D115): al abrir, el foco pasa a la primera columna;
 * Escape, «Listo», Enter en una opción o Tab fuera del panel lo cierran y
 * devuelven el foco al campo; clic fuera también cierra.
 */
export function TimeField({
  label,
  value,
  onChange,
  error,
  helperText,
  required,
}: TimeFieldProps) {
  const [open, setOpen] = useState(false);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const parts = parseTime24(value);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const valueId = useId();

  function handleOpenChange(next: boolean) {
    if (next) {
      setContainer(
        triggerRef.current?.closest<HTMLElement>('[role="dialog"]') ?? null,
      );
    }
    setOpen(next);
  }

  // Al cerrar por estado (no por clic fuera), Radix devuelve el foco al campo.
  const close = () => setOpen(false);

  // Base para componer cuando aún falta alguna parte (campo vacío).
  const base = parts ?? { hour12: 12, minute: 0, period: "am" as Period };
  const emit = (patch: Partial<typeof base>) =>
    onChange(composeTime24({ ...base, ...patch }));

  const hourOptions: ColumnOption[] = HOURS_12.map((h) => ({
    key: String(h),
    text: String(h),
    selected: parts?.hour12 === h,
    select: () => emit({ hour12: h }),
  }));
  const minuteOptions: ColumnOption[] = MINUTE_STEPS.map((m) => ({
    key: String(m),
    text: String(m).padStart(2, "0"),
    selected: parts?.minute === m,
    select: () => emit({ minute: m }),
  }));
  const periodOptions: ColumnOption[] = (["am", "pm"] as const).map((p) => ({
    key: p,
    text: PERIOD_LABEL[p],
    selected: parts?.period === p,
    select: () => emit({ period: p }),
  }));

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
      '[tabindex="0"], button:not(:disabled)',
    );
    if (!stops?.length) return;
    const first = stops[0];
    const last = stops[stops.length - 1];
    if (
      (e.shiftKey && document.activeElement === first) ||
      (!e.shiftKey && document.activeElement === last)
    ) {
      e.preventDefault();
      close();
    }
  }

  const shown = parts ? formatTime12(value) : "";

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <Field
        label={label}
        required={required}
        error={error ? helperText || true : undefined}
      >
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
                className={cn(!shown && "text-muted-foreground")}
              >
                {shown || "Seleccionar hora"}
              </span>
              <Clock
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
        aria-label={`${label} — elegir hora`}
        onKeyDown={handleContentKeyDown}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          // Tras el primer cuadro: la columna ya se desplazó a la opción marcada.
          requestAnimationFrame(() => {
            contentRef.current
              ?.querySelector<HTMLElement>('[role="option"][tabindex="0"]')
              ?.focus({ preventScroll: true });
          });
        }}
      >
        <div className="flex gap-2">
          <Column
            label="Hora"
            options={hourOptions}
            onChoose={(c) => c && close()}
          />
          <Column
            label="Minutos"
            options={minuteOptions}
            onChoose={(c) => c && close()}
          />
          <Column
            label="a. m. o p. m."
            options={periodOptions}
            onChoose={(c) => c && close()}
          />
        </div>
        <Button
          variant="plain"
          onClick={close}
          className={cn(
            "mt-3 min-h-11 w-full rounded-sm border border-border",
            "font-semibold text-14 text-foreground hover:bg-accent dark:text-foreground dark:hover:bg-accent",
          )}
        >
          Listo
        </Button>
      </PopoverContent>
    </Popover>
  );
}
