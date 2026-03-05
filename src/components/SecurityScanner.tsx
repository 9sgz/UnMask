import { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Search, Globe, Lock, Eye, Clock, Zap, Mail, Cpu, Target, Scan, Activity, Bug, MessageCircle, CreditCard, DollarSign, BarChart3, ArrowRight, Sparkles, ChevronRight } from 'lucide-react';
import unmaskLogo from '@/assets/unmask-logo-new.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useNavigate } from 'react-router-dom';
import Waves from './Waves';

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
      toast({ title: "URL obrigatória", description: "Por favor, insira uma URL para análise", variant: "destructive" });
      return;
    }
    try { new URL(currentUrl); } catch {
      toast({ title: "URL inválida", description: "Por favor, insira uma URL válida (exemplo: https://site.com)", variant: "destructive" });
      return;
    }
    setIsScanning(true); setProgress(0); setResult(null); setEmailResult(null); setPaymentResult(null);
    if (extensionMode && typeof chrome !== 'undefined' && chrome.runtime) {
      try {
        const response = await chrome.runtime.sendMessage({ action: 'analyzeUrl', url: currentUrl });
        if (response) { setResult(response); setIsScanning(false); setProgress(100);
          toast({ title: "Análise concluída", description: `Site ${response.status === 'safe' ? 'seguro' : response.status === 'danger' ? 'perigoso' : 'suspeito'} detectado`, variant: response.status === 'danger' ? "destructive" : "default" });
        } return;
      } catch (error) { console.error('Extension API error:', error); }
    }
    const scanSteps = ['Verificando certificado SSL...', 'Analisando reputação do domínio...', 'Escaneando por malware...', 'Detectando phishing...', 'Verificando redirecionamentos...', 'Validando idade do domínio...'];
    for (let i = 0; i < scanSteps.length; i++) { await new Promise(resolve => setTimeout(resolve, 800)); setProgress((i + 1) * (100 / scanSteps.length)); }
    const mockResult: ScanResult = {
      url: currentUrl, status: Math.random() > 0.7 ? 'danger' : Math.random() > 0.5 ? 'warning' : 'safe', score: Math.floor(Math.random() * 100),
      checks: { ssl: Math.random() > 0.2, reputation: Math.random() > 0.3, malware: Math.random() > 0.1, phishing: Math.random() > 0.2, redirects: Math.random() > 0.4, age: Math.random() > 0.3 },
      details: { domain: new URL(currentUrl).hostname, title: 'Site Analisado', description: 'Resultado da análise de segurança', lastScan: new Date().toLocaleString('pt-BR') }
    };
    setResult(mockResult); setIsScanning(false); setProgress(100);
    toast({ title: "Análise concluída", description: `Site ${mockResult.status === 'safe' ? 'seguro' : mockResult.status === 'danger' ? 'perigoso' : 'suspeito'} detectado`, variant: mockResult.status === 'danger' ? "destructive" : "default" });
  };

  const scanEmail = async () => {
    if (!email) { toast({ title: "E-mail obrigatório", description: "Por favor, insira um e-mail para análise", variant: "destructive" }); return; }
    setIsScanning(true); setProgress(0); setResult(null); setEmailResult(null); setPaymentResult(null);
    const scanSteps = ['Verificando domínio do e-mail...', 'Analisando padrões de spam...', 'Verificando blacklists...', 'Validando sintaxe...', 'Checando reputação...'];
    for (let i = 0; i < scanSteps.length; i++) { await new Promise(resolve => setTimeout(resolve, 600)); setProgress((i + 1) * (100 / scanSteps.length)); }
    const mockEmailResult = {
      email, status: Math.random() > 0.6 ? 'danger' : Math.random() > 0.4 ? 'warning' : 'safe', score: Math.floor(Math.random() * 100),
      checks: { syntax: Math.random() > 0.1, domain: Math.random() > 0.2, blacklist: Math.random() > 0.3, spam: Math.random() > 0.4, reputation: Math.random() > 0.3 },
      details: { domain: email.split('@')[1] || '', provider: email.includes('gmail') ? 'Gmail' : email.includes('outlook') ? 'Outlook' : 'Desconhecido', lastScan: new Date().toLocaleString('pt-BR') }
    };
    setEmailResult(mockEmailResult); setIsScanning(false); setProgress(100);
    toast({ title: "Análise de e-mail concluída", description: `E-mail ${mockEmailResult.status === 'safe' ? 'válido' : mockEmailResult.status === 'danger' ? 'suspeito' : 'duvidoso'} detectado`, variant: mockEmailResult.status === 'danger' ? "destructive" : "default" });
  };

  const scanPaymentLink = async () => {
    if (!paymentLink) { toast({ title: "Link obrigatório", description: "Por favor, insira um link de pagamento para análise", variant: "destructive" }); return; }
    setIsScanning(true); setProgress(0); setResult(null); setEmailResult(null); setPaymentResult(null);
    const scanSteps = ['Verificando SSL do link...', 'Analisando gateway de pagamento...', 'Verificando certificações...', 'Detectando fraudes...', 'Validando merchant...', 'Checando criptografia...'];
    for (let i = 0; i < scanSteps.length; i++) { await new Promise(resolve => setTimeout(resolve, 700)); setProgress((i + 1) * (100 / scanSteps.length)); }
    const mockPaymentResult = {
      link: paymentLink, status: Math.random() > 0.7 ? 'danger' : Math.random() > 0.5 ? 'warning' : 'safe', score: Math.floor(Math.random() * 100),
      checks: { ssl: Math.random() > 0.1, gateway: Math.random() > 0.2, certification: Math.random() > 0.3, fraud: Math.random() > 0.2, merchant: Math.random() > 0.3, encryption: Math.random() > 0.2 },
      details: { gateway: paymentLink.includes('stripe') ? 'Stripe' : paymentLink.includes('paypal') ? 'PayPal' : paymentLink.includes('mercadopago') ? 'Mercado Pago' : 'Desconhecido', merchant: 'Merchant verificado', lastScan: new Date().toLocaleString('pt-BR') }
    };
    setPaymentResult(mockPaymentResult); setIsScanning(false); setProgress(100);
    toast({ title: "Análise de link de pagamento concluída", description: `Link ${mockPaymentResult.status === 'safe' ? 'seguro' : mockPaymentResult.status === 'danger' ? 'suspeito' : 'requer atenção'}`, variant: mockPaymentResult.status === 'danger' ? "destructive" : "default" });
  };

  const clearResults = () => {
    setResult(null); setEmailResult(null); setPaymentResult(null); setProgress(0);
    toast({ title: "Interface limpa", description: "Pronto para nova análise" });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return <CheckCircle className="w-8 h-8 text-safe" />;
      case 'danger': return <XCircle className="w-8 h-8 text-danger" />;
      case 'warning': return <AlertTriangle className="w-8 h-8 text-warning" />;
      default: return <Shield className="w-8 h-8 text-scanning" />;
    }
  };
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'safe': return 'SEGURO';
      case 'danger': return 'PERIGOSO';
      case 'warning': return 'SUSPEITO';
      default: return 'ANALISANDO';
    }
  };
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'safe': return 'bg-safe text-safe-foreground';
      case 'danger': return 'bg-danger text-danger-foreground';
      case 'warning': return 'bg-warning text-warning-foreground';
      default: return 'bg-scanning text-scanning-foreground';
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

  const hasResults = result || emailResult || paymentResult;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Waves
        lineColor="hsl(230, 85%, 55%)"
        backgroundColor="transparent"
        waveSpeedX={0.0125}
        waveSpeedY={0.008}
        waveAmpX={32}
        waveAmpY={16}
        friction={0.92}
        tension={0.008}
        maxCursorMove={100}
        xGap={14}
        yGap={40}
      />

      <nav className="relative z-20 px-6 md:px-10 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">UnMask</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              size="sm"
              className="rounded-xl border-border hover:bg-muted/50"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-10">
        <section className="pt-12 pb-16 md:pt-20 md:pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Proteção inteligente com IA</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-6">
            Proteja-se contra
            <br />
            <span className="text-primary">ameaças digitais</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Sistema inteligente de detecção que analisa sites, e-mails e links de pagamento em tempo real para sua segurança.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm text-muted-foreground mb-12">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center">
                <Activity className="w-4 h-4 text-primary" />
              </div>
              <span className="font-medium">AI-Powered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <span className="font-medium">Tempo Real</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <span className="font-medium">Anti-Phishing</span>
            </div>
          </div>
        </section>

        <section className="pb-16 md:pb-24">
          <Card className="p-8 md:p-10">
            <div className="space-y-8">
              <div className="flex bg-muted/40 p-1.5 rounded-2xl gap-1.5">
                {[
                  { key: 'url' as const, icon: Scan, label: 'Sites' },
                  { key: 'email' as const, icon: Mail, label: 'E-mail' },
                  { key: 'payment' as const, icon: CreditCard, label: 'Pagamentos' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 ${
                      activeTab === tab.key
                        ? 'bg-primary text-primary-foreground shadow-cta'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {activeTab === 'url' && (
                <div className="space-y-4">
                  <label className="text-sm font-medium text-muted-foreground">Insira a URL para análise de segurança</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      type="url"
                      placeholder="https://exemplo-site.com"
                      value={currentUrl}
                      onChange={(e) => setCurrentUrl(e.target.value)}
                      className="flex-1 h-14 px-5 rounded-2xl bg-background/80 border-border/60 text-base focus:border-primary focus:ring-2 focus:ring-primary/20"
                      disabled={isScanning}
                    />
                    <Button
                      onClick={scanUrl}
                      disabled={isScanning || !currentUrl}
                      className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-cta hover:shadow-cta transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {isScanning ? (
                        <><Cpu className="w-5 h-5 mr-2 animate-scan-rotate" /> Analisando...</>
                      ) : (
                        <><Scan className="w-5 h-5 mr-2" /> Escanear Site</>
                      )}
                    </Button>
                    {hasResults && (
                      <Button onClick={clearResults} variant="outline" className="h-14 px-6 rounded-2xl border-border/60">
                        <XCircle className="w-4 h-4 mr-2" /> Limpar
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'email' && (
                <div className="space-y-4">
                  <label className="text-sm font-medium text-muted-foreground">Verificar legitimidade de um e-mail</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      type="email"
                      placeholder="exemplo@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 h-14 px-5 rounded-2xl bg-background/80 border-border/60 text-base focus:border-primary focus:ring-2 focus:ring-primary/20"
                      disabled={isScanning}
                    />
                    <Button
                      onClick={scanEmail}
                      disabled={isScanning || !email}
                      className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-cta hover:shadow-cta transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {isScanning ? (
                        <><Activity className="w-5 h-5 mr-2 animate-scan-rotate" /> Verificando...</>
                      ) : (
                        <><Mail className="w-5 h-5 mr-2" /> Verificar E-mail</>
                      )}
                    </Button>
                    {hasResults && (
                      <Button onClick={() => { clearResults(); setEmail(''); }} variant="outline" className="h-14 px-6 rounded-2xl border-border/60">
                        <XCircle className="w-4 h-4 mr-2" /> Limpar
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'payment' && (
                <div className="space-y-4">
                  <label className="text-sm font-medium text-muted-foreground">Analisar segurança de link de pagamento</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      type="url"
                      placeholder="https://pay.stripe.com/..."
                      value={paymentLink}
                      onChange={(e) => setPaymentLink(e.target.value)}
                      className="flex-1 h-14 px-5 rounded-2xl bg-background/80 border-border/60 text-base focus:border-primary focus:ring-2 focus:ring-primary/20"
                      disabled={isScanning}
                    />
                    <Button
                      onClick={scanPaymentLink}
                      disabled={isScanning || !paymentLink}
                      className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-cta hover:shadow-cta transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {isScanning ? (
                        <><Activity className="w-5 h-5 mr-2 animate-scan-rotate" /> Verificando...</>
                      ) : (
                        <><DollarSign className="w-5 h-5 mr-2" /> Verificar Link</>
                      )}
                    </Button>
                    {hasResults && (
                      <Button onClick={() => { clearResults(); setPaymentLink(''); }} variant="outline" className="h-14 px-6 rounded-2xl border-border/60">
                        <XCircle className="w-4 h-4 mr-2" /> Limpar
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {isScanning && (
                <div className="space-y-3 pt-2">
                  <Progress value={progress} className="w-full h-2 rounded-full" />
                  <p className="text-sm text-muted-foreground text-center">
                    {activeTab === 'url' && 'Executando verificações de segurança...'}
                    {activeTab === 'email' && 'Analisando padrões de e-mail...'}
                    {activeTab === 'payment' && 'Verificando segurança do link de pagamento...'}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </section>

        {result && (
          <section className="pb-16">
            <Card className={`p-8 md:p-10 transition-bounce ${getCardClass(result.status)}`}>
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-background/30 flex items-center justify-center">
                      {getStatusIcon(result.status)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{result.details.domain}</h3>
                      <p className="text-sm text-muted-foreground">Score: {result.score}/100</p>
                    </div>
                  </div>
                  <Badge className={`${getStatusBadgeClass(result.status)} px-4 py-1.5 text-sm font-semibold rounded-xl`}>
                    {getStatusLabel(result.status)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { icon: Lock, label: 'SSL/HTTPS', ok: result.checks.ssl },
                    { icon: Globe, label: 'Reputação', ok: result.checks.reputation },
                    { icon: Shield, label: 'Anti-Malware', ok: result.checks.malware },
                    { icon: Eye, label: 'Anti-Phishing', ok: result.checks.phishing },
                    { icon: Zap, label: 'Redirecionamentos', ok: result.checks.redirects },
                    { icon: Clock, label: 'Idade do Domínio', ok: result.checks.age },
                  ].map((check, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-background/20">
                      <check.icon className={`w-4 h-4 ${check.ok ? 'text-safe' : 'text-danger'}`} />
                      <span className="text-sm font-medium flex-1">{check.label}</span>
                      {check.ok ? <CheckCircle className="w-4 h-4 text-safe" /> : <XCircle className="w-4 h-4 text-danger" />}
                    </div>
                  ))}
                </div>

                <div className="p-5 rounded-2xl bg-background/20 border border-border/30">
                  <h4 className="font-semibold mb-2">Recomendação:</h4>
                  <p className="text-sm leading-relaxed">
                    {result.status === 'safe' && 'Este site passou em todas as verificações de segurança. É seguro para navegação.'}
                    {result.status === 'warning' && 'Este site apresenta alguns riscos. Proceda com cautela e evite inserir dados pessoais.'}
                    {result.status === 'danger' && 'ATENÇÃO: Este site foi identificado como perigoso. Não prossiga e feche a página imediatamente.'}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground text-center">Última análise: {result.details.lastScan}</p>
              </div>
            </Card>
          </section>
        )}

        {emailResult && (
          <section className="pb-16">
            <Card className={`p-8 md:p-10 transition-bounce ${getCardClass(emailResult.status)}`}>
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-background/30 flex items-center justify-center">
                      {getStatusIcon(emailResult.status)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{emailResult.email}</h3>
                      <p className="text-sm text-muted-foreground">Score: {emailResult.score}/100 • Provider: {emailResult.details.provider}</p>
                    </div>
                  </div>
                  <Badge className={`${getStatusBadgeClass(emailResult.status)} px-4 py-1.5 text-sm font-semibold rounded-xl`}>
                    {getStatusLabel(emailResult.status)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { icon: Mail, label: 'Sintaxe', ok: emailResult.checks.syntax },
                    { icon: Globe, label: 'Domínio', ok: emailResult.checks.domain },
                    { icon: Shield, label: 'Blacklist', ok: emailResult.checks.blacklist },
                    { icon: Bug, label: 'Anti-Spam', ok: emailResult.checks.spam },
                    { icon: Activity, label: 'Reputação', ok: emailResult.checks.reputation },
                  ].map((check, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-background/20">
                      <check.icon className={`w-4 h-4 ${check.ok ? 'text-safe' : 'text-danger'}`} />
                      <span className="text-sm font-medium flex-1">{check.label}</span>
                      {check.ok ? <CheckCircle className="w-4 h-4 text-safe" /> : <XCircle className="w-4 h-4 text-danger" />}
                    </div>
                  ))}
                </div>

                <div className="p-5 rounded-2xl bg-background/20 border border-border/30">
                  <h4 className="font-semibold mb-2">Recomendação:</h4>
                  <p className="text-sm leading-relaxed">
                    {emailResult.status === 'safe' && 'Este e-mail passou em todas as verificações. Aparenta ser legítimo.'}
                    {emailResult.status === 'warning' && 'Este e-mail apresenta alguns sinais suspeitos. Verifique a origem antes de confiar.'}
                    {emailResult.status === 'danger' && 'ATENÇÃO: Este e-mail foi identificado como potencialmente malicioso. Não clique em links ou forneça informações.'}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground text-center">Última análise: {emailResult.details.lastScan}</p>
              </div>
            </Card>
          </section>
        )}

        {paymentResult && (
          <section className="pb-16">
            <Card className={`p-8 md:p-10 transition-bounce ${getCardClass(paymentResult.status)}`}>
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-background/30 flex items-center justify-center">
                      {getStatusIcon(paymentResult.status)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <CreditCard className="w-5 h-5" /> Link de Pagamento
                      </h3>
                      <p className="text-sm text-muted-foreground">Score: {paymentResult.score}/100 • Gateway: {paymentResult.details.gateway}</p>
                    </div>
                  </div>
                  <Badge className={`${getStatusBadgeClass(paymentResult.status)} px-4 py-1.5 text-sm font-semibold rounded-xl`}>
                    {getStatusLabel(paymentResult.status)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { icon: Lock, label: 'SSL/HTTPS', ok: paymentResult.checks.ssl },
                    { icon: CreditCard, label: 'Gateway', ok: paymentResult.checks.gateway },
                    { icon: Shield, label: 'Certificação', ok: paymentResult.checks.certification },
                    { icon: Bug, label: 'Anti-Fraude', ok: paymentResult.checks.fraud },
                    { icon: DollarSign, label: 'Merchant', ok: paymentResult.checks.merchant },
                    { icon: Eye, label: 'Criptografia', ok: paymentResult.checks.encryption },
                  ].map((check, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-background/20">
                      <check.icon className={`w-4 h-4 ${check.ok ? 'text-safe' : 'text-danger'}`} />
                      <span className="text-sm font-medium flex-1">{check.label}</span>
                      {check.ok ? <CheckCircle className="w-4 h-4 text-safe" /> : <XCircle className="w-4 h-4 text-danger" />}
                    </div>
                  ))}
                </div>

                <div className="p-5 rounded-2xl bg-background/20 border border-border/30">
                  <h4 className="font-semibold mb-2">Recomendação:</h4>
                  <p className="text-sm leading-relaxed">
                    {paymentResult.status === 'safe' && 'Este link de pagamento passou em todas as verificações de segurança. É seguro para realizar transações.'}
                    {paymentResult.status === 'warning' && 'Este link de pagamento apresenta alguns riscos. Verifique a legitimidade antes de realizar transações.'}
                    {paymentResult.status === 'danger' && 'ATENÇÃO: Este link de pagamento foi identificado como potencialmente fraudulento. NÃO realize transações.'}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground text-center">Última análise: {paymentResult.details.lastScan}</p>
              </div>
            </Card>
          </section>
        )}

        <section className="pb-16 md:pb-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">Proteção completa em um só lugar</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Ferramentas integradas para manter você seguro no mundo digital</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-8 group hover:scale-[1.02] transition-all duration-300 cursor-default">
              <div className="w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center mb-6 group-hover:bg-primary/15 transition-colors">
                <Cpu className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">Extensão Chrome</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Proteção automática durante a navegação. Analisa sites em tempo real diretamente no seu navegador.
              </p>
              <div className="bg-muted/30 p-4 rounded-xl space-y-3 border border-border/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
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
                <div className="text-xs text-muted-foreground truncate">
                  URL: {currentUrl || 'Nenhuma URL detectada'}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={scanUrl} disabled={isScanning || !currentUrl} className="text-xs rounded-xl bg-primary text-primary-foreground px-3">
                    <Scan className="w-3 h-3 mr-1" /> Scan
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { clearResults(); toast({ title: "Proteção ativada", description: "Monitoramento automático iniciado" }); }} className="text-xs rounded-xl border-safe/30 text-safe hover:bg-safe/10 px-3">
                    <Shield className="w-3 h-3 mr-1" /> Proteger
                  </Button>
                </div>
                {result && (
                  <div className="p-2.5 rounded-lg bg-background/50 border border-border/20">
                    <div className="flex items-center gap-2 text-xs">
                      {result.status === 'safe' && <CheckCircle className="w-3 h-3 text-safe" />}
                      {result.status === 'danger' && <XCircle className="w-3 h-3 text-danger" />}
                      {result.status === 'warning' && <AlertTriangle className="w-3 h-3 text-warning" />}
                      <span className="font-medium">
                        {result.status === 'safe' ? 'Site verificado e seguro' :
                         result.status === 'danger' ? 'ATENÇÃO: Site perigoso!' :
                         'Site apresenta riscos'}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Score: {result.score}/100 • {Object.values(result.checks).filter(Boolean).length}/6 checks
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
                <Activity className="w-3 h-3 text-primary" />
                Simulação • Funcionalidade em desenvolvimento
              </p>
            </Card>

            <Card className="p-8 group hover:scale-[1.02] transition-all duration-300 cursor-default">
              <div className="w-12 h-12 rounded-2xl bg-accent/8 flex items-center justify-center mb-6 group-hover:bg-accent/15 transition-colors">
                <MessageCircle className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-bold mb-2">Bot WhatsApp</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Comandos inteligentes para proteção via WhatsApp. Verifique links e e-mails em segundos.
              </p>
              <div className="space-y-2 text-sm font-mono bg-muted/30 p-4 rounded-xl border border-border/30">
                <div>🎯 <span className="text-primary">/scan https://site.com</span></div>
                <div>📧 <span className="text-primary">/email user@dom.com</span></div>
                <div>🛡️ <span className="text-primary">/status</span></div>
                <div>⚡ <span className="text-primary">/quick</span></div>
                <div>ℹ️ <span className="text-primary">/ajuda</span></div>
              </div>
              <div className="mt-6">
                <Button
                  onClick={() => {
                    const message = "Olá! Gostaria de usar o UnMask Bot para verificar a segurança de sites e e-mails. Pode me ajudar com os comandos disponíveis?";
                    const phoneNumber = "5511999999999";
                    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
                    toast({ title: "Abrindo WhatsApp", description: "Redirecionando para conversa com o bot UnMask" });
                  }}
                  className="w-full h-12 rounded-2xl bg-accent hover:bg-accent/90 text-accent-foreground font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Iniciar Conversa
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
                <Cpu className="w-3 h-3 text-primary" />
                Powered by AI • Respostas em tempo real
              </p>
            </Card>

            <Card className="p-8 group hover:scale-[1.02] transition-all duration-300 cursor-pointer" onClick={() => navigate('/dashboard')}>
              <div className="w-12 h-12 rounded-2xl bg-warning/8 flex items-center justify-center mb-6 group-hover:bg-warning/15 transition-colors">
                <BarChart3 className="w-6 h-6 text-warning" />
              </div>
              <h3 className="text-lg font-bold mb-2">Dashboard Global</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Monitoramento em tempo real de crimes cibernéticos globais com mapa interativo e estatísticas detalhadas.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3 rounded-xl bg-muted/30 border border-border/30 text-center">
                  <Globe className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Mapa Global</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/30 text-center">
                  <Activity className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Tempo Real</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/30 text-center">
                  <AlertTriangle className="w-5 h-5 text-warning mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Alertas</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/30 text-center">
                  <Shield className="w-5 h-5 text-safe mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Proteção</p>
                </div>
              </div>
              <Button variant="outline" className="w-full h-12 rounded-2xl border-border/60 font-semibold group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-200">
                Ver Dashboard <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Card>
          </div>
        </section>

        <footer className="pb-12 text-center">
          <div className="border-t border-border/30 pt-8">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} UnMask • Proteção digital inteligente
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};
