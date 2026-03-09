import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get('ABSTRACT_EMAIL_API_KEY')?.trim();
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ABSTRACT_EMAIL_API_KEY not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (trimmedEmail.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = `https://emailvalidation.abstractapi.com/v1/?api_key=${apiKey}&email=${encodeURIComponent(trimmedEmail)}`;
    const res = await fetch(url);

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Abstract API error [${res.status}]: ${errBody}`);
    }

    const data = await res.json();

    const isValid = data.deliverability === 'DELIVERABLE';
    const isDisposable = data.is_disposable_email?.value === true;
    const isSpamTrap = data.is_catchall_email?.value === true;
    const domainExists = data.is_valid_format?.value === true && data.is_mx_found?.value === true;

    let status: string;
    if (isDisposable || isSpamTrap) status = 'danger';
    else if (!isValid || !domainExists) status = 'warning';
    else status = 'safe';

    return new Response(JSON.stringify({
      email: trimmedEmail,
      status,
      isValid,
      isDisposable,
      isSpamTrap,
      domainExists,
      deliverability: data.deliverability ?? 'UNKNOWN',
      qualityScore: data.quality_score ? parseFloat(data.quality_score) : null,
      details: {
        formatValid: data.is_valid_format?.value ?? false,
        mxFound: data.is_mx_found?.value ?? false,
        smtpValid: data.is_smtp_valid?.value ?? false,
        isFreeEmail: data.is_free_email?.value ?? false,
        isRoleEmail: data.is_role_email?.value ?? false,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in validate-email:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
