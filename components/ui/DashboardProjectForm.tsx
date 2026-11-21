"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
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

// Quita las flechas nativas de incremento/decremento de los inputs
// numéricos — mismo criterio ya aplicado al monto libre de `TitheForm.tsx`
// (D057), el cliente tampoco las quiere acá.
const NUMBER_INPUT_CLASS =
  "appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none";

// Botón de texto "Agregar…": el primary en oscuro (3.1:1) no llega a AA.
const ADD_ACTION_CLASS = "text-primary-700 dark:text-primary-200";

/** Quitar una línea o un encargado: `IconButton size="small"` gris (30 px). */
const REMOVE_ACTION_CLASS =
  "self-center text-muted-foreground dark:text-muted-foreground";

export function DashboardProjectForm({
  initialValues,
  onSubmit,
  formId,
  onDirtyChange,
}: DashboardProjectFormProps) {
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
    <form id={formId} noValidate onSubmit={handleSubmit} className="w-full">
      <DrawerSection title="Información" first>
        <Field
          label="Título del proyecto"
          error={
            touched && !titleValid ? "El título es obligatorio." : undefined
          }
        >
          <Input
            data-autofocus=""
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>

        <Field label="Descripción">
          <Textarea
            className="min-h-19"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field
            label="Monto meta"
            error={
              touched && !goalValid ? "Ingresa un monto mayor a 0." : undefined
            }
          >
            <Input
              type="number"
              className={NUMBER_INPUT_CLASS}
              value={goalAmount || ""}
              onChange={(e) => setGoalAmount(Number(e.target.value))}
            />
          </Field>
          <DateField
            label="Fecha de cierre"
            value={deadline}
            onChange={setDeadline}
            error={touched && !deadlineValid}
            helperText="La fecha de cierre es obligatoria."
          />
        </div>

        <Field
          label="Monto recaudado"
          description="Para registrar aportes recibidos fuera del sitio"
          error={
            touched && currentAmount < 0
              ? "No puede ser negativo."
              : touched && goalValid && currentAmount > goalAmount
                ? "No puede superar el monto meta."
                : undefined
          }
        >
          <Input
            type="number"
            className={NUMBER_INPUT_CLASS}
            value={currentAmount || ""}
            onChange={(e) => setCurrentAmount(Number(e.target.value))}
          />
        </Field>
      </DrawerSection>

      <DrawerSection
        title="Presupuesto"
        action={
          <Button
            variant="text"
            size="small"
            className={ADD_ACTION_CLASS}
            onClick={addBudgetLine}
          >
            <Plus aria-hidden="true" className="size-4.5" />
            Agregar línea
          </Button>
        }
      >
        <div className="flex flex-col gap-2">
          {/* Sin `exit` — al cliente le gustó la animación de entrada pero
                no la de salida; sin ese prop, `AnimatePresence` desmonta el
                item de inmediato (sin animar su desaparición) mientras que
                el resto de líneas sigue reacomodándose suavemente gracias a
                `layout`, que no depende de `exit`. */}
          <AnimatePresence initial={false}>
            {budget.map((line) => (
              <motion.div
                key={line.id}
                layout
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.22, ease: EASE }}
                className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_160px_auto]"
              >
                <Input
                  placeholder="Concepto"
                  aria-label="Concepto de la línea de presupuesto"
                  value={line.label}
                  onChange={(e) =>
                    updateBudgetLine(line.id, { label: e.target.value })
                  }
                  className="col-span-full sm:col-span-1"
                />
                <Input
                  placeholder="Monto"
                  aria-label="Monto de la línea de presupuesto"
                  type="number"
                  inputMode="numeric"
                  value={line.amount || ""}
                  onChange={(e) =>
                    updateBudgetLine(line.id, {
                      amount: Number(e.target.value),
                    })
                  }
                  className={NUMBER_INPUT_CLASS}
                />
                <Button
                  variant="plain"
                  size="icon-sm"
                  onClick={() => removeBudgetLine(line.id)}
                  aria-label={
                    line.label
                      ? `Eliminar línea "${line.label}"`
                      : "Eliminar línea de presupuesto"
                  }
                  className={REMOVE_ACTION_CLASS}
                >
                  <Trash2 aria-hidden="true" className="size-5" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </DrawerSection>

      <DrawerSection
        title="Encargados"
        action={
          <Button
            variant="text"
            size="small"
            className={ADD_ACTION_CLASS}
            onClick={addEncargado}
          >
            <Plus aria-hidden="true" className="size-4.5" />
            Agregar encargado
          </Button>
        }
      >
        <div className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {encargados.map((encargado) => (
              <motion.div
                key={encargado.id}
                layout
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.22, ease: EASE }}
                className="rounded-md border border-border p-3"
              >
                <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Field label="Nombre">
                    <Input
                      value={encargado.name}
                      onChange={(e) =>
                        updateEncargado(encargado.id, { name: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Rol">
                    <Input
                      value={encargado.role}
                      onChange={(e) =>
                        updateEncargado(encargado.id, { role: e.target.value })
                      }
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-[1fr_auto] items-end gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <Field
                    label="URL de foto"
                    className="col-span-full sm:col-span-1"
                  >
                    <Input
                      value={encargado.imageUrl}
                      onChange={(e) =>
                        updateEncargado(encargado.id, {
                          imageUrl: e.target.value,
                        })
                      }
                    />
                  </Field>
                  <Field label="Instagram (opcional)">
                    <Input
                      value={encargado.instagramUrl}
                      onChange={(e) =>
                        updateEncargado(encargado.id, {
                          instagramUrl: e.target.value,
                        })
                      }
                    />
                  </Field>
                  <Button
                    variant="plain"
                    size="icon-sm"
                    onClick={() => removeEncargado(encargado.id)}
                    aria-label={
                      encargado.name
                        ? `Eliminar a ${encargado.name}`
                        : "Eliminar encargado"
                    }
                    className={cn(REMOVE_ACTION_CLASS, "mb-1.25 self-end")}
                  >
                    <Trash2 aria-hidden="true" className="size-5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </DrawerSection>
    </form>
  );
}
