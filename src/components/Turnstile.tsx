import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

interface TurnstileRenderOptions {
  sitekey: string;
  theme?: 'light' | 'dark' | 'auto';
  callback?: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: () => void;
}

export interface TurnstileProps {
  siteKey: string | undefined;
  onToken: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  resetSignal?: number;
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
}

const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export default function Turnstile({
  siteKey,
  onToken,
  onError,
  onExpire,
  resetSignal = 0,
  theme = 'dark',
  className = '',
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptReady, setScriptReady] = useState(
    () => typeof window !== 'undefined' && !!window.turnstile,
  );

  const onTokenRef = useRef(onToken);
  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // Dynamically load Turnstile script if not already present
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.turnstile) {
      setScriptReady(true);
      return;
    }

    const interval = setInterval(() => {
      if (window.turnstile) {
        setScriptReady(true);
        clearInterval(interval);
      }
    }, 100);

    let script = document.querySelector(`script[src="${TURNSTILE_SRC}"]`) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.src = TURNSTILE_SRC;
      script.async = true;
      script.defer = true;
      script.onerror = () => onErrorRef.current?.();
      document.head.appendChild(script);
    }

    return () => clearInterval(interval);
  }, []);

  // Render widget once script is ready and container is mounted
  useEffect(() => {
    if (!scriptReady || !containerRef.current || !siteKey || !window.turnstile) {
      return;
    }

    if (widgetIdRef.current) return;

    try {
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme,
        callback: (token: string) => onTokenRef.current(token),
        'expired-callback': () => onExpireRef.current?.(),
        'error-callback': () => onErrorRef.current?.(),
      });
    } catch (err) {
      console.error('[Turnstile render error]', err);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore cleanup error
        }
        widgetIdRef.current = null;
      }
    };
  }, [scriptReady, siteKey, theme]);

  // Handle resets
  useEffect(() => {
    if (resetSignal > 0 && widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch {
        // ignore reset error
      }
    }
  }, [resetSignal]);

  if (!siteKey) return null;

  return <div ref={containerRef} className={className} />;
}
