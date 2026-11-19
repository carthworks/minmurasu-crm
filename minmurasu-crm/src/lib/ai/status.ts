import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

export interface AiProviderStatus {
  openAiConfigured: boolean;
  openAiModel: string;
  ollamaRunning: boolean;
  ollamaBaseUrl: string;
  ollamaSelectedModel: string;
  ollamaAvailableModels: string[];
  activeLabel: string;
}

export function pickBestChatModel(models: string[], preferred?: string): string {
  if (preferred && models.includes(preferred)) return preferred;
  const chatModels = models.filter(
    (m) => !/embed|ocr/i.test(m)
  );
  const fastModel = chatModels.find((m) => /4b|3b|7b|8b|llama3/i.test(m));
  return fastModel || chatModels[0] || models[0] || '';
}

export async function getAiProviderStatus(
  organizationId?: string
): Promise<AiProviderStatus> {
  const openAiConfigured = Boolean(process.env.OPENAI_API_KEY);
  const openAiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  let ollamaBaseUrl = (
    process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434'
  ).replace(/\/$/, '');
  let ollamaSelectedModel = process.env.OLLAMA_MODEL || '';

  if (organizationId && isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from('integrations')
        .select('config')
        .eq('organization_id', organizationId)
        .eq('provider', 'ollama')
        .maybeSingle();

      const cfg = (data?.config ?? {}) as { base_url?: string; model?: string };
      if (cfg.base_url) ollamaBaseUrl = cfg.base_url.replace(/\/$/, '');
      if (cfg.model) ollamaSelectedModel = cfg.model;
    } catch {
      // Fallback to env defaults
    }
  }

  let ollamaRunning = false;
  let ollamaAvailableModels: string[] = [];

  try {
    const res = await fetch(`${ollamaBaseUrl}/api/tags`, {
      signal: AbortSignal.timeout(2_500),
    });
    if (res.ok) {
      const json = (await res.json()) as { models?: { name: string }[] };
      ollamaAvailableModels = (json.models ?? []).map((m) => m.name);
      ollamaRunning = ollamaAvailableModels.length > 0;
    }
  } catch {
    ollamaRunning = false;
  }

  const effectiveOllamaModel =
    pickBestChatModel(ollamaAvailableModels, ollamaSelectedModel) || 'No local model';

  let activeLabel = 'Not Connected';
  if (openAiConfigured) {
    activeLabel = `OpenAI · ${openAiModel}${ollamaRunning ? ` (Fallback: Ollama · ${effectiveOllamaModel})` : ''}`;
  } else if (ollamaRunning) {
    activeLabel = `Ollama (Local) · ${effectiveOllamaModel}`;
  }

  return {
    openAiConfigured,
    openAiModel,
    ollamaRunning,
    ollamaBaseUrl,
    ollamaSelectedModel,
    ollamaAvailableModels,
    activeLabel,
  };
}
