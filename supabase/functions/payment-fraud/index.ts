import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get('GREIP_API_KEY')?.trim();
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GREIP_API_KEY not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { name, email, ip, country, amount, currency = 'USD' } = await req.json();
    
    // Validate required fields
    if (!name || !email || !ip || !country || !amount) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: name, email, ip, country, amount' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate input lengths and formats
    if (name.length > 100 || email.length > 255 || country.length > 3) {
      return new Response(JSON.stringify({ 
        error: 'Input validation failed: name max 100 chars, email max 255 chars, country max 3 chars' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return new Response(JSON.stringify({ 
        error: 'Amount must be a positive number' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = {
      action: 'purchase',
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        ip: ip.trim(),
        country: country.trim().toUpperCase(),
        amount: amount,
        currency: currency.trim().toUpperCase(),
      }
    };

    const res = await fetch('https://greip.com/payment-fraud', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Greip API error [${res.status}]: ${errBody}`);
    }

    const data = await res.json();

    // Extract relevant data from response
    const fraudScore = data.fraud_score ?? 0;
    const shouldBlock = data.should_block ?? false;
    const riskLevel = data.risk_level ?? 'unknown';
    const factors = data.risk_factors ?? [];

    let status: string;
    if (fraudScore <= 20) status = 'safe';
    else if (fraudScore <= 60) status = 'warning';
    else status = 'danger';

    return new Response(JSON.stringify({
      name: payload.data.name,
      email: payload.data.email,
      ip: payload.data.ip,
      country: payload.data.country,
      amount: payload.data.amount,
      currency: payload.data.currency,
      fraudScore,
      shouldBlock,
      riskLevel,
      riskFactors: factors,
      status,
      recommendation: shouldBlock 
        ? 'BLOQUEAR: Transação de alto risco detectada'
        : fraudScore > 60 
        ? 'CUIDADO: Revisar transação manualmente'
        : 'APROVAR: Transação segura',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in payment-fraud:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});