'use client';

import { useEffect, useRef } from 'react';

type Point = { x: number; y: number; t: number };

// Draws a live, hand-sketched scribble line that responds to the
// parent's voice amplitude while recording. Looks like someone is
// drawing as they talk — a wobbly ink line that spikes on louder
// sounds and quietly waves during pauses.
export function SketchScribble({ stream }: { stream: MediaStream | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!stream || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set internal pixel size to match display size so the line stays crisp.
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;

    let audioCtx: AudioContext;
    try {
      const AnyAudioContext =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AnyAudioContext) return;
      audioCtx = new AnyAudioContext();
    } catch {
      return;
    }
    audioCtxRef.current = audioCtx;

    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.6;
    source.connect(analyser);

    const data = new Uint8Array(analyser.fftSize);
    const points: Point[] = [];
    const spikes: { x: number; y: number; size: number; t: number }[] = [];
    let x = 0;
    let t = 0;
    const step = 2.5;

    const draw = () => {
      analyser.getByteTimeDomainData(data);
      // Amplitude from time-domain data (deviation from silent 128).
      let sum = 0;
      let peak = 0;
      for (let i = 0; i < data.length; i++) {
        const v = Math.abs(data[i] - 128);
        sum += v;
        if (v > peak) peak = v;
      }
      const avg = sum / data.length / 128; // 0–1
      const peakNorm = peak / 128; // 0–1

      // Wobble while silent, big spike when loud.
      const baselineWobble = Math.sin(t * 0.15) * 3 + (Math.random() - 0.5) * 1.5;
      const amplitudeKick = avg * (H * 0.45);
      const direction = Math.sin(t * 0.05) > 0 ? -1 : 1;
      const y =
        H / 2 + baselineWobble + direction * amplitudeKick * (0.6 + Math.random() * 0.4);

      points.push({ x, y, t });
      x += step;
      t += 1;

      // Mark big peaks with a little ink "spike" doodle.
      if (peakNorm > 0.55 && Math.random() > 0.7) {
        spikes.push({ x, y, size: 4 + Math.random() * 4, t: 0 });
      }

      // Scroll left when we reach the right edge.
      if (x > W) {
        const shift = x - W;
        for (const p of points) p.x -= shift;
        for (const s of spikes) s.x -= shift;
        x = W;
        while (points.length && points[0].x < -10) points.shift();
        while (spikes.length && spikes[0].x < -10) spikes.shift();
      }

      // Render
      ctx.clearRect(0, 0, W, H);

      // Faint baseline guide
      ctx.strokeStyle = 'rgba(43, 36, 23, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(0, H / 2);
      ctx.lineTo(W, H / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // The scribble line
      ctx.strokeStyle = '#2b2417';
      ctx.lineWidth = 2.6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();

      // Spikes
      ctx.strokeStyle = 'rgba(198, 74, 74, 0.7)';
      ctx.lineWidth = 1.5;
      for (const s of spikes) {
        ctx.beginPath();
        ctx.moveTo(s.x - s.size, s.y);
        ctx.lineTo(s.x + s.size, s.y);
        ctx.moveTo(s.x, s.y - s.size);
        ctx.lineTo(s.x, s.y + s.size);
        ctx.stroke();
        s.t += 1;
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
      try {
        audioCtx.close();
      } catch {
        /* ignore */
      }
      audioCtxRef.current = null;
    };
  }, [stream]);

  return (
    <canvas
      ref={canvasRef}
      className="block w-full h-20 bg-white border-2 border-ink/40 rounded-lg"
      aria-label="Live voice scribble"
    />
  );
}
