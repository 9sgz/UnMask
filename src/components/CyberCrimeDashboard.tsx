import { useState, useEffect, lazy, Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, AlertTriangle, TrendingUp, Activity, 
  Globe, Clock, Filter, ChevronRight, MapPin 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useRealtimeAlerts } from '@/hooks/useRealtimeAlerts';
import { AlertIndicator } from './AlertIndicator';
import { AttackFeed } from './AttackFeed';

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
  critical: 'hsl(var(--danger))',
  high: 'hsl(var(--warning))',
  medium: '#3b82f6',
  low: 'hsl(var(--safe))',
};

export const CyberCrimeDashboard = () => {
  const [crimes, setCrimes] = useState<CyberCrime[]>([]);
  const [period, setPeriod] = useState<TimePeriod>('week');
  const [loading, setLoading] = useState(true);
  const { requestNotificationPermission } = useRealtimeAlerts();

  useEffect(() => {
    fetchCrimes();
    
    // Realtime subscription
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
      day: 'Hoje',
      week: 'Semana',
      month: 'Mês',
      semester: 'Semestre',
      year: 'Ano'
    };
    return labels[p];
  };

  // Statistics
  const stats = {
    total: crimes.length,
    active: crimes.filter(c => c.status === 'active').length,
    critical: crimes.filter(c => c.severity === 'critical').length,
    resolved: crimes.filter(c => c.status === 'resolved').length,
  };

  // Severity distribution
  const severityData = [
    { name: 'Crítico', value: crimes.filter(c => c.severity === 'critical').length, color: COLORS.critical },
    { name: 'Alto', value: crimes.filter(c => c.severity === 'high').length, color: COLORS.high },
    { name: 'Médio', value: crimes.filter(c => c.severity === 'medium').length, color: COLORS.medium },
    { name: 'Baixo', value: crimes.filter(c => c.severity === 'low').length, color: COLORS.low },
  ].filter(d => d.value > 0);

  // Crime types distribution
  const crimeTypesData = Object.entries(
    crimes.reduce((acc, crime) => {
      acc[crime.crime_type] = (acc[crime.crime_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  // Timeline data (last 7 days)
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
    const variants = {
      critical: 'bg-danger text-danger-foreground',
      high: 'bg-warning text-warning-foreground',
      medium: 'bg-blue-500 text-white',
      low: 'bg-safe text-safe-foreground',
    };
    return <Badge className={variants[severity as keyof typeof variants]}>{severity.toUpperCase()}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-danger text-danger-foreground',
      mitigated: 'bg-warning text-warning-foreground',
      resolved: 'bg-safe text-safe-foreground',
    };
    const labels = {
      active: 'Ativo',
      mitigated: 'Mitigado',
      resolved: 'Resolvido',
    };
    return <Badge className={variants[status as keyof typeof variants]}>{labels[status as keyof typeof labels]}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Shield className="w-8 h-8 text-primary" />
              Dashboard de Crimes Cibernéticos
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitoramento em tempo real de ameaças digitais
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Alert Indicator */}
            <AlertIndicator onEnableNotifications={requestNotificationPermission} />

            {/* Period Filter */}
            <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border border-border">
            <Filter className="w-4 h-4 text-muted-foreground ml-2" />
            {(['day', 'week', 'month', 'semester', 'year'] as TimePeriod[]).map((p) => (
              <Button
                key={p}
                onClick={() => setPeriod(p)}
                variant={period === p ? 'default' : 'ghost'}
                size="sm"
                className={period === p ? 'bg-primary text-primary-foreground' : ''}
              >
                {getPeriodLabel(p)}
              </Button>
            ))}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 gradient-hero border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Ameaças</p>
                <p className="text-3xl font-bold text-foreground mt-1">{stats.total}</p>
              </div>
              <Activity className="w-10 h-10 text-primary" />
            </div>
          </Card>

          <Card className="p-6 gradient-danger border-danger/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ameaças Ativas</p>
                <p className="text-3xl font-bold text-danger mt-1">{stats.active}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-danger" />
            </div>
          </Card>

          <Card className="p-6 gradient-warning border-warning/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Nível Crítico</p>
                <p className="text-3xl font-bold text-warning mt-1">{stats.critical}</p>
              </div>
              <Shield className="w-10 h-10 text-warning" />
            </div>
          </Card>

          <Card className="p-6 gradient-safe border-safe/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolvidas</p>
                <p className="text-3xl font-bold text-safe mt-1">{stats.resolved}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-safe" />
            </div>
          </Card>
        </div>

        {/* Mapa Mundial e Feed de Ataques */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="p-6 border-border lg:col-span-3">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Mapa de Ataques em Tempo Real
            </h3>
            <div className="h-[500px] rounded-lg overflow-hidden bg-muted/20">
              <Suspense fallback={
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <Activity className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Carregando mapa...</p>
                  </div>
                </div>
              }>
                <CyberAttackMap crimes={crimes} />
              </Suspense>
            </div>
          </Card>

          <div className="h-[572px]">
            <AttackFeed />
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timeline Chart */}
          <Card className="p-6 border-border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Tendência (Últimos 7 dias)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="crimes" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Severity Distribution */}
          <Card className="p-6 border-border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              Distribuição por Severidade
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Crime Types */}
          <Card className="p-6 border-border lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Tipos de Ameaças
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={crimeTypesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Recent Crimes Table */}
        <Card className="p-6 border-border">
          <h3 className="text-lg font-semibold mb-4">Ameaças Recentes</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {crimes.slice(0, 10).map((crime) => (
              <div 
                key={crime.id} 
                className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-foreground">{crime.crime_type}</h4>
                    {getSeverityBadge(crime.severity)}
                    {getStatusBadge(crime.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{crime.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>🎯 {crime.target_type}</span>
                    <span>🌍 {crime.source_country} → {crime.target_country}</span>
                    <span>⏰ {new Date(crime.detected_at).toLocaleString('pt-BR')}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};