import { useState } from 'react';
import { Spinner } from './ui.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Customer details form. Validates inline on blur and on submit.
export default function BookingForm({ onSubmit, submitting, serverError }) {
  const [values, setValues] = useState({ name: '', email: '', phone: '', note: '' });
  const [touched, setTouched] = useState({});

  const errors = {
    name: values.name.trim() ? null : 'Please enter your name.',
    email: !values.email.trim()
      ? 'Please enter your email.'
      : EMAIL_RE.test(values.email.trim())
        ? null
        : 'Please enter a valid email address.',
  };
  const isValid = !errors.name && !errors.email;

  function update(field) {
    return (e) => setValues((v) => ({ ...v, [field]: e.target.value }));
  }
  function blur(field) {
    return () => setTouched((t) => ({ ...t, [field]: true }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setTouched({ name: true, email: true });
    if (!isValid) return;
    onSubmit({
      customerName: values.name.trim(),
      customerEmail: values.email.trim(),
      customerPhone: values.phone.trim() || null,
      note: values.note.trim() || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field label="Name" required error={touched.name && errors.name}>
        <input
          type="text"
          value={values.name}
          onChange={update('name')}
          onBlur={blur('name')}
          className={inputClass(touched.name && errors.name)}
          placeholder="Jane Doe"
          autoComplete="name"
        />
      </Field>

      <Field label="Email" required error={touched.email && errors.email}>
        <input
          type="email"
          value={values.email}
          onChange={update('email')}
          onBlur={blur('email')}
          className={inputClass(touched.email && errors.email)}
          placeholder="jane@example.com"
          autoComplete="email"
        />
      </Field>

      <Field label="Phone" hint="optional">
        <input
          type="tel"
          value={values.phone}
          onChange={update('phone')}
          className={inputClass(false)}
          placeholder="(555) 123-4567"
          autoComplete="tel"
        />
      </Field>

      <Field label="Note" hint="optional">
        <textarea
          value={values.note}
          onChange={update('note')}
          rows={3}
          className={inputClass(false)}
          placeholder="Anything we should know before your appointment?"
        />
      </Field>

      {serverError && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting && <Spinner className="h-4 w-4 text-white" />}
        {submitting ? 'Confirming…' : 'Confirm booking'}
      </button>
    </form>
  );
}

function Field({ label, required, hint, error, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
        {hint && <span className="text-slate-400 font-normal"> ({hint})</span>}
      </span>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </label>
  );
}

function inputClass(hasError) {
  return (
    'block w-full rounded-lg border px-3 py-2 text-slate-900 shadow-sm outline-none transition-colors ' +
    'focus:ring-2 focus:ring-brand-200 ' +
    (hasError
      ? 'border-red-400 focus:border-red-500'
      : 'border-slate-300 focus:border-brand-500')
  );
}
