"use client";

import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import { fontScale, radius, typography } from "@/theme/tokens";

export interface BudgetLine {
  label: string;
  amount: number;
}

export interface ProjectDetailContentProps {
  title: string;
  description: string;
  imageUrl?: string;
  budget: BudgetLine[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ProjectDetailContent({
  title,
  description,
  imageUrl,
  budget,
}: ProjectDetailContentProps) {
  const theme = useTheme();

  return (
    <Box>
      <Box
        sx={{
          position: "relative",
          height: 320,
          borderRadius: `${radius.lg}px`,
          overflow: "hidden",
          mb: 5,
          backgroundColor: theme.palette.primary.dark,
        }}
      >
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={title}
            fill
            priority
            sizes="(max-width: 900px) 100vw, 1000px"
            style={{ objectFit: "cover" }}
          />
        )}
      </Box>

      <Typography
        component="h1"
        sx={{
          fontFamily: typography.fontFamily.heading,
          fontWeight: 700,
          fontSize: fontScale[22],
          color: theme.palette.text.primary,
          mb: 2,
        }}
      >
        {title}
      </Typography>

      <Typography
        sx={{
          fontFamily: typography.fontFamily.body,
          fontSize: theme.typography.body1.fontSize,
          lineHeight: 1.6,
          color: theme.palette.text.secondary,
          mb: 5,
          // Medida de lectura (design-qa fase 09): sin tope llegaba a ~117
          // caracteres por línea desde 1920px.
          maxWidth: "70ch",
        }}
      >
        {description}
      </Typography>

      <Box
        sx={{
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: `${radius.md}px`,
          backgroundColor: theme.palette.background.paper,
          p: 3.5,
        }}
      >
        <Typography
          sx={{
            fontFamily: typography.fontFamily.heading,
            fontWeight: 600,
            fontSize: fontScale[13],
            color: theme.palette.text.primary,
            mb: 2,
          }}
        >
          Presupuesto
        </Typography>

        {budget.map((line, index) => (
          <Box
            key={line.label}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: fontScale[12],
              color: theme.palette.text.secondary,
              py: 1.25,
              borderBottom:
                index < budget.length - 1
                  ? `1px solid ${theme.palette.divider}`
                  : "none",
            }}
          >
            <span>{line.label}</span>
            <span>{formatCurrency(line.amount)}</span>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
