// app/sitemap.ts — Auto-generated sitemap for SEO
import { MetadataRoute } from "next";
import { getListingsStore, getUsersStore } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://cribconnect-gold.vercel.app";

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

  const [listings, users] = await Promise.all([
    getListingsStore().catch(() => []),
    getUsersStore().catch(() => []),
  ]);

  const listingRoutes: MetadataRoute.Sitemap = listings.map((l) => ({
    url: `${baseUrl}/listings/${l.id}`,
    lastModified: l.createdAt ? new Date(l.createdAt) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const agentIds = new Set<string>();
  for (const u of users) {
    if (u.role === "AGENT" || u.role === "LANDLORD") agentIds.add(u.id);
  }
  for (const l of listings) {
    if (l.agentId) agentIds.add(l.agentId);
  }

  const agentRoutes: MetadataRoute.Sitemap = Array.from(agentIds).map((agentId) => ({
    url: `${baseUrl}/agents/${agentId}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...listingRoutes, ...agentRoutes];
}
