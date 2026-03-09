import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get('ABUSEIPDB_API_KEY')?.trim();
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ABUSEIPDB_API_KEY not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { ip } = await req.json();
    if (!ip || typeof ip !== 'string') {
      return new Response(JSON.stringify({ error: 'ip is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If input looks like a domain, resolve to IP first
    let ipAddress = ip.trim();
    const ipv4Regex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    const ipv6Regex = /^[0-9a-fA-F:]+$/;

    if (!ipv4Regex.test(ipAddress) && !ipv6Regex.test(ipAddress)) {
      // Treat as domain – resolve via DNS
      try {
        const dnsRes = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(ipAddress)}&type=A`);
        const dnsData = await dnsRes.json();
        const answer = dnsData.Answer?.find((a: any) => a.type === 1);
        if (!answer) {
          return new Response(JSON.stringify({ error: `Could not resolve domain: ${ipAddress}` }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        ipAddress = answer.data;
      } catch {
        return new Response(JSON.stringify({ error: `DNS resolution failed for: ${ipAddress}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const url = `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ipAddress)}&maxAgeInDays=90`;
    const res = await fetch(url, {
      headers: { 'Key': apiKey, 'Accept': 'application/json' },
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`AbuseIPDB error [${res.status}]: ${errBody}`);
    }

    const data = await res.json();
    const d = data.data;

    return new Response(JSON.stringify({
      ip: d.ipAddress,
      abuseScore: d.abuseConfidenceScore,
      country: d.countryCode,
      isp: d.isp,
      domain: d.domain,
      totalReports: d.totalReports,
      lastReportedAt: d.lastReportedAt,
      isWhitelisted: d.isWhitelisted,
      status: d.abuseConfidenceScore <= 20 ? 'safe' : d.abuseConfidenceScore <= 60 ? 'warning' : 'danger',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in check-ip:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
