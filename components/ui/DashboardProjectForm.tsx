"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import { type Theme, useTheme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { AnimatePresence, motion } from "framer-motion";
import { type FormEvent, useState } from "react";
import { SMALL_FIELD_SX } from "@/theme/fieldStyles";
import { radius, typography } from "@/theme/tokens";
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
  onCancel: () => void;
  /**
   * Cuando el form vive dentro de un modal propio (`DashboardProjectModal`),
   * el modal ya aporta el fondo/borde/radius de la tarjeta — si el form
   * agrega los suyos encima queda una "tarjeta dentro de otra tarjeta" con
   * espacio de fondo visible alrededor. `bare` quita el wrapper con borde,
   * fondo, ancho máximo y padding propios, dejando solo el contenido en
   * columna — mismo patrón ya usado en `SocialLinkCard` (prop `bare`, D036).
   */
  bare?: boolean;
}

const EASE = [0.2, 0.8, 0.2, 1] as const;

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function sectionLabelSx(theme: Theme) {
  return {
    fontFamily: typography.fontFamily.heading,
    fontWeight: 600,
    fontSize: "14px",
    color: theme.palette.text.primary,
  };
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
  onCancel,
  bare,
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
      noValidate
      onSubmit={handleSubmit}
      sx={
        bare
          ? { width: "100%" }
          : {
              maxWidth: 640,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: `${radius.lg}px`,
              backgroundColor: theme.palette.background.paper,
              p: 6,
            }
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 4.5 }}>
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

        <ImageUploadField
          label="Foto del proyecto"
          value={imageUrl}
          onChange={(value, file) => {
            setImageUrl(value);
            setImageFile(file);
          }}
        />

        {/* Fase 08: los grids de 2/3 columnas fijas de este formulario no
            cabían en mobile (modal angosto) — todos pasan a 1 columna por
            debajo de `sm`, sin cambiar nada en tablet/desktop. */}
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
              touched && !goalValid ? "Ingresá un monto mayor a 0." : undefined
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

        {/*
          Antes había un chip "Activo"/"Completado" al lado de este campo,
          calculado en vivo a partir de meta/recaudado — el cliente pidió
          quitarlo: no tiene sentido mostrar un estado derivado dentro del
          formulario que lo genera. El campo vuelve a ocupar todo el ancho.
        */}
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

        <Box sx={{ borderTop: `1px solid ${theme.palette.divider}`, pt: 4.5 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography sx={sectionLabelSx(theme)}>Presupuesto</Typography>
            <Button
              type="button"
              size="small"
              startIcon={<AddIcon />}
              onClick={addBudgetLine}
            >
              Agregar línea
            </Button>
          </Box>
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
        </Box>

        <Box sx={{ borderTop: `1px solid ${theme.palette.divider}`, pt: 4.5 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography sx={sectionLabelSx(theme)}>Encargados</Typography>
            <Button
              type="button"
              size="small"
              startIcon={<AddIcon />}
              onClick={addEncargado}
            >
              Agregar encargado
            </Button>
          </Box>
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
        </Box>

        <Box
          sx={{
            borderTop: `1px solid ${theme.palette.divider}`,
            pt: 4.5,
            display: "flex",
            gap: 2.5,
            justifyContent: "flex-end",
          }}
        >
          <Button
            type="button"
            variant="outlined"
            color="primary"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={submitting}
            sx={{ color: "#FFFFFF" }}
          >
            Guardar
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
