import { useState, useCallback } from 'react';

interface UseClipboardOptions {
  successDuration?: number;
}

export const useClipboard = (options: UseClipboardOptions = {}) => {
  const { successDuration = 2000 } = options;
  const [hasCopied, setHasCopied] = useState(false);

  const copyToClipboard = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setHasCopied(true);
        
        // Reset the copied state after duration
        setTimeout(() => {
          setHasCopied(false);
        }, successDuration);

        return true;
      } catch (err) {
        console.error('Failed to copy text:', err);
        setHasCopied(false);
        return false;
      }
    },
    [successDuration]
  );

  return { hasCopied, copyToClipboard };
};