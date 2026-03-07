import { useState, useEffect, lazy, Suspense } from 'react';
import { Activity, Shield, AlertTriangle, Zap, Globe, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeAlerts } from '@/hooks/useRealtimeAlerts';

const CyberAttackMap = lazy(() => import('./CyberAttackMap'));

interface CyberCrime {
  id: string;
  crime_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  target_type: string;
  source_country: string;
  target_country: string;
  attack_vector: string;
  status: 'active' | 'mitigated' | 'resolved';
  detected_at: string;
  ip_address?: string;
}

const THREAT_CATEGORIES = [
  { key: 'OAS', label: 'OAS', color: '#00e676', description: 'On-Access Scan' },
  { key: 'ODS', label: 'ODS', color: '#2979ff', description: 'On-Demand Scan' },
  { key: 'MAV', label: 'MAV', color: '#ff1744', description: 'Mail Anti-Virus' },
  { key: 'WAV', label: 'WAV', color: '#ff9100', description: 'Web Anti-Virus' },
  { key: 'IDS', label: 'IDS', color: '#d500f9', description: 'Intrusion Detection' },
  { key: 'VUL', label: 'VUL', color: '#00b0ff', description: 'Vulnerabilidades' },
  { key: 'KAS', label: 'KAS', color: '#76ff03', description: 'Kaspersky Anti-Spam' },
  { key: 'BAD', label: 'BAD', color: '#ff6d00', description: 'Botnet Activity' },
];

const mapCrimeToCategory = (crimeType: string): string => {
  const lower = crimeType.toLowerCase();
  if (lower.includes('phishing') || lower.includes('mail') || lower.includes('email')) return 'MAV';
  if (lower.includes('malware') || lower.includes('virus') || lower.includes('trojan')) return 'OAS';
  if (lower.includes('ddos') || lower.includes('botnet') || lower.includes('bot')) return 'BAD';
  if (lower.includes('ransomware') || lower.includes('scan')) return 'ODS';
  if (lower.includes('web') || lower.includes('xss') || lower.includes('sql')) return 'WAV';
  if (lower.includes('intrusion') || lower.includes('brute') || lower.includes('exploit')) return 'IDS';
  if (lower.includes('vulnerab') || lower.includes('cve')) return 'VUL';
  if (lower.includes('spam')) return 'KAS';
  return 'OAS';
};

export const CyberCrimeDashboard = () => {
  const [crimes, setCrimes] = useState<CyberCrime[]>([]);
  const [recentAttacks, setRecentAttacks] = useState<CyberCrime[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const { requestNotificationPermission } = useRealtimeAlerts();

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    const fetchCrimes = async () => {
      const { data, error } = await supabase
        .from('cyber_crimes')
        .select('*')
        .order('detected_at', { ascending: false });

      if (!error && data) {
        setCrimes(data as CyberCrime[]);
        setRecentAttacks((data as CyberCrime[]).slice(0, 8));
        
        const counts: Record<string, number> = {};
        (data as CyberCrime[]).forEach(crime => {
          const cat = mapCrimeToCategory(crime.crime_type);
          counts[cat] = (counts[cat] || 0) + 1;
        });
        setCategoryCounts(counts);
      }
    };

    fetchCrimes();

    const channel = supabase
      .channel('cyber-crimes-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cyber_crimes' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newCrime = payload.new as CyberCrime;
          setCrimes(prev => [newCrime, ...prev]);
          setRecentAttacks(prev => [newCrime, ...prev].slice(0, 8));
          const cat = mapCrimeToCategory(newCrime.crime_type);
          setCategoryCounts(prev => ({ ...prev, [cat]: (prev[cat] || 0) + 1 }));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return `${Math.floor(diffHours / 24)}d`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-danger';
      case 'high': return 'text-warning';
      case 'medium': return 'text-primary';
      default: return 'text-safe';
    }
  };

  const activeCrimes = crimes.filter(c => c.status === 'active');

  return (
    <div className="fixed inset-0 bg-background/80 text-foreground overflow-hidden flex flex-col">
      {/* Top Header Bar */}
      <header className="relative z-20 flex items-center justify-between px-6 py-3 border-b border-border/30 bg-card/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-lg tracking-wider font-light">
            MAPA DE <span className="font-bold text-primary">CIBERAMEAÇAS</span>
          </h1>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs tracking-widest text-muted-foreground uppercase">
          <button className="text-primary border-b border-primary pb-1">Mapa</button>
          <button className="hover:text-foreground transition-colors">Estatísticas</button>
          <button className="hover:text-foreground transition-colors">Fonte de Dados</button>
        </nav>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-safe animate-pulse" />
            <span>LIVE</span>
          </div>
        </div>
      </header>

      {/* Main Map Area */}
      <div className="flex-1 relative">
        <div className="absolute inset-0">
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center">
              <Activity className="w-8 h-8 animate-spin text-primary" />
            </div>
          }>
            <CyberAttackMap crimes={crimes} />
          </Suspense>
        </div>

        {/* Right Side - Live Attack Feed */}
        <div className="absolute top-4 right-4 z-10 w-72 max-h-[calc(100vh-180px)] overflow-hidden">
          <div className="bg-card/80 backdrop-blur-md border border-border/30 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
              <span className="text-xs tracking-widest text-muted-foreground uppercase flex items-center gap-2">
                <Zap className="w-3 h-3 text-primary" />
                Ataques Recentes
              </span>
              <span className="text-xs text-primary font-mono">{activeCrimes.length}</span>
            </div>
            <div className="divide-y divide-border/20 max-h-80 overflow-y-auto scrollbar-thin">
              {recentAttacks.map((attack) => (
                <div key={attack.id} className="px-4 py-2.5 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold ${getSeverityColor(attack.severity)}`}>
                      {attack.crime_type}
                    </span>
                    <span className="text-[10px] text-muted-foreground/50 font-mono">{formatTime(attack.detected_at)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
                    <span>{attack.source_country || '??'}</span>
                    <span className="text-primary">→</span>
                    <span>{attack.target_country || '??'}</span>
                  </div>
                  {attack.ip_address && (
                    <p className="text-[10px] text-muted-foreground/40 font-mono mt-0.5">{attack.ip_address}</p>
                  )}
                </div>
              ))}
              {recentAttacks.length === 0 && (
                <div className="px-4 py-8 text-center text-muted-foreground/50 text-xs">
                  Aguardando dados...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Left Side Stats */}
        <div className="absolute top-4 left-4 z-10 space-y-3">
          <div className="bg-card/80 backdrop-blur-md border border-border/30 rounded-lg px-4 py-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Ameaças Detectadas</div>
            <div className="text-2xl font-bold text-primary font-mono">{crimes.length.toLocaleString()}</div>
          </div>
          <div className="bg-card/80 backdrop-blur-md border border-border/30 rounded-lg px-4 py-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Ataques Ativos</div>
            <div className="text-2xl font-bold text-danger font-mono">{activeCrimes.length}</div>
          </div>
        </div>
      </div>

      {/* Bottom Stats Bar */}
      <footer className="relative z-20 border-t border-border/30 bg-card/60 backdrop-blur-md">
        <div className="flex items-stretch justify-center divide-x divide-border/20">
          {THREAT_CATEGORIES.map((cat) => (
            <div key={cat.key} className="flex flex-col items-center px-4 md:px-8 py-3 hover:bg-muted/30 transition-colors cursor-pointer group">
              <span className="text-sm md:text-lg font-bold font-mono text-foreground/80 group-hover:text-foreground transition-colors">
                {(categoryCounts[cat.key] || 0).toLocaleString()}
              </span>
              <span
                className="text-[10px] md:text-xs font-bold tracking-wider mt-1 px-2 py-0.5 rounded"
                style={{ color: cat.color, backgroundColor: `${cat.color}15` }}
              >
                {cat.label}
              </span>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
};
