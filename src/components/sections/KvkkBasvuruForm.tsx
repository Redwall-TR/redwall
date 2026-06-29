'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { validateKvkkBasvuru } from '@/lib/form';
import { submitForm } from '@/app/actions/form-gonderim';
import { Button } from '@/components/ui';
import type { Locale } from '@/types';

type FormValues = {
  adSoyad: string;
  iletisim: string;
  basvuruSahibiSifati: string;
  talepTuru: string;
  aciklama: string;
  kvkkOnay: boolean;
  hp: string;
};

const INITIAL: FormValues = {
  adSoyad: '',
  iletisim: '',
  basvuruSahibiSifati: '',
  talepTuru: '',
  aciklama: '',
  kvkkOnay: false,
  hp: '',
};

const BASVURU_SAHIBI_SIFATI = {
  tr: [
    { value: 'ilgili-kisi', label: 'İlgili kişi' },
    { value: 'vekil', label: 'Vekil' },
    { value: 'yasal-temsilci', label: 'Yasal temsilci' },
  ],
  en: [
    { value: 'ilgili-kisi', label: 'Data subject' },
    { value: 'vekil', label: 'Authorized representative' },
    { value: 'yasal-temsilci', label: 'Legal representative' },
  ],
};

const TALEP_TURU = {
  tr: [
    { value: 'bilgi-talebi', label: 'Bilgi talebi' },
    { value: 'duzeltme', label: 'Düzeltme' },
    { value: 'silme-yok-etme', label: 'Silme/Yok etme' },
    { value: 'islemeye-itiraz', label: 'İşlemeye itiraz' },
    { value: 'diger', label: 'Diğer' },
  ],
  en: [
    { value: 'bilgi-talebi', label: 'Access request' },
    { value: 'duzeltme', label: 'Rectification' },
    { value: 'silme-yok-etme', label: 'Erasure/Destruction' },
    { value: 'islemeye-itiraz', label: 'Objection to processing' },
    { value: 'diger', label: 'Other' },
  ],
};

export default function KvkkBasvuruForm({ locale }: { locale: Locale }) {
  const t = useTranslations('form');
  const tc = useTranslations('common');
  const isTr = locale === 'tr';

  const [values, setValues] = useState<FormValues>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [genelHata, setGenelHata] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    setValues((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name])
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = validateKvkkBasvuru(values);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    setGenelHata(false);
    const res = await submitForm({
      tur: 'kvkk',
      ad: values.adSoyad,
      iletisim: values.iletisim,
      basvuruSahibiSifati: values.basvuruSahibiSifati,
      talepTuru: values.talepTuru,
      aciklama: values.aciklama,
      kvkkOnay: values.kvkkOnay,
      hp: values.hp,
    });
    setSubmitting(false);
    if (res.ok) {
      setSubmitted(true);
      setValues(INITIAL);
    } else if (res.errors && !res.errors._genel) {
      setErrors(res.errors);
    } else {
      setGenelHata(true);
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

  const sifatOptions = BASVURU_SAHIBI_SIFATI[locale];
  const talepOptions = TALEP_TURU[locale];

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Ad Soyad */}
      <div>
        <label htmlFor="kbf-adSoyad" className="mb-1 block text-sm font-medium">
          {t('ad')} <span aria-hidden="true">*</span>
        </label>
        <input
          id="kbf-adSoyad"
          name="adSoyad"
          type="text"
          autoComplete="name"
          value={values.adSoyad}
          onChange={handleChange}
          aria-required="true"
          aria-invalid={!!errors.adSoyad}
          aria-describedby={errors.adSoyad ? 'kbf-adSoyad-err' : undefined}
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary aria-[invalid=true]:border-red-500"
        />
        {errors.adSoyad && (
          <p id="kbf-adSoyad-err" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
            {t(errors.adSoyad as 'zorunlu' | 'gecersizEmail')}
          </p>
        )}
      </div>

      {/* İletişim (e-posta veya telefon) */}
      <div>
        <label htmlFor="kbf-iletisim" className="mb-1 block text-sm font-medium">
          {isTr ? 'E-posta veya Telefon' : 'Email or Phone'} <span aria-hidden="true">*</span>
        </label>
        <input
          id="kbf-iletisim"
          name="iletisim"
          type="text"
          autoComplete="email"
          value={values.iletisim}
          onChange={handleChange}
          aria-required="true"
          aria-invalid={!!errors.iletisim}
          aria-describedby={errors.iletisim ? 'kbf-iletisim-err' : undefined}
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary aria-[invalid=true]:border-red-500"
        />
        {errors.iletisim && (
          <p id="kbf-iletisim-err" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
            {t(errors.iletisim as 'zorunlu' | 'gecersizEmail')}
          </p>
        )}
      </div>

      {/* Başvuru Sahibi Sıfatı */}
      <div>
        <label htmlFor="kbf-basvuruSahibiSifati" className="mb-1 block text-sm font-medium">
          {isTr ? 'Başvuru Sahibinin Sıfatı' : 'Applicant Status'} <span aria-hidden="true">*</span>
        </label>
        <select
          id="kbf-basvuruSahibiSifati"
          name="basvuruSahibiSifati"
          value={values.basvuruSahibiSifati}
          onChange={handleChange}
          aria-required="true"
          aria-invalid={!!errors.basvuruSahibiSifati}
          aria-describedby={errors.basvuruSahibiSifati ? 'kbf-basvuruSahibiSifati-err' : undefined}
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary aria-[invalid=true]:border-red-500"
        >
          <option value="">{isTr ? 'Seçiniz' : 'Select'}</option>
          {sifatOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors.basvuruSahibiSifati && (
          <p id="kbf-basvuruSahibiSifati-err" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
            {t(errors.basvuruSahibiSifati as 'zorunlu' | 'gecersizEmail')}
          </p>
        )}
      </div>

      {/* Talep Türü */}
      <div>
        <label htmlFor="kbf-talepTuru" className="mb-1 block text-sm font-medium">
          {isTr ? 'Talep Türü' : 'Request Type'} <span aria-hidden="true">*</span>
        </label>
        <select
          id="kbf-talepTuru"
          name="talepTuru"
          value={values.talepTuru}
          onChange={handleChange}
          aria-required="true"
          aria-invalid={!!errors.talepTuru}
          aria-describedby={errors.talepTuru ? 'kbf-talepTuru-err' : undefined}
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary aria-[invalid=true]:border-red-500"
        >
          <option value="">{isTr ? 'Seçiniz' : 'Select'}</option>
          {talepOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors.talepTuru && (
          <p id="kbf-talepTuru-err" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
            {t(errors.talepTuru as 'zorunlu' | 'gecersizEmail')}
          </p>
        )}
      </div>

      {/* Açıklama */}
      <div>
        <label htmlFor="kbf-aciklama" className="mb-1 block text-sm font-medium">
          {isTr ? 'Açıklama / Talep Detayı' : 'Description / Request Detail'}{' '}
          <span aria-hidden="true">*</span>
        </label>
        <textarea
          id="kbf-aciklama"
          name="aciklama"
          rows={5}
          value={values.aciklama}
          onChange={handleChange}
          aria-required="true"
          aria-invalid={!!errors.aciklama}
          aria-describedby={errors.aciklama ? 'kbf-aciklama-err' : undefined}
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary aria-[invalid=true]:border-red-500"
        />
        {errors.aciklama && (
          <p id="kbf-aciklama-err" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
            {t(errors.aciklama as 'zorunlu' | 'gecersizEmail')}
          </p>
        )}
      </div>

      {/* KVKK Onay Checkbox */}
      <div>
        <div className="flex items-start gap-3">
          <input
            id="kbf-kvkkOnay"
            name="kvkkOnay"
            type="checkbox"
            checked={values.kvkkOnay}
            onChange={handleChange}
            aria-required="true"
            aria-invalid={!!errors.kvkkOnay}
            aria-describedby={errors.kvkkOnay ? 'kbf-kvkkOnay-err' : undefined}
            className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          <label htmlFor="kbf-kvkkOnay" className="text-sm">
            {isTr
              ? 'Başvurumun KVKK kapsamında işlenmesini onaylıyorum.'
              : 'I consent to my request being processed under the KVKK (Turkish data protection law).'}
            {' '}<span aria-hidden="true">*</span>
          </label>
        </div>
        {errors.kvkkOnay && (
          <p id="kbf-kvkkOnay-err" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
            {t(errors.kvkkOnay as 'zorunlu' | 'gecersizEmail')}
          </p>
        )}
      </div>

      {/* Honeypot — kullanıcıya gizli; botlar doldurursa gönderim sessizce yok sayılır */}
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
          {t('genelHata')}
        </p>
      )}
      <Button type="submit" disabled={submitting}>
        {submitting ? tc('yukleniyor') : tc('gonder')}
      </Button>
    </form>
  );
}
