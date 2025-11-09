/// <reference types="chrome" />

// Content Script for UnMask Extension
// This script runs on every webpage and monitors for threats

// Get current page URL and send to background for analysis
const currentUrl = window.location.href;

chrome.runtime.sendMessage({
  action: 'analyzeUrl',
  url: currentUrl
}, (response) => {
  if (response && response.status === 'danger') {
    showWarningBanner(response);
  }
});

// Monitor for payment forms and suspicious email inputs
function monitorForms() {
  const forms = document.querySelectorAll('form');
  
  forms.forEach(form => {
    // Check for payment-related inputs
    const hasPaymentFields = form.querySelector('input[type="tel"]') || 
                            form.querySelector('input[name*="card"]') ||
                            form.querySelector('input[name*="cvv"]') ||
                            form.querySelector('input[name*="credit"]');
    
    if (hasPaymentFields) {
      analyzePaymentForm(form);
    }
    
    // Check for email inputs
    const emailInputs = form.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
      input.addEventListener('blur', (e) => {
        const email = (e.target as HTMLInputElement).value;
        if (email) {
          analyzeEmailInput(email);
        }
      });
    });
  });
}

function analyzePaymentForm(form: HTMLFormElement) {
  const formAction = form.action || window.location.href;
  
  chrome.runtime.sendMessage({
    action: 'analyzePaymentLink',
    link: formAction
  }, (response) => {
    if (response && response.status === 'danger') {
      highlightDangerousForm(form, response);
    }
  });
}

function analyzeEmailInput(email: string) {
  chrome.runtime.sendMessage({
    action: 'analyzeEmail',
    email: email
  }, (response) => {
    if (response && response.status === 'danger') {
      console.warn('Suspicious email detected:', email);
    }
  });
}

function showWarningBanner(scanResult: any) {
  // Create warning banner
  const banner = document.createElement('div');
  banner.id = 'unmask-warning-banner';
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
    padding: 16px 24px;
    z-index: 999999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: system-ui, -apple-system, sans-serif;
    animation: slideDown 0.3s ease-out;
  `;
  
  banner.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <div>
        <div style="font-weight: bold; font-size: 16px;">⚠️ ALERTA DE SEGURANÇA - SITE PERIGOSO</div>
        <div style="font-size: 14px; opacity: 0.9; margin-top: 4px;">
          Este site foi identificado como potencialmente perigoso. Score de segurança: ${scanResult.score}/100
        </div>
      </div>
    </div>
    <button id="unmask-close-banner" style="
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.3);
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    ">
      Entendi
    </button>
  `;
  
  // Add animation keyframes
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideDown {
      from {
        transform: translateY(-100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
  
  document.body.prepend(banner);
  
  // Add close handler
  const closeButton = document.getElementById('unmask-close-banner');
  closeButton?.addEventListener('click', () => {
    banner.style.animation = 'slideDown 0.3s ease-out reverse';
    setTimeout(() => banner.remove(), 300);
  });
}

function highlightDangerousForm(form: HTMLFormElement, scanResult: any) {
  form.style.border = '3px solid #ef4444';
  form.style.borderRadius = '8px';
  form.style.padding = '16px';
  form.style.position = 'relative';
  
  // Add warning overlay
  const warning = document.createElement('div');
  warning.style.cssText = `
    position: absolute;
    top: -40px;
    left: 0;
    right: 0;
    background: #ef4444;
    color: white;
    padding: 8px 12px;
    border-radius: 6px 6px 0 0;
    font-size: 13px;
    font-weight: bold;
    font-family: system-ui, -apple-system, sans-serif;
  `;
  warning.textContent = '⚠️ FORMULÁRIO DE PAGAMENTO SUSPEITO - CUIDADO!';
  
  form.style.position = 'relative';
  form.prepend(warning);
}

// Monitor for dynamic content
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length) {
      monitorForms();
    }
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Initial monitoring
monitorForms();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getCurrentUrl') {
    sendResponse({ url: window.location.href });
  }
});
