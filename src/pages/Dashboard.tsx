import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Activity,
  Clock,
  Target,
  Globe2,
  ArrowLeft
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeToggle } from '@/components/ThemeToggle';

type TimePeriod = 'day' | 'week' | 'month' | 'semester' | 'year';

interface CyberCrime {
  id: string;
  crime_type: string;
  severity: string;
  description: string;
  target_type: string;
  source_country: string;
  target_country: string;
  status: string;
  detected_at: string;
}

const Dashboard = () => {
  const [crimes, setCrimes] = useState<CyberCrime[]>([]);
  const [period, setPeriod] = useState<TimePeriod>('day');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchCrimes = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate = new Date();

      switch (period) {
        case 'day':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'semester':
          startDate.setMonth(now.getMonth() - 6);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      const { data, error } = await supabase
        .from('cyber_crimes')
        .select('*')
        .gte('detected_at', startDate.toISOString())
        .order('detected_at', { ascending: false });

      if (error) throw error;
      setCrimes(data || []);
    } catch (error) {
      console.error('Error fetching crimes:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os crimes cibernéticos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrimes();
    
    // Realtime updates
    const channel = supabase
      .channel('cyber_crimes_changes')
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

  // Calcular estatísticas
  const stats = {
    total: crimes.length,
    active: crimes.filter(c => c.status === 'active').length,
    critical: crimes.filter(c => c.severity === 'critical').length,
    resolved: crimes.filter(c => c.status === 'resolved').length,
  };

  // Dados para gráficos
  const crimeTypesData = Object.entries(
    crimes.reduce((acc, crime) => {
      acc[crime.crime_type] = (acc[crime.crime_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const severityData = Object.entries(
    crimes.reduce((acc, crime) => {
      acc[crime.severity] = (acc[crime.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const countriesData = Object.entries(
    crimes.reduce((acc, crime) => {
      if (crime.source_country) {
        acc[crime.source_country] = (acc[crime.source_country] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>)
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));

  const COLORS = {
    critical: 'hsl(var(--danger))',
    high: 'hsl(var(--warning))',
    medium: 'hsl(var(--accent))',
    low: 'hsl(var(--safe))',
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-danger text-danger-foreground';
      case 'high': return 'bg-warning text-warning-foreground';
      case 'medium': return 'bg-accent text-accent-foreground';
      case 'low': return 'bg-safe text-safe-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-danger text-danger-foreground';
      case 'mitigated': return 'bg-warning text-warning-foreground';
      case 'resolved': return 'bg-safe text-safe-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              size="icon"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center space-x-3">
                <Shield className="w-10 h-10 text-primary" />
                <h1 className="text-4xl font-bold text-foreground">Dashboard de Crimes Cibernéticos</h1>
              </div>
              <p className="text-muted-foreground mt-2">Monitoramento em tempo real de ameaças digitais</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Period Selector */}
        <Card className="p-4">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as TimePeriod)}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="day">Hoje</TabsTrigger>
              <TabsTrigger value="week">Semana</TabsTrigger>
              <TabsTrigger value="month">Mês</TabsTrigger>
              <TabsTrigger value="semester">Semestre</TabsTrigger>
              <TabsTrigger value="year">Ano</TabsTrigger>
            </TabsList>
          </Tabs>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 gradient-hero shadow-scanning">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Crimes</p>
                <p className="text-3xl font-bold text-foreground">{stats.total}</p>
              </div>
              <Activity className="w-8 h-8 text-primary" />
            </div>
          </Card>

          <Card className="p-6 gradient-danger shadow-danger">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-3xl font-bold text-danger">{stats.active}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-danger" />
            </div>
          </Card>

          <Card className="p-6 gradient-warning shadow-warning">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Críticos</p>
                <p className="text-3xl font-bold text-warning">{stats.critical}</p>
              </div>
              <Target className="w-8 h-8 text-warning" />
            </div>
          </Card>

          <Card className="p-6 gradient-safe shadow-safe">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolvidos</p>
                <p className="text-3xl font-bold text-safe">{stats.resolved}</p>
              </div>
              <Shield className="w-8 h-8 text-safe" />
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Crime Types */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-primary" />
              Tipos de Crimes
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={crimeTypesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))' 
                  }} 
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Severity Distribution */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-primary" />
              Distribuição por Severidade
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={100}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || 'hsl(var(--muted))'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))' 
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Top Countries */}
          <Card className="p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Globe2 className="w-5 h-5 mr-2 text-primary" />
              Top 10 Países de Origem
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={countriesData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={100} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))' 
                  }} 
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Recent Crimes Table */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-primary" />
            Crimes Recentes
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tipo</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Severidade</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Origem</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Alvo</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Detectado</th>
                </tr>
              </thead>
              <tbody>
                {crimes.slice(0, 10).map((crime) => (
                  <tr key={crime.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium">{crime.crime_type}</td>
                    <td className="py-3 px-4">
                      <Badge className={getSeverityColor(crime.severity)}>
                        {crime.severity}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getStatusColor(crime.status)}>
                        {crime.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm">{crime.source_country}</td>
                    <td className="py-3 px-4 text-sm">{crime.target_type}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {new Date(crime.detected_at).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;