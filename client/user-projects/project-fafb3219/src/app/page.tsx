'use client';

import CounterContainer from '@/components/CounterContainer';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md px-4 py-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Counter Application
        </h1>
        <CounterContainer />
      </div>
    </main>
  );
}
