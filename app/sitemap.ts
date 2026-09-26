import type { MetadataRoute } from "next";
import { PROJECTS } from "@/lib/projectsData";
import { SITE_URL } from "@/lib/siteConfig";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/proyectos`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...PROJECTS.map((project) => ({
      url: `${SITE_URL}/proyectos/${project.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
