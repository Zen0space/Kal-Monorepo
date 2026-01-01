import type { MetadataRoute } from "next";

/**
 * Dynamic sitemap generator for Kalori API
 * This sitemap helps Google and other search engines discover and index all pages
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://kalori-api.my";
  const currentDate = new Date();

  // Main pages with their priorities and change frequencies
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 1.0, // Homepage - highest priority
    },
    {
      url: `${baseUrl}/search`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.9, // Food search - high priority, updated frequently
    },
    {
      url: `${baseUrl}/api-docs`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8, // API documentation - important for developers
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.7, // User dashboard
    },
    {
      url: `${baseUrl}/dashboard/api-keys`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.6, // API keys management
    },
    {
      url: `${baseUrl}/dashboard/settings`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.5, // User settings
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: currentDate,
      changeFrequency: "yearly",
      priority: 0.4, // Terms of Service
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: currentDate,
      changeFrequency: "yearly",
      priority: 0.4, // Privacy Policy
    },
  ];

  return staticPages;
}
