'use client';

type BranchOption = {
  id: string;
  label: string;
  icon?: string | null;
  fromMom?: boolean;
};

const MADEUP_MARKERS = ['marker-kid', 'marker-mint', 'marker-coral'] as const;

export function BranchPicker({
  options,
  onPick,
}: {
  options: BranchOption[];
  onPick: (id: string) => void;
}) {
  return (
    <div className="grid gap-5">
      {options.map((o, i) => (
        <button
          key={o.id}
          onClick={() => onPick(o.id)}
          className={`sketched-box relative px-4 py-3 text-left font-bold ${
            o.fromMom ? 'marker-parent' : MADEUP_MARKERS[i % MADEUP_MARKERS.length]
          }`}
          type="button"
        >
          <span
            className={`annotation absolute -top-3 left-3 bg-white px-1.5 ${
              o.fromMom ? 'ink' : ''
            }`}
          >
            {o.fromMom ? 'FROM MOM' : 'MADE UP'}
          </span>
          {o.icon && <span className="mr-2">{o.icon}</span>}
          {o.label}
        </button>
      ))}
    </div>
  );
}
