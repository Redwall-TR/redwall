'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { validateContact } from '@/lib/form';
import { Button } from '@/components/ui';

type FormValues = {
  ad: string;
  kurum: string;
  email: string;
  telefon: string;
  mesaj: string;
};

const INITIAL: FormValues = { ad: '', kurum: '', email: '', telefon: '', mesaj: '' };

export default function ContactForm() {
  const t = useTranslations('form');
  const tc = useTranslations('common');

  const [values, setValues] = useState<FormValues>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => { const next = { ...prev }; delete next[name]; return next; });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = validateContact(values);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    console.log('contact form', values);
    setSubmitted(true);
    setValues(INITIAL);
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
      {/* Ad Soyad */}
      <div>
        <label htmlFor="cf-ad" className="mb-1 block text-sm font-medium">
          {t('ad')} <span aria-hidden="true">*</span>
        </label>
        <input
          id="cf-ad"
          name="ad"
          type="text"
          autoComplete="name"
          value={values.ad}
          onChange={handleChange}
          aria-required="true"
          aria-invalid={!!errors.ad}
          aria-describedby={errors.ad ? 'cf-ad-err' : undefined}
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary aria-[invalid=true]:border-red-500"
        />
        {errors.ad && (
          <p id="cf-ad-err" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
            {t(errors.ad as 'zorunlu' | 'gecersizEmail')}
          </p>
        )}
      </div>

      {/* Kurum */}
      <div>
        <label htmlFor="cf-kurum" className="mb-1 block text-sm font-medium">
          {t('kurum')}
        </label>
        <input
          id="cf-kurum"
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
        <label htmlFor="cf-email" className="mb-1 block text-sm font-medium">
          {t('email')} <span aria-hidden="true">*</span>
        </label>
        <input
          id="cf-email"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={handleChange}
          aria-required="true"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'cf-email-err' : undefined}
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary aria-[invalid=true]:border-red-500"
        />
        {errors.email && (
          <p id="cf-email-err" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
            {t(errors.email as 'zorunlu' | 'gecersizEmail')}
          </p>
        )}
      </div>

      {/* Telefon */}
      <div>
        <label htmlFor="cf-telefon" className="mb-1 block text-sm font-medium">
          {t('telefon')}
        </label>
        <input
          id="cf-telefon"
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
        <label htmlFor="cf-mesaj" className="mb-1 block text-sm font-medium">
          {t('mesaj')} <span aria-hidden="true">*</span>
        </label>
        <textarea
          id="cf-mesaj"
          name="mesaj"
          rows={5}
          value={values.mesaj}
          onChange={handleChange}
          aria-required="true"
          aria-invalid={!!errors.mesaj}
          aria-describedby={errors.mesaj ? 'cf-mesaj-err' : undefined}
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary aria-[invalid=true]:border-red-500"
        />
        {errors.mesaj && (
          <p id="cf-mesaj-err" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
            {t(errors.mesaj as 'zorunlu' | 'gecersizEmail')}
          </p>
        )}
      </div>

      <Button type="submit">{tc('gonder')}</Button>
    </form>
  );
}
