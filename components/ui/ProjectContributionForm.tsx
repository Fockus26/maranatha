"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useTheme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { MAX_AMOUNT_USD, MIN_AMOUNT_USD } from "@/lib/payments/schema";
import { isValidEmail } from "@/lib/validation";
import { SMALL_FIELD_SX } from "@/theme/fieldStyles";
import { radius, typography } from "@/theme/tokens";
import { AmountSelector } from "./AmountSelector";
import { DonationFormCard } from "./DonationFormCard";

export interface ProjectContributionFormValues {
  amount: number;
  name: string;
  email: string;
}

export interface ProjectContributionFormProps {
  projectTitle: string;
  projectImageUrl?: string;
  currentAmount: number;
  goalAmount: number;
  presetAmounts?: number[];
  onSubmit: (values: ProjectContributionFormValues) => void;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ProjectContributionForm({
  projectTitle,
  projectImageUrl,
  currentAmount,
  goalAmount,
  presetAmounts = [25, 50, 100],
  onSubmit,
}: ProjectContributionFormProps) {
  const theme = useTheme();
  const basePct = Math.min((currentAmount / goalAmount) * 100, 100);

  const [amount, setAmount] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [displayPct, setDisplayPct] = useState(basePct);

  const highlighted = amount > 0;
  const valueRef = useRef(basePct);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const target = highlighted
      ? Math.min(((currentAmount + amount) / goalAmount) * 100, 100)
      : basePct;
    const from = valueRef.current;
    const duration = 600;
    const startTime = performance.now();

    if (frameRef.current) cancelAnimationFrame(frameRef.current);

    function step(now: number) {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - (1 - t) ** 3;
      const value = from + (target - from) * eased;
      valueRef.current = value;
      setDisplayPct(value);
      if (t < 1) frameRef.current = requestAnimationFrame(step);
    }
    frameRef.current = requestAnimationFrame(step);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [amount, highlighted, currentAmount, goalAmount, basePct]);

  // Mismos límites que valida el servidor (lib/payments/schema.ts).
  const amountValid = amount >= MIN_AMOUNT_USD && amount <= MAX_AMOUNT_USD;
  const nameValid = name.trim().length > 0;
  const emailValid = isValidEmail(email);
  const formValid = amountValid && nameValid && emailValid;

  function handleSubmit(event?: FormEvent) {
    event?.preventDefault();
    setTouched(true);
    if (!formValid) return;
    // Sin guard de `submitting`: el submit solo avanza al paso de pago
    // (sincrónico, sin red), y el formulario queda montado para que "Volver"
    // conserve lo escrito — un bloqueo permanente lo dejaba inutilizable.
    onSubmit({ amount, name: name.trim(), email: email.trim() });
  }

  const barTransition = theme.transitions.create(
    ["width", "background-color"],
    {
      duration: 600,
      easing: theme.transitions.easing.easeInOut,
    },
  );
  const numberTransition = theme.transitions.create(["color", "font-size"], {
    duration: 300,
    easing: theme.transitions.easing.easeInOut,
  });

  return (
    <Box component="form" noValidate onSubmit={handleSubmit}>
      <DonationFormCard>
        <Box
          sx={{
            display: "flex",
            gap: 2.5,
            alignItems: "center",
            pb: 4,
            mb: 4.5,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: `${radius.md}px`,
              flexShrink: 0,
              backgroundImage: projectImageUrl
                ? `url(${projectImageUrl})`
                : undefined,
              backgroundColor: projectImageUrl
                ? undefined
                : theme.palette.primary.dark,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontFamily: typography.fontFamily.heading,
                fontWeight: 600,
                fontSize: "13px",
                color: theme.palette.text.primary,
                mb: 0.5,
              }}
            >
              {projectTitle}
            </Typography>
            <Typography
              sx={{
                fontFamily: typography.fontFamily.body,
                fontSize: "11px",
                color: theme.palette.text.secondary,
              }}
            >
              {formatCurrency(currentAmount)} de {formatCurrency(goalAmount)}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            position: "relative",
            height: 8,
            borderRadius: "20px",
            backgroundColor: theme.palette.action.hover,
            overflow: "hidden",
            mb: 1.5,
          }}
        >
          <Box
            sx={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              borderRadius: "20px",
              width: `${displayPct}%`,
              backgroundColor: highlighted
                ? theme.palette.success.main
                : theme.palette.secondary.main,
              transition: barTransition,
            }}
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            mb: 4.5,
          }}
        >
          <Typography
            sx={{
              fontFamily: typography.fontFamily.heading,
              fontWeight: 700,
              fontSize: highlighted ? "22px" : "15px",
              color: highlighted
                ? theme.palette.success.main
                : theme.palette.text.primary,
              transition: numberTransition,
            }}
          >
            {displayPct.toFixed(2)}%
          </Typography>
          <Typography
            sx={{
              fontFamily: typography.fontFamily.body,
              fontSize: "11px",
              color: theme.palette.text.secondary,
            }}
          >
            recaudado
          </Typography>
        </Box>

        <Typography
          sx={{
            fontFamily: typography.fontFamily.body,
            fontSize: "12px",
            fontWeight: 500,
            color: theme.palette.text.primary,
            mb: 2,
          }}
        >
          Monto a aportar
        </Typography>
        <Box sx={{ mb: 3.5 }}>
          <AmountSelector
            presets={presetAmounts}
            onChange={setAmount}
            error={touched && !amountValid}
            helperText="Elegí un monto entre US$ 1 y US$ 10.000."
          />
        </Box>

        <Box
          sx={{ display: "flex", flexDirection: "column", gap: 3.5, mb: 4.5 }}
        >
          <TextField
            label="Nombre completo"
            fullWidth
            size="small"
            sx={SMALL_FIELD_SX}
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={touched && !nameValid}
            helperText={
              touched && !nameValid ? "Ingresá tu nombre completo." : undefined
            }
          />
          <TextField
            label="Correo electrónico"
            type="email"
            fullWidth
            size="small"
            sx={SMALL_FIELD_SX}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={touched && !emailValid}
            helperText={
              touched && !emailValid
                ? "Ingresá un correo electrónico válido."
                : undefined
            }
          />
        </Box>

        <Box sx={{ borderTop: `1px solid ${theme.palette.divider}`, pt: 4.5 }}>
          <Button fullWidth type="submit" variant="contained" color="secondary">
            Continuar al pago
          </Button>
        </Box>
      </DonationFormCard>
    </Box>
  );
}
