import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'MIN MURASU — Digital Growth CRM & Client Portal',
    template: '%s | MIN MURASU CRM',
  },
  description:
    'Turn Digital Attention Into Business Growth. Agency CRM, Campaign ROI, Lead Pipeline, WhatsApp Business CRM, and Client Growth Portal for MIN MURASU.',
  icons: {
    icon: '/brand/min-murasu-logo.png',
    apple: '/brand/min-murasu-logo.png',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
