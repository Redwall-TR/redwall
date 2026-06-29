'use client';

import { useState } from 'react';
import { submitForm } from '@/app/actions/form-gonderim';
import type { FormGonderimInput } from '@/lib/formRecord';

export type GenelHata = false | 'genel' | 'rate' | 'turnstile';

/**
 * Form gönderim mantığını paylaşır: state (values/errors/submitted/submitting/
 * genelHata), alan değişimi (checkbox dahil), doğrulama + submitForm çağrısı,
 * sonuç dallanması (başarı / alan hataları / rate / genel). Her form yalnız
 * kendi alan düzenini tutar.
 */
export function useFormSubmit<V extends Record<string, unknown>>(opts: {
  initial: V;
  validate: (values: V) => Record<string, string>;
  toInput: (values: V) => FormGonderimInput;
}) {
  const [values, setValues] = useState<V>(opts.initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [genelHata, setGenelHata] = useState<GenelHata>(false);
  const [turnstileToken, setToken] = useState('');

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value, type } = e.target;
    const next = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setValues((prev) => ({ ...prev, [name]: next }));
    if (errors[name])
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = opts.validate(values);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    setGenelHata(false);
    const res = await submitForm({ ...opts.toInput(values), turnstileToken });
    setSubmitting(false);
    if (res.ok) {
      setSubmitted(true);
      setValues(opts.initial);
    } else if (res.errors && !res.errors._genel) {
      setErrors(res.errors);
    } else {
      const code = res.errors?._genel;
      setGenelHata(code === 'rate' || code === 'turnstile' ? code : 'genel');
    }
  }

  return { values, setValues, errors, submitted, submitting, genelHata, setToken, handleChange, handleSubmit };
}
