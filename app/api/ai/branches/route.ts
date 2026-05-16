import { NextRequest, NextResponse } from 'next/server';
import { CURATED_BRANCHES } from '@/lib/branches';

export async function POST(req: NextRequest) {
  const { transcript } = await req.json().catch(() => ({ transcript: '' }));
  const key = process.env.ANTHROPIC_API_KEY;

  if (!key) {
    const branches = [...CURATED_BRANCHES].sort(() => Math.random() - 0.5).slice(0, 3);
    return NextResponse.json({ branches, source: 'curated' });
  }

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 400,
        system: [
          {
            type: 'text',
            text: 'You help a parent write bedtime stories for their child. Given the story so far, suggest 3 short branch ideas the parent could record as voice continuations. Each suggestion is one short sentence, gentle, age 5-9 appropriate: no violence, no scary surprises, no separation or loss themes. Return strict JSON: {"branches": ["…", "…", "…"]}',
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content: `Story so far:\n\n${transcript || '(blank)'}\n\nReturn JSON only.`,
          },
        ],
      }),
    });
    const data = await r.json();
    const text: string = data?.content?.[0]?.text ?? '';
    const match = text.match(/\{[\s\S]*\}/);
    const parsed = match ? JSON.parse(match[0]) : { branches: [] };
    return NextResponse.json({
      branches: parsed.branches ?? [],
      source: 'claude',
    });
  } catch (err) {
    return NextResponse.json({
      branches: [...CURATED_BRANCHES].sort(() => Math.random() - 0.5).slice(0, 3),
      source: 'curated-fallback',
      error: (err as Error).message,
    });
  }
}
