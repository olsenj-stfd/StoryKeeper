import { NextRequest, NextResponse } from 'next/server';

// Map common audio mime types to extensions Whisper recognizes by filename.
function extForMime(mime: string): string {
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('mp4')) return 'mp4';
  if (mime.includes('mpeg') || mime.includes('mp3')) return 'mp3';
  if (mime.includes('wav')) return 'wav';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('flac')) return 'flac';
  if (mime.includes('aac')) return 'm4a';
  return 'mp4';
}

export async function POST(req: NextRequest) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { transcript: '', source: 'no-key', error: 'OPENAI_API_KEY not set' },
      { status: 200 },
    );
  }

  let file: File | null = null;
  try {
    const form = await req.formData();
    const audio = form.get('audio');
    if (audio instanceof File) file = audio;
  } catch (err) {
    return NextResponse.json(
      { transcript: '', source: 'bad-input', error: (err as Error).message },
      { status: 200 },
    );
  }
  if (!file) {
    return NextResponse.json(
      { transcript: '', source: 'no-audio', error: 'No audio in request' },
      { status: 200 },
    );
  }

  // Whisper accepts files up to 25MB.
  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json(
      {
        transcript: '',
        source: 'too-large',
        error: 'Audio exceeds 25MB limit; split into chunks.',
      },
      { status: 200 },
    );
  }

  // Re-package with a proper filename extension so Whisper detects the format.
  const ext = extForMime(file.type || '');
  const blob = await file.arrayBuffer();
  const upload = new File([blob], `recording.${ext}`, {
    type: file.type || `audio/${ext}`,
  });

  const openaiForm = new FormData();
  openaiForm.append('file', upload);
  openaiForm.append('model', 'whisper-1');
  openaiForm.append('response_format', 'json');

  try {
    const r = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: openaiForm,
    });
    if (!r.ok) {
      const text = await r.text();
      return NextResponse.json(
        {
          transcript: '',
          source: 'whisper-error',
          error: `Whisper ${r.status}: ${text.slice(0, 300)}`,
        },
        { status: 200 },
      );
    }
    const data = (await r.json()) as { text?: string };
    return NextResponse.json({
      transcript: (data.text ?? '').trim(),
      source: 'whisper',
    });
  } catch (err) {
    return NextResponse.json(
      {
        transcript: '',
        source: 'whisper-network',
        error: (err as Error).message,
      },
      { status: 200 },
    );
  }
}
