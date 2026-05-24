import { createClient } from '@supabase/supabase-js';

const REST_BASE_PATH = '/rest/v1';

let cachedServerClient = null;

function cleanSupabaseUrl(value) {
  return String(value || '').replace(/\/+$/, '');
}

function getSupabaseConfig() {
  const url = cleanSupabaseUrl(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return {
      ok: false,
      error: {
        code: 'SUPABASE_CONFIG_MISSING',
        message:
          'NEXT_PUBLIC_SUPABASE_URL and a Supabase key are required. Set SUPABASE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, or NEXT_PUBLIC_SUPABASE_ANON_KEY.',
      },
    };
  }

  return { ok: true, url, key };
}

async function parseSupabaseResponse(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function errorFromPayload(payload, fallbackCode, fallbackMessage) {
  if (payload && typeof payload === 'object') {
    return {
      code: payload.code || fallbackCode,
      message: payload.message || payload.error || fallbackMessage,
      details: payload.details || payload.hint || null,
    };
  }

  return {
    code: fallbackCode,
    message: typeof payload === 'string' && payload ? payload : fallbackMessage,
    details: null,
  };
}

export function getSupabaseServerClient() {
  const config = getSupabaseConfig();

  if (!config.ok) {
    const error = new Error(config.error.message);
    error.code = config.error.code;
    throw error;
  }

  if (!cachedServerClient) {
    cachedServerClient = createClient(config.url, config.key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return cachedServerClient;
}

export async function supabaseRequest(path, options = {}) {
  const config = getSupabaseConfig();
  if (!config.ok) {
    return {
      ok: false,
      status: 500,
      error: config.error,
    };
  }

  const response = await fetch(`${config.url}${REST_BASE_PATH}${path}`, {
    method: options.method || 'GET',
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.prefer ? { Prefer: options.prefer } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: 'no-store',
  });

  const payload = await parseSupabaseResponse(response);

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: errorFromPayload(payload, 'SUPABASE_REQUEST_FAILED', 'Supabase request failed'),
    };
  }

  return {
    ok: true,
    status: response.status,
    data: payload,
  };
}
