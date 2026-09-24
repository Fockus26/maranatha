"use client";

import { useRef, useState } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import PageNavbar from "@/components/layout/PageNavbar";
import Footer from "@/components/layout/Footer";
import { ProjectDetailContent } from "@/components/ui/ProjectDetailContent";
import { ProjectSidebar } from "@/components/ui/ProjectSidebar";
import { ProjectContributionForm, type ProjectContributionFormValues } from "@/components/ui/ProjectContributionForm";
import { PaymentStep, type PaymentStepContribution } from "@/components/ui/PaymentStep";
import type { ProjectRecord } from "@/lib/projectsData";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonLd";
import { gray, semantic } from "@/theme/tokens";

/**
 * Parte interactiva de la página de detalle: botón "Aportar" del sidebar
 * abre un modal con `ProjectContributionForm` (D020) precargado con el
 * contexto del proyecto — mismo patrón que "Aportar" en Home/`/proyectos`
 * navega al detalle, y desde el detalle el aporte se resuelve sin salir de
 * la página.
 *
 * El formulario es el paso 1; al enviarlo, el mismo modal pasa al paso de
 * método de pago (`PaymentStep`). Los aportes a proyectos son siempre de
 * única vez.
 */
export function ProjectDetailClient({ project }: { project: ProjectRecord }) {
  const [contributeOpen, setContributeOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [contribution, setContribution] = useState<PaymentStepContribution | null>(null);
  const isCompleted = project.status === "completed";

  function handleContribute(values: ProjectContributionFormValues) {
    setContribution({
      purpose: "proyecto",
      projectSlug: project.slug,
      frequency: "once",
      amountUsd: values.amount,
      name: values.name,
      email: values.email,
    });
  }

  const stepOneRef = useRef<HTMLDivElement>(null);

  // Al volver, el botón "Volver" desaparece: el foco va al submit del paso 1
  // (que es desde donde el usuario había avanzado) en vez de caer al <body>.
  function handleBack() {
    setContribution(null);
    requestAnimationFrame(() => {
      stepOneRef.current?.querySelector<HTMLElement>('button[type="submit"]')?.focus();
    });
  }

  function handleClose() {
    setContributeOpen(false);
    setContribution(null);
  }

  function handleReported() {
    handleClose();
    setConfirmed(true);
  }

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Inicio", path: "/" },
          { name: "Proyectos", path: "/proyectos" },
          { name: project.title, path: `/proyectos/${project.slug}` },
        ])}
      />
      <PageNavbar />

      <Box component="main" id="main-content" sx={{ py: { xs: 6, md: 9 } }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 340px" },
              gap: { xs: 6, md: 8 },
              alignItems: "start",
            }}
          >
            <ProjectDetailContent
              title={project.title}
              description={project.longDescription}
              imageUrl={project.imageUrl}
              budget={project.budget}
            />

            <ProjectSidebar
              status={project.status}
              currentAmount={project.currentAmount}
              goalAmount={project.goalAmount}
              deadlineLabel={project.deadlineLabel}
              encargados={project.encargados}
              onCtaClick={() => (isCompleted ? undefined : setContributeOpen(true))}
            />
          </Box>
        </Container>
      </Box>

      <Footer />

      <Dialog
        open={contributeOpen}
        onClose={handleClose}
        maxWidth="xs"
        fullWidth
        aria-label={`Aportar a "${project.title}"`}
        slotProps={{ paper: { sx: { backgroundImage: "none", m: { xs: 2, sm: 4 } } } }}
      >
        <IconButton
          onClick={handleClose}
          aria-label="Cerrar"
          sx={{ position: "absolute", top: 8, right: 8, zIndex: 1, color: "text.secondary" }}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
        <DialogContent sx={{ p: { xs: 2.5, sm: 4 }, display: "flex", justifyContent: "center" }}>
          {/* Oculto (no desmontado) durante el paso 2: "Volver" conserva lo escrito. */}
          <Box ref={stepOneRef} sx={{ display: contribution ? "none" : "block" }}>
            <ProjectContributionForm
              projectTitle={project.title}
              projectImageUrl={project.imageUrl}
              currentAmount={project.currentAmount}
              goalAmount={project.goalAmount}
              onSubmit={handleContribute}
            />
          </Box>
          {contribution && (
            <PaymentStep
              contribution={contribution}
              summary={`Aporte a "${project.title}"`}
              onBack={handleBack}
              onReported={handleReported}
            />
          )}
        </DialogContent>
      </Dialog>

      <Snackbar open={confirmed} autoHideDuration={5000} onClose={() => setConfirmed(false)}>
        <Alert
          onClose={() => setConfirmed(false)}
          severity="success"
          variant="filled"
          sx={{
            width: "100%",
            bgcolor: semantic.successFilled,
            color: gray[50],
            "& .MuiAlert-icon, & .MuiAlert-action": { color: gray[50] },
          }}
        >
          ¡Gracias por tu aporte a &quot;{project.title}&quot;! Verificaremos tu pago en las próximas horas.
        </Alert>
      </Snackbar>
    </>
  );
}
