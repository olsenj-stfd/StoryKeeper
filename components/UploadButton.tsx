'use client';

import { useRef, useState } from 'react';

export function UploadButton({
  onFile,
}: {
  onFile: (file: File) => Promise<void> | void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      await onFile(file);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        onChange={onChange}
        className="hidden"
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        type="button"
        className="rounded-full px-5 py-2.5 border border-line bg-white text-ink text-[15px] hover:bg-cream-soft disabled:opacity-60"
      >
        {busy ? 'Uploading…' : '↑ Upload audio'}
      </button>
    </>
  );
}
