import { useState, useEffect, lazy, Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, AlertTriangle, TrendingUp, Activity, 
  Globe, Clock, Filter, ChevronRight, MapPin,
  Zap, Terminal, Wifi, Lock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { useRealtimeAlerts } from '@/hooks/useRealtimeAlerts';
import { AlertIndicator } from './AlertIndicator';
import { AttackFeed } from './AttackFeed';
import { CodeTicker } from './CodeTicker';

const CyberAttackMap = lazy(() => import('./CyberAttackMap'));

type TimePeriod = 'day' | 'week' | 'month' | 'semester' | 'year';

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
}

const COLORS = {
  critical: 'hsl(0 100% 55%)',
  high: 'hsl(50 100% 50%)',
  medium: 'hsl(200 100% 50%)',
  low: 'hsl(160 100% 45%)',
};

export const CyberCrimeDashboard = () => {
  const [crimes, setCrimes] = useState<CyberCrime[]>([]);
  const [period, setPeriod] = useState<TimePeriod>('week');
  const [loading, setLoading] = useState(true);
  const { requestNotificationPermission } = useRealtimeAlerts();

  useEffect(() => {
    fetchCrimes();
    
    const channel = supabase
      .channel('cyber-crimes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cyber_crimes'
        },
        () => {
          fetchCrimes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [period]);

  const fetchCrimes = async () => {
    setLoading(true);
    const dateFilter = getDateFilter(period);
    
    const { data, error } = await supabase
      .from('cyber_crimes')
      .select('*')
      .gte('detected_at', dateFilter)
      .order('detected_at', { ascending: false });

    if (!error && data) {
      setCrimes(data as CyberCrime[]);
    }
    setLoading(false);
  };

  const getDateFilter = (period: TimePeriod): string => {
    const now = new Date();
    switch (period) {
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case 'semester':
        return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString();
      case 'year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const getPeriodLabel = (p: TimePeriod): string => {
    const labels = {
      day: 'HOJE',
      week: 'SEMANA',
      month: 'MÊS',
      semester: 'SEMESTRE',
      year: 'ANO'
    };
    return labels[p];
  };

  const stats = {
    total: crimes.length,
    active: crimes.filter(c => c.status === 'active').length,
    critical: crimes.filter(c => c.severity === 'critical').length,
    resolved: crimes.filter(c => c.status === 'resolved').length,
  };

  const severityData = [
    { name: 'CRÍTICO', value: crimes.filter(c => c.severity === 'critical').length, color: COLORS.critical },
    { name: 'ALTO', value: crimes.filter(c => c.severity === 'high').length, color: COLORS.high },
    { name: 'MÉDIO', value: crimes.filter(c => c.severity === 'medium').length, color: COLORS.medium },
    { name: 'BAIXO', value: crimes.filter(c => c.severity === 'low').length, color: COLORS.low },
  ].filter(d => d.value > 0);

  const crimeTypesData = Object.entries(
    crimes.reduce((acc, crime) => {
      acc[crime.crime_type] = (acc[crime.crime_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const timelineData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    
    const count = crimes.filter(c => {
      const crimeDate = new Date(c.detected_at);
      return crimeDate.toDateString() === date.toDateString();
    }).length;
    
    return { date: dateStr, crimes: count };
  });

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, string> = {
      critical: 'bg-danger/20 text-danger border border-danger/50 glow-danger',
      high: 'bg-warning/20 text-warning border border-warning/50',
      medium: 'bg-accent/20 text-accent border border-accent/50',
      low: 'bg-safe/20 text-safe border border-safe/50',
    };
    return <Badge className={`font-orbitron text-xs uppercase tracking-wider ${variants[severity]}`}>{severity}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: 'bg-danger/20 text-danger border border-danger/50 animate-pulse',
      mitigated: 'bg-warning/20 text-warning border border-warning/50',
      resolved: 'bg-safe/20 text-safe border border-safe/50',
    };
    const labels: Record<string, string> = {
      active: 'ATIVO',
      mitigated: 'MITIGADO',
      resolved: 'RESOLVIDO',
    };
    return <Badge className={`font-orbitron text-xs uppercase tracking-wider ${variants[status]}`}>{labels[status]}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background cyber-grid scanlines">
      {/* Code Ticker */}
      <CodeTicker />
      
      {/* Main Content */}
      <div className="pt-12 px-4 md:px-6 pb-6">
        <div className="max-w-[1800px] mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 py-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center glow-primary animate-pulse-glow">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-ping" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-orbitron font-bold text-foreground tracking-wider text-glow-primary">
                  CYBER THREAT MONITOR
                </h1>
                <p className="text-muted-foreground font-mono text-sm flex items-center gap-2">
                  <span className="w-2 h-2 bg-safe rounded-full animate-pulse" />
                  SISTEMA ATIVO | MONITORAMENTO EM TEMPO REAL
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <AlertIndicator onEnableNotifications={requestNotificationPermission} />
              
              <div className="flex items-center gap-1 p-1 rounded-lg border border-primary/30 bg-card/50 backdrop-blur">
                <Filter className="w-4 h-4 text-primary ml-2" />
                {(['day', 'week', 'month', 'semester', 'year'] as TimePeriod[]).map((p) => (
                  <Button
                    key={p}
                    onClick={() => setPeriod(p)}
                    size="sm"
                    className={`font-orbitron text-xs tracking-wider transition-all ${
                      period === p 
                        ? 'bg-primary text-primary-foreground glow-primary' 
                        : 'bg-transparent text-muted-foreground hover:text-primary hover:bg-primary/10'
                    }`}
                  >
                    {getPeriodLabel(p)}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="cyber-card p-6 corner-decoration">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-orbitron text-muted-foreground tracking-wider">TOTAL AMEAÇAS</p>
                  <p className="text-3xl font-orbitron font-bold text-primary text-glow-primary mt-1">{stats.total}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-border-flow" style={{ width: '75%' }} />
              </div>
            </Card>

            <Card className="cyber-card p-6 corner-decoration">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-orbitron text-muted-foreground tracking-wider">ATIVAS</p>
                  <p className="text-3xl font-orbitron font-bold text-danger text-glow-danger mt-1">{stats.active}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-danger/10 border border-danger/30 flex items-center justify-center animate-pulse">
                  <Zap className="w-6 h-6 text-danger" />
                </div>
              </div>
              <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-danger" style={{ width: `${(stats.active / Math.max(stats.total, 1)) * 100}%` }} />
              </div>
            </Card>

            <Card className="cyber-card p-6 corner-decoration">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-orbitron text-muted-foreground tracking-wider">NÍVEL CRÍTICO</p>
                  <p className="text-3xl font-orbitron font-bold text-warning mt-1">{stats.critical}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-warning/10 border border-warning/30 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-warning" />
                </div>
              </div>
              <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-warning" style={{ width: `${(stats.critical / Math.max(stats.total, 1)) * 100}%` }} />
              </div>
            </Card>

            <Card className="cyber-card p-6 corner-decoration">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-orbitron text-muted-foreground tracking-wider">RESOLVIDAS</p>
                  <p className="text-3xl font-orbitron font-bold text-safe text-glow-primary mt-1">{stats.resolved}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-safe/10 border border-safe/30 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-safe" />
                </div>
              </div>
              <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-safe" style={{ width: `${(stats.resolved / Math.max(stats.total, 1)) * 100}%` }} />
              </div>
            </Card>
          </div>

          {/* Map and Feed */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <Card className="cyber-card p-4 xl:col-span-3">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-orbitron text-sm tracking-wider text-foreground">
                  MAPA DE ATAQUES EM TEMPO REAL
                </h3>
                <div className="flex-1" />
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                  <Wifi className="w-3 h-3 text-safe animate-pulse" />
                  LIVE
                </div>
              </div>
              <div className="h-[450px] md:h-[500px] rounded-lg overflow-hidden border border-primary/20 bg-background/50">
                <Suspense fallback={
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <Terminal className="w-8 h-8 animate-pulse text-primary mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground font-mono">CARREGANDO MAPA...</p>
                    </div>
                  </div>
                }>
                  <CyberAttackMap crimes={crimes} />
                </Suspense>
              </div>
            </Card>

            <div className="h-[550px]">
              <AttackFeed />
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Timeline */}
            <Card className="cyber-card p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded bg-accent/20 border border-accent/30 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-accent" />
                </div>
                <h3 className="font-orbitron text-sm tracking-wider text-foreground">
                  TENDÊNCIA (7 DIAS)
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="colorCrimes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(160 100% 45%)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="hsl(160 100% 45%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(160 100% 45% / 0.1)" />
                  <XAxis dataKey="date" stroke="hsl(160 40% 60%)" fontSize={10} fontFamily="Share Tech Mono" />
                  <YAxis stroke="hsl(160 40% 60%)" fontSize={10} fontFamily="Share Tech Mono" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(220 25% 10%)',
                      border: '1px solid hsl(160 100% 45% / 0.3)',
                      borderRadius: '8px',
                      fontFamily: 'Share Tech Mono'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="crimes" 
                    stroke="hsl(160 100% 45%)" 
                    strokeWidth={2}
                    fill="url(#colorCrimes)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* Severity */}
            <Card className="cyber-card p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded bg-danger/20 border border-danger/30 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-danger" />
                </div>
                <h3 className="font-orbitron text-sm tracking-wider text-foreground">
                  DISTRIBUIÇÃO POR SEVERIDADE
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    innerRadius={50}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="hsl(220 25% 10%)"
                    strokeWidth={2}
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(220 25% 10%)',
                      border: '1px solid hsl(160 100% 45% / 0.3)',
                      borderRadius: '8px',
                      fontFamily: 'Share Tech Mono'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Crime Types */}
            <Card className="cyber-card p-4 lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded bg-secondary/20 border border-secondary/30 flex items-center justify-center">
                  <Terminal className="w-4 h-4 text-secondary" />
                </div>
                <h3 className="font-orbitron text-sm tracking-wider text-foreground">
                  TIPOS DE AMEAÇAS
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={crimeTypesData}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(160 100% 45%)" stopOpacity={1}/>
                      <stop offset="100%" stopColor="hsl(200 100% 50%)" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(160 100% 45% / 0.1)" />
                  <XAxis dataKey="name" stroke="hsl(160 40% 60%)" fontSize={10} fontFamily="Share Tech Mono" />
                  <YAxis stroke="hsl(160 40% 60%)" fontSize={10} fontFamily="Share Tech Mono" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(220 25% 10%)',
                      border: '1px solid hsl(160 100% 45% / 0.3)',
                      borderRadius: '8px',
                      fontFamily: 'Share Tech Mono'
                    }}
                  />
                  <Bar dataKey="value" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Recent Threats */}
          <Card className="cyber-card p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded bg-primary/20 border border-primary/30 flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-orbitron text-sm tracking-wider text-foreground">
                AMEAÇAS RECENTES
              </h3>
              <div className="flex-1" />
              <span className="text-xs font-mono text-muted-foreground">{crimes.length} REGISTROS</span>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {crimes.slice(0, 10).map((crime, index) => (
                <div 
                  key={crime.id} 
                  className="group flex items-center justify-between p-4 rounded-lg border border-primary/10 bg-muted/20 hover:border-primary/40 hover:bg-muted/40 transition-all cursor-pointer"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h4 className="font-orbitron text-sm font-semibold text-foreground tracking-wide">{crime.crime_type}</h4>
                      {getSeverityBadge(crime.severity)}
                      {getStatusBadge(crime.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 truncate">{crime.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {crime.source_country} → {crime.target_country}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(crime.detected_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors ml-4" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
