'use client';

import Counter from '@/components/Counter';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <main className="flex flex-col items-center gap-8">
        <h1 className="text-4xl font-bold">Counter App</h1>
        <Counter />
      </main>
    </div>
  );
}