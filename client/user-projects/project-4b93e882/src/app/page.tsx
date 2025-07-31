import Stopwatch from '../components/Stopwatch';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <main className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-black">Stopwatch App</h1>
        <div className="max-w-md mx-auto">
          <Stopwatch />
        </div>
      </main>
    </div>
  );
}