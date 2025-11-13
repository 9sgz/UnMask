import { useEffect, useState, memo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Line,
  Marker,
} from 'react-simple-maps';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';

interface CyberCrime {
  id: string;
  source_country: string;
  target_country: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'mitigated' | 'resolved';
  crime_type: string;
  ip_address?: string;
}

interface CyberAttackMapProps {
  crimes: CyberCrime[];
}

// Coordenadas aproximadas de países
const countryCoordinates: Record<string, [number, number]> = {
  'EUA': [-95.7129, 37.0902],
  'USA': [-95.7129, 37.0902],
  'China': [104.1954, 35.8617],
  'Rússia': [105.3188, 61.5240],
  'Russia': [105.3188, 61.5240],
  'Brasil': [-47.9292, -15.7801],
  'Brazil': [-47.9292, -15.7801],
  'Alemanha': [10.4515, 51.1657],
  'Germany': [10.4515, 51.1657],
  'Reino Unido': [-3.4360, 55.3781],
  'UK': [-3.4360, 55.3781],
  'França': [2.2137, 46.2276],
  'France': [2.2137, 46.2276],
  'Japão': [138.2529, 36.2048],
  'Japan': [138.2529, 36.2048],
  'Índia': [78.9629, 20.5937],
  'India': [78.9629, 20.5937],
  'Coreia do Norte': [127.5101, 40.3399],
  'North Korea': [127.5101, 40.3399],
  'Irã': [53.6880, 32.4279],
  'Iran': [53.6880, 32.4279],
  'Canadá': [-106.3468, 56.1304],
  'Canada': [-106.3468, 56.1304],
  'Austrália': [133.7751, -25.2744],
  'Australia': [133.7751, -25.2744],
  'México': [-102.5528, 23.6345],
  'Mexico': [-102.5528, 23.6345],
  'Argentina': [-63.6167, -38.4161],
  'Espanha': [-3.7492, 40.4637],
  'Spain': [-3.7492, 40.4637],
  'Itália': [12.5674, 41.8719],
  'Italy': [12.5674, 41.8719],
};

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const CyberAttackMap = memo(({ crimes }: CyberAttackMapProps) => {
  const [activeAttacks, setActiveAttacks] = useState<Array<{
    id: string;
    start: [number, number];
    end: [number, number];
    severity: string;
    opacity: number;
    crimeType: string;
    sourceCountry: string;
    targetCountry: string;
    ipAddress: string;
    animationDelay: number;
  }>>([]);
  const [allCrimes, setAllCrimes] = useState<CyberCrime[]>(crimes);

  useEffect(() => {
    // Fetch inicial de todos os crimes ativos
    const fetchActiveCrimes = async () => {
      const { data, error } = await supabase
        .from('cyber_crimes')
        .select('*')
        .eq('status', 'active');
      
      if (data && !error) {
        setAllCrimes(data as CyberCrime[]);
      }
    };

    fetchActiveCrimes();

    // Subscrever a mudanças em tempo real
    const channel = supabase
      .channel('cyber-attacks-map')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cyber_crimes',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newCrime = payload.new as CyberCrime;
            if (newCrime.status === 'active') {
              setAllCrimes(prev => [...prev, newCrime]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedCrime = payload.new as CyberCrime;
            setAllCrimes(prev => 
              prev.map(crime => crime.id === updatedCrime.id ? updatedCrime : crime)
                .filter(crime => crime.status === 'active')
            );
          } else if (payload.eventType === 'DELETE') {
            setAllCrimes(prev => prev.filter(crime => crime.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    // Filtrar apenas ataques ativos e com coordenadas válidas
    const attacks = allCrimes
      .filter(crime => 
        crime.status === 'active' &&
        countryCoordinates[crime.source_country] &&
        countryCoordinates[crime.target_country]
      )
      .map((crime, index) => ({
        id: crime.id,
        start: countryCoordinates[crime.source_country],
        end: countryCoordinates[crime.target_country],
        severity: crime.severity,
        opacity: 1,
        crimeType: crime.crime_type,
        sourceCountry: crime.source_country,
        targetCountry: crime.target_country,
        ipAddress: crime.ip_address || 'N/A',
        animationDelay: index * 0.2,
      }));

    setActiveAttacks(attacks);

    // Animar opacidade dos ataques
    const interval = setInterval(() => {
      setActiveAttacks(prev => 
        prev.map(attack => ({
          ...attack,
          opacity: Math.random() * 0.5 + 0.5,
        }))
      );
    }, 1500);

    return () => clearInterval(interval);
  }, [allCrimes]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'hsl(var(--danger))';
      case 'high':
        return 'hsl(var(--warning))';
      case 'medium':
        return '#3b82f6';
      case 'low':
        return 'hsl(var(--safe))';
      default:
        return 'hsl(var(--primary))';
    }
  };

  const getSeverityWidth = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 3;
      case 'high':
        return 2.5;
      case 'medium':
        return 2;
      case 'low':
        return 1.5;
      default:
        return 1;
    }
  };

  return (
    <TooltipProvider>
      <div className="relative w-full h-full">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 147,
            center: [0, 20],
          }}
          className="w-full h-full"
        >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="hsl(var(--muted))"
                stroke="hsl(var(--border))"
                strokeWidth={0.5}
                style={{
                  default: { outline: 'none' },
                  hover: { outline: 'none', fill: 'hsl(var(--muted) / 0.8)' },
                  pressed: { outline: 'none' },
                }}
              />
            ))
          }
        </Geographies>

        {/* Linhas de ataque */}
        {activeAttacks.map((attack) => (
          <Tooltip key={attack.id}>
            <TooltipTrigger asChild>
              <g style={{ cursor: 'pointer' }}>
                <Line
                  from={attack.start}
                  to={attack.end}
                  stroke={getSeverityColor(attack.severity)}
                  strokeWidth={getSeverityWidth(attack.severity)}
                  strokeLinecap="round"
                  opacity={attack.opacity}
                  style={{
                    transition: 'opacity 1.5s ease-in-out',
                    animation: `dashOffset 3s linear infinite`,
                    animationDelay: `${attack.animationDelay}s`,
                    strokeDasharray: '10 5',
                  }}
                />
              </g>
            </TooltipTrigger>
            <TooltipContent className="bg-card border-border">
              <div className="space-y-1">
                <p className="font-semibold text-foreground">{attack.crimeType}</p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Origem:</span> {attack.sourceCountry}
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Destino:</span> {attack.targetCountry}
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">IP:</span> {attack.ipAddress}
                </p>
                <p className="text-xs">
                  <span className="font-medium">Severidade:</span>{' '}
                  <span style={{ color: getSeverityColor(attack.severity) }}>
                    {attack.severity === 'critical' ? 'Crítico' : 
                     attack.severity === 'high' ? 'Alto' :
                     attack.severity === 'medium' ? 'Médio' : 'Baixo'}
                  </span>
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}

        {/* Marcadores nos pontos de origem e destino */}
        {activeAttacks.map((attack) => (
          <>
            {/* Marcador de origem com pulso */}
            <Marker key={`source-${attack.id}`} coordinates={attack.start}>
              <g>
                <circle
                  r={8}
                  fill={getSeverityColor(attack.severity)}
                  opacity={0.2}
                  className="animate-ping"
                  style={{
                    animationDelay: `${attack.animationDelay}s`,
                    animationDuration: '2s',
                  }}
                />
                <circle
                  r={4}
                  fill={getSeverityColor(attack.severity)}
                  opacity={attack.opacity}
                  style={{
                    transition: 'opacity 1.5s ease-in-out',
                  }}
                />
              </g>
            </Marker>

            {/* Marcador de destino com pulso */}
            <Marker key={`target-${attack.id}`} coordinates={attack.end}>
              <g>
                <circle
                  r={8}
                  fill={getSeverityColor(attack.severity)}
                  opacity={0.2}
                  className="animate-ping"
                  style={{
                    animationDelay: `${attack.animationDelay + 0.5}s`,
                    animationDuration: '2s',
                  }}
                />
                <circle
                  r={5}
                  fill={getSeverityColor(attack.severity)}
                  opacity={attack.opacity * 0.8}
                  style={{
                    transition: 'opacity 1.5s ease-in-out',
                  }}
                />
                <circle
                  r={8}
                  fill="none"
                  stroke={getSeverityColor(attack.severity)}
                  strokeWidth={2}
                  opacity={attack.opacity * 0.4}
                  style={{
                    transition: 'opacity 1.5s ease-in-out',
                  }}
                />
              </g>
            </Marker>
          </>
        ))}
        </ComposableMap>

        {/* Legenda */}
      <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 space-y-2">
        <p className="text-xs font-semibold text-foreground mb-2">Severidade</p>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-danger"></div>
          <span className="text-xs text-muted-foreground">Crítico</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-warning"></div>
          <span className="text-xs text-muted-foreground">Alto</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3b82f6' }}></div>
          <span className="text-xs text-muted-foreground">Médio</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-safe"></div>
          <span className="text-xs text-muted-foreground">Baixo</span>
        </div>
      </div>

        {/* Contador de ataques ativos */}
        <div className="absolute top-4 right-4 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Ataques Ativos</p>
          <p className="text-2xl font-bold text-danger">{activeAttacks.length}</p>
        </div>
      </div>
    </TooltipProvider>
  );
});

CyberAttackMap.displayName = 'CyberAttackMap';

export default CyberAttackMap;
