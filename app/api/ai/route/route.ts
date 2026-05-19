import { NextRequest, NextResponse } from 'next/server';

type WorldRef = { id: string; name: string; description?: string | null };

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { transcript = '', worlds = [] } = body as {
    transcript?: string;
    worlds?: WorldRef[];
  };
  const key = process.env.ANTHROPIC_API_KEY;
  const trimmed = transcript.trim();

  // No key or no content — drop into the first world if any, otherwise
  // tell the client to create a new "New stories" world.
  if (!key || !trimmed) {
    return NextResponse.json({
      worldId: worlds[0]?.id ?? null,
      suggestedNewWorldName: worlds.length === 0 ? 'New stories' : undefined,
      reasoning: !key ? 'no-key fallback' : 'empty-transcript fallback',
      source: 'fallback',
    });
  }

  try {
    const worldList = worlds.length
      ? worlds
          .map(
            (w) =>
              `- ${w.id}: "${w.name}"${
                w.description ? ` (${w.description})` : ''
              }`,
          )
          .join('\n')
      : '(none yet)';

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 200,
        system: [
          {
            type: 'text',
            text: `You help a family organize their story library. Given a brand-new recording's transcript and the existing "worlds" (story collections), pick the best-fit world or suggest a brand-new one. Prefer existing worlds when the new recording reasonably fits. Only suggest a new world if none of the existing worlds make sense. Return strict JSON only, no prose: {"worldId": "<existing id or null>", "suggestedNewWorldName": "<short name or null>", "reasoning": "<one short sentence>"}.`,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content: `Existing worlds:\n${worldList}\n\nNew recording transcript:\n${trimmed}\n\nReturn JSON only.`,
          },
        ],
      }),
    });
    const data = await r.json();
    const text: string = data?.content?.[0]?.text ?? '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in Claude response');
    const parsed = JSON.parse(match[0]);
    return NextResponse.json({
      worldId: parsed.worldId || null,
      suggestedNewWorldName: parsed.suggestedNewWorldName || undefined,
      reasoning: parsed.reasoning || '',
      source: 'claude',
    });
  } catch (err) {
    return NextResponse.json({
      worldId: worlds[0]?.id ?? null,
      suggestedNewWorldName: worlds.length === 0 ? 'New stories' : undefined,
      reasoning: 'claude error fallback',
      source: 'fallback-error',
      error: (err as Error).message,
    });
  }
}
