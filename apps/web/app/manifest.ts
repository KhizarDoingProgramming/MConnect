import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MConnect',
    short_name: 'MConnect',
    description: 'Real-time chat for MConnect.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#111b21',
    theme_color: '#202c33',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
