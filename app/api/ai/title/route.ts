import { NextRequest, NextResponse } from 'next/server';

const STUBS = [
  'a new story',
  'the next adventure',
  'an untitled tale',
  'something new',
];

function short(s: string, n = 60): string {
  return s.length <= n ? s : s.slice(0, n - 1) + '…';
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { transcript = '' } = body as { transcript?: string };
  const trimmed = transcript.trim();
  const key = process.env.ANTHROPIC_API_KEY;

  if (!trimmed) {
    return NextResponse.json({
      title: STUBS[Math.floor(Math.random() * STUBS.length)],
      source: 'stub-empty',
    });
  }
  if (!key) {
    // Heuristic: first 5 meaningful words.
    const words = trimmed.split(/\s+/).slice(0, 5).join(' ');
    return NextResponse.json({ title: short(words, 50), source: 'no-key' });
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
        model: 'claude-haiku-4-5',
        max_tokens: 80,
        system: [
          {
            type: 'text',
            text: `You write very short, kid-friendly titles for a bedtime story. Given the opening recording, generate a 2-to-6 word title that captures what the story is about. Sentence case, no quotes, no period at the end. Examples: "The Garden With the Purple Door", "Auntie's Lighthouse", "Astro-Dog and the Bone Ship". Return strict JSON only, no prose: {"title": "..."}.`,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content: `Opening transcript:\n\n${trimmed}\n\nReturn JSON only.`,
          },
        ],
      }),
    });
    const data = await r.json();
    const text: string = data?.content?.[0]?.text ?? '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON');
    const parsed = JSON.parse(match[0]);
    const title = String(parsed.title ?? '').trim();
    if (!title) throw new Error('Empty title');
    return NextResponse.json({
      title: short(title, 80),
      source: 'claude',
    });
  } catch (err) {
    return NextResponse.json({
      title: short(trimmed.split(/\s+/).slice(0, 5).join(' '), 50),
      source: 'claude-fallback',
      error: (err as Error).message,
    });
  }
}
