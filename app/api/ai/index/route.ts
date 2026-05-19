import { NextRequest, NextResponse } from 'next/server';

const STUB = {
  synopsis: 'A small kid finds a tiny purple door behind the ivy and decides to step through.',
  characters: [
    { name: 'The Listener', role: 'protagonist', traits: ['curious', 'gentle'] },
    { name: 'Mom', role: 'narrator', traits: ['warm', 'thoughtful'] },
  ],
  themes: ['curiosity', 'home', 'comfort'],
  settings: ['the garden', 'behind the purple door'],
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { storyId = '', transcript = '' } = body as {
    storyId?: string;
    transcript?: string;
  };
  const key = process.env.ANTHROPIC_API_KEY;

  if (!key || !transcript.trim()) {
    return NextResponse.json({
      storyId,
      ...STUB,
      updatedAt: Date.now(),
      source: !key ? 'stub-no-key' : 'stub-no-transcript',
    });
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
        max_tokens: 1200,
        system: [
          {
            type: 'text',
            text: `You help a parent organize a bedtime story for their child. Given the story transcript, extract a story bible. Return STRICT JSON only, no prose, no markdown fences: {"synopsis": "one sentence", "characters": [{"name": "string", "role": "protagonist|sidekick|antagonist|mentor|narrator|background", "traits": ["string", ...]}], "themes": ["string", ...], "settings": ["string", ...]}. Be conservative: only include characters who are clearly named or distinct. Themes are one-word age-5-9 concepts (bravery, friendship, curiosity). Settings are concrete places. Maximum 8 characters, 6 themes, 6 settings.`,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content: `Story transcript:\n\n${transcript}\n\nReturn JSON only.`,
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
      storyId,
      synopsis: parsed.synopsis ?? '',
      characters: parsed.characters ?? [],
      themes: parsed.themes ?? [],
      settings: parsed.settings ?? [],
      updatedAt: Date.now(),
      source: 'claude',
    });
  } catch (err) {
    return NextResponse.json({
      storyId,
      ...STUB,
      updatedAt: Date.now(),
      source: 'stub-fallback',
      error: (err as Error).message,
    });
  }
}
