/// <reference types="chrome" />

// Background Service Worker para UnMask Extension

// Listen for tab updates to analyze URLs in real-time
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    analyzeUrl(tab.url, tabId);
  }
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeUrl') {
    analyzeUrl(request.url, sender.tab?.id).then(sendResponse);
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'analyzeEmail') {
    analyzeEmail(request.email).then(sendResponse);
    return true;
  }
  
  if (request.action === 'analyzePaymentLink') {
    analyzePaymentLink(request.link).then(sendResponse);
    return true;
  }
});

// Analyze URL for threats
async function analyzeUrl(url: string, tabId?: number): Promise<any> {
  try {
    const urlObj = new URL(url);
    
    // Real checks
    const checks = {
      ssl: url.startsWith('https://'),
      reputation: await checkDomainReputation(urlObj.hostname),
      malware: await checkMalware(url),
      phishing: await checkPhishing(urlObj.hostname),
      redirects: await checkRedirects(url),
      age: await checkDomainAge(urlObj.hostname),
    };
    
    const score = calculateSecurityScore(checks);
    const status = score >= 80 ? 'safe' : score >= 50 ? 'warning' : 'danger';
    
    const result = {
      url,
      status,
      score,
      checks,
      details: {
        domain: urlObj.hostname,
        title: 'Análise Completa',
        description: 'Verificação de segurança realizada',
        lastScan: new Date().toLocaleString('pt-BR'),
      }
    };
    
    // Store result
    await chrome.storage.local.set({ [`scan_${url}`]: result });
    
    // Update badge based on threat level
    if (tabId) {
      updateBadge(tabId, status);
    }
    
    return result;
  } catch (error) {
    console.error('Error analyzing URL:', error);
    return null;
  }
}

// Analyze email for threats
async function analyzeEmail(email: string): Promise<any> {
  try {
    const [username, domain] = email.split('@');
    
    if (!domain) {
      throw new Error('Invalid email format');
    }
    
    const checks = {
      syntax: validateEmailSyntax(email),
      domain: await checkDomainReputation(domain),
      blacklist: await checkEmailBlacklist(email),
      spam: await checkSpamPatterns(email),
      reputation: await checkEmailReputation(domain),
    };
    
    const score = calculateSecurityScore(checks);
    const status = score >= 80 ? 'safe' : score >= 50 ? 'warning' : 'danger';
    
    return {
      email,
      status,
      score,
      checks,
      details: {
        domain,
        provider: getEmailProvider(domain),
        lastScan: new Date().toLocaleString('pt-BR'),
      }
    };
  } catch (error) {
    console.error('Error analyzing email:', error);
    return null;
  }
}

// Analyze payment link
async function analyzePaymentLink(link: string): Promise<any> {
  try {
    const urlObj = new URL(link);
    
    const checks = {
      ssl: link.startsWith('https://'),
      gateway: await verifyPaymentGateway(urlObj.hostname),
      certification: await checkCertification(urlObj.hostname),
      fraud: await checkFraudPatterns(link),
      merchant: await verifyMerchant(urlObj.hostname),
      encryption: await checkEncryption(link),
    };
    
    const score = calculateSecurityScore(checks);
    const status = score >= 85 ? 'safe' : score >= 60 ? 'warning' : 'danger';
    
    return {
      link,
      status,
      score,
      checks,
      details: {
        gateway: identifyPaymentGateway(urlObj.hostname),
        merchant: 'Verificação em andamento',
        lastScan: new Date().toLocaleString('pt-BR'),
      }
    };
  } catch (error) {
    console.error('Error analyzing payment link:', error);
    return null;
  }
}

// Helper functions for security checks
async function checkDomainReputation(domain: string): Promise<boolean> {
  // TODO: Integrate with real threat intelligence APIs
  // For now, check against known safe domains
  const safeDomains = ['google.com', 'github.com', 'microsoft.com', 'apple.com'];
  return safeDomains.some(safe => domain.includes(safe));
}

async function checkMalware(url: string): Promise<boolean> {
  // TODO: Integrate with Google Safe Browsing API or similar
  return !url.includes('malware') && !url.includes('virus');
}

async function checkPhishing(domain: string): Promise<boolean> {
  // TODO: Check against phishing databases
  const phishingKeywords = ['secure-login', 'verify-account', 'update-payment'];
  return !phishingKeywords.some(keyword => domain.includes(keyword));
}

async function checkRedirects(url: string): Promise<boolean> {
  // TODO: Follow redirects and check destination
  return true;
}

async function checkDomainAge(domain: string): Promise<boolean> {
  // TODO: Check domain registration date via WHOIS
  return true;
}

async function checkEmailBlacklist(email: string): Promise<boolean> {
  // TODO: Check against email blacklist databases
  return true;
}

async function checkSpamPatterns(email: string): Promise<boolean> {
  const spamPatterns = ['noreply', 'donotreply', 'no-reply'];
  return !spamPatterns.some(pattern => email.includes(pattern));
}

async function checkEmailReputation(domain: string): Promise<boolean> {
  return checkDomainReputation(domain);
}

function validateEmailSyntax(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function getEmailProvider(domain: string): string {
  if (domain.includes('gmail')) return 'Gmail';
  if (domain.includes('outlook') || domain.includes('hotmail')) return 'Outlook';
  if (domain.includes('yahoo')) return 'Yahoo';
  return 'Desconhecido';
}

async function verifyPaymentGateway(domain: string): Promise<boolean> {
  const knownGateways = ['stripe.com', 'paypal.com', 'mercadopago.com', 'pagseguro.uol.com.br'];
  return knownGateways.some(gateway => domain.includes(gateway));
}

async function checkCertification(domain: string): Promise<boolean> {
  // TODO: Check SSL certificate validity
  return true;
}

async function checkFraudPatterns(link: string): Promise<boolean> {
  const fraudKeywords = ['urgent', 'verify-now', 'claim-prize', 'winner'];
  return !fraudKeywords.some(keyword => link.toLowerCase().includes(keyword));
}

async function verifyMerchant(domain: string): Promise<boolean> {
  // TODO: Verify merchant authenticity
  return true;
}

async function checkEncryption(link: string): Promise<boolean> {
  return link.startsWith('https://');
}

function identifyPaymentGateway(domain: string): string {
  if (domain.includes('stripe')) return 'Stripe';
  if (domain.includes('paypal')) return 'PayPal';
  if (domain.includes('mercadopago')) return 'Mercado Pago';
  if (domain.includes('pagseguro')) return 'PagSeguro';
  return 'Desconhecido';
}

function calculateSecurityScore(checks: Record<string, boolean>): number {
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.values(checks).length;
  return Math.round((passedChecks / totalChecks) * 100);
}

function updateBadge(tabId: number, status: string) {
  const colors = {
    safe: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
  };
  
  const text = {
    safe: '✓',
    warning: '!',
    danger: '✗',
  };
  
  chrome.action.setBadgeBackgroundColor({ 
    color: colors[status as keyof typeof colors] || colors.warning,
    tabId 
  });
  
  chrome.action.setBadgeText({ 
    text: text[status as keyof typeof text] || '?',
    tabId 
  });
}

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('UnMask Extension installed');
});
