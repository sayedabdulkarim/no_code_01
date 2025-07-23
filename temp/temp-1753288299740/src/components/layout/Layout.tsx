'use client';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <main 
        className="container mx-auto max-w-2xl bg-white rounded-lg shadow-sm p-6"
        aria-label="Main content"
      >
        {children}
      </main>
    </div>
  );
}
