"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import Footer from "@/components/layout/Footer";
import PageNavbar from "@/components/layout/PageNavbar";
import { JsonLd } from "@/components/seo/JsonLd";
import { Container } from "@/components/ui/container";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  PaymentStep,
  type PaymentStepContribution,
} from "@/components/ui/PaymentStep";
import {
  ProjectContributionForm,
  type ProjectContributionFormValues,
} from "@/components/ui/ProjectContributionForm";
import { ProjectDetailContent } from "@/components/ui/ProjectDetailContent";
import { ProjectSidebar } from "@/components/ui/ProjectSidebar";
import { StepTransition } from "@/components/ui/StepTransition";
import { breadcrumbJsonLd } from "@/lib/jsonLd";
import type { ProjectRecord } from "@/lib/projectsData";

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
  const [contribution, setContribution] =
    useState<PaymentStepContribution | null>(null);
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
  // Quien abrió el modal: Radix solo devuelve el foco a un `DialogTrigger`
  // (aquí el botón vive en `ProjectSidebar`), así que se restaura a mano.
  const openerRef = useRef<HTMLElement | null>(null);

  // Al volver, el botón "Volver" desaparece: el foco va al submit del paso 1
  // (que es desde donde el usuario había avanzado) en vez de caer al <body>.
  function handleBack() {
    setContribution(null);
    requestAnimationFrame(() => {
      stepOneRef.current
        ?.querySelector<HTMLElement>('button[type="submit"]')
        ?.focus();
    });
  }

  function handleClose() {
    setContributeOpen(false);
    setContribution(null);
  }

  function handleReported() {
    handleClose();
    toast.success(
      `¡Gracias por tu aporte a "${project.title}"! Verificaremos tu pago en las próximas horas.`,
    );
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

      <main id="main-content" className="py-6 md:py-9">
        <Container maxWidth="lg">
          {/* valor único: contenido + barra lateral fija de 340 px */}
          <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[1fr_340px] md:gap-8">
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
              onCtaClick={() => {
                if (isCompleted) return;
                openerRef.current =
                  document.activeElement instanceof HTMLElement
                    ? document.activeElement
                    : null;
                setContributeOpen(true);
              }}
            />
          </div>
        </Container>
      </main>

      <Footer />

      <Dialog
        open={contributeOpen}
        onOpenChange={(open) => {
          if (!open) handleClose();
        }}
      >
        <DialogContent
          aria-label={`Aportar a "${project.title}"`}
          aria-describedby={undefined}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            openerRef.current?.focus();
          }}
          // Márgenes de 8 px (16 desde `sm`) como el papel de MUI; el paso
          // interior trae su propio ancho.
          className="flex max-w-[calc(100%-1rem)] justify-center p-2.5 sm:max-w-111 sm:p-4"
        >
          <DialogTitle asChild>
            <span className="sr-only">{`Aportar a "${project.title}"`}</span>
          </DialogTitle>
          {/* Paso 1 montado durante el paso 2: "Volver" conserva lo escrito (D087). */}
          <StepTransition
            showSecond={!!contribution}
            firstRef={stepOneRef}
            first={
              <ProjectContributionForm
                projectTitle={project.title}
                projectImageUrl={project.imageUrl}
                currentAmount={project.currentAmount}
                goalAmount={project.goalAmount}
                onSubmit={handleContribute}
              />
            }
            second={
              contribution && (
                <PaymentStep
                  contribution={contribution}
                  summary={`Aporte a "${project.title}"`}
                  onBack={handleBack}
                  onReported={handleReported}
                />
              )
            }
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
