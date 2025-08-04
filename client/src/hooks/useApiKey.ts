import { useState, useEffect } from 'react';
import { shouldShowApiKeyModal, requiresUserApiKey } from '../utils/environment';
import { useSocket } from '../context/SocketContext';

interface UseApiKeyReturn {
  apiKey: string | null;
  showModal: boolean;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  hasValidKey: boolean;
}

/**
 * Hook to manage API key state and modal visibility
 */
export const useApiKey = (): UseApiKeyReturn => {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { sendApiKey, isConnected } = useSocket();

  // Initialize API key from sessionStorage on mount
  useEffect(() => {
    const storedKey = sessionStorage.getItem('anthropic_api_key');
    if (storedKey) {
      setApiKeyState(storedKey);
    }
    
    // Determine if modal should be shown
    setShowModal(shouldShowApiKeyModal());
  }, []);

  // Send API key to backend when socket connects and we have a key
  useEffect(() => {
    if (isConnected && apiKey) {
      sendApiKey(apiKey);
    }
  }, [isConnected, apiKey, sendApiKey]);

  const setApiKey = (key: string) => {
    setApiKeyState(key);
    sessionStorage.setItem('anthropic_api_key', key);
    setShowModal(false);
    
    // Send to backend immediately if socket is connected
    if (isConnected) {
      sendApiKey(key);
    }
  };

  const clearApiKey = () => {
    setApiKeyState(null);
    sessionStorage.removeItem('anthropic_api_key');
    
    // Show modal again if in production
    if (requiresUserApiKey()) {
      setShowModal(true);
    }
  };

  const hasValidKey = apiKey !== null && apiKey.startsWith('sk-ant-api');

  return {
    apiKey,
    showModal,
    setApiKey,
    clearApiKey,
    hasValidKey
  };
};