'use client';

import { useTranslations } from 'next-intl';
import { validateDemo } from '@/lib/form';
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
import { Button } from '@/components/ui';
import type { Locale } from '@/types';

type FormValues = { urun: string; ad: string; kurum: string; email: string; mesaj: string; hp: string };
const INITIAL: FormValues = { urun: '', ad: '', kurum: '', email: '', mesaj: '', hp: '' };

const URUN_OPTIONS = [
  { value: 'yanginpro', label: 'YangınPro' },
  { value: 'mekanikpro', label: 'MekanikPro' },
  { value: 'her-ikisi', tr: 'Her ikisi', en: 'Both' },
] as const;

export default function DemoForm({ locale }: { locale: Locale }) {
  const t = useTranslations('form');
  const tc = useTranslations('common');
  const isTr = locale === 'tr';
  const { values, errors, submitted, submitting, genelHata, setToken, handleChange, handleSubmit } =
    useFormSubmit<FormValues>({
      initial: INITIAL,
      validate: (v) => validateDemo(v),
      toInput: (v) => ({ tur: 'demo', ...v }),
    });

  if (submitted) return <SuccessBanner />;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <SelectField id="df-urun" name="urun" label={t('urun')} required value={values.urun} onChange={handleChange} error={errors.urun}>
        <option value="">{isTr ? 'Seçiniz' : 'Select'}</option>
        {URUN_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {'tr' in opt ? (isTr ? opt.tr : opt.en) : opt.label}
          </option>
        ))}
      </SelectField>
      <TextField id="df-ad" name="ad" label={t('ad')} required value={values.ad} onChange={handleChange} error={errors.ad} autoComplete="name" />
      <TextField id="df-kurum" name="kurum" label={t('kurum')} value={values.kurum} onChange={handleChange} error={errors.kurum} autoComplete="organization" />
      <TextField id="df-email" name="email" type="email" label={t('email')} required value={values.email} onChange={handleChange} error={errors.email} autoComplete="email" />
      <TextareaField id="df-mesaj" name="mesaj" label={isTr ? 'İhtiyacınız' : 'Your needs'} value={values.mesaj} onChange={handleChange} error={errors.mesaj} />
      <Honeypot value={values.hp} onChange={handleChange} />
      <FormTurnstile onToken={setToken} />
      <GenelHataMesaji kind={genelHata} />
      <Button type="submit" disabled={submitting}>
        {submitting ? tc('yukleniyor') : tc('gonder')}
      </Button>
    </form>
  );
}
