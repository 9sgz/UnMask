import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CyberCrime {
  id: string;
  crime_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  source_country: string;
  target_country: string;
  status: 'active' | 'mitigated' | 'resolved';
}

export const useRealtimeAlerts = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const processedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Criar elemento de áudio para alertas
    audioRef.current = new Audio();
    audioRef.current.volume = 0.5;

    // Subscrever a mudanças em tempo real
    const channel = supabase
      .channel('critical-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cyber_crimes',
          filter: 'severity=eq.critical'
        },
        (payload) => {
          const newCrime = payload.new as CyberCrime;
          
          // Evitar alertas duplicados
          if (!processedIds.current.has(newCrime.id)) {
            processedIds.current.add(newCrime.id);
            triggerAlert(newCrime);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const triggerAlert = (crime: CyberCrime) => {
    // Tocar som de alerta
    playAlertSound();

    // Mostrar notificação visual
    toast({
      title: '🚨 AMEAÇA CRÍTICA DETECTADA!',
      description: `${crime.crime_type}: ${crime.description}. Origem: ${crime.source_country} → Destino: ${crime.target_country}`,
      variant: 'destructive',
      duration: 10000,
    });

    // Notificação do navegador (se permitido)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🚨 Ameaça Crítica Detectada', {
        body: `${crime.crime_type}: ${crime.description}`,
        icon: '/unmask-icon.png',
        tag: crime.id,
        requireInteraction: true,
      });
    }
  };

  const playAlertSound = () => {
    if (!audioRef.current) return;

    // Usar API de Web Audio para gerar som de alerta
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configurar tom de alerta (sirene)
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);

    // Repetir 3 vezes
    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(800, audioContext.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.5);
      gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      osc2.start();
      osc2.stop(audioContext.currentTime + 0.5);
    }, 600);

    setTimeout(() => {
      const osc3 = audioContext.createOscillator();
      const gain3 = audioContext.createGain();
      osc3.connect(gain3);
      gain3.connect(audioContext.destination);
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(800, audioContext.currentTime);
      osc3.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.5);
      gain3.gain.setValueAtTime(0.3, audioContext.currentTime);
      gain3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      osc3.start();
      osc3.stop(audioContext.currentTime + 0.5);
    }, 1200);
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  return { requestNotificationPermission };
};
