// Define types for the style classes
export interface ColorPickerStyles {
  container: string;
  pickerWrapper: string;
  colorPicker: string;
  previewSection: string;
  previewSwatch: string;
  hexCode: string;
}

// Export the styles using Tailwind CSS classes
export const styles: ColorPickerStyles = {
  // Main container with responsive padding and flex layout
  container: [
    'w-full',
    'max-w-3xl',
    'mx-auto',
    'p-4',
    'md:p-6',
    'lg:p-8',
    'flex',
    'flex-col',
    'md:flex-row',
    'gap-6',
    'items-center',
    'md:items-start',
    'justify-center',
    'min-h-[400px]',
    'bg-white',
    'rounded-lg',
    'shadow-lg'
  ].join(' '),

  // Wrapper for the color picker element
  pickerWrapper: [
    'w-full',
    'md:w-2/3',
    'aspect-square',
    'rounded-lg',
    'overflow-hidden',
    'shadow-md'
  ].join(' '),

  // Color picker canvas/element
  colorPicker: [
    'w-full',
    'h-full',
    'cursor-pointer',
    'touch-none', // Prevent unwanted touch events on mobile
    'select-none' // Prevent text selection
  ].join(' '),

  // Preview section container
  previewSection: [
    'w-full',
    'md:w-1/3',
    'flex',
    'flex-col',
    'gap-4',
    'items-center',
    'justify-center',
    'p-4'
  ].join(' '),

  // Color preview swatch
  previewSwatch: [
    'w-32',
    'h-32',
    'rounded-lg',
    'shadow-inner',
    'border',
    'border-gray-200'
  ].join(' '),

  // Hex code display
  hexCode: [
    'font-mono',
    'text-lg',
    'font-semibold',
    'bg-gray-100',
    'px-4',
    'py-2',
    'rounded',
    'select-all',
    'cursor-pointer'
  ].join(' ')
};