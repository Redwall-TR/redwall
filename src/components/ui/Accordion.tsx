'use client';
import { useState } from 'react';
export function Accordion({ items }: { items: { soru: string; cevap: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="divide-y divide-border rounded-xl border border-border">
      {items.map((it, i) => (
        <div key={i}>
          <button onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-medium">
            <span>{it.soru}</span><span>{open === i ? '−' : '+'}</span>
          </button>
          {open === i && <div className="px-5 pb-4 text-muted">{it.cevap}</div>}
        </div>
      ))}
    </div>
  );
}
