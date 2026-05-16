'use client';

type BranchOption = { id: string; label: string; icon?: string | null };

const MARKERS = ['marker-kid', 'marker-mint', 'marker-coral'] as const;

export function BranchPicker({
  options,
  onPick,
}: {
  options: BranchOption[];
  onPick: (id: string) => void;
}) {
  return (
    <div className="grid gap-4">
      {options.map((o, i) => (
        <button
          key={o.id}
          onClick={() => onPick(o.id)}
          className={`sketched-box ${MARKERS[i % MARKERS.length]} px-4 py-3 text-left font-bold`}
          type="button"
        >
          {o.icon && <span className="mr-2">{o.icon}</span>}
          {o.label}
        </button>
      ))}
    </div>
  );
}
