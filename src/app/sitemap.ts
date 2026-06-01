import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://studiopilot.com";

  return [
    { url: baseUrl, lastModified: new Date(), priority: 1.0 },
    { url: `${baseUrl}/auth/login`, lastModified: new Date(), priority: 0.8 },
    { url: `${baseUrl}/book`, lastModified: new Date(), priority: 0.9 },
  ];
}
