// app/robots.ts — robots.txt configuration for SEO crawling
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cribconnect.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/listings", "/listings/*", "/agents", "/agents/*", "/requests"],
        disallow: [
          "/admin",
          "/agent/dashboard",
          "/messages",
          "/api/",
          "/_next/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
