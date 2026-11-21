"use client";

import { CalendarX, Pencil, Plus, Trash2 } from "lucide-react";
import { type FormEvent, useId, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  type AgendaActionError,
  createAgendaEvent,
  editAgendaEvent,
  removeAgendaEvent,
} from "@/app/actions/adminAgenda";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type AgendaEvent,
  type AgendaEventKind,
  agendaEventInputSchema,
  formatStartTime,
  isRealDate,
  parseLocalDate,
  WEEKDAY_NAMES,
} from "@/lib/agenda/schema";
import type { PanelVersion } from "@/lib/panelFreshness";
import { ConfirmDialog } from "./ConfirmDialog";
import { DashboardFormDrawer, DrawerSection } from "./DashboardFormDrawer";
import { DateField } from "./DateField";
import { EmptyState } from "./EmptyState";
import { PanelFreshness } from "./PanelFreshness";
import { TimeField } from "./TimeField";

/**
 * Panel de la agenda (`/dashboard/agenda`): las reuniones semanales y los
 * eventos especiales que muestra la sección "Agenda" del home. Los datos
 * llegan del Server Component; cada acción (crear, editar, borrar) es una
 * Server Action que revalida la página, así que la lista se refresca sola
 * sin estado local que sincronizar.
 */

const ACTION_ERROR_TEXT: Record<AgendaActionError, string> = {
  unauthorized: "Tu sesión expiró. Vuelve a iniciar sesión.",
  invalid_input: "Revisa los datos del evento.",
  not_found: "Ese evento ya no existe. Recarga la página.",
  server_error: "No se pudo completar la acción. Prueba de nuevo.",
};

/**
 * La Server Action no respondió (red caída o 500). Sin esto la excepción sube
 * al error boundary, reemplaza todo el panel y se pierde lo escrito en el
 * diálogo (mismo patrón que `DashboardPayments`).
 */
const NETWORK_ERROR_TEXT =
  "No hubo respuesta del servidor. Revisa tu conexión y la lista antes de intentarlo de nuevo.";

/** Llama a la Server Action y convierte un fallo de red en `null`. */
async function callAction<T>(action: () => Promise<T>): Promise<T | null> {
  try {
    return await action();
  } catch {
    return null;
  }
}

const DATE_FORMATTER = new Intl.DateTimeFormat("es-VE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function todayValue() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface FormState {
  kind: AgendaEventKind;
  weekday: number;
  eventDate: string;
  startTime: string;
  title: string;
  location: string;
}

function emptyForm(): FormState {
  return {
    kind: "recurring",
    weekday: 0,
    eventDate: todayValue(),
    startTime: "19:00",
    title: "",
    location: "",
  };
}

function formFromEvent(event: AgendaEvent): FormState {
  return {
    kind: event.kind,
    weekday: event.weekday ?? 0,
    eventDate: event.eventDate ?? todayValue(),
    startTime: event.startTime,
    title: event.title,
    location: event.location,
  };
}

function toInput(form: FormState) {
  const common = {
    startTime: form.startTime,
    title: form.title,
    location: form.location,
  };
  return form.kind === "recurring"
    ? { kind: "recurring" as const, weekday: form.weekday, ...common }
    : { kind: "one_time" as const, eventDate: form.eventDate, ...common };
}

/** Aviso de resultado (antes `Snackbar` + `Alert filled`): éxito o error. */
function notify(message: string, ok: boolean) {
  if (ok) toast.success(message);
  else toast.error(message);
}

function AgendaEventDialog({
  open,
  initial,
  editing,
  pending,
  onClose,
  onSubmit,
}: {
  open: boolean;
  initial: FormState;
  editing: boolean;
  pending: boolean;
  onClose: () => void;
  onSubmit: (form: FormState) => void;
}) {
  const [form, setForm] = useState(initial);
  const [touched, setTouched] = useState(false);
  const kindLabelId = useId();
  const formId = useId();
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const titleValid = form.title.trim().length > 0;
  const locationValid = form.location.trim().length > 0;
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const timeValid = /^([01]\d|2[0-3]):[0-5]\d$/.test(form.startTime);
  const dateValid =
    form.kind === "recurring" ||
    (Boolean(form.eventDate) && isRealDate(form.eventDate));

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched(true);
    if (!agendaEventInputSchema.safeParse(toInput(form)).success) return;
    onSubmit(form);
  }

  return (
    <DashboardFormDrawer
      open={open}
      title={editing ? "Editar evento" : "Nuevo evento"}
      formId={formId}
      dirty={dirty}
      saving={pending}
      submitLabel={editing ? "Guardar cambios" : "Crear evento"}
      onClose={onClose}
    >
      <form id={formId} noValidate onSubmit={handleSubmit}>
        <DrawerSection title="Evento" first>
          <fieldset className="m-0 border-0 p-0">
            <legend
              id={kindLabelId}
              className="mb-1 p-0 text-14 leading-body text-muted-foreground"
            >
              Tipo de evento
            </legend>
            <RadioGroup
              aria-labelledby={kindLabelId}
              value={form.kind}
              onValueChange={(v) => set("kind", v as AgendaEventKind)}
              className="flex flex-wrap gap-x-4 gap-y-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem
                  value="recurring"
                  id={`${kindLabelId}-recurring`}
                />
                <label
                  htmlFor={`${kindLabelId}-recurring`}
                  className="cursor-pointer text-small"
                >
                  Cada semana
                </label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem
                  value="one_time"
                  id={`${kindLabelId}-one-time`}
                />
                <label
                  htmlFor={`${kindLabelId}-one-time`}
                  className="cursor-pointer text-small"
                >
                  Fecha única
                </label>
              </div>
            </RadioGroup>
          </fieldset>

          <Field
            label="Nombre"
            required
            error={
              touched && !titleValid ? "El nombre es obligatorio." : undefined
            }
          >
            <Input
              required
              data-autofocus=""
              maxLength={120}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </Field>
        </DrawerSection>

        <DrawerSection title="Cuándo">
          {form.kind === "recurring" ? (
            <Field label="Día de la semana">
              {(control) => (
                <Select
                  value={String(form.weekday)}
                  onValueChange={(v) => set("weekday", Number(v))}
                >
                  <SelectTrigger {...control}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {WEEKDAY_NAMES.map((name, i) => (
                      <SelectItem key={name} value={String(i)}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </Field>
          ) : (
            <DateField
              label="Fecha"
              value={form.eventDate}
              onChange={(v) => set("eventDate", v)}
              error={touched && !dateValid}
              helperText={
                touched && !dateValid
                  ? "Elige una fecha válida entre 2000 y 2100."
                  : undefined
              }
            />
          )}

          <TimeField
            label="Hora"
            required
            value={form.startTime}
            onChange={(v) => set("startTime", v)}
            error={touched && !timeValid}
            helperText={touched && !timeValid ? "Elige la hora." : undefined}
          />
        </DrawerSection>

        <DrawerSection title="Dónde">
          <Field
            label="Lugar"
            required
            error={
              touched && !locationValid ? "El lugar es obligatorio." : undefined
            }
          >
            <Input
              required
              maxLength={120}
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
            />
          </Field>
        </DrawerSection>
      </form>
    </DashboardFormDrawer>
  );
}

function EventRow({
  event,
  onEdit,
  onDelete,
}: {
  event: AgendaEvent;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isPast =
    event.kind === "one_time" &&
    event.eventDate !== null &&
    event.eventDate < todayValue();
  const when =
    event.kind === "recurring"
      ? `Cada ${WEEKDAY_NAMES[event.weekday ?? 0].toLowerCase()}`
      : DATE_FORMATTER.format(parseLocalDate(event.eventDate ?? todayValue()));

  return (
    <li className="flex items-center gap-2 px-2 py-2 not-last:border-b not-last:border-border sm:px-3">
      <div className="min-w-0 flex-1">
        <p className="text-16 leading-body font-semibold text-foreground wrap-anywhere">
          {event.title}
          {isPast && (
            <span className="ml-1 text-14 font-medium text-muted-foreground">
              (ya pasó)
            </span>
          )}
        </p>
        <p className="text-14 leading-body text-muted-foreground wrap-anywhere first-letter:uppercase">
          {when} · {formatStartTime(event.startTime)} · {event.location}
        </p>
      </div>
      <Button
        variant="plain"
        size="icon"
        aria-label={`Editar ${event.title}`}
        onClick={onEdit}
      >
        <Pencil aria-hidden="true" className="size-5" />
      </Button>
      <Button
        variant="plain"
        size="icon"
        aria-label={`Eliminar ${event.title}`}
        onClick={onDelete}
      >
        <Trash2 aria-hidden="true" className="size-5" />
      </Button>
    </li>
  );
}

function EventGroup({
  title,
  events,
  emptyText,
  onEdit,
  onDelete,
}: {
  title: string;
  events: AgendaEvent[];
  emptyText: string;
  onEdit: (event: AgendaEvent) => void;
  onDelete: (event: AgendaEvent) => void;
}) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="mb-5">
      <h2
        id={headingId}
        className="mb-1.5 font-heading text-18 font-bold text-foreground"
      >
        {title}
      </h2>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {events.length === 0 ? (
          <EmptyState icon={CalendarX} title={emptyText} compact />
        ) : (
          <ul className="m-0 list-none p-0">
            {events.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                onEdit={() => onEdit(event)}
                onDelete={() => onDelete(event)}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export function DashboardAgenda({
  events,
  loadError,
  version,
}: {
  events: AgendaEvent[];
  loadError: boolean;
  /** Versión de los datos con la que se renderizó (D104); null si no se leyó. */
  version: PanelVersion | null;
}) {
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<{
    key: number;
    editing: AgendaEvent | null;
  } | null>(null);
  const [deleting, setDeleting] = useState<AgendaEvent | null>(null);

  const recurring = events.filter((e) => e.kind === "recurring");
  const oneTime = events.filter((e) => e.kind === "one_time");

  function openDialog(editing: AgendaEvent | null) {
    // `key` nuevo en cada apertura: el formulario arranca limpio.
    setDialog({ key: Date.now(), editing });
  }

  function handleSubmit(form: FormState) {
    const editing = dialog?.editing ?? null;
    startTransition(async () => {
      const input = toInput(form);
      const result = await callAction(() =>
        editing ? editAgendaEvent(editing.id, input) : createAgendaEvent(input),
      );
      // El diálogo queda abierto con lo escrito: el admin puede reintentar.
      if (!result) {
        notify(NETWORK_ERROR_TEXT, false);
        return;
      }
      if (result.ok) setDialog(null);
      notify(
        result.ok
          ? editing
            ? "Evento actualizado."
            : "Evento creado."
          : ACTION_ERROR_TEXT[result.error],
        result.ok,
      );
    });
  }

  function handleDelete() {
    if (!deleting) return;
    const target = deleting;
    startTransition(async () => {
      const result = await callAction(() => removeAgendaEvent(target.id));
      if (!result) {
        notify(NETWORK_ERROR_TEXT, false);
        return;
      }
      setDeleting(null);
      notify(
        result.ok ? "Evento eliminado." : ACTION_ERROR_TEXT[result.error],
        result.ok,
      );
    });
  }

  return (
    <div className="mx-auto w-full max-w-[1000px] px-3 pt-8 pb-5 md:px-5 md:pt-12">
      <PanelFreshness scope="agenda" version={version} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="mb-0.5 font-heading text-26 font-extrabold text-foreground">
            Agenda
          </h1>
          <p className="text-13 leading-body text-muted-foreground">
            Lo que se muestra en la sección «Agenda» de la página de inicio.
          </p>
        </div>
        <Button
          variant="contained"
          color="primary"
          onClick={() => openDialog(null)}
          disabled={loadError}
        >
          <Plus aria-hidden="true" className="size-5" />
          Nuevo evento
        </Button>
      </div>

      {loadError ? (
        <Alert severity="error">
          No se pudo cargar la agenda. Recarga la página en unos minutos.
        </Alert>
      ) : (
        <>
          <EventGroup
            title="Reuniones semanales"
            events={recurring}
            emptyText="No hay reuniones semanales."
            onEdit={openDialog}
            onDelete={setDeleting}
          />
          <EventGroup
            title="Eventos especiales"
            events={oneTime}
            emptyText="No hay eventos especiales."
            onEdit={openDialog}
            onDelete={setDeleting}
          />
        </>
      )}

      {dialog && (
        <AgendaEventDialog
          key={dialog.key}
          open
          editing={Boolean(dialog.editing)}
          initial={dialog.editing ? formFromEvent(dialog.editing) : emptyForm()}
          pending={pending}
          onClose={() => setDialog(null)}
          onSubmit={handleSubmit}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Eliminar evento"
        description={
          <>
            Se quitará <strong>{deleting?.title}</strong> de la agenda del
            sitio. Esta acción no se puede deshacer.
          </>
        }
        confirmLabel="Eliminar"
        destructive
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
        pending={pending}
      />
    </div>
  );
}
