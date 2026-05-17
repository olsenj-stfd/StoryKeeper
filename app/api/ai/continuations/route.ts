import { NextRequest, NextResponse } from 'next/server';
import { CURATED_BRANCHES } from '@/lib/branches';

function fallback(n = 4): string[] {
  return [...CURATED_BRANCHES].sort(() => Math.random() - 0.5).slice(0, n);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const {
    transcript = '',
    characters = [],
    settings = [],
  } = body as {
    transcript?: string;
    characters?: { name: string; role: string; traits?: string[] }[];
    settings?: string[];
  };
  const key = process.env.ANTHROPIC_API_KEY;

  if (!key || !transcript.trim()) {
    return NextResponse.json({ options: fallback(), source: 'curated' });
  }

  try {
    const charList = characters.length
      ? `Characters in the story: ${characters
          .map((c) => `${c.name}${c.role ? ` (${c.role})` : ''}`)
          .join(', ')}.\n`
      : '';
    const settingList = settings.length
      ? `Settings: ${settings.join(', ')}.\n`
      : '';

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        system: [
          {
            type: 'text',
            text: `You suggest "what happens next" branches for a kid's bedtime story. Generate 4 short, gentle, age 5-9 continuation options that *build on the existing story* — they should reference the characters, settings, or events already in the story when possible. Each option is one sentence. No violence, no scary surprises, no separation or loss themes. Return strict JSON only, no prose, no markdown fences: {"options": ["...", "...", "...", "..."]}.`,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content: `${charList}${settingList}Story so far:\n\n${transcript}\n\nReturn JSON only.`,
          },
        ],
      }),
    });
    const data = await r.json();
    const text: string = data?.content?.[0]?.text ?? '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in Claude response');
    const parsed = JSON.parse(match[0]);
    const options = Array.isArray(parsed.options) ? parsed.options.slice(0, 4) : [];
    if (options.length === 0) throw new Error('No options returned');
    return NextResponse.json({ options, source: 'claude' });
  } catch (err) {
    return NextResponse.json({
      options: fallback(),
      source: 'curated-fallback',
      error: (err as Error).message,
    });
  }
}
