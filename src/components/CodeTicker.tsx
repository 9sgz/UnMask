import { useEffect, useState } from 'react';

const generateRandomCode = () => {
  const types = [
    () => `0x${Math.random().toString(16).substr(2, 8).toUpperCase()}`,
    () => `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    () => `#${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    () => `${Math.random().toString(36).substr(2, 12).toUpperCase()}`,
    () => `${Math.floor(Math.random() * 9999)}:${Math.floor(Math.random() * 9999)}`,
  ];
  return types[Math.floor(Math.random() * types.length)]();
};

export const CodeTicker = () => {
  const [codes, setCodes] = useState<string[]>([]);

  useEffect(() => {
    // Gerar códigos iniciais
    const initialCodes = Array.from({ length: 50 }, () => generateRandomCode());
    setCodes(initialCodes);

    // Atualizar alguns códigos periodicamente
    const interval = setInterval(() => {
      setCodes(prev => {
        const newCodes = [...prev];
        const randomIndex = Math.floor(Math.random() * newCodes.length);
        newCodes[randomIndex] = generateRandomCode();
        return newCodes;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none overflow-hidden bg-background/80 backdrop-blur-sm border-b border-border/50">
      <div className="ticker-wrapper">
        <div className="ticker-content">
          {codes.map((code, index) => (
            <span
              key={`${code}-${index}`}
              className="ticker-item text-primary/70 font-mono text-sm mx-4"
            >
              {code}
            </span>
          ))}
        </div>
        <div className="ticker-content" aria-hidden="true">
          {codes.map((code, index) => (
            <span
              key={`${code}-${index}-duplicate`}
              className="ticker-item text-primary/70 font-mono text-sm mx-4"
            >
              {code}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
