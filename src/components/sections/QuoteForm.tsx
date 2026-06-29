'use client';

import { useTranslations } from 'next-intl';
import { validateQuote } from '@/lib/form';
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
  const isTr = locale === 'tr';
  const { values, errors, submitted, submitting, genelHata, setToken, handleChange, handleSubmit } =
    useFormSubmit<FormValues>({
      initial: INITIAL,
      validate: (v) => validateQuote(v),
      toInput: (v) => ({
        tur: 'teklif',
        ad: v.ad,
        email: v.email,
        telefon: v.telefon,
        kurum: v.kurum,
        isKolu: v.isKolu,
        il: v.il,
        metrekare: v.metrekare,
        hp: v.hp,
        // hizmetTipi yapısal bir kolon değil; mesaja katlanır.
        mesaj: [v.hizmetTipi && `Hizmet tipi: ${v.hizmetTipi}`, v.mesaj].filter(Boolean).join('\n'),
      }),
    });

  if (submitted) return <SuccessBanner />;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <SelectField id="qf-isKolu" name="isKolu" label={t('isKolu')} required value={values.isKolu} onChange={handleChange} error={errors.isKolu}>
        <option value="">{isTr ? 'Seçiniz' : 'Select'}</option>
        {IS_KOLU_VALUES.map((v) => (
          <option key={v} value={v}>
            {isKoluLabel(v, locale)}
          </option>
        ))}
      </SelectField>
      <TextField id="qf-hizmetTipi" name="hizmetTipi" label={isTr ? 'Proje / Hizmet Tipi' : 'Project / Service Type'} value={values.hizmetTipi} onChange={handleChange} error={errors.hizmetTipi} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id="qf-il" name="il" label={t('il')} value={values.il} onChange={handleChange} error={errors.il} />
        <TextField id="qf-metrekare" name="metrekare" type="number" label={t('metrekare')} value={values.metrekare} onChange={handleChange} error={errors.metrekare} />
      </div>
      <TextField id="qf-ad" name="ad" label={t('ad')} required value={values.ad} onChange={handleChange} error={errors.ad} autoComplete="name" />
      <TextField id="qf-kurum" name="kurum" label={t('kurum')} value={values.kurum} onChange={handleChange} error={errors.kurum} autoComplete="organization" />
      <TextField id="qf-email" name="email" type="email" label={t('email')} required value={values.email} onChange={handleChange} error={errors.email} autoComplete="email" />
      <TextField id="qf-telefon" name="telefon" type="tel" label={t('telefon')} value={values.telefon} onChange={handleChange} error={errors.telefon} autoComplete="tel" />
      <TextareaField id="qf-mesaj" name="mesaj" label={t('mesaj')} value={values.mesaj} onChange={handleChange} error={errors.mesaj} />
      <Honeypot value={values.hp} onChange={handleChange} />
      <FormTurnstile onToken={setToken} />
      <GenelHataMesaji kind={genelHata} />
      <Button type="submit" disabled={submitting}>
        {submitting ? tc('yukleniyor') : tc('teklifAl')}
      </Button>
    </form>
  );
}
