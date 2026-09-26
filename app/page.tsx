import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { Agenda } from "@/components/sections/Agenda";
import { Hero } from "@/components/sections/Hero";
import { History } from "@/components/sections/History";
import { Leaders } from "@/components/sections/Leaders";
import { Sermons } from "@/components/sections/Sermons";
import { ServiceAreas } from "@/components/sections/ServiceAreas";
import { SocialLinks } from "@/components/sections/SocialLinks";
import { JsonLd } from "@/components/seo/JsonLd";
import { PhotoAnchorBand } from "@/components/ui/PhotoAnchorBand";
import { getAllInstagramPosts } from "@/lib/instagram";
import { organizationJsonLd, sermonsJsonLd, webSiteJsonLd } from "@/lib/jsonLd";
import { getLatestSermons } from "@/lib/youtube";

export const metadata: Metadata = {
  // El title queda como el `default` de la plantilla (app/layout.tsx).
  alternates: { canonical: "/" },
};

/**
 * Home (fase 07, ritmo visual — /design): entre Áreas de Servicio → Liderazgo
 * y entre Agenda → Historia se insertan "anclas fotográficas" con parallax
 * (`PhotoAnchorBand`, Dirección B elegida) — los dos tramos donde más se
 * repetía el mismo tratamiento bordered/plano seguido. Contenido (foto y
 * stat) placeholder, mismo criterio que el resto del sitio.
 */
export default async function Home() {
  const [sermons, instagramPosts] = await Promise.all([
    getLatestSermons(3),
    getAllInstagramPosts(4),
  ]);
  const sermonsLd = sermonsJsonLd(sermons);

  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd(),
          webSiteJsonLd(),
          ...(sermonsLd ? [sermonsLd] : []),
        ]}
      />
      <Navbar />
      <main id="main-content">
        <Hero />
        <ServiceAreas />
        <PhotoAnchorBand
          eyebrow="Comunidad"
          value="+400"
          label="personas sirviendo cada semana, en cinco áreas distintas"
          imageUrl="https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=1920&h=1080&fit=crop&q=80"
        />
        <Leaders />
        <Sermons videos={sermons} />
        <SocialLinks postsByAccount={instagramPosts} />
        <Agenda />
        <PhotoAnchorBand
          eyebrow="Nuestra historia"
          value="11 años"
          label="construyendo comunidad, un domingo a la vez"
          imageUrl="https://images.unsplash.com/photo-1438032005730-c779502df39b?w=1920&h=1080&fit=crop&q=80"
        />
        <History />
      </main>
      <Footer />
    </>
  );
}
