import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Shield, AlertTriangle, Zap } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface Attack {
  id: string;
  crime_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source_country: string;
  target_country: string;
  detected_at: string;
  ip_address?: string;
  status: string;
}

export const AttackFeed = () => {
  const [attacks, setAttacks] = useState<Attack[]>([]);

  useEffect(() => {
    // Buscar ataques ativos iniciais
    const fetchAttacks = async () => {
      const { data } = await supabase
        .from('cyber_crimes')
        .select('*')
        .eq('status', 'active')
        .order('detected_at', { ascending: false })
        .limit(50);
      
      if (data) {
        setAttacks(data as Attack[]);
      }
    };

    fetchAttacks();

    // Subscrever a novos ataques em tempo real
    const channel = supabase
      .channel('attack-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cyber_crimes',
        },
        (payload) => {
          const newAttack = payload.new as Attack;
          if (newAttack.status === 'active') {
            setAttacks(prev => [newAttack, ...prev].slice(0, 50));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-danger" />;
      case 'high':
        return <Zap className="w-4 h-4 text-warning" />;
      default:
        return <Shield className="w-4 h-4 text-primary" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-danger/10 text-danger border-danger/20';
      case 'high':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'medium':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-safe/10 text-safe border-safe/20';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${Math.floor(diffHours / 24)}d atrás`;
  };

  return (
    <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Ataques em Tempo Real
        </h3>
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
          {attacks.length} ativos
        </Badge>
      </div>

      <ScrollArea className="h-[calc(100%-60px)]">
        <div className="space-y-2">
          {attacks.map((attack, index) => (
            <div
              key={attack.id}
              className="p-3 rounded-lg border border-border bg-background/50 hover:bg-background/80 transition-all duration-300 animate-fade-in cursor-pointer"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {getSeverityIcon(attack.severity)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {attack.crime_type}
                    </p>
                    <Badge className={`text-xs ${getSeverityColor(attack.severity)}`}>
                      {attack.severity}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <span className="truncate">{attack.source_country}</span>
                    <span>→</span>
                    <span className="truncate">{attack.target_country}</span>
                  </div>
                  {attack.ip_address && (
                    <p className="text-xs text-muted-foreground font-mono">
                      {attack.ip_address}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTime(attack.detected_at)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
