'use client';

import { useTranslations } from 'next-intl';
import { validateContact } from '@/lib/form';
import { useFormSubmit } from '@/components/sections/useFormSubmit';
import {
  TextField,
  TextareaField,
  Honeypot,
  SuccessBanner,
  GenelHataMesaji,
  FormTurnstile,
} from '@/components/sections/FormFields';
import { Button } from '@/components/ui';

type FormValues = { ad: string; kurum: string; email: string; telefon: string; mesaj: string; hp: string };
const INITIAL: FormValues = { ad: '', kurum: '', email: '', telefon: '', mesaj: '', hp: '' };

export default function ContactForm() {
  const t = useTranslations('form');
  const tc = useTranslations('common');
  const { values, errors, submitted, submitting, genelHata, setToken, handleChange, handleSubmit } =
    useFormSubmit<FormValues>({
      initial: INITIAL,
      validate: (v) => validateContact(v),
      toInput: (v) => ({ tur: 'iletisim', ...v }),
    });

  if (submitted) return <SuccessBanner />;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <TextField id="cf-ad" name="ad" label={t('ad')} required value={values.ad} onChange={handleChange} error={errors.ad} autoComplete="name" />
      <TextField id="cf-kurum" name="kurum" label={t('kurum')} value={values.kurum} onChange={handleChange} error={errors.kurum} autoComplete="organization" />
      <TextField id="cf-email" name="email" type="email" label={t('email')} required value={values.email} onChange={handleChange} error={errors.email} autoComplete="email" />
      <TextField id="cf-telefon" name="telefon" type="tel" label={t('telefon')} value={values.telefon} onChange={handleChange} error={errors.telefon} autoComplete="tel" />
      <TextareaField id="cf-mesaj" name="mesaj" label={t('mesaj')} required rows={5} value={values.mesaj} onChange={handleChange} error={errors.mesaj} />
      <Honeypot value={values.hp} onChange={handleChange} />
      <FormTurnstile onToken={setToken} />
      <GenelHataMesaji kind={genelHata} />
      <Button type="submit" disabled={submitting}>
        {submitting ? tc('yukleniyor') : tc('gonder')}
      </Button>
    </form>
  );
}
