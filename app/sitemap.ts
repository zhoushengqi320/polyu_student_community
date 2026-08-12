import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://polyuhub.com"

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      priority: 1.0
    },
    {
      url: `${baseUrl}/forum`,
      lastModified: new Date(),
      priority: 0.8
    },
    {
      url: `${baseUrl}/auth/login`,
      lastModified: new Date(),
      priority: 0.7
    },
    {
      url: `${baseUrl}/courses`,
      lastModified: new Date(),
      priority: 0.8
    },
    {
      url: `${baseUrl}/guide`,
      lastModified: new Date(),
      priority: 0.8
    }
  ]
}
