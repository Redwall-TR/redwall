export function Stat({ deger, etiket }: { deger: string; etiket: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-surface p-6 text-center">
      <div className="text-3xl font-bold text-primary">{deger}</div>
      <div className="text-sm text-muted">{etiket}</div>
    </div>
  );
}
