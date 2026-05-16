'use client';

import { useRef, useState } from 'react';

export function RecordButton({
  onRecorded,
}: {
  onRecorded: (blob: Blob) => Promise<void> | void;
}) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        setBusy(true);
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((t) => t.stop());
        await onRecorded(blob);
        setBusy(false);
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch (err) {
      alert('Could not access microphone: ' + (err as Error).message);
    }
  };

  const stop = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <button
      onClick={recording ? stop : start}
      disabled={busy}
      className={`rounded-full px-5 py-2.5 text-white text-[15px] ${
        recording ? 'bg-[#c64a4a] recording-anim' : 'bg-parent hover:brightness-95'
      } disabled:opacity-60`}
    >
      {busy ? 'Saving…' : recording ? '■ Stop' : '● Record'}
    </button>
  );
}
