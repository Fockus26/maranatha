import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Skeleton from "@mui/material/Skeleton";
import PageNavbar from "@/components/layout/PageNavbar";
import { radius } from "@/theme/tokens";

/**
 * Esqueleto de las páginas públicas con fetch en servidor (D095): navbar
 * real (queda quieta) + título y tarjetas en gris mientras llega el contenido.
 */
export function PublicPageSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <>
      <PageNavbar />
      <Box
        component="main"
        id="main-content"
        aria-busy="true"
        sx={{ py: { xs: 8, md: 12 }, minHeight: "100vh" }}
      >
        <Container maxWidth="lg">
          <Skeleton variant="text" width="45%" sx={{ fontSize: 40 }} />
          <Skeleton variant="text" width="70%" sx={{ fontSize: 18, mb: 5 }} />
          <Box
            sx={{
              display: "grid",
              gap: 3,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
              },
            }}
          >
            {Array.from({ length: cards }, (_, i) => (
              <Skeleton
                // biome-ignore lint/suspicious/noArrayIndexKey: lista fija de esqueletos
                key={i}
                variant="rounded"
                height={280}
                sx={{ borderRadius: `${radius.lg}px` }}
              />
            ))}
          </Box>
        </Container>
      </Box>
    </>
  );
}
