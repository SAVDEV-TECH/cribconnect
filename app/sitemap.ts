// app/sitemap.ts — Auto-generated sitemap for SEO
import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cribconnect.vercel.app";

  // Static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/listings`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/agents`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/requests`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  // Dynamic listing pages
  let listingRoutes: MetadataRoute.Sitemap = [];
  let agentRoutes: MetadataRoute.Sitemap = [];
  try {
    const listings = await prisma.listing.findMany({
      where: { isAvailable: true },
      select: { id: true, updatedAt: true },
    });
    listingRoutes = listings.map((l) => ({
      url: `${baseUrl}/listings/${l.id}`,
      lastModified: l.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    const agents = await prisma.agentProfile.findMany({
      where: { verificationStatus: "VERIFIED" },
      select: { userId: true, updatedAt: true },
    });
    agentRoutes = agents.map((a) => ({
      url: `${baseUrl}/agents/${a.userId}`,
      lastModified: a.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {
    // Silently fail during build if DB not yet set up
  }

  return [...staticRoutes, ...listingRoutes, ...agentRoutes];
}
