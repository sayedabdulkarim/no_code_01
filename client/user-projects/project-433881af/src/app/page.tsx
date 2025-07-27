import ColorPicker from '../components/ColorPicker';

export default function Home() {
  return (
    <main className="min-h-screen p-8 flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-8">Color Picker</h1>
      <ColorPicker />
    </main>
  );
}
