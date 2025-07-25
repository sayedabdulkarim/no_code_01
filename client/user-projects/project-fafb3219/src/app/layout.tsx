import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Counter Application',
  description: 'A simple counter application to track numerical counts',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main className="min-h-screen w-full bg-gray-50">
          <div className="container mx-auto max-w-2xl px-4 py-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
