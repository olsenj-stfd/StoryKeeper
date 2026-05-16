'use client';

import { useRef, useState } from 'react';

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
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

export function RecordButton({
  onRecorded,
}: {
  onRecorded: (blob: Blob, transcript: string) => Promise<void> | void;
}) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptRef = useRef<string>('');

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      transcriptRef.current = '';

      rec.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        setBusy(true);
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((t) => t.stop());
        await onRecorded(blob, transcriptRef.current.trim());
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
        } catch {
          /* recognition may throw if started twice; ignore */
        }
        recognitionRef.current = recognition;
        setHint(null);
      } else {
        setHint('(no transcription — Chrome/Edge only)');
      }

      rec.start();
      setRecording(true);
    } catch (err) {
      alert('Could not access microphone: ' + (err as Error).message);
    }
  };

  const stop = () => {
    recorderRef.current?.stop();
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
      {hint && <div className="text-[11px] text-muted">{hint}</div>}
    </div>
  );
}
