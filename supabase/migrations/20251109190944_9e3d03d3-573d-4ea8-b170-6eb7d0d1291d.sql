-- Criar tabela de crimes cibernéticos
CREATE TABLE public.cyber_crimes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crime_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT,
  target_type TEXT,
  source_country TEXT,
  target_country TEXT,
  ip_address TEXT,
  attack_vector TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'mitigated', 'resolved')),
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_cyber_crimes_detected_at ON public.cyber_crimes(detected_at DESC);
CREATE INDEX idx_cyber_crimes_crime_type ON public.cyber_crimes(crime_type);
CREATE INDEX idx_cyber_crimes_severity ON public.cyber_crimes(severity);
CREATE INDEX idx_cyber_crimes_status ON public.cyber_crimes(status);

-- Habilitar RLS (dados públicos para visualização)
ALTER TABLE public.cyber_crimes ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública
CREATE POLICY "Allow public read access" 
ON public.cyber_crimes 
FOR SELECT 
TO public
USING (true);

-- Inserir dados de exemplo
INSERT INTO public.cyber_crimes (crime_type, severity, description, target_type, source_country, target_country, ip_address, attack_vector, status, detected_at) VALUES
  ('Phishing', 'high', 'Campanha de phishing direcionada a instituições financeiras', 'Banking', 'Russia', 'Brazil', '192.168.1.100', 'Email', 'active', NOW() - INTERVAL '2 hours'),
  ('Ransomware', 'critical', 'Ataque de ransomware em hospital', 'Healthcare', 'China', 'USA', '10.0.0.50', 'Malware', 'mitigated', NOW() - INTERVAL '1 day'),
  ('DDoS', 'medium', 'Ataque DDoS em servidor governamental', 'Government', 'North Korea', 'South Korea', '172.16.0.1', 'Network', 'resolved', NOW() - INTERVAL '3 days'),
  ('Data Breach', 'critical', 'Vazamento de dados de milhões de usuários', 'E-commerce', 'Unknown', 'Brazil', '203.0.113.0', 'SQL Injection', 'active', NOW() - INTERVAL '5 hours'),
  ('Malware', 'high', 'Distribuição de malware via downloads falsos', 'Corporate', 'Russia', 'Germany', '198.51.100.0', 'Drive-by Download', 'active', NOW() - INTERVAL '1 day'),
  ('Credential Stuffing', 'medium', 'Tentativa de acesso com credenciais roubadas', 'Social Media', 'Iran', 'USA', '192.0.2.0', 'Brute Force', 'mitigated', NOW() - INTERVAL '2 days'),
  ('Cryptojacking', 'low', 'Mineração de criptomoedas não autorizada', 'Corporate', 'Unknown', 'France', '198.18.0.0', 'Browser Script', 'resolved', NOW() - INTERVAL '7 days'),
  ('Phishing', 'critical', 'Phishing sofisticado imitando serviços bancários', 'Banking', 'Brazil', 'Brazil', '203.0.113.50', 'SMS/Email', 'active', NOW() - INTERVAL '3 hours'),
  ('Zero-day Exploit', 'critical', 'Exploração de vulnerabilidade desconhecida', 'Software', 'China', 'Global', '192.168.100.1', 'Code Injection', 'active', NOW() - INTERVAL '6 hours'),
  ('Insider Threat', 'high', 'Vazamento interno de dados confidenciais', 'Corporate', 'Brazil', 'Brazil', 'Internal', 'Data Exfiltration', 'mitigated', NOW() - INTERVAL '4 days'),
  ('Man-in-the-Middle', 'high', 'Interceptação de comunicações empresariais', 'Corporate', 'Russia', 'UK', '198.51.100.50', 'Network Sniffing', 'resolved', NOW() - INTERVAL '10 days'),
  ('Ransomware', 'critical', 'Ransomware atacando infraestrutura crítica', 'Energy', 'Unknown', 'USA', '203.0.113.100', 'Malware', 'active', NOW() - INTERVAL '12 hours'),
  ('DDoS', 'high', 'Ataque DDoS massivo em plataforma de streaming', 'Entertainment', 'Multiple', 'Brazil', '192.0.2.100', 'Botnet', 'mitigated', NOW() - INTERVAL '1 day'),
  ('Business Email Compromise', 'critical', 'Fraude de email corporativo', 'Corporate', 'Nigeria', 'USA', '198.18.0.50', 'Social Engineering', 'active', NOW() - INTERVAL '8 hours'),
  ('Supply Chain Attack', 'critical', 'Comprometimento de fornecedor de software', 'Technology', 'China', 'Global', '172.16.0.50', 'Software Update', 'active', NOW() - INTERVAL '2 days'),
  ('Phishing', 'medium', 'Campanha de phishing genérica', 'General Public', 'Russia', 'Brazil', '10.0.0.100', 'Email', 'resolved', NOW() - INTERVAL '14 days'),
  ('Malware', 'high', 'Trojan bancário ativo', 'Banking', 'Brazil', 'Brazil', '192.168.1.200', 'Trojan', 'active', NOW() - INTERVAL '1 day'),
  ('Data Breach', 'high', 'Exposição de banco de dados não protegido', 'Healthcare', 'Unknown', 'Canada', '203.0.113.150', 'Misconfiguration', 'mitigated', NOW() - INTERVAL '5 days'),
  ('Cryptojacking', 'medium', 'Mineração em servidores corporativos', 'Corporate', 'Unknown', 'Brazil', '198.51.100.100', 'Malware', 'resolved', NOW() - INTERVAL '20 days'),
  ('Phishing', 'critical', 'Spear phishing direcionado a executivos', 'Corporate', 'China', 'USA', '192.0.2.150', 'Targeted Email', 'active', NOW() - INTERVAL '4 hours'),
  ('DDoS', 'low', 'Ataque DDoS de baixa intensidade', 'Small Business', 'Unknown', 'Brazil', '198.18.0.100', 'IoT Botnet', 'resolved', NOW() - INTERVAL '30 days'),
  ('Ransomware', 'critical', 'WannaCry variante detectada', 'Healthcare', 'North Korea', 'Global', '172.16.0.100', 'Worm', 'active', NOW() - INTERVAL '1 hour'),
  ('SQL Injection', 'high', 'Tentativa de SQL injection em e-commerce', 'E-commerce', 'Unknown', 'Brazil', '10.0.0.200', 'Web Application', 'mitigated', NOW() - INTERVAL '3 days'),
  ('Account Takeover', 'high', 'Sequestro de contas em massa', 'Social Media', 'Russia', 'USA', '192.168.100.50', 'Credential Theft', 'active', NOW() - INTERVAL '2 days'),
  ('Backdoor', 'critical', 'Backdoor instalado em sistema financeiro', 'Banking', 'China', 'Singapore', '203.0.113.200', 'APT', 'active', NOW() - INTERVAL '6 days');

-- Habilitar realtime para atualizações em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.cyber_crimes;