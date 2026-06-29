'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { validateQuote } from '@/lib/form';
import { submitForm } from '@/app/actions/form-gonderim';
import { isKoluLabel } from '@/lib/labels';
import { Button } from '@/components/ui';
import type { Locale, IsKolu } from '@/types';

type FormValues = {
  isKolu: string;
  hizmetTipi: string;
  il: string;
  metrekare: string;
  ad: string;
  kurum: string;
  telefon: string;
  email: string;
  mesaj: string;
  hp: string;
};

const INITIAL: FormValues = {
  isKolu: '',
  hizmetTipi: '',
  il: '',
  metrekare: '',
  ad: '',
  kurum: '',
  telefon: '',
  email: '',
  mesaj: '',
  hp: '',
};

const IS_KOLU_VALUES: IsKolu[] = ['yazilim', 'danismanlik', 'muhendislik'];

export default function QuoteForm({ locale }: { locale: Locale }) {
  const t = useTranslations('form');
  const tc = useTranslations('common');

  const [values, setValues] = useState<FormValues>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [genelHata, setGenelHata] = useState<false | 'genel' | 'rate'>(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name])
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = validateQuote(values);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    setGenelHata(false);
    const mesaj = [values.hizmetTipi && `Hizmet tipi: ${values.hizmetTipi}`, values.mesaj]
      .filter(Boolean)
      .join('\n');
    const res = await submitForm({
      tur: 'teklif',
      ad: values.ad,
      email: values.email,
      telefon: values.telefon,
      kurum: values.kurum,
      isKolu: values.isKolu,
      il: values.il,
      metrekare: values.metrekare,
      mesaj,
      hp: values.hp,
    });
    setSubmitting(false);
    if (res.ok) {
      setSubmitted(true);
      setValues(INITIAL);
    } else if (res.errors && !res.errors._genel) {
      setErrors(res.errors);
    } else {
      setGenelHata(res.errors?._genel === 'rate' ? 'rate' : 'genel');
    }
  }

  if (submitted) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-green-200 bg-green-50 px-6 py-8 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
      >
        {t('basarili')}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* İş Kolu */}
      <div>
        <label htmlFor="qf-isKolu" className="mb-1 block text-sm font-medium">
          {t('isKolu')} <span aria-hidden="true">*</span>
        </label>
        <select
          id="qf-isKolu"
          name="isKolu"
          value={values.isKolu}
          onChange={handleChange}
          aria-required="true"
          aria-invalid={!!errors.isKolu}
          aria-describedby={errors.isKolu ? 'qf-isKolu-err' : undefined}
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary aria-[invalid=true]:border-red-500"
        >
          <option value="">{locale === 'tr' ? 'Seçiniz' : 'Select'}</option>
          {IS_KOLU_VALUES.map((v) => (
            <option key={v} value={v}>
              {isKoluLabel(v, locale)}
            </option>
          ))}
        </select>
        {errors.isKolu && (
          <p id="qf-isKolu-err" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
            {t(errors.isKolu as 'zorunlu' | 'gecersizEmail')}
          </p>
        )}
      </div>

      {/* Hizmet / Proje Tipi */}
      <div>
        <label htmlFor="qf-hizmetTipi" className="mb-1 block text-sm font-medium">
          {locale === 'tr' ? 'Proje / Hizmet Tipi' : 'Project / Service Type'}
        </label>
        <input
          id="qf-hizmetTipi"
          name="hizmetTipi"
          type="text"
          value={values.hizmetTipi}
          onChange={handleChange}
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* İl + Metrekare */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="qf-il" className="mb-1 block text-sm font-medium">
            {t('il')}
          </label>
          <input
            id="qf-il"
            name="il"
            type="text"
            value={values.il}
            onChange={handleChange}
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label htmlFor="qf-metrekare" className="mb-1 block text-sm font-medium">
            {t('metrekare')}
          </label>
          <input
            id="qf-metrekare"
            name="metrekare"
            type="number"
            min="0"
            value={values.metrekare}
            onChange={handleChange}
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Ad Soyad */}
      <div>
        <label htmlFor="qf-ad" className="mb-1 block text-sm font-medium">
          {t('ad')} <span aria-hidden="true">*</span>
        </label>
        <input
          id="qf-ad"
          name="ad"
          type="text"
          autoComplete="name"
          value={values.ad}
          onChange={handleChange}
          aria-required="true"
          aria-invalid={!!errors.ad}
          aria-describedby={errors.ad ? 'qf-ad-err' : undefined}
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary aria-[invalid=true]:border-red-500"
        />
        {errors.ad && (
          <p id="qf-ad-err" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
            {t(errors.ad as 'zorunlu' | 'gecersizEmail')}
          </p>
        )}
      </div>

      {/* Kurum */}
      <div>
        <label htmlFor="qf-kurum" className="mb-1 block text-sm font-medium">
          {t('kurum')}
        </label>
        <input
          id="qf-kurum"
          name="kurum"
          type="text"
          autoComplete="organization"
          value={values.kurum}
          onChange={handleChange}
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* E-posta */}
      <div>
        <label htmlFor="qf-email" className="mb-1 block text-sm font-medium">
          {t('email')} <span aria-hidden="true">*</span>
        </label>
        <input
          id="qf-email"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={handleChange}
          aria-required="true"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'qf-email-err' : undefined}
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary aria-[invalid=true]:border-red-500"
        />
        {errors.email && (
          <p id="qf-email-err" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
            {t(errors.email as 'zorunlu' | 'gecersizEmail')}
          </p>
        )}
      </div>

      {/* Telefon */}
      <div>
        <label htmlFor="qf-telefon" className="mb-1 block text-sm font-medium">
          {t('telefon')}
        </label>
        <input
          id="qf-telefon"
          name="telefon"
          type="tel"
          autoComplete="tel"
          value={values.telefon}
          onChange={handleChange}
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Mesaj */}
      <div>
        <label htmlFor="qf-mesaj" className="mb-1 block text-sm font-medium">
          {t('mesaj')}
        </label>
        <textarea
          id="qf-mesaj"
          name="mesaj"
          rows={4}
          value={values.mesaj}
          onChange={handleChange}
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <input
        type="text"
        name="hp"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={values.hp}
        onChange={handleChange}
        className="hidden"
      />
      {genelHata && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {t(genelHata === 'rate' ? 'cokFazla' : 'genelHata')}
        </p>
      )}
      <Button type="submit" disabled={submitting}>
        {submitting ? tc('yukleniyor') : tc('teklifAl')}
      </Button>
    </form>
  );
}
