import PageNavbar from "@/components/layout/PageNavbar";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Esqueleto de las páginas públicas con fetch en servidor (D095): navbar
 * real (queda quieta) + título y tarjetas en gris mientras llega el contenido.
 */
export function PublicPageSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <>
      <PageNavbar />
      <main
        id="main-content"
        aria-busy="true"
        className="min-h-screen py-8 md:py-12"
      >
        <Container maxWidth="lg">
          {/* valor único: anchos relativos (45 % / 70 %) del título y la bajada simulados */}
          <Skeleton className="my-2.5 h-8 w-[45%]" />
          <Skeleton className="mt-1 mb-5 h-4 w-[70%]" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {Array.from({ length: cards }, (_, i) => (
              <Skeleton
                // biome-ignore lint/suspicious/noArrayIndexKey: lista fija de esqueletos
                key={i}
                className="h-70 rounded-lg"
              />
            ))}
          </div>
        </Container>
      </main>
    </>
  );
}
