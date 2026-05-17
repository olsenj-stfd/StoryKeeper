import { NextRequest, NextResponse } from 'next/server';

const STUB_LABELS = [
  'the next part',
  'a new path',
  "what happened next",
  'the surprise',
];

function pickStub() {
  return STUB_LABELS[Math.floor(Math.random() * STUB_LABELS.length)];
}

function shorten(s: string, n = 60): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + '…';
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const {
    transcript = '',
    summary = '',
    storyContext = '',
  } = body as {
    transcript?: string;
    summary?: string;
    storyContext?: string;
  };
  const sourceText = (transcript || summary).trim();
  const key = process.env.ANTHROPIC_API_KEY;

  if (!sourceText) {
    return NextResponse.json({ branchLabel: pickStub(), source: 'stub-empty' });
  }

  if (!key) {
    // No key — extract a short label heuristically from the source.
    const words = sourceText.split(/\s+/).slice(0, 5).join(' ');
    return NextResponse.json({ branchLabel: shorten(words, 50), source: 'no-key' });
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
            text: `You write very short, kid-friendly labels for branches of a bedtime story. Given the new recording's content (and the story so far), generate a 3-to-6-word label that captures what's distinct about this beat. Examples: "the dragon's secret", "through the purple door", "meeting the fox". Lowercase. No punctuation at the end. Return strict JSON only, no prose: {"branchLabel": "..."}.`,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content: `Story so far:\n${storyContext || '(none)'}\n\nNew recording content:\n${sourceText}\n\nReturn JSON only.`,
          },
        ],
      }),
    });
    const data = await r.json();
    const text: string = data?.content?.[0]?.text ?? '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in Claude response');
    const parsed = JSON.parse(match[0]);
    const label = String(parsed.branchLabel ?? '').trim();
    if (!label) throw new Error('Empty label');
    return NextResponse.json({
      branchLabel: shorten(label, 60),
      source: 'claude',
    });
  } catch (err) {
    return NextResponse.json({
      branchLabel: shorten(sourceText.split(/\s+/).slice(0, 5).join(' '), 50),
      source: 'claude-fallback',
      error: (err as Error).message,
    });
  }
}
