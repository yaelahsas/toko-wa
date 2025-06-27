import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TOKO SEMBAKO SRI REJEKI UTAMA - Belanja Dekat, Lebih Hemat',
  description: 'Toko online sembako dan voucher digital dengan harga terjangkau. Belanja mudah via WhatsApp, pengiriman cepat, dan berbagai promo menarik.',
  keywords: 'toko sembako, voucher digital, belanja online, toko online murah, voucher game, sembako murah',
  authors: [{ name: 'Toko Sembako Sri Rejeki Utama' }],
  creator: 'Toko Sembako Sri Rejeki Utama',
  publisher: 'Toko Sembako Sri Rejeki Utama',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'TOKO SEMBAKO SRI REJEKI UTAMA - Belanja Dekat, Lebih Hemat',
    description: 'Toko online sembako dan voucher digital dengan harga terjangkau. Belanja mudah via WhatsApp, pengiriman cepat, dan berbagai promo menarik.',
    url: '/',
    siteName: 'Toko Sembako Sri Rejeki Utama',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Toko Sembako Sri Rejeki Utama',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TOKO SEMBAKO SRI REJEKI UTAMA - Belanja Dekat, Lebih Hemat',
    description: 'Toko online sembako dan voucher digital dengan harga terjangkau.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
