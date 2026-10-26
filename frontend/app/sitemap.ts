import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const PATHS: string[] = [
  "/landing",
  "/signup",
  "/use-cases",
  "/about",
  "/faq",
  "/team",
  "/contact",
  "/privacy",
  "/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  if (!SITE_URL) return [];
  return PATHS.map((path) => ({ url: `${SITE_URL}${path}` }));
}
