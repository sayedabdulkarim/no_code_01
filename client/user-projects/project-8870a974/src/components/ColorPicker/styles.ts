import { HexColor } from '../../types/color';

export const colorPickerStyles = {
  container: 'flex flex-col gap-4 p-4 md:p-6 rounded-lg shadow-lg bg-white w-full max-w-md mx-auto',
  
  previewSection: 'flex flex-col sm:flex-row items-start sm:items-center gap-4',
  colorPreview: 'w-16 h-16 sm:w-20 sm:h-20 rounded-lg shadow-inner',
  
  infoSection: 'flex flex-col gap-2 w-full sm:w-auto',
  label: 'text-sm font-medium text-gray-700',
  
  codeContainer: 'flex items-center gap-2 w-full sm:w-auto',
  hexCode: 'px-2 py-1 bg-gray-100 rounded font-mono text-sm',
  copyButton: 'px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 transition-colors focus:ring-2 focus:ring-blue-300 focus:outline-none',
  
  pickerArea: 'w-full h-40 sm:h-48 md:h-56 bg-gray-100 rounded-lg',
  
  presetContainer: 'flex flex-wrap gap-2 justify-center sm:justify-start',
  presetColor: 'w-8 h-8 sm:w-10 sm:h-10 rounded-full shadow hover:scale-110 transition-transform focus:ring-2 focus:ring-blue-300 focus:outline-none',
};

export const getColorPickerStyles = (selectedColor: HexColor, showCopyFeedback: boolean) => ({
  ...colorPickerStyles,
  colorPreviewStyle: {
    backgroundColor: selectedColor,
  },
  copyButtonClasses: `${colorPickerStyles.copyButton} ${
    showCopyFeedback ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'
  }`,
});