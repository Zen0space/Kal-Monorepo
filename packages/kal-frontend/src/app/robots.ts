import type { MetadataRoute } from "next";

/**
 * Robots.txt configuration for Kalori API
 * This tells search engines which pages to crawl and where to find the sitemap
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/search", "/api-docs"],
        disallow: [
          "/api/v1/", // Prevent crawling API endpoints
          "/callback", // Auth callback routes
          "/login-success", // Login flow pages
          "/_next/", // Next.js internal files
        ],
      },
      {
        // Specific rules for Googlebot
        userAgent: "Googlebot",
        allow: ["/", "/search", "/api-docs", "/dashboard"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
