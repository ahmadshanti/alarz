/* Admin panel branding (login screen logo + nav icon). Plain <img>: these render inside Payload's UI. */
/* eslint-disable @next/next/no-img-element */

export function Logo() {
  return <img src="/logo.svg" alt="Al-Arz" className="graphic-logo" />;
}

export function Icon() {
  return <img src="/favicon.svg" alt="Al-Arz" className="graphic-icon" />;
}
