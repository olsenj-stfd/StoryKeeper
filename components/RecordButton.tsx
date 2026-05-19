'use client';

import { useRef, useState } from 'react';
import { SketchScribble } from './SketchScribble';

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult:
    | ((e: {
        resultIndex: number;
        results: ArrayLike<
          ArrayLike<{ transcript: string }> & { isFinal: boolean }
        >;
      }) => void)
    | null;
  onerror: ((e: { error: string }) => void) | null;
};

function makeRecognition(): SpeechRecognitionLike | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  return new Ctor();
}

function pickAudioMimeType(): string | undefined {
  if (
    typeof MediaRecorder === 'undefined' ||
    !MediaRecorder.isTypeSupported
  ) {
    return undefined;
  }
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4;codecs=mp4a.40.2',
    'audio/mp4',
    'audio/mpeg',
    'audio/aac',
  ];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return undefined;
}

export function RecordButton({
  onRecorded,
}: {
  onRecorded: (blob: Blob, transcript: string) => Promise<void> | void;
}) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptRef = useRef<string>('');

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setActiveStream(stream);
      const mimeType = pickAudioMimeType();
      const rec = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      chunksRef.current = [];
      transcriptRef.current = '';

      rec.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      rec.onerror = (e) => {
        const err = (e as unknown as { error?: { message?: string } }).error;
        setError('Recorder error: ' + (err?.message ?? 'unknown'));
        stream.getTracks().forEach((t) => t.stop());
        setActiveStream(null);
        setRecording(false);
      };
      rec.onstop = async () => {
        setBusy(true);
        // Use the actual mime type the recorder used — important on iOS where
        // it produces audio/mp4 even if we asked for webm.
        const blobType = rec.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: blobType });
        stream.getTracks().forEach((t) => t.stop());
        setActiveStream(null);

        let transcript = transcriptRef.current.trim();

        // Whisper fallback: if Web Speech captured nothing (iOS Safari/Chrome,
        // Firefox without prefs), POST the blob to /api/ai/transcribe. Server
        // forwards to OpenAI Whisper and returns the text. Without OPENAI_API_KEY
        // (or with no billing on OpenAI), this no-ops and we proceed with
        // whatever transcript we have.
        if (!transcript && blob.size > 0) {
          setHint('Transcribing audio…');
          try {
            const ext = blobType.split('/')[1]?.split(';')[0] || 'webm';
            const form = new FormData();
            form.append('audio', blob, `recording.${ext}`);
            const r = await fetch('/api/ai/transcribe', {
              method: 'POST',
              body: form,
            });
            const j = (await r.json()) as { transcript?: string; source?: string };
            if (j.transcript && j.transcript.trim()) {
              transcript = j.transcript.trim();
              setHint(null);
            } else if (j.source === 'no-key') {
              setHint('No transcription — add OPENAI_API_KEY to enable.');
            } else if (j.source === 'whisper-error') {
              setHint('Transcription failed — OpenAI billing may be unset.');
            } else {
              setHint(null);
            }
          } catch {
            setHint('Transcription failed — proceeding without.');
          }
        }

        try {
          await onRecorded(blob, transcript);
        } catch (err) {
          setError('Save failed: ' + (err as Error).message);
        }
        setBusy(false);
      };
      recorderRef.current = rec;

      const recognition = makeRecognition();
      if (recognition) {
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.onresult = (e) => {
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const result = e.results[i];
            if (result.isFinal) {
              transcriptRef.current += result[0].transcript + ' ';
            }
          }
        };
        recognition.onerror = (e) => {
          if (e.error !== 'no-speech' && e.error !== 'aborted') {
            console.warn('Speech recognition error:', e.error);
          }
        };
        try {
          recognition.start();
          setHint(null);
        } catch {
          /* ignore double-start */
        }
        recognitionRef.current = recognition;
      } else {
        // Web Speech blocked (iOS / etc.) — we'll fall back to server-side
        // Whisper after the recording stops, so don't scare the user yet.
        setHint(null);
      }

      rec.start();
      setRecording(true);
    } catch (err) {
      setError('Could not access microphone: ' + (err as Error).message);
    }
  };

  const stop = () => {
    try {
      recorderRef.current?.stop();
    } catch (err) {
      setError('Stop failed: ' + (err as Error).message);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }
    setRecording(false);
  };

  return (
    <div className="flex flex-col items-stretch gap-2 w-full max-w-md">
      {recording && activeStream && (
        <div className="relative">
          <div className="annotation absolute -top-3 left-2 bg-white px-1">
            SKETCHING AS YOU TALK
          </div>
          <SketchScribble stream={activeStream} />
        </div>
      )}
      <div className="flex items-start justify-end gap-2 flex-wrap">
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={recording ? stop : start}
            disabled={busy}
            type="button"
            className={`rounded-full px-5 py-2.5 text-white text-[15px] ${
              recording ? 'bg-[#c64a4a] recording-anim' : 'bg-parent hover:brightness-95'
            } disabled:opacity-60`}
          >
            {busy ? 'Saving…' : recording ? '■ Stop' : '● Record'}
          </button>
          {hint && (
            <div className="text-[11px] text-muted text-right max-w-[260px] leading-tight">
              {hint}
            </div>
          )}
          {error && (
            <div className="text-[12px] text-[#c64a4a] text-right max-w-[260px] leading-tight font-bold">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
