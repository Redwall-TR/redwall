import { Button } from './Button';

export function Cta({ baslik, aciklama, buton }: { baslik: string; aciklama?: string; buton: { etiket: string; href: string } }) {
  return (
    <section className="bg-[#141416] text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 text-center">
        <h2 className="font-display text-3xl font-bold">{baslik}</h2>
        {aciklama && <p className="mx-auto mt-3 max-w-xl text-white/70">{aciklama}</p>}
        <div className="mt-8"><Button href={buton.href}>{buton.etiket}</Button></div>
      </div>
    </section>
  );
}
