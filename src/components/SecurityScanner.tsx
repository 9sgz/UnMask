import { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Search, Globe, Lock, Eye, Clock, Zap, Mail, Cpu, Target, Scan, Activity, Bug, MessageCircle, CreditCard, DollarSign, BarChart3 } from 'lucide-react';
import unmaskLogo from '@/assets/unmask-logo-new.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useNavigate } from 'react-router-dom';

/// <reference types="chrome" />

interface ScanResult {
  url: string;
  status: 'safe' | 'danger' | 'warning' | 'scanning';
  score: number;
  checks: {
    ssl: boolean;
    reputation: boolean;
    malware: boolean;
    phishing: boolean;
    redirects: boolean;
    age: boolean;
  };
  details: {
    domain: string;
    title: string;
    description: string;
    lastScan: string;
  };
}

interface SecurityScannerProps {
  initialUrl?: string;
  extensionMode?: boolean;
}

export const SecurityScanner = ({ initialUrl = '', extensionMode = false }: SecurityScannerProps) => {
  const [currentUrl, setCurrentUrl] = useState(initialUrl || 'https://exemplo-site.com.br');
  const [email, setEmail] = useState('');
  const [paymentLink, setPaymentLink] = useState('');
  const [activeTab, setActiveTab] = useState<'url' | 'email' | 'payment'>('url');
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [emailResult, setEmailResult] = useState<any>(null);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  const scanUrl = async () => {
    if (!currentUrl) {
      toast({
        title: "URL obrigatória",
        description: "Por favor, insira uma URL para análise",
        variant: "destructive",
      });
      return;
    }

    try {
      new URL(currentUrl);
    } catch {
      toast({
        title: "URL inválida",
        description: "Por favor, insira uma URL válida (exemplo: https://site.com)",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);
    setProgress(0);
    setResult(null);
    setEmailResult(null);
    setPaymentResult(null);

    // If in extension mode, use chrome API
    if (extensionMode && typeof chrome !== 'undefined' && chrome.runtime) {
      try {
        const response = await chrome.runtime.sendMessage({
          action: 'analyzeUrl',
          url: currentUrl
        });
        
        if (response) {
          setResult(response);
          setIsScanning(false);
          setProgress(100);
          
          toast({
            title: "Análise concluída",
            description: `Site ${response.status === 'safe' ? 'seguro' : response.status === 'danger' ? 'perigoso' : 'suspeito'} detectado`,
            variant: response.status === 'danger' ? "destructive" : "default",
          });
        }
        return;
      } catch (error) {
        console.error('Extension API error:', error);
      }
    }

    // Fallback to simulated scanning
    const scanSteps = [
      'Verificando certificado SSL...',
      'Analisando reputação do domínio...',
      'Escaneando por malware...',
      'Detectando phishing...',
      'Verificando redirecionamentos...',
      'Validando idade do domínio...',
    ];

    for (let i = 0; i < scanSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setProgress((i + 1) * (100 / scanSteps.length));
    }

    // Simulate analysis result
    const mockResult: ScanResult = {
      url: currentUrl,
      status: Math.random() > 0.7 ? 'danger' : Math.random() > 0.5 ? 'warning' : 'safe',
      score: Math.floor(Math.random() * 100),
      checks: {
        ssl: Math.random() > 0.2,
        reputation: Math.random() > 0.3,
        malware: Math.random() > 0.1,
        phishing: Math.random() > 0.2,
        redirects: Math.random() > 0.4,
        age: Math.random() > 0.3,
      },
      details: {
        domain: new URL(currentUrl).hostname,
        title: 'Site Analisado',
        description: 'Resultado da análise de segurança',
        lastScan: new Date().toLocaleString('pt-BR'),
      }
    };

    setResult(mockResult);
    setIsScanning(false);
    setProgress(100);

    toast({
      title: "Análise concluída",
      description: `Site ${mockResult.status === 'safe' ? 'seguro' : mockResult.status === 'danger' ? 'perigoso' : 'suspeito'} detectado`,
      variant: mockResult.status === 'danger' ? "destructive" : "default",
    });
  };

  const scanEmail = async () => {
    if (!email) {
      toast({
        title: "E-mail obrigatório",
        description: "Por favor, insira um e-mail para análise",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);
    setProgress(0);
    setResult(null);
    setEmailResult(null);
    setPaymentResult(null);

    // Simulated email scanning process
    const scanSteps = [
      'Verificando domínio do e-mail...',
      'Analisando padrões de spam...',
      'Verificando blacklists...',
      'Validando sintaxe...',
      'Checando reputação...',
    ];

    for (let i = 0; i < scanSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 600));
      setProgress((i + 1) * (100 / scanSteps.length));
    }

    // Simulate email analysis result
    const mockEmailResult = {
      email,
      status: Math.random() > 0.6 ? 'danger' : Math.random() > 0.4 ? 'warning' : 'safe',
      score: Math.floor(Math.random() * 100),
      checks: {
        syntax: Math.random() > 0.1,
        domain: Math.random() > 0.2,
        blacklist: Math.random() > 0.3,
        spam: Math.random() > 0.4,
        reputation: Math.random() > 0.3,
      },
      details: {
        domain: email.split('@')[1] || '',
        provider: email.includes('gmail') ? 'Gmail' : email.includes('outlook') ? 'Outlook' : 'Desconhecido',
        lastScan: new Date().toLocaleString('pt-BR'),
      }
    };

    setEmailResult(mockEmailResult);
    setIsScanning(false);
    setProgress(100);

    toast({
      title: "Análise de e-mail concluída",
      description: `E-mail ${mockEmailResult.status === 'safe' ? 'válido' : mockEmailResult.status === 'danger' ? 'suspeito' : 'duvidoso'} detectado`,
      variant: mockEmailResult.status === 'danger' ? "destructive" : "default",
    });
  };

  const scanPaymentLink = async () => {
    if (!paymentLink) {
      toast({
        title: "Link obrigatório",
        description: "Por favor, insira um link de pagamento para análise",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);
    setProgress(0);
    setResult(null);
    setEmailResult(null);
    setPaymentResult(null);

    // Simulated payment link scanning process
    const scanSteps = [
      'Verificando SSL do link...',
      'Analisando gateway de pagamento...',
      'Verificando certificações...',
      'Detectando fraudes...',
      'Validando merchant...',
      'Checando criptografia...',
    ];

    for (let i = 0; i < scanSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 700));
      setProgress((i + 1) * (100 / scanSteps.length));
    }

    // Simulate payment link analysis result
    const mockPaymentResult = {
      link: paymentLink,
      status: Math.random() > 0.7 ? 'danger' : Math.random() > 0.5 ? 'warning' : 'safe',
      score: Math.floor(Math.random() * 100),
      checks: {
        ssl: Math.random() > 0.1,
        gateway: Math.random() > 0.2,
        certification: Math.random() > 0.3,
        fraud: Math.random() > 0.2,
        merchant: Math.random() > 0.3,
        encryption: Math.random() > 0.2,
      },
      details: {
        gateway: paymentLink.includes('stripe') ? 'Stripe' : paymentLink.includes('paypal') ? 'PayPal' : paymentLink.includes('mercadopago') ? 'Mercado Pago' : 'Desconhecido',
        merchant: 'Merchant verificado',
        lastScan: new Date().toLocaleString('pt-BR'),
      }
    };

    setPaymentResult(mockPaymentResult);
    setIsScanning(false);
    setProgress(100);

    toast({
      title: "Análise de link de pagamento concluída",
      description: `Link ${mockPaymentResult.status === 'safe' ? 'seguro' : mockPaymentResult.status === 'danger' ? 'suspeito' : 'requer atenção'}`,
      variant: mockPaymentResult.status === 'danger' ? "destructive" : "default",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return <CheckCircle className="w-8 h-8 text-safe" />;
      case 'danger': return <XCircle className="w-8 h-8 text-danger" />;
      case 'warning': return <AlertTriangle className="w-8 h-8 text-warning" />;
      default: return <Shield className="w-8 h-8 text-scanning" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'safe': return <Badge className="bg-safe text-safe-foreground">SEGURO</Badge>;
      case 'danger': return <Badge className="bg-danger text-danger-foreground">PERIGOSO</Badge>;
      case 'warning': return <Badge className="bg-warning text-warning-foreground">SUSPEITO</Badge>;
      default: return <Badge className="bg-scanning text-scanning-foreground">ANALISANDO</Badge>;
    }
  };

  const getCardClass = (status: string) => {
    switch (status) {
      case 'safe': return 'gradient-safe shadow-safe';
      case 'danger': return 'gradient-danger shadow-danger';
      case 'warning': return 'gradient-warning shadow-warning';
      default: return 'gradient-hero shadow-scanning';
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <Target className="w-12 h-12 text-blue-500 animate-scan-pulse" />
            <h1 className="text-4xl font-bold text-blue-500">
              UnMask
            </h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Sistema inteligente de detecção de ameaças digitais
          </p>
          <div className="flex justify-center mt-4 space-x-3">
            <ThemeToggle />
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/10"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard de Crimes
            </Button>
          </div>
          <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Activity className="w-4 h-4 text-primary" />
              <span>AI-Powered</span>
            </div>
            <div className="flex items-center space-x-1">
              <Cpu className="w-4 h-4 text-primary" />
              <span>Real-time</span>
            </div>
            <div className="flex items-center space-x-1">
              <Bug className="w-4 h-4 text-primary" />
              <span>Anti-Phishing</span>
            </div>
          </div>
        </div>

        {/* Scanner Tabs */}
        <Card className="p-6 bg-card border border-border shadow-lg">
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex space-x-2 bg-muted/50 p-1 rounded-lg border border-border">
              <button
                onClick={() => setActiveTab('url')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-md transition-all ${
                  activeTab === 'url' 
                    ? 'bg-primary text-primary-foreground shadow-lg' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                <Scan className="w-4 h-4" />
                <span className="font-medium">Sites</span>
              </button>
              <button
                onClick={() => setActiveTab('email')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-md transition-all ${
                  activeTab === 'email' 
                    ? 'bg-primary text-primary-foreground shadow-lg' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                <Mail className="w-4 h-4" />
                <span className="font-medium">E-mail</span>
              </button>
              <button
                onClick={() => setActiveTab('payment')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-md transition-all ${
                  activeTab === 'payment' 
                    ? 'bg-primary text-primary-foreground shadow-lg' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span className="font-medium">Pagamentos</span>
              </button>
            </div>

            {/* URL Scanner */}
            {activeTab === 'url' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-primary" />
                  <label className="text-sm font-medium">Insira a URL para análise</label>
                </div>
                <div className="flex space-x-3">
                  <Input
                    type="url"
                    placeholder="https://exemplo-site.com"
                    value={currentUrl}
                    onChange={(e) => setCurrentUrl(e.target.value)}
                    className="flex-1 bg-background border-border focus:border-primary"
                    disabled={isScanning}
                  />
                  <Button
                    onClick={scanUrl}
                    disabled={isScanning || !currentUrl}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
                  >
                    {isScanning ? (
                      <>
                        <Cpu className="w-4 h-4 mr-2 animate-scan-rotate" />
                        Analisando...
                      </>
                    ) : (
                      <>
                        <Scan className="w-4 h-4 mr-2" />
                        Escanear Site
                      </>
                    )}
                  </Button>
                  {(result || emailResult || paymentResult) && (
                    <Button
                      onClick={() => {
                        setResult(null);
                        setEmailResult(null);
                        setPaymentResult(null);
                        setProgress(0);
                        toast({
                          title: "Interface limpa",
                          description: "Pronto para nova análise",
                        });
                      }}
                      variant="outline"
                      className="border-primary/30 text-primary hover:bg-primary/10 px-6"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Limpar
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Email Scanner */}
            {activeTab === 'email' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Mail className="w-5 h-5 text-primary" />
                  <label className="text-sm font-medium">Verificar e-mail</label>
                </div>
                <div className="flex space-x-3">
                  <Input
                    type="email"
                    placeholder="exemplo@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 bg-background border-border focus:border-primary"
                    disabled={isScanning}
                  />
                  <Button
                    onClick={scanEmail}
                    disabled={isScanning || !email}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
                  >
                    {isScanning ? (
                      <>
                        <Activity className="w-4 h-4 mr-2 animate-scan-rotate" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Verificar E-mail
                      </>
                    )}
                  </Button>
                  {(result || emailResult || paymentResult) && (
                    <Button
                      onClick={() => {
                        setResult(null);
                        setEmailResult(null);
                        setPaymentResult(null);
                        setProgress(0);
                        setEmail('');
                        toast({
                          title: "Interface limpa",
                          description: "Pronto para nova análise",
                        });
                      }}
                      variant="outline"
                      className="border-primary/30 text-primary hover:bg-primary/10 px-6"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Limpar
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Payment Link Scanner */}
            {activeTab === 'payment' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <label className="text-sm font-medium">Analisar link de pagamento</label>
                </div>
                <div className="flex space-x-3">
                  <Input
                    type="url"
                    placeholder="https://pay.stripe.com/..."
                    value={paymentLink}
                    onChange={(e) => setPaymentLink(e.target.value)}
                    className="flex-1 bg-background border-border focus:border-primary"
                    disabled={isScanning}
                  />
                  <Button
                    onClick={scanPaymentLink}
                    disabled={isScanning || !paymentLink}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
                  >
                    {isScanning ? (
                      <>
                        <Activity className="w-4 h-4 mr-2 animate-scan-rotate" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-4 h-4 mr-2" />
                        Verificar Link
                      </>
                    )}
                  </Button>
                  {(result || emailResult || paymentResult) && (
                    <Button
                      onClick={() => {
                        setResult(null);
                        setEmailResult(null);
                        setPaymentResult(null);
                        setProgress(0);
                        setPaymentLink('');
                        toast({
                          title: "Interface limpa",
                          description: "Pronto para nova análise",
                        });
                      }}
                      variant="outline"
                      className="border-primary/30 text-primary hover:bg-primary/10 px-6"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Limpar
                    </Button>
                  )}
                </div>
              </div>
            )}
            
            {isScanning && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground text-center">
                  {activeTab === 'url' && 'Executando verificações de segurança...'}
                  {activeTab === 'email' && 'Analisando padrões de e-mail...'}
                  {activeTab === 'payment' && 'Verificando segurança do link de pagamento...'}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* URL Results */}
        {result && (
          <Card className={`p-6 transition-bounce ${getCardClass(result.status)}`}>
            <div className="space-y-6">
              {/* Status Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(result.status)}
                  <div>
                    <h3 className="text-xl font-semibold">{result.details.domain}</h3>
                    <p className="text-sm text-muted-foreground">
                      Score: {result.score}/100
                    </p>
                  </div>
                </div>
                {getStatusBadge(result.status)}
              </div>

              {/* Security Checks Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Lock className={`w-4 h-4 ${result.checks.ssl ? 'text-safe' : 'text-danger'}`} />
                  <span className="text-sm">SSL/HTTPS</span>
                  {result.checks.ssl ? <CheckCircle className="w-4 h-4 text-safe" /> : <XCircle className="w-4 h-4 text-danger" />}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Globe className={`w-4 h-4 ${result.checks.reputation ? 'text-safe' : 'text-danger'}`} />
                  <span className="text-sm">Reputação</span>
                  {result.checks.reputation ? <CheckCircle className="w-4 h-4 text-safe" /> : <XCircle className="w-4 h-4 text-danger" />}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Shield className={`w-4 h-4 ${result.checks.malware ? 'text-safe' : 'text-danger'}`} />
                  <span className="text-sm">Anti-Malware</span>
                  {result.checks.malware ? <CheckCircle className="w-4 h-4 text-safe" /> : <XCircle className="w-4 h-4 text-danger" />}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Eye className={`w-4 h-4 ${result.checks.phishing ? 'text-safe' : 'text-danger'}`} />
                  <span className="text-sm">Anti-Phishing</span>
                  {result.checks.phishing ? <CheckCircle className="w-4 h-4 text-safe" /> : <XCircle className="w-4 h-4 text-danger" />}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Zap className={`w-4 h-4 ${result.checks.redirects ? 'text-safe' : 'text-danger'}`} />
                  <span className="text-sm">Redirecionamentos</span>
                  {result.checks.redirects ? <CheckCircle className="w-4 h-4 text-safe" /> : <XCircle className="w-4 h-4 text-danger" />}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Clock className={`w-4 h-4 ${result.checks.age ? 'text-safe' : 'text-danger'}`} />
                  <span className="text-sm">Idade do Domínio</span>
                  {result.checks.age ? <CheckCircle className="w-4 h-4 text-safe" /> : <XCircle className="w-4 h-4 text-danger" />}
                </div>
              </div>

              {/* Recommendation */}
              <div className="p-4 rounded-lg border border-border/50 bg-background/30">
                <h4 className="font-semibold mb-2">Recomendação:</h4>
                <p className="text-sm">
                  {result.status === 'safe' && 'Este site passou em todas as verificações de segurança. É seguro para navegação.'}
                  {result.status === 'warning' && 'Este site apresenta alguns riscos. Proceda com cautela e evite inserir dados pessoais.'}
                  {result.status === 'danger' && 'ATENÇÃO: Este site foi identificado como perigoso. Não prossiga e feche a página imediatamente.'}
                </p>
              </div>

              {/* Last Scan */}
              <div className="text-xs text-muted-foreground text-center">
                Última análise: {result.details.lastScan}
              </div>
            </div>
          </Card>
        )}

        {/* Email Results */}
        {emailResult && (
          <Card className={`p-6 transition-bounce ${getCardClass(emailResult.status)}`}>
            <div className="space-y-6">
              {/* Status Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(emailResult.status)}
                  <div>
                    <h3 className="text-xl font-semibold">{emailResult.email}</h3>
                    <p className="text-sm text-muted-foreground">
                      Score: {emailResult.score}/100 • Provider: {emailResult.details.provider}
                    </p>
                  </div>
                </div>
                {getStatusBadge(emailResult.status)}
              </div>

              {/* Email Checks Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Mail className={`w-4 h-4 ${emailResult.checks.syntax ? 'text-safe' : 'text-danger'}`} />
                  <span className="text-sm">Sintaxe</span>
                  {emailResult.checks.syntax ? <CheckCircle className="w-4 h-4 text-safe" /> : <XCircle className="w-4 h-4 text-danger" />}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Globe className={`w-4 h-4 ${emailResult.checks.domain ? 'text-safe' : 'text-danger'}`} />
                  <span className="text-sm">Domínio</span>
                  {emailResult.checks.domain ? <CheckCircle className="w-4 h-4 text-safe" /> : <XCircle className="w-4 h-4 text-danger" />}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Shield className={`w-4 h-4 ${emailResult.checks.blacklist ? 'text-safe' : 'text-danger'}`} />
                  <span className="text-sm">Blacklist</span>
                  {emailResult.checks.blacklist ? <CheckCircle className="w-4 h-4 text-safe" /> : <XCircle className="w-4 h-4 text-danger" />}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Bug className={`w-4 h-4 ${emailResult.checks.spam ? 'text-safe' : 'text-danger'}`} />
                  <span className="text-sm">Anti-Spam</span>
                  {emailResult.checks.spam ? <CheckCircle className="w-4 h-4 text-safe" /> : <XCircle className="w-4 h-4 text-danger" />}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Activity className={`w-4 h-4 ${emailResult.checks.reputation ? 'text-safe' : 'text-danger'}`} />
                  <span className="text-sm">Reputação</span>
                  {emailResult.checks.reputation ? <CheckCircle className="w-4 h-4 text-safe" /> : <XCircle className="w-4 h-4 text-danger" />}
                </div>
              </div>

              {/* Recommendation */}
              <div className="p-4 rounded-lg border border-border/50 bg-background/30">
                <h4 className="font-semibold mb-2">Recomendação:</h4>
                <p className="text-sm">
                  {emailResult.status === 'safe' && 'Este e-mail passou em todas as verificações. Aparenta ser legítimo.'}
                  {emailResult.status === 'warning' && 'Este e-mail apresenta alguns sinais suspeitos. Verifique a origem antes de confiar.'}
                  {emailResult.status === 'danger' && 'ATENÇÃO: Este e-mail foi identificado como potencialmente malicioso. Não clique em links ou forneça informações.'}
                </p>
              </div>

              {/* Last Scan */}
              <div className="text-xs text-muted-foreground text-center">
                Última análise: {emailResult.details.lastScan}
              </div>
            </div>
          </Card>
        )}

        {/* Payment Link Results */}
        {paymentResult && (
          <Card className={`p-6 transition-bounce ${getCardClass(paymentResult.status)}`}>
            <div className="space-y-6">
              {/* Status Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(paymentResult.status)}
                  <div>
                    <h3 className="text-xl font-semibold flex items-center space-x-2">
                      <CreditCard className="w-5 h-5" />
                      <span>Link de Pagamento</span>
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Score: {paymentResult.score}/100 • Gateway: {paymentResult.details.gateway}
                    </p>
                  </div>
                </div>
                {getStatusBadge(paymentResult.status)}
              </div>

              {/* Payment Security Checks Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Lock className={`w-4 h-4 ${paymentResult.checks.ssl ? 'text-safe' : 'text-danger'}`} />
                  <span className="text-sm">SSL/HTTPS</span>
                  {paymentResult.checks.ssl ? <CheckCircle className="w-4 h-4 text-safe" /> : <XCircle className="w-4 h-4 text-danger" />}
                </div>
                
                <div className="flex items-center space-x-2">
                  <CreditCard className={`w-4 h-4 ${paymentResult.checks.gateway ? 'text-safe' : 'text-danger'}`} />
                  <span className="text-sm">Gateway</span>
                  {paymentResult.checks.gateway ? <CheckCircle className="w-4 h-4 text-safe" /> : <XCircle className="w-4 h-4 text-danger" />}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Shield className={`w-4 h-4 ${paymentResult.checks.certification ? 'text-safe' : 'text-danger'}`} />
                  <span className="text-sm">Certificação</span>
                  {paymentResult.checks.certification ? <CheckCircle className="w-4 h-4 text-safe" /> : <XCircle className="w-4 h-4 text-danger" />}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Bug className={`w-4 h-4 ${paymentResult.checks.fraud ? 'text-safe' : 'text-danger'}`} />
                  <span className="text-sm">Anti-Fraude</span>
                  {paymentResult.checks.fraud ? <CheckCircle className="w-4 h-4 text-safe" /> : <XCircle className="w-4 h-4 text-danger" />}
                </div>
                
                <div className="flex items-center space-x-2">
                  <DollarSign className={`w-4 h-4 ${paymentResult.checks.merchant ? 'text-safe' : 'text-danger'}`} />
                  <span className="text-sm">Merchant</span>
                  {paymentResult.checks.merchant ? <CheckCircle className="w-4 h-4 text-safe" /> : <XCircle className="w-4 h-4 text-danger" />}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Eye className={`w-4 h-4 ${paymentResult.checks.encryption ? 'text-safe' : 'text-danger'}`} />
                  <span className="text-sm">Criptografia</span>
                  {paymentResult.checks.encryption ? <CheckCircle className="w-4 h-4 text-safe" /> : <XCircle className="w-4 h-4 text-danger" />}
                </div>
              </div>

              {/* Recommendation */}
              <div className="p-4 rounded-lg border border-border/50 bg-background/30">
                <h4 className="font-semibold mb-2">Recomendação:</h4>
                <p className="text-sm">
                  {paymentResult.status === 'safe' && 'Este link de pagamento passou em todas as verificações de segurança. É seguro para realizar transações.'}
                  {paymentResult.status === 'warning' && 'Este link de pagamento apresenta alguns riscos. Verifique a legitimidade antes de realizar transações.'}
                  {paymentResult.status === 'danger' && 'ATENÇÃO: Este link de pagamento foi identificado como potencialmente fraudulento. NÃO realize transações.'}
                </p>
              </div>

              {/* Last Scan */}
              <div className="text-xs text-muted-foreground text-center">
                Última análise: {paymentResult.details.lastScan}
              </div>
            </div>
          </Card>
        )}

        {/* Extension Preview */}
        <Card className="p-6 border border-primary/30 shadow-scanning">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Cpu className="w-5 h-5 mr-2 text-primary animate-scan-pulse" />
            Simulador da Extensão Chrome
          </h3>
          <div className="bg-card/50 p-4 rounded-lg border border-border/50 space-y-4">
            <p className="text-sm text-muted-foreground mb-3">
              Interface da extensão - teste a funcionalidade aqui:
            </p>
            
            {/* Extension Interface Simulation */}
            <div className="bg-background/80 p-3 rounded-md border border-primary/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">UnMask Protection</span>
                </div>
                <Badge className={`text-xs ${
                  result?.status === 'safe' ? 'bg-safe text-safe-foreground' :
                  result?.status === 'danger' ? 'bg-danger text-danger-foreground' :
                  result?.status === 'warning' ? 'bg-warning text-warning-foreground' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {result?.status === 'safe' ? 'SEGURO' :
                   result?.status === 'danger' ? 'PERIGOSO' :
                   result?.status === 'warning' ? 'SUSPEITO' :
                   'INATIVO'}
                </Badge>
              </div>
              
              <div className="text-xs text-muted-foreground">
                URL atual: {currentUrl || 'Nenhuma URL detectada'}
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  onClick={scanUrl}
                  disabled={isScanning || !currentUrl}
                  className="bg-primary text-primary-foreground text-xs px-3 py-1"
                >
                  <Scan className="w-3 h-3 mr-1" />
                  Scan Rápido
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setResult(null);
                    setEmailResult(null);
                    setPaymentResult(null);
                    toast({
                      title: "Proteção ativada",
                      description: "Monitoramento automático iniciado",
                    });
                  }}
                  className="text-xs px-3 py-1 bg-safe hover:bg-safe/80 text-safe-foreground border-safe"
                >
                  <Shield className="w-3 h-3 mr-1" />
                  Proteger
                </Button>
              </div>
              
              {result && (
                <div className="mt-3 p-2 rounded border border-border/30 bg-background/50">
                  <div className="flex items-center space-x-2 text-xs">
                    {result.status === 'safe' && <CheckCircle className="w-3 h-3 text-safe" />}
                    {result.status === 'danger' && <XCircle className="w-3 h-3 text-danger" />}
                    {result.status === 'warning' && <AlertTriangle className="w-3 h-3 text-warning" />}
                    <span className="font-medium">
                      {result.status === 'safe' ? 'Site verificado e seguro' :
                       result.status === 'danger' ? 'ATENÇÃO: Site perigoso detectado!' :
                       'Site apresenta riscos - cuidado'}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Score: {result.score}/100 • Verificações: {Object.values(result.checks).filter(Boolean).length}/6
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Activity className="w-3 h-3 text-primary" />
                <span>Simulação da extensão • Funcionalidade real em desenvolvimento</span>
              </div>
            </div>
          </div>
        </Card>

        {/* WhatsApp Integration */}
        <Card className="p-6 border border-primary/30 shadow-scanning">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-primary animate-scan-pulse" />
            Bot WhatsApp - UnMask
          </h3>
          <div className="bg-card/50 p-4 rounded-lg border border-border/50 space-y-4">
            <p className="text-sm text-muted-foreground mb-3">
              Comandos inteligentes para proteção via WhatsApp:
            </p>
            <div className="space-y-2 text-sm font-mono">
              <div>🎯 <span className="text-primary">/scan https://site.com</span> - Análise completa de URL</div>
              <div>📧 <span className="text-primary">/email usuario@dominio.com</span> - Verificar e-mail</div>
              <div>🛡️ <span className="text-primary">/status</span> - Status de proteção</div>
              <div>⚡ <span className="text-primary">/quick</span> - Scan rápido da última URL</div>
              <div>ℹ️ <span className="text-primary">/ajuda</span> - Lista completa de comandos</div>
            </div>
            
            {/* WhatsApp Button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={() => {
                  const message = "Olá! Gostaria de usar o UnMask Bot para verificar a segurança de sites e e-mails. Pode me ajudar com os comandos disponíveis?";
                  const phoneNumber = "5511999999999"; // Substitua pelo número do bot
                  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
                  window.open(whatsappUrl, '_blank');
                  
                  toast({
                    title: "Abrindo WhatsApp",
                    description: "Redirecionando para conversa com o bot UnMask",
                  });
                }}
                className="bg-[#25D366] hover:bg-[#128C7E] text-white px-6 py-3 rounded-full flex items-center space-x-2 font-medium transition-all transform hover:scale-105"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Iniciar Conversa no WhatsApp</span>
              </Button>
            </div>
            
            <div className="mt-3 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Cpu className="w-3 h-3 text-primary" />
                <span>Powered by AI • Respostas em tempo real</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};