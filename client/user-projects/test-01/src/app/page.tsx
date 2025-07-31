import ColorPickerContainer from "../components/ColorPicker/Container";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-red-600 mb-2">
            Color Picker Tool ( COPYYY )
          </h1>
          <p className="text-gray-600">
            Select colors and get their hex codes instantly
          </p>
          <p className="text-gray-600 mt-2">
            A simple and intuitive tool for designers and developers to pick colors and copy their hex codes with a single click
          </p>
        </div>

        {/* Color Picker Component */}
        <ColorPickerContainer />

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>
            Click anywhere in the color spectrum to select a color. The hex code
            will update automatically.
          </p>
        </footer>
      </div>
    </div>
  );
}