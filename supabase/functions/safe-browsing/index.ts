import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GSB_BASE = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get('GOOGLE_SAFE_BROWSING_KEY')?.trim();
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GOOGLE_SAFE_BROWSING_KEY not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = {
      client: { clientId: 'unmask-extension', clientVersion: '1.0.0' },
      threatInfo: {
        threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
        platformTypes: ['ANY_PLATFORM'],
        threatEntryTypes: ['URL'],
        threatEntries: [{ url }],
      },
    };

    const res = await fetch(`${GSB_BASE}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Google Safe Browsing API error [${res.status}]: ${errBody}`);
    }

    const data = await res.json();
    const matches = data.matches || [];

    const threats = matches.map((m: any) => ({
      type: m.threatType,
      platform: m.platformType,
    }));

    const hasMalware = threats.some((t: any) => t.type === 'MALWARE');
    const hasPhishing = threats.some((t: any) => t.type === 'SOCIAL_ENGINEERING');
    const hasUnwanted = threats.some((t: any) => t.type === 'UNWANTED_SOFTWARE' || t.type === 'POTENTIALLY_HARMFUL_APPLICATION');

    let status: string;
    if (hasMalware || hasPhishing) status = 'danger';
    else if (hasUnwanted) status = 'warning';
    else status = 'safe';

    return new Response(JSON.stringify({
      url,
      status,
      safe: matches.length === 0,
      threats,
      details: {
        malware: hasMalware,
        phishing: hasPhishing,
        unwanted: hasUnwanted,
        totalThreats: matches.length,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in safe-browsing:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
