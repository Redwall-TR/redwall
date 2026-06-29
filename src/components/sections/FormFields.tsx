'use client';

import { useTranslations } from 'next-intl';
import { Turnstile } from '@marsidev/react-turnstile';
import type { GenelHata } from '@/components/sections/useFormSubmit';

// Form alanları için paylaşılan sunum bileşenleri — label + input + hata +
// aria kablolaması tek yerde. 4 form da bunları kullanır (markup tekrarı yok).

const INPUT_CLS =
  'w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary aria-[invalid=true]:border-red-500';

type ChangeHandler = React.ChangeEventHandler<
  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
>;

function FieldShell({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  const t = useTranslations('form');
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label} {required && <span aria-hidden="true">*</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
          {t(error as Parameters<typeof t>[0])}
        </p>
      )}
    </div>
  );
}

interface BaseFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: ChangeHandler;
  error?: string;
  required?: boolean;
  autoComplete?: string;
}

export function TextField({ type = 'text', ...p }: BaseFieldProps & { type?: string }) {
  return (
    <FieldShell id={p.id} label={p.label} required={p.required} error={p.error}>
      <input
        id={p.id}
        name={p.name}
        type={type}
        autoComplete={p.autoComplete}
        value={p.value}
        onChange={p.onChange}
        aria-required={p.required || undefined}
        aria-invalid={!!p.error}
        aria-describedby={p.error ? `${p.id}-err` : undefined}
        className={INPUT_CLS}
      />
    </FieldShell>
  );
}

export function TextareaField({ rows = 4, ...p }: BaseFieldProps & { rows?: number }) {
  return (
    <FieldShell id={p.id} label={p.label} required={p.required} error={p.error}>
      <textarea
        id={p.id}
        name={p.name}
        rows={rows}
        value={p.value}
        onChange={p.onChange}
        aria-required={p.required || undefined}
        aria-invalid={!!p.error}
        aria-describedby={p.error ? `${p.id}-err` : undefined}
        className={INPUT_CLS}
      />
    </FieldShell>
  );
}

export function SelectField({
  children,
  ...p
}: BaseFieldProps & { children: React.ReactNode }) {
  return (
    <FieldShell id={p.id} label={p.label} required={p.required} error={p.error}>
      <select
        id={p.id}
        name={p.name}
        value={p.value}
        onChange={p.onChange}
        aria-required={p.required || undefined}
        aria-invalid={!!p.error}
        aria-describedby={p.error ? `${p.id}-err` : undefined}
        className={INPUT_CLS}
      >
        {children}
      </select>
    </FieldShell>
  );
}

/** Gizli honeypot alanı — botlar doldurursa gönderim sunucuda sessizce yok sayılır. */
export function Honeypot({ value, onChange }: { value: string; onChange: ChangeHandler }) {
  return (
    <input
      type="text"
      name="hp"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
      value={value}
      onChange={onChange}
      className="hidden"
    />
  );
}

export function SuccessBanner() {
  const t = useTranslations('form');
  return (
    <div
      role="alert"
      className="rounded-xl border border-green-200 bg-green-50 px-6 py-8 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
    >
      {t('basarili')}
    </div>
  );
}

export function GenelHataMesaji({ kind }: { kind: GenelHata }) {
  const t = useTranslations('form');
  if (!kind) return null;
  const key = kind === 'rate' ? 'cokFazla' : kind === 'turnstile' ? 'dogrulamaHatasi' : 'genelHata';
  return (
    <p role="alert" className="text-sm text-red-600 dark:text-red-400">
      {t(key)}
    </p>
  );
}

/**
 * Cloudflare Turnstile widget'ı. NEXT_PUBLIC_TURNSTILE_SITE_KEY tanımlı değilse
 * hiçbir şey render etmez (özellik kapalı; form yine çalışır).
 */
export function FormTurnstile({ onToken }: { onToken: (token: string) => void }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) return null;
  return (
    <Turnstile
      siteKey={siteKey}
      options={{ theme: 'auto' }}
      onSuccess={(token) => onToken(token)}
      onExpire={() => onToken('')}
      onError={() => onToken('')}
    />
  );
}
