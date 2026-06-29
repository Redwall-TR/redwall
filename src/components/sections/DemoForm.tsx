'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { validateDemo } from '@/lib/form';
import { submitForm } from '@/app/actions/form-gonderim';
import { Button } from '@/components/ui';
import type { Locale } from '@/types';

type FormValues = {
  urun: string;
  ad: string;
  kurum: string;
  email: string;
  mesaj: string;
  hp: string;
};

const INITIAL: FormValues = {
  urun: '',
  ad: '',
  kurum: '',
  email: '',
  mesaj: '',
  hp: '',
};

const URUN_OPTIONS = [
  { value: 'yanginpro', label: 'YangınPro' },
  { value: 'mekanikpro', label: 'MekanikPro' },
  { value: 'her-ikisi', tr: 'Her ikisi', en: 'Both' },
] as const;

export default function DemoForm({ locale }: { locale: Locale }) {
  const t = useTranslations('form');
  const tc = useTranslations('common');
  const isTr = locale === 'tr';

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
    const errs = validateDemo(values);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    setGenelHata(false);
    const res = await submitForm({ tur: 'demo', ...values });
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
      {/* Ürün */}
      <div>
        <label htmlFor="df-urun" className="mb-1 block text-sm font-medium">
          {t('urun')} <span aria-hidden="true">*</span>
        </label>
        <select
          id="df-urun"
          name="urun"
          value={values.urun}
          onChange={handleChange}
          aria-required="true"
          aria-invalid={!!errors.urun}
          aria-describedby={errors.urun ? 'df-urun-err' : undefined}
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary aria-[invalid=true]:border-red-500"
        >
          <option value="">{isTr ? 'Seçiniz' : 'Select'}</option>
          {URUN_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {'tr' in opt ? (isTr ? opt.tr : opt.en) : opt.label}
            </option>
          ))}
        </select>
        {errors.urun && (
          <p id="df-urun-err" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
            {t(errors.urun as 'zorunlu' | 'gecersizEmail')}
          </p>
        )}
      </div>

      {/* Ad Soyad */}
      <div>
        <label htmlFor="df-ad" className="mb-1 block text-sm font-medium">
          {t('ad')} <span aria-hidden="true">*</span>
        </label>
        <input
          id="df-ad"
          name="ad"
          type="text"
          autoComplete="name"
          value={values.ad}
          onChange={handleChange}
          aria-required="true"
          aria-invalid={!!errors.ad}
          aria-describedby={errors.ad ? 'df-ad-err' : undefined}
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary aria-[invalid=true]:border-red-500"
        />
        {errors.ad && (
          <p id="df-ad-err" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
            {t(errors.ad as 'zorunlu' | 'gecersizEmail')}
          </p>
        )}
      </div>

      {/* Kurum */}
      <div>
        <label htmlFor="df-kurum" className="mb-1 block text-sm font-medium">
          {t('kurum')}
        </label>
        <input
          id="df-kurum"
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
        <label htmlFor="df-email" className="mb-1 block text-sm font-medium">
          {t('email')} <span aria-hidden="true">*</span>
        </label>
        <input
          id="df-email"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={handleChange}
          aria-required="true"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'df-email-err' : undefined}
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary aria-[invalid=true]:border-red-500"
        />
        {errors.email && (
          <p id="df-email-err" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
            {t(errors.email as 'zorunlu' | 'gecersizEmail')}
          </p>
        )}
      </div>

      {/* İhtiyaç / Mesaj */}
      <div>
        <label htmlFor="df-mesaj" className="mb-1 block text-sm font-medium">
          {isTr ? 'İhtiyacınız' : 'Your needs'}
        </label>
        <textarea
          id="df-mesaj"
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
        {submitting ? tc('yukleniyor') : tc('gonder')}
      </Button>
    </form>
  );
}
