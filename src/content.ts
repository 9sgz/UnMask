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
  // Validate and sanitize scan result score
  const validatedScore = typeof scanResult?.score === 'number' 
    ? Math.max(0, Math.min(100, Math.floor(scanResult.score))) 
    : 0;

  // Create warning banner using safe DOM manipulation
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
  
  // Create content container
  const contentWrapper = document.createElement('div');
  contentWrapper.style.cssText = 'display: flex; align-items: center; gap: 12px;';
  
  // Create SVG icon
  const iconContainer = document.createElement('div');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '24');
  svg.setAttribute('height', '24');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', '12');
  circle.setAttribute('cy', '12');
  circle.setAttribute('r', '10');
  
  const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line1.setAttribute('x1', '12');
  line1.setAttribute('y1', '8');
  line1.setAttribute('x2', '12');
  line1.setAttribute('y2', '12');
  
  const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line2.setAttribute('x1', '12');
  line2.setAttribute('y1', '16');
  line2.setAttribute('x2', '12.01');
  line2.setAttribute('y2', '16');
  
  svg.appendChild(circle);
  svg.appendChild(line1);
  svg.appendChild(line2);
  iconContainer.appendChild(svg);
  
  // Create text container
  const textContainer = document.createElement('div');
  
  const titleDiv = document.createElement('div');
  titleDiv.style.cssText = 'font-weight: bold; font-size: 16px;';
  titleDiv.textContent = '⚠️ ALERTA DE SEGURANÇA - SITE PERIGOSO';
  
  const scoreDiv = document.createElement('div');
  scoreDiv.style.cssText = 'font-size: 14px; opacity: 0.9; margin-top: 4px;';
  scoreDiv.textContent = `Este site foi identificado como potencialmente perigoso. Score de segurança: ${validatedScore}/100`;
  
  textContainer.appendChild(titleDiv);
  textContainer.appendChild(scoreDiv);
  
  contentWrapper.appendChild(iconContainer);
  contentWrapper.appendChild(textContainer);
  
  // Create close button
  const closeButton = document.createElement('button');
  closeButton.id = 'unmask-close-banner';
  closeButton.style.cssText = `
    background: rgba(255,255,255,0.2);
    border: 1px solid rgba(255,255,255,0.3);
    color: white;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
  `;
  closeButton.textContent = 'Entendi';
  
  banner.appendChild(contentWrapper);
  banner.appendChild(closeButton);
  
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
  closeButton.addEventListener('click', () => {
    banner.style.animation = 'slideDown 0.3s ease-out reverse';
    setTimeout(() => banner.remove(), 300);
  });
}

function highlightDangerousForm(form: HTMLFormElement, _scanResult: unknown) {
  form.style.border = '3px solid #ef4444';
  form.style.borderRadius = '8px';
  form.style.padding = '16px';
  form.style.position = 'relative';
  
  // Add warning overlay using safe DOM manipulation (no innerHTML)
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
  // Use textContent instead of innerHTML for safety
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
