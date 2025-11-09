# 🛡️ UnMask - Guia de Instalação da Extensão do Chrome

## 📋 Pré-requisitos
- Google Chrome ou navegador baseado em Chromium (Edge, Brave, Opera)
- Node.js instalado (para build)

## 🔨 Build da Extensão

1. **Clone o repositório e instale as dependências:**
```bash
npm install
```

2. **Faça o build do projeto:**
```bash
npm run build
```

3. **O build gerará uma pasta `dist/` com todos os arquivos da extensão**

## 📦 Instalação no Chrome

### Modo Desenvolvedor (Recomendado para testes)

1. Abra o Chrome e acesse: `chrome://extensions/`

2. Ative o **Modo do desenvolvedor** no canto superior direito

3. Clique em **"Carregar sem compactação"**

4. Selecione a pasta `dist/` do projeto

5. A extensão UnMask aparecerá na lista de extensões instaladas! 🎉

## 🚀 Como Usar

### Análise Automática
- A extensão analisa automaticamente cada site que você visita
- Um badge colorido aparece no ícone da extensão:
  - ✓ (Verde) = Site Seguro
  - ! (Amarelo) = Site Suspeito  
  - ✗ (Vermelho) = Site Perigoso

### Análise Manual
1. Clique no ícone da extensão UnMask na barra de ferramentas
2. Use as abas para analisar:
   - **Sites**: Analise URLs específicas
   - **E-mail**: Verifique endereços de e-mail
   - **Pagamentos**: Analise links de pagamento

### Proteção em Tempo Real
- Banners de aviso aparecem automaticamente em sites perigosos
- Formulários de pagamento suspeitos são destacados em vermelho
- Monitora continuamente a página em busca de ameaças

## ⚙️ Funcionalidades

### ✅ Verificações de Segurança
- **SSL/HTTPS**: Verifica certificado de segurança
- **Reputação**: Analisa histórico do domínio
- **Malware**: Detecta software malicioso
- **Phishing**: Identifica tentativas de fraude
- **Redirecionamentos**: Verifica redirecionamentos suspeitos
- **Idade do Domínio**: Valida tempo de registro

### 📧 Análise de E-mail
- Validação de sintaxe
- Verificação de domínio
- Checagem em blacklists
- Detecção de padrões de spam
- Análise de reputação

### 💳 Análise de Links de Pagamento
- Verificação SSL
- Identificação de gateway de pagamento
- Checagem de certificações
- Detecção de fraudes
- Verificação de merchant
- Validação de criptografia

## 🔧 Configurações Avançadas

### Para Desenvolvedores

#### Estrutura de Arquivos
```
dist/
├── manifest.json          # Configuração da extensão
├── index.html            # Interface popup
├── background.js         # Service Worker
├── content.js            # Script de conteúdo
└── assets/              # Recursos (ícones, CSS, JS)
```

#### Permissões Utilizadas
- `activeTab`: Para analisar a aba atual
- `storage`: Para armazenar resultados de análise
- `tabs`: Para monitorar navegação
- `host_permissions`: Para acessar conteúdo das páginas

## 🔄 Atualizações

Para atualizar a extensão após modificações:

1. Faça as alterações no código
2. Execute `npm run build` novamente
3. Vá em `chrome://extensions/`
4. Clique no botão de **atualizar** (🔄) na extensão UnMask

## 🐛 Solução de Problemas

### A extensão não carrega
- Verifique se o Modo do desenvolvedor está ativado
- Certifique-se de que a pasta `dist/` contém todos os arquivos necessários
- Verifique o console de erros em `chrome://extensions/`

### Funcionalidades não estão funcionando
- Recarregue a extensão clicando no botão de atualizar
- Verifique se todas as permissões foram concedidas
- Abra o DevTools da extensão para ver erros no console

### Badge não aparece
- Recarregue a página que está sendo analisada
- Verifique se a URL é válida (http:// ou https://)

## 📝 Integração com APIs Reais

Para produção, você deve integrar com APIs de segurança reais:

### APIs Recomendadas
- **Google Safe Browsing API**: Detecção de malware e phishing
- **VirusTotal API**: Análise de URLs e arquivos
- **PhishTank API**: Base de dados de phishing
- **Have I Been Pwned API**: Verificação de vazamentos de dados

### Como Integrar
1. Obtenha as chaves de API dos serviços
2. Adicione as chaves em `src/background.ts`
3. Implemente as chamadas de API nas funções de verificação
4. Faça rebuild da extensão

## 📜 Licença

Este projeto é de código aberto e está disponível para uso educacional e comercial.

## 🆘 Suporte

Para reportar bugs ou solicitar funcionalidades, abra uma issue no repositório do projeto.

---

**UnMask** - Proteção inteligente contra golpes digitais 🛡️
