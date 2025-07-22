import Counter from '@/components/Counter'

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Counter Application
        </h1>
        <Counter />
      </div>
    </main>
  )
}
