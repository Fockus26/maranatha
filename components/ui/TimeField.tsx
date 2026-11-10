"use client";

import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import Popper from "@mui/material/Popper";
import { useTheme } from "@mui/material/styles";
import { motion, useReducedMotion } from "framer-motion";
import {
  type KeyboardEvent,
  type MouseEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import {
  composeTime24,
  formatTime12,
  HOURS_12,
  MINUTE_STEPS,
  PERIOD_LABEL,
  type Period,
  parseTime24,
} from "@/lib/timeOfDay";
import { fontScale, radius, typography } from "@/theme/tokens";

export interface TimeFieldProps {
  label: string;
  value: string; // "HH:MM" 24 h
  onChange: (value: string) => void;
  error?: boolean;
  /** Mensaje bajo el campo cuando `error` está activo (igual que `DateField`). */
  helperText?: string;
  required?: boolean;
}

const EASE = [0.2, 0.8, 0.2, 1] as const;
// Altura táctil mínima de cada opción (≥ 44 px) y de filas visibles por columna.
const OPTION_HEIGHT = 44;
const VISIBLE_ROWS = 5;

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
  const theme = useTheme();
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
    <Box
      ref={listRef}
      role="listbox"
      aria-label={label}
      sx={{
        flex: 1,
        minWidth: 0,
        maxHeight: OPTION_HEIGHT * VISIBLE_ROWS,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
        // Evita que el scroll de la columna arrastre la página.
        overscrollBehavior: "contain",
      }}
    >
      {options.map((option, index) => (
        <Box
          key={option.key}
          role="option"
          aria-selected={option.selected}
          tabIndex={index === tabStop ? 0 : -1}
          onClick={() => {
            option.select();
            onChoose(false);
          }}
          onKeyDown={(e: KeyboardEvent) => handleKeyDown(e, index)}
          sx={{
            flexShrink: 0,
            minHeight: OPTION_HEIGHT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: `${radius.sm}px`,
            cursor: "pointer",
            fontFamily: typography.fontFamily.body,
            fontSize: fontScale[14],
            // Marcada: relleno + peso + borde, no solo color.
            fontWeight: option.selected ? 700 : 500,
            backgroundColor: option.selected
              ? theme.palette.secondary.main
              : "transparent",
            color: option.selected
              ? theme.palette.secondary.contrastText
              : theme.palette.text.primary,
            border: `1px solid ${option.selected ? theme.palette.text.primary : "transparent"}`,
            transition: theme.transitions.create(["background-color"], {
              duration: theme.transitions.duration.shortest,
            }),
            "&:hover": {
              backgroundColor: option.selected
                ? theme.palette.secondary.main
                : theme.palette.action.hover,
            },
          }}
        >
          {option.text}
        </Box>
      ))}
    </Box>
  );
}

/**
 * Selector de hora propio (mismo patrón y estilo que `DateField`, D062): el
 * `<input type="time">` nativo abría el picker del sistema. Popper con
 * columnas Hora (1–12), Minutos (de 5 en 5) y a. m./p. m. El valor sigue
 * siendo "HH:MM" en 24 h, así que el servidor no cambia. Un valor con minutos
 * fuera de la grilla (p. ej. 19:07) se muestra tal cual y la columna de
 * minutos no marca ninguno hasta que se elija.
 */
export function TimeField({
  label,
  value,
  onChange,
  error,
  helperText,
  required,
}: TimeFieldProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const parts = parseTime24(value);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const labelId = useId();

  // Al abrir, el foco pasa a la primera columna (su parada de Tab).
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      dialogRef.current
        ?.querySelector<HTMLElement>('[role="option"][tabindex="0"]')
        ?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  function toggleOpen(e: MouseEvent) {
    e.stopPropagation();
    setOpen((prev) => !prev);
  }

  function close(returnFocus: boolean) {
    setOpen(false);
    if (returnFocus) anchorRef.current?.focus();
  }

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

  function handleDialogKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation();
      close(true);
      return;
    }
    if (e.key !== "Tab") return;
    // El Popper vive fuera del flujo del formulario: al salir por cualquiera
    // de sus extremos se cierra y el foco vuelve al campo.
    const stops = dialogRef.current?.querySelectorAll<HTMLElement>(
      '[tabindex="0"], button:not(:disabled)',
    );
    if (!stops?.length) return;
    const first = stops[0];
    const last = stops[stops.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      close(true);
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      close(true);
    }
  }

  const shown = parts ? formatTime12(value) : "";

  return (
    <Box>
      <Box
        component="span"
        id={labelId}
        sx={{
          display: "block",
          fontSize: fontScale[12],
          fontWeight: 500,
          color: error
            ? theme.palette.error.main
            : theme.palette.text.secondary,
          mb: 0.75,
        }}
      >
        {label}
        {required ? " *" : ""}
      </Box>

      <Box
        ref={anchorRef}
        component="button"
        type="button"
        onClick={toggleOpen}
        onKeyDown={(e: KeyboardEvent) => {
          if (e.key === "Escape" && open) {
            e.stopPropagation();
            setOpen(false);
          }
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={labelId}
        aria-required={required || undefined}
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
          transition: theme.transitions.create(["border-color"], {
            duration: theme.transitions.duration.shortest,
          }),
          "&:hover": {
            borderColor: error
              ? theme.palette.error.main
              : theme.palette.text.secondary,
          },
        }}
      >
        <Box
          component="span"
          sx={{
            fontFamily: typography.fontFamily.body,
            fontSize: fontScale[14],
            color: shown
              ? theme.palette.text.primary
              : theme.palette.text.secondary,
          }}
        >
          {shown || "Seleccionar hora"}
        </Box>
        <ScheduleRoundedIcon
          fontSize="small"
          sx={{ color: theme.palette.text.secondary, flexShrink: 0 }}
        />
      </Box>

      {error && helperText && (
        <Box
          component="p"
          id={`${labelId}-error`}
          role="alert"
          sx={{
            m: 0,
            mt: 0.75,
            ml: 1.75,
            fontSize: fontScale[12],
            color: theme.palette.error.main,
          }}
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
            ref={dialogRef}
            component={motion.div}
            role="dialog"
            aria-label={`${label} — elegir hora`}
            onKeyDown={handleDialogKeyDown}
            initial={reduceMotion ? false : { opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.16, ease: EASE }}
            sx={{
              width: 280,
              maxWidth: "calc(100vw - 32px)",
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: `${radius.md}px`,
              backgroundColor: theme.palette.background.paper,
              boxShadow: theme.shadows[8],
              p: 2,
            }}
          >
            <Box sx={{ display: "flex", gap: 1 }}>
              <Column
                label="Hora"
                options={hourOptions}
                onChoose={(c) => c && close(true)}
              />
              <Column
                label="Minutos"
                options={minuteOptions}
                onChoose={(c) => c && close(true)}
              />
              <Column
                label="a. m. o p. m."
                options={periodOptions}
                onChoose={(c) => c && close(true)}
              />
            </Box>
            <ButtonBase
              type="button"
              onClick={() => close(true)}
              sx={{
                mt: 1.5,
                width: "100%",
                minHeight: OPTION_HEIGHT,
                borderRadius: `${radius.sm}px`,
                border: `1px solid ${theme.palette.divider}`,
                fontFamily: typography.fontFamily.body,
                fontSize: fontScale[14],
                fontWeight: 600,
                color: theme.palette.text.primary,
                "&:hover": { backgroundColor: theme.palette.action.hover },
              }}
            >
              Listo
            </ButtonBase>
          </Box>
        </ClickAwayListener>
      </Popper>
    </Box>
  );
}
