import type {Metadata} from 'next';
import './globals.css';
import {Toaster} from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: "Bung'Kurir 📦 - Alat Tempur Kurir Indonesia Timur",
  description: 'Aplikasi pembantu kurir modern berbasis maps.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossOrigin="" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js');
            });
          }
        ` }} />
      </head>
      <body className="font-body antialiased selection:bg-primary selection:text-primary-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}