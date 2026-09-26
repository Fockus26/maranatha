"use client";

import InstagramIcon from "@mui/icons-material/Instagram";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { Box, Container, IconButton } from "@mui/material";
import Link from "next/link";

// Fase 10 (QA): antes solo tenía 3 de las 5 anclas de Home — se completa
// con Prédicas y Redes para que coincida con `HOME_ANCHOR_ITEMS`
// (`components/layout/navItems.ts`), la misma fuente que usa el Navbar.
//
// Fase QA (functional-qa): los `href` eran relativos (`#areas`) — en toda
// página que no es Home resolvían a `/proyectos#areas`, un ancla que no
// existe ahí. Se prefijan con `/` para que naveguen a Home y hagan scroll.
const NAV_LINKS = [
  { label: "Áreas", href: "/#areas" },
  { label: "Liderazgo", href: "/#liderazgo" },
  { label: "Prédicas", href: "/#predicas" },
  { label: "Redes", href: "/#redes" },
  { label: "Agenda", href: "/#agenda" },
] as const;

// Fase 10 (QA): se quita "Nosotros" → `/nosotros` — esa ruta no existe en
// el árbol de páginas (`app/`), era un link roto (404).
const RESOURCE_LINKS = [{ label: "Proyectos", href: "/proyectos" }] as const;

const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/maranathasancristobal/",
    icon: InstagramIcon,
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/channel/UCT2A5hFBhTJ5T0CykeCKX7w",
    icon: YouTubeIcon,
  },
] as const;

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { label: string; href: string }[];
}) {
  return (
    <Box
      component="nav"
      aria-label={title}
      sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}
    >
      <Box
        component="span"
        sx={{
          fontFamily: "var(--font-body)",
          fontWeight: 500,
          fontSize: 12,
          "@media (min-width:1920px)": { fontSize: "14px" },
          color: "text.primary",
          mb: 0.5,
        }}
      >
        {title}
      </Box>
      <Box
        component="ul"
        sx={{
          listStyle: "none",
          m: 0,
          p: 0,
          display: "flex",
          flexDirection: "column",
          gap: 0.75,
        }}
      >
        {links.map((link) => (
          <Box component="li" key={link.href}>
            <Box
              component={Link}
              href={link.href}
              sx={{
                fontFamily: "var(--font-body)",
                fontSize: 12,
                "@media (min-width:1920px)": { fontSize: "14px" },
                color: "text.secondary",
                textDecoration: "none",
                "&:hover": { color: "secondary.main" },
              }}
            >
              {link.label}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "background.default",
        borderTop: "1px solid",
        borderColor: "divider",
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 4, lg: 8 } }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1.3fr 1fr 1fr 1fr" },
            gap: { xs: 3, sm: 3 },
          }}
        >
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: "4px",
                  bgcolor: "primary.main",
                }}
              />
              <Box
                component="span"
                sx={{
                  fontFamily: "var(--font-heading)",
                  fontWeight: 600,
                  fontSize: 13,
                  "@media (min-width:1920px)": { fontSize: "15px" },
                  color: (t) =>
                    t.palette.mode === "dark"
                      ? t.palette.primary.light
                      : t.palette.primary.main,
                }}
              >
                Iglesia
              </Box>
            </Box>
            <Box
              component="p"
              sx={{
                fontFamily: "var(--font-body)",
                fontSize: 11,
                "@media (min-width:1920px)": { fontSize: "13px" },
                lineHeight: 1.5,
                color: "text.secondary",
                m: 0,
              }}
            >
              Una comunidad creciendo en fe y propósito.
            </Box>
          </Box>

          <FooterColumn title="Navegación" links={NAV_LINKS} />
          <FooterColumn title="Recursos" links={RESOURCE_LINKS} />

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Box
              component="span"
              sx={{
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                fontSize: 12,
                "@media (min-width:1920px)": { fontSize: "14px" },
                color: "text.primary",
              }}
            >
              Conecta
            </Box>
            <Box
              component="a"
              href="mailto:contacto@iglesia.org"
              sx={{
                fontFamily: "var(--font-body)",
                fontSize: 12,
                "@media (min-width:1920px)": { fontSize: "14px" },
                color: "text.secondary",
                textDecoration: "none",
                "&:hover": { color: "secondary.main" },
              }}
            >
              contacto@iglesia.org
            </Box>
            <Box sx={{ display: "flex", gap: 0.75, mt: 0.5 }}>
              {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <IconButton
                  key={label}
                  component="a"
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${label} (se abre en una pestaña nueva)`}
                  size="small"
                  sx={{
                    width: 26,
                    height: 26,
                    borderRadius: "4px",
                    border: "1px solid",
                    borderColor: "divider",
                    color: "text.secondary",
                    "&:hover": {
                      color: "secondary.main",
                      borderColor: "secondary.main",
                    },
                  }}
                >
                  <Icon sx={{ fontSize: 14 }} />
                </IconButton>
              ))}
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            borderTop: "1px solid",
            borderColor: "divider",
            mt: { xs: 3, lg: 4 },
            pt: 1.5,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 1,
            justifyContent: "space-between",
            fontFamily: "var(--font-body)",
            fontSize: 11,
            "@media (min-width:1920px)": { fontSize: "13px" },
            // Fase 10 (QA): `text.muted` no existe en la paleta de MUI/tema
            // del proyecto (solo `text.primary`/`text.secondary`/`text.disabled`,
            // ver `theme/theme.ts`) — la barra de copyright se renderizaba con
            // el color heredado (más oscuro/marcado de lo previsto) en vez de
            // atenuado. Se corrige a `text.secondary`, el token real más cercano.
            color: "text.secondary",
          }}
        >
          <Box component="span">
            © 2026 Iglesia. Todos los derechos reservados.
          </Box>
          <Box component="span">Hecho con propósito</Box>
        </Box>
      </Container>
    </Box>
  );
}
