'use client';

import { useTranslations } from 'next-intl';
import { validateKvkkBasvuru } from '@/lib/form';
import { useFormSubmit } from '@/components/sections/useFormSubmit';
import {
  TextField,
  TextareaField,
  SelectField,
  Honeypot,
  SuccessBanner,
  GenelHataMesaji,
  FormTurnstile,
} from '@/components/sections/FormFields';
import { KVKK_SIFAT_OPTIONS, KVKK_TALEP_OPTIONS } from '@/lib/kvkk';
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

export default function KvkkBasvuruForm({ locale }: { locale: Locale }) {
  const t = useTranslations('form');
  const tc = useTranslations('common');
  const isTr = locale === 'tr';
  const { values, errors, submitted, submitting, genelHata, setToken, handleChange, handleSubmit } =
    useFormSubmit<FormValues>({
      initial: INITIAL,
      validate: (v) => validateKvkkBasvuru(v),
      toInput: (v) => ({
        tur: 'kvkk',
        ad: v.adSoyad,
        iletisim: v.iletisim,
        basvuruSahibiSifati: v.basvuruSahibiSifati,
        talepTuru: v.talepTuru,
        aciklama: v.aciklama,
        kvkkOnay: v.kvkkOnay,
        hp: v.hp,
      }),
    });

  if (submitted) return <SuccessBanner />;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <TextField id="kbf-adSoyad" name="adSoyad" label={t('ad')} required value={values.adSoyad} onChange={handleChange} error={errors.adSoyad} autoComplete="name" />
      <TextField id="kbf-iletisim" name="iletisim" label={isTr ? 'E-posta veya Telefon' : 'Email or Phone'} required value={values.iletisim} onChange={handleChange} error={errors.iletisim} />
      <SelectField id="kbf-basvuruSahibiSifati" name="basvuruSahibiSifati" label={isTr ? 'Başvuru Sahibinin Sıfatı' : 'Applicant Status'} required value={values.basvuruSahibiSifati} onChange={handleChange} error={errors.basvuruSahibiSifati}>
        <option value="">{isTr ? 'Seçiniz' : 'Select'}</option>
        {KVKK_SIFAT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {isTr ? opt.tr : opt.en}
          </option>
        ))}
      </SelectField>
      <SelectField id="kbf-talepTuru" name="talepTuru" label={isTr ? 'Talep Türü' : 'Request Type'} required value={values.talepTuru} onChange={handleChange} error={errors.talepTuru}>
        <option value="">{isTr ? 'Seçiniz' : 'Select'}</option>
        {KVKK_TALEP_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {isTr ? opt.tr : opt.en}
          </option>
        ))}
      </SelectField>
      <TextareaField id="kbf-aciklama" name="aciklama" label={isTr ? 'Açıklama / Talep Detayı' : 'Description / Request Detail'} required rows={5} value={values.aciklama} onChange={handleChange} error={errors.aciklama} />

      {/* KVKK Onay (checkbox — özel düzen) */}
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
              : 'I consent to my request being processed under the KVKK (Turkish data protection law).'}{' '}
            <span aria-hidden="true">*</span>
          </label>
        </div>
        {errors.kvkkOnay && (
          <p id="kbf-kvkkOnay-err" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
            {t(errors.kvkkOnay as Parameters<typeof t>[0])}
          </p>
        )}
      </div>

      <Honeypot value={values.hp} onChange={handleChange} />
      <FormTurnstile onToken={setToken} />
      <GenelHataMesaji kind={genelHata} />
      <Button type="submit" disabled={submitting}>
        {submitting ? tc('yukleniyor') : tc('gonder')}
      </Button>
    </form>
  );
}
