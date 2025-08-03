import ColorPickerContainer from "../components/ColorPicker/Container";
import ColorDisplay from "../components/ColorDisplay";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-yellow-500 mb-2 relative inline-block px-4 py-2 group">
            <span className="relative z-10">Color Picker Tool</span>
            {/* Enhanced sliding border animation */}
            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-yellow-500 transform scale-x-0 origin-left transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
            <span className="absolute inset-x-0 top-0 h-0.5 bg-yellow-500 transform scale-x-0 origin-right transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
            <span className="absolute inset-y-0 left-0 w-0.5 bg-yellow-500 transform scale-y-0 origin-bottom transition-transform duration-300 ease-out group-hover:scale-y-100"></span>
            <span className="absolute inset-y-0 right-0 w-0.5 bg-yellow-500 transform scale-y-0 origin-top transition-transform duration-300 ease-out group-hover:scale-y-100"></span>
          </h1>
          <p className="text-gray-600 group relative inline-block">
            <span className="relative z-10">Select colors and get their hex codes instantly</span>
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-yellow-400 transform scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
          </p>
        </div>

        {/* Sample Colors Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <ColorDisplay hexColor="#FF0000" />
          <ColorDisplay hexColor="#00FF00" />
          <ColorDisplay hexColor="#0000FF" />
        </div>

        {/* Color Picker Component */}
        <ColorPickerContainer />

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-500 group">
          <p className="relative inline-block">
            <span className="relative z-10">
              Click anywhere in the color spectrum to select a color. The hex code
              will update automatically.
            </span>
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-300 transform scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
          </p>
        </footer>
      </div>
    </div>
  );
}