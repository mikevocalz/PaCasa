import React, { createContext, useContext, useRef } from 'react';

const OtpContext = createContext({ value: '', activeIndex: 0 });

/**
 * The code field of the sign-up flow. One real input carries the value, so
 * pasting a code and the keyboard's one-time-code autofill both work; the
 * boxes beside it are simply its visible face.
 */
export function InputOTP({
  value = '',
  onChange,
  maxLength = 6,
  autoFocus,
  autoComplete,
  className = '',
  children,
}) {
  const inputRef = useRef(null);

  return (
    <OtpContext.Provider value={{ value, activeIndex: value.length }}>
      <div className={`flex items-center gap-2 ${className}`} onClick={() => inputRef.current?.focus()}>
        {children}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(event) => onChange?.(event.target.value.replace(/\D/g, '').slice(0, maxLength))}
          inputMode="numeric"
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          maxLength={maxLength}
          aria-label="Código de verificación"
          className="sr-only"
        />
      </div>
    </OtpContext.Provider>
  );
}

export function InputOTPGroup({ className = '', ...props }) {
  return (
    <div
      className={`flex items-center focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent-soft ${className}`}
      {...props}
    />
  );
}

export function InputOTPSlot({ index, className = '' }) {
  const { value, activeIndex } = useContext(OtpContext);
  const filled = index < value.length;

  return (
    <div
      className={`flex h-14 w-11 items-center justify-center border font-display text-xl text-fg ${
        index === activeIndex ? 'border-accent-soft' : 'border-line'
      } ${filled ? 'bg-panel-2' : 'bg-page'} ${className}`}
    >
      {value[index] ?? ''}
    </div>
  );
}

export default InputOTP;