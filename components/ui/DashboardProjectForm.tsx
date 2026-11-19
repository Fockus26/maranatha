"use client";

import AddIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import { AnimatePresence, motion } from "framer-motion";
import { type FormEvent, useEffect, useState } from "react";
import { SMALL_FIELD_SX } from "@/theme/fieldStyles";
import { radius } from "@/theme/tokens";
import { DrawerSection } from "./DashboardFormDrawer";
import { DateField } from "./DateField";
import { ImageUploadField } from "./ImageUploadField";

export interface BudgetLineInput {
  id: string;
  label: string;
  amount: number;
}

export interface EncargadoInput {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
  instagramUrl: string;
}

export interface DashboardProjectFormValues {
  title: string;
  description: string;
  imageUrl: string;
  imageFile?: File;
  goalAmount: number;
  currentAmount: number;
  deadline: string;
  budget: BudgetLineInput[];
  encargados: EncargadoInput[];
}

export interface DashboardProjectFormProps {
  initialValues?: Partial<DashboardProjectFormValues>;
  onSubmit: (values: DashboardProjectFormValues) => void;
  /** `id` del `<form>`: el pie de `DashboardFormDrawer` lo envía con `form=` (D096). */
  formId: string;
  /** Avisa si hay cambios sin guardar respecto a `initialValues`. */
  onDirtyChange?: (dirty: boolean) => void;
}

const EASE = [0.2, 0.8, 0.2, 1] as const;

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

// Tamaño de placeholder/label/texto ingresado — antes heredaban el default de
// MUI (16px), que se sentía grande al lado del resto de texto del form
// (mismo ajuste ya hecho en `TitheForm.tsx`, D057). Se aplica a todos los
// `TextField` del formulario.
//
// Revisión: la primera versión apuntaba solo a `.MuiInputLabel-root`, lo que
// dejaba un hueco visible a la derecha del label cuando este "flota" hacia
// arriba — el notch del borde (`NotchedOutline`, variante `outlined`) mide su
// ancho con `font-size: 0.75em` relativo al tamaño de fuente del contenedor,
// no del label en sí; al no tocar ese contenedor, el notch seguía
// calculándose sobre el tamaño por defecto (16px) mientras el label ya
// medía 14px, dejando el hueco de más. Poner `fontSize` a nivel raíz del
// `TextField` (hereda por CSS a input, label Y notch) resuelve ambos a la
// vez.
// Campos chicos (14px, label y hueco del borde a la misma escala) — mismo
// estilo que los formularios de aporte y login (theme/fieldStyles.ts).
function fieldSx() {
  return SMALL_FIELD_SX;
}

// Quita las flechas nativas de incremento/decremento de los inputs
// numéricos — mismo criterio ya aplicado al monto libre de `TitheForm.tsx`
// (D057), el cliente tampoco las quiere acá.
function numberFieldSx() {
  return {
    ...fieldSx(),
    "& input[type=number]": { MozAppearance: "textfield" },
    "& input[type=number]::-webkit-outer-spin-button": {
      WebkitAppearance: "none",
      margin: 0,
    },
    "& input[type=number]::-webkit-inner-spin-button": {
      WebkitAppearance: "none",
      margin: 0,
    },
  };
}

export function DashboardProjectForm({
  initialValues,
  onSubmit,
  formId,
  onDirtyChange,
}: DashboardProjectFormProps) {
  const theme = useTheme();

  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [description, setDescription] = useState(
    initialValues?.description ?? "",
  );
  const [imageUrl, setImageUrl] = useState(initialValues?.imageUrl ?? "");
  const [imageFile, setImageFile] = useState<File | undefined>(
    initialValues?.imageFile,
  );
  const [goalAmount, setGoalAmount] = useState(initialValues?.goalAmount ?? 0);
  const [currentAmount, setCurrentAmount] = useState(
    initialValues?.currentAmount ?? 0,
  );
  const [deadline, setDeadline] = useState(initialValues?.deadline ?? "");
  const [budget, setBudget] = useState<BudgetLineInput[]>(
    initialValues?.budget ?? [],
  );
  const [encargados, setEncargados] = useState<EncargadoInput[]>(
    initialValues?.encargados ?? [],
  );
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [initialSnapshot] = useState(() =>
    JSON.stringify([
      initialValues?.title ?? "",
      initialValues?.description ?? "",
      initialValues?.imageUrl ?? "",
      initialValues?.goalAmount ?? 0,
      initialValues?.currentAmount ?? 0,
      initialValues?.deadline ?? "",
      initialValues?.budget ?? [],
      initialValues?.encargados ?? [],
    ]),
  );
  const snapshot = JSON.stringify([
    title,
    description,
    imageUrl,
    goalAmount,
    currentAmount,
    deadline,
    budget,
    encargados,
  ]);
  const dirty = snapshot !== initialSnapshot;
  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  const titleValid = title.trim().length > 0;
  const goalValid = goalAmount > 0;
  const deadlineValid = deadline.trim().length > 0;
  // El recaudado no puede ser negativo ni superar la meta (un tipeo que lo
  // pasara marcaba el proyecto como "Completado" y bloqueaba la edición).
  const currentValid =
    currentAmount >= 0 && (!goalValid || currentAmount <= goalAmount);
  const formValid = titleValid && goalValid && deadlineValid && currentValid;

  function addBudgetLine() {
    setBudget((prev) => [...prev, { id: newId(), label: "", amount: 0 }]);
  }
  function updateBudgetLine(id: string, patch: Partial<BudgetLineInput>) {
    setBudget((prev) =>
      prev.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    );
  }
  function removeBudgetLine(id: string) {
    setBudget((prev) => prev.filter((line) => line.id !== id));
  }

  function addEncargado() {
    setEncargados((prev) => [
      ...prev,
      { id: newId(), name: "", role: "", imageUrl: "", instagramUrl: "" },
    ]);
  }
  function updateEncargado(id: string, patch: Partial<EncargadoInput>) {
    setEncargados((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }
  function removeEncargado(id: string) {
    setEncargados((prev) => prev.filter((item) => item.id !== id));
  }

  function handleSubmit(event?: FormEvent) {
    event?.preventDefault();
    setTouched(true);
    if (!formValid || submitting) return;
    // Guard contra doble/triple submit (fase QA — functional-qa: 3 clics
    // rápidos creaban 3 proyectos). `currentAmount` se acota a ≥ 0 (un
    // negativo daba "-80%" en la tabla).
    setSubmitting(true);
    onSubmit({
      title: title.trim(),
      description,
      imageUrl,
      imageFile,
      goalAmount,
      currentAmount: Math.max(currentAmount, 0),
      deadline,
      budget,
      encargados,
    });
  }

  return (
    <Box
      component="form"
      id={formId}
      noValidate
      onSubmit={handleSubmit}
      sx={{ width: "100%" }}
    >
      <DrawerSection title="Información" first>
        <TextField
          size="small"
          label="Título del proyecto"
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={touched && !titleValid}
          helperText={
            touched && !titleValid ? "El título es obligatorio." : undefined
          }
          sx={fieldSx()}
        />

        <TextField
          size="small"
          label="Descripción"
          fullWidth
          multiline
          minRows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={fieldSx()}
        />
      </DrawerSection>

      <DrawerSection title="Imagen">
        <ImageUploadField
          label="Foto del proyecto"
          value={imageUrl}
          onChange={(value, file) => {
            setImageUrl(value);
            setImageFile(file);
          }}
        />
      </DrawerSection>

      <DrawerSection title="Meta y fechas">
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 3,
          }}
        >
          <TextField
            size="small"
            label="Monto meta"
            type="number"
            fullWidth
            value={goalAmount || ""}
            onChange={(e) => setGoalAmount(Number(e.target.value))}
            error={touched && !goalValid}
            helperText={
              touched && !goalValid ? "Ingresa un monto mayor a 0." : undefined
            }
            sx={numberFieldSx()}
          />
          <DateField
            label="Fecha de cierre"
            value={deadline}
            onChange={setDeadline}
            error={touched && !deadlineValid}
            helperText="La fecha de cierre es obligatoria."
          />
        </Box>

        <TextField
          size="small"
          label="Monto recaudado"
          type="number"
          fullWidth
          value={currentAmount || ""}
          onChange={(e) => setCurrentAmount(Number(e.target.value))}
          error={touched && !currentValid}
          helperText={
            touched && currentAmount < 0
              ? "No puede ser negativo."
              : touched && goalValid && currentAmount > goalAmount
                ? "No puede superar el monto meta."
                : "Para registrar aportes recibidos fuera del sitio"
          }
          sx={numberFieldSx()}
        />
      </DrawerSection>

      <DrawerSection
        title="Presupuesto"
        action={
          <Button
            type="button"
            size="small"
            startIcon={<AddIcon />}
            onClick={addBudgetLine}
          >
            Agregar línea
          </Button>
        }
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Sin `exit` — al cliente le gustó la animación de entrada pero
                no la de salida; sin ese prop, `AnimatePresence` desmonta el
                item de inmediato (sin animar su desaparición) mientras que
                el resto de líneas sigue reacomodándose suavemente gracias a
                `layout`, que no depende de `exit`. */}
          <AnimatePresence initial={false}>
            {budget.map((line) => (
              <Box
                key={line.id}
                component={motion.div}
                layout
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.22, ease: EASE }}
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr auto",
                    sm: "1fr 160px auto",
                  },
                  gap: 2,
                }}
              >
                <TextField
                  placeholder="Concepto"
                  aria-label="Concepto de la línea de presupuesto"
                  size="small"
                  value={line.label}
                  onChange={(e) =>
                    updateBudgetLine(line.id, { label: e.target.value })
                  }
                  sx={{
                    ...fieldSx(),
                    gridColumn: { xs: "1 / -1", sm: "auto" },
                  }}
                />
                <TextField
                  placeholder="Monto"
                  aria-label="Monto de la línea de presupuesto"
                  type="number"
                  inputMode="numeric"
                  size="small"
                  value={line.amount || ""}
                  onChange={(e) =>
                    updateBudgetLine(line.id, {
                      amount: Number(e.target.value),
                    })
                  }
                  sx={numberFieldSx()}
                />
                <IconButton
                  type="button"
                  size="small"
                  onClick={() => removeBudgetLine(line.id)}
                  aria-label={
                    line.label
                      ? `Eliminar línea "${line.label}"`
                      : "Eliminar línea de presupuesto"
                  }
                  sx={{ color: theme.palette.text.secondary }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </AnimatePresence>
        </Box>
      </DrawerSection>

      <DrawerSection
        title="Encargados"
        action={
          <Button
            type="button"
            size="small"
            startIcon={<AddIcon />}
            onClick={addEncargado}
          >
            Agregar encargado
          </Button>
        }
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <AnimatePresence initial={false}>
            {encargados.map((encargado) => (
              <Box
                key={encargado.id}
                component={motion.div}
                layout
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.22, ease: EASE }}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: `${radius.md}px`,
                  p: 3,
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 2,
                    mb: 2,
                  }}
                >
                  <TextField
                    label="Nombre"
                    size="small"
                    value={encargado.name}
                    onChange={(e) =>
                      updateEncargado(encargado.id, { name: e.target.value })
                    }
                    sx={fieldSx()}
                  />
                  <TextField
                    label="Rol"
                    size="small"
                    value={encargado.role}
                    onChange={(e) =>
                      updateEncargado(encargado.id, { role: e.target.value })
                    }
                    sx={fieldSx()}
                  />
                </Box>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr auto",
                      sm: "1fr 1fr auto",
                    },
                    gap: 2,
                    alignItems: "center",
                  }}
                >
                  <TextField
                    label="URL de foto"
                    size="small"
                    value={encargado.imageUrl}
                    onChange={(e) =>
                      updateEncargado(encargado.id, {
                        imageUrl: e.target.value,
                      })
                    }
                    sx={{
                      ...fieldSx(),
                      gridColumn: { xs: "1 / -1", sm: "auto" },
                    }}
                  />
                  <TextField
                    label="Instagram (opcional)"
                    size="small"
                    value={encargado.instagramUrl}
                    onChange={(e) =>
                      updateEncargado(encargado.id, {
                        instagramUrl: e.target.value,
                      })
                    }
                    sx={fieldSx()}
                  />
                  <IconButton
                    type="button"
                    size="small"
                    onClick={() => removeEncargado(encargado.id)}
                    aria-label={
                      encargado.name
                        ? `Eliminar a ${encargado.name}`
                        : "Eliminar encargado"
                    }
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            ))}
          </AnimatePresence>
        </Box>
      </DrawerSection>
    </Box>
  );
}
