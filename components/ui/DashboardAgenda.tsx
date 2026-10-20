"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Snackbar from "@mui/material/Snackbar";
import { useTheme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { type FormEvent, useId, useState, useTransition } from "react";
import {
  type AgendaActionError,
  createAgendaEvent,
  editAgendaEvent,
  removeAgendaEvent,
} from "@/app/actions/adminAgenda";
import {
  type AgendaEvent,
  type AgendaEventKind,
  agendaEventInputSchema,
  formatStartTime,
  isRealDate,
  parseLocalDate,
  WEEKDAY_NAMES,
} from "@/lib/agenda/schema";
import { SMALL_FIELD_SX } from "@/theme/fieldStyles";
import { radius, semantic, typography } from "@/theme/tokens";
import { ConfirmDialog } from "./ConfirmDialog";
import { DateField } from "./DateField";
import { EmptyState } from "./EmptyState";

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
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const titleValid = form.title.trim().length > 0;
  const locationValid = form.location.trim().length > 0;
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
    <Dialog
      open={open}
      onClose={pending ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { elevation: 0 } }}
    >
      <Box component="form" noValidate onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700, px: 3.5, pt: 3.5, pb: 1 }}>
          {editing ? "Editar evento" : "Nuevo evento"}
        </DialogTitle>
        <DialogContent
          sx={{
            px: 3.5,
            pb: 1,
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <Box component="fieldset" sx={{ border: 0, p: 0, m: 0, mt: 1 }}>
            <FormLabel
              component="legend"
              id={kindLabelId}
              sx={{ fontSize: typography.size.small }}
            >
              Tipo de evento
            </FormLabel>
            <RadioGroup
              row
              aria-labelledby={kindLabelId}
              value={form.kind}
              onChange={(e) => set("kind", e.target.value as AgendaEventKind)}
            >
              <FormControlLabel
                value="recurring"
                control={<Radio size="small" />}
                label="Cada semana"
              />
              <FormControlLabel
                value="one_time"
                control={<Radio size="small" />}
                label="Fecha única"
              />
            </RadioGroup>
          </Box>

          <TextField
            size="small"
            label="Nombre"
            required
            fullWidth
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            error={touched && !titleValid}
            helperText={
              touched && !titleValid ? "El nombre es obligatorio." : undefined
            }
            slotProps={{ htmlInput: { maxLength: 120 } }}
            sx={SMALL_FIELD_SX}
          />

          {form.kind === "recurring" ? (
            <TextField
              select
              size="small"
              label="Día de la semana"
              fullWidth
              value={form.weekday}
              onChange={(e) => set("weekday", Number(e.target.value))}
              sx={SMALL_FIELD_SX}
            >
              {WEEKDAY_NAMES.map((name, i) => (
                <MenuItem key={name} value={i}>
                  {name}
                </MenuItem>
              ))}
            </TextField>
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

          <TextField
            size="small"
            type="time"
            label="Hora"
            required
            fullWidth
            value={form.startTime}
            onChange={(e) => set("startTime", e.target.value)}
            error={touched && !timeValid}
            helperText={touched && !timeValid ? "Elige la hora." : undefined}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={SMALL_FIELD_SX}
          />

          <TextField
            size="small"
            label="Lugar"
            required
            fullWidth
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            error={touched && !locationValid}
            helperText={
              touched && !locationValid ? "El lugar es obligatorio." : undefined
            }
            slotProps={{ htmlInput: { maxLength: 120 } }}
            sx={SMALL_FIELD_SX}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3.5, pb: 3.5, pt: 2 }}>
          <Button
            onClick={onClose}
            color="primary"
            variant="outlined"
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            color="primary"
            variant="contained"
            loading={pending}
            sx={{ color: "#FFFFFF" }}
          >
            {editing ? "Guardar cambios" : "Crear evento"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
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
  const theme = useTheme();
  const isPast =
    event.kind === "one_time" &&
    event.eventDate !== null &&
    event.eventDate < todayValue();
  const when =
    event.kind === "recurring"
      ? `Cada ${WEEKDAY_NAMES[event.weekday ?? 0].toLowerCase()}`
      : DATE_FORMATTER.format(parseLocalDate(event.eventDate ?? todayValue()));

  return (
    <Box
      component="li"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        px: { xs: 2, sm: 3 },
        py: 2,
        "&:not(:last-of-type)": {
          borderBottom: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: typography.size.body,
            color: theme.palette.text.primary,
            overflowWrap: "anywhere",
          }}
        >
          {event.title}
          {isPast && (
            <Typography
              component="span"
              sx={{
                ml: 1,
                fontSize: typography.size.small,
                fontWeight: 500,
                color: theme.palette.text.secondary,
              }}
            >
              (ya pasó)
            </Typography>
          )}
        </Typography>
        <Typography
          sx={{
            fontSize: typography.size.small,
            color: theme.palette.text.secondary,
            overflowWrap: "anywhere",
            "&::first-letter": { textTransform: "uppercase" },
          }}
        >
          {when} · {formatStartTime(event.startTime)} · {event.location}
        </Typography>
      </Box>
      <IconButton aria-label={`Editar ${event.title}`} onClick={onEdit}>
        <EditOutlinedIcon fontSize="small" />
      </IconButton>
      <IconButton aria-label={`Eliminar ${event.title}`} onClick={onDelete}>
        <DeleteOutlineRoundedIcon fontSize="small" />
      </IconButton>
    </Box>
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
  const theme = useTheme();
  const headingId = useId();
  return (
    <Box component="section" aria-labelledby={headingId} sx={{ mb: 5 }}>
      <Typography
        id={headingId}
        component="h2"
        sx={{
          fontFamily: typography.fontFamily.heading,
          fontWeight: 700,
          fontSize: typography.size.h4.mobile,
          color: theme.palette.text.primary,
          mb: 1.5,
        }}
      >
        {title}
      </Typography>
      <Box
        sx={{
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: `${radius.lg}px`,
          backgroundColor: theme.palette.background.paper,
          overflow: "hidden",
        }}
      >
        {events.length === 0 ? (
          <EmptyState icon={EventBusyRoundedIcon} title={emptyText} compact />
        ) : (
          <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
            {events.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                onEdit={() => onEdit(event)}
                onDelete={() => onDelete(event)}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}

export function DashboardAgenda({
  events,
  loadError,
}: {
  events: AgendaEvent[];
  loadError: boolean;
}) {
  const theme = useTheme();
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<{
    key: number;
    editing: AgendaEvent | null;
  } | null>(null);
  const [deleting, setDeleting] = useState<AgendaEvent | null>(null);
  const [toast, setToast] = useState<{ message: string; ok: boolean } | null>(
    null,
  );

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
        setToast({ ok: false, message: NETWORK_ERROR_TEXT });
        return;
      }
      if (result.ok) setDialog(null);
      setToast({
        ok: result.ok,
        message: result.ok
          ? editing
            ? "Evento actualizado."
            : "Evento creado."
          : ACTION_ERROR_TEXT[result.error],
      });
    });
  }

  function handleDelete() {
    if (!deleting) return;
    const target = deleting;
    startTransition(async () => {
      const result = await callAction(() => removeAgendaEvent(target.id));
      if (!result) {
        setToast({ ok: false, message: NETWORK_ERROR_TEXT });
        return;
      }
      setDeleting(null);
      setToast({
        ok: result.ok,
        message: result.ok
          ? "Evento eliminado."
          : ACTION_ERROR_TEXT[result.error],
      });
    });
  }

  return (
    <Box
      sx={{
        px: { xs: 3, md: 5 },
        pt: { xs: "32px", md: "48px" },
        pb: 5,
        maxWidth: 1000,
        mx: "auto",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 4,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            component="h1"
            sx={{
              fontFamily: typography.fontFamily.heading,
              fontWeight: 800,
              fontSize: 26,
              color: theme.palette.text.primary,
              mb: 0.5,
            }}
          >
            Agenda
          </Typography>
          <Typography
            sx={{ fontSize: 13, color: theme.palette.text.secondary }}
          >
            Lo que se muestra en la sección «Agenda» de la página de inicio.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => openDialog(null)}
          disabled={loadError}
          sx={{ color: "#FFFFFF" }}
        >
          Nuevo evento
        </Button>
      </Box>

      {loadError ? (
        <Alert severity="error" role="alert">
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
        onClose={() => (pending ? undefined : setDeleting(null))}
      />

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={5000}
        onClose={() => setToast(null)}
      >
        <Alert
          onClose={() => setToast(null)}
          severity={toast?.ok ? "success" : "error"}
          variant="filled"
          sx={
            toast?.ok
              ? {
                  bgcolor: semantic.successFilled,
                  color: "#FFFFFF",
                  "& .MuiAlert-icon, & .MuiAlert-action": { color: "#FFFFFF" },
                }
              : undefined
          }
        >
          {toast?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
