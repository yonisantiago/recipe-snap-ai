import type {Metadata} from 'next';
import { Geist } from 'next/font/google'; // Use Geist Sans only
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

// Remove Geist Mono unless specifically needed

export const metadata: Metadata = {
  title: 'Recipe Snap', // Update title
  description: 'Generate recipes from photos of your food!', // Update description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        {children}
        <Toaster /> {/* Add Toaster here */}
      </body>
    </html>
  );
}
