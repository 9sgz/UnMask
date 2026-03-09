import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VT_BASE = 'https://www.virustotal.com/api/v3';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get('VIRUSTOTAL_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'VIRUSTOTAL_API_KEY not configured' }), {
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

    // Step 1: Submit URL for scanning
    const scanRes = await fetch(`${VT_BASE}/urls`, {
      method: 'POST',
      headers: { 'x-apikey': apiKey, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `url=${encodeURIComponent(url)}`,
    });

    if (!scanRes.ok) {
      const errBody = await scanRes.text();
      throw new Error(`VT scan submit failed [${scanRes.status}]: ${errBody}`);
    }

    const scanData = await scanRes.json();
    const analysisId = scanData.data?.id;

    if (!analysisId) {
      throw new Error('No analysis ID returned from VirusTotal');
    }

    // Step 2: Poll for analysis result (max ~15s)
    let analysisResult = null;
    for (let i = 0; i < 5; i++) {
      await new Promise(r => setTimeout(r, 3000));

      const analysisRes = await fetch(`${VT_BASE}/analyses/${analysisId}`, {
        headers: { 'x-apikey': apiKey },
      });

      if (!analysisRes.ok) {
        const errBody = await analysisRes.text();
        throw new Error(`VT analysis fetch failed [${analysisRes.status}]: ${errBody}`);
      }

      const data = await analysisRes.json();
      if (data.data?.attributes?.status === 'completed') {
        analysisResult = data.data.attributes;
        break;
      }
    }

    if (!analysisResult) {
      // Fallback: try URL lookup by ID (base64 of URL without padding)
      const urlId = btoa(url).replace(/=/g, '');
      const lookupRes = await fetch(`${VT_BASE}/urls/${urlId}`, {
        headers: { 'x-apikey': apiKey },
      });
      if (lookupRes.ok) {
        const lookupData = await lookupRes.json();
        analysisResult = lookupData.data?.attributes?.last_analysis_stats
          ? { stats: lookupData.data.attributes.last_analysis_stats, results: lookupData.data.attributes.last_analysis_results }
          : null;
      } else {
        await lookupRes.text();
      }
    }

    // Step 3: Build response
    const stats = analysisResult?.stats || analysisResult?.results
      ? undefined
      : null;
    const finalStats = stats !== undefined
      ? stats
      : (analysisResult?.stats || {
          malicious: 0,
          suspicious: 0,
          harmless: 0,
          undetected: 0,
        });

    const malicious = finalStats?.malicious || 0;
    const suspicious = finalStats?.suspicious || 0;
    const harmless = finalStats?.harmless || 0;
    const undetected = finalStats?.undetected || 0;
    const total = malicious + suspicious + harmless + undetected;

    let status: string;
    if (malicious > 0) status = 'danger';
    else if (suspicious > 0) status = 'warning';
    else status = 'safe';

    const score = total > 0 ? Math.round(((harmless + undetected) / total) * 100) : 50;

    return new Response(JSON.stringify({
      url,
      status,
      score,
      stats: { malicious, suspicious, harmless, undetected, total },
      analysisComplete: !!analysisResult,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in scan-url:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
