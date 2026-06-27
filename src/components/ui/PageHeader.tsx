export function PageHeader({ ust, baslik, aciklama }: { ust?: string; baslik: string; aciklama?: string }) {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-28 pb-12">
      {ust && <span className="text-sm font-medium uppercase tracking-wider text-primary">{ust}</span>}
      <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">{baslik}</h1>
      {aciklama && <p className="mt-4 max-w-2xl text-lg text-muted">{aciklama}</p>}
    </div>
  );
}
