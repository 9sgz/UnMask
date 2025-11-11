import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface AlertIndicatorProps {
  onEnableNotifications: () => void;
}

export const AlertIndicator = ({ onEnableNotifications }: AlertIndicatorProps) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    // Verificar se notificações estão habilitadas
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const handleEnableNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
      onEnableNotifications();
    }
  };

  useEffect(() => {
    // Animar ícone quando há alertas
    const interval = setInterval(() => {
      setIsBlinking(prev => !prev);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative"
        >
          {notificationsEnabled ? (
            <Bell className={`w-5 h-5 ${isBlinking ? 'text-primary' : 'text-muted-foreground'}`} />
          ) : (
            <BellOff className="w-5 h-5 text-muted-foreground" />
          )}
          {notificationsEnabled && (
            <Badge 
              className="absolute -top-1 -right-1 h-3 w-3 p-0 bg-danger animate-pulse"
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          <div className="space-y-1">
            <h4 className="font-semibold text-foreground">Sistema de Alertas</h4>
            <p className="text-sm text-muted-foreground">
              {notificationsEnabled 
                ? '✓ Notificações ativadas. Você será alertado sobre ameaças críticas.'
                : 'Ative as notificações para receber alertas em tempo real sobre ameaças críticas.'}
            </p>
          </div>

          {!notificationsEnabled && (
            <Button 
              onClick={handleEnableNotifications}
              className="w-full"
            >
              <Bell className="w-4 h-4 mr-2" />
              Ativar Notificações
            </Button>
          )}

          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-xs font-semibold text-foreground">Recursos:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Alertas sonoros para ameaças críticas</li>
              <li>• Notificações visuais no dashboard</li>
              <li>• Notificações do navegador</li>
              <li>• Monitoramento em tempo real</li>
            </ul>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
