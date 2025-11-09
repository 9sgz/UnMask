/// <reference types="chrome" />

// Extension Popup Component - Adapted for Chrome Extension
import { useEffect, useState } from 'react';
import { SecurityScanner } from './components/SecurityScanner';

export const ExtensionPopup = () => {
  const [currentTabUrl, setCurrentTabUrl] = useState('');

  useEffect(() => {
    // Get current tab URL when popup opens
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        setCurrentTabUrl(tabs[0].url);
      }
    });
  }, []);

  return (
    <div style={{ width: '600px', minHeight: '500px' }}>
      <SecurityScanner initialUrl={currentTabUrl} extensionMode={true} />
    </div>
  );
};
