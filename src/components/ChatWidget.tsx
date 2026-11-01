import React, { useEffect, useRef, useState } from 'react';
import { WELCOME_MESSAGE, PROMPT_QUESTION, GREETING } from '../lib/chat/prompts';
import Turnstile from './Turnstile';

export interface ChatWidgetProps {
  className?: string;
  siteKey?: string;
}

interface ChatMessageView {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_QUESTIONS = [
  'What projects does SnapLabs build?',
  'Who built RERA Sentinel?',
  'Is Family Vault available yet?',
  'What does TV Show Tracker do?',
];

const EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';

export default function ChatWidget({ className = '', siteKey }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [verified, setVerified] = useState(() => !siteKey);
  const [resetSignal, setResetSignal] = useState(0);

  const [messages, setMessages] = useState<ChatMessageView[]>(() => [
    { role: 'assistant', content: siteKey ? WELCOME_MESSAGE : GREETING },
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll to the latest message.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open, verified]);

  // Lock body scroll on mobile when chat is open to prevent background scrolling
  useEffect(() => {
    if (open) {
      const isMobile = window.innerWidth < 640;
      if (isMobile) {
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
          document.body.style.overflow = prev;
        };
      }
    }
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // Abort any in-flight request when the panel closes or unmounts.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  function handleTurnstileSuccess(token: string) {
    setTurnstileToken(token);
    setVerified(true);
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: PROMPT_QUESTION },
    ]);
  }

  async function send(text: string) {
    const query = text.trim();
    if (!query || streaming || !verified) return;
    setError(null);
    setInput('');
    const nextMessages: ChatMessageView[] = [...messages, { role: 'user', content: query }];
    setMessages([...nextMessages, { role: 'assistant', content: '' }]);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(turnstileToken ? { 'cf-turnstile-token': turnstileToken } : {}),
        },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
          turnstileToken: turnstileToken ?? undefined,
        }),
        signal: controller.signal,
      });

      if (res.status === 403) {
        setResetSignal((s) => s + 1);
        setVerified(false);
        setTurnstileToken(null);
        throw new Error('Security verification failed. Please try again.');
      }

      if (!res.ok || !res.body) {
        throw new Error(`request failed: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantText = '';
      let isDone = false;
      while (!isDone) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === '[DONE]') {
            isDone = true;
            break;
          }
          try {
            const event = JSON.parse(payload) as { type?: string; text?: string };
            if (event.type === 'status' && event.text) {
              setMessages([...nextMessages, { role: 'assistant', content: event.text }]);
            } else if (event.type === 'delta' && event.text) {
              assistantText += event.text;
              setMessages([...nextMessages, { role: 'assistant', content: assistantText }]);
            } else if (event.type === 'replace' && event.text) {
              assistantText = event.text;
              setMessages([...nextMessages, { role: 'assistant', content: assistantText }]);
            }
          } catch {
            // Ignore malformed SSE lines.
          }
        }
      }
      if (!assistantText) {
        setMessages([
          ...nextMessages,
          {
            role: 'assistant',
            content: 'Something went wrong. Try again, or email contact@snaplabs.tech.',
          },
        ]);
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError('Something went wrong. Try again, or email contact@snaplabs.tech.');
      setMessages(nextMessages);
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  }

  return (
    <>
      {/* Chat Panel: Full-screen modal on mobile (100dvh), floating card on desktop */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-[#09090b] sm:bg-[#121216]/80 sm:backdrop-blur-[16px] sm:shadow-2xl sm:shadow-black/70 sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[540px] sm:w-[400px] sm:max-w-sm sm:rounded-2xl sm:border sm:border-white/[0.08] motion-safe:animate-[chat-in_220ms] motion-reduce:animate-none overflow-hidden h-[100dvh] sm:h-[540px]"
          style={{ animationTimingFunction: EASE }}
          role="dialog"
          aria-modal="true"
          aria-label="Ask about SnapLabs projects"
        >
          {/* Header with Safe Area Inset Support */}
          <div
            className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4 bg-[#09090b]/80 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none"
            style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top, 0px))' }}
          >
            <div>
              <div className="tag-line !text-[10px]">Ask about our projects</div>
              <div className="mt-1 font-serif text-xl sm:text-lg font-normal text-white">SnapLabs Assistant</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-400 sm:text-zinc-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                online
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="flex h-10 w-10 sm:h-auto sm:w-auto items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] sm:bg-transparent px-3 py-1.5 font-mono text-xs sm:text-[10px] text-zinc-300 sm:text-zinc-400 hover:border-white/25 hover:text-white active:scale-95 transition-all"
                style={{ transitionDuration: '200ms', transitionTimingFunction: EASE }}
              >
                <span className="sm:hidden text-sm">✕</span>
                <span className="hidden sm:inline">esc</span>
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4 overscroll-contain"
          >
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={
                    m.role === 'user'
                      ? 'max-w-[85%] rounded-2xl rounded-br-sm bg-[#e11d48]/15 border border-[#e11d48]/30 px-3.5 py-2.5 text-xs leading-relaxed text-zinc-100'
                      : 'max-w-[85%] rounded-2xl rounded-bl-sm bg-white/[0.04] border border-white/[0.06] px-3.5 py-2.5 text-xs leading-relaxed text-zinc-300'
                  }
                >
                  {m.content || (streaming && i === messages.length - 1 ? (
                    <span className="font-mono text-zinc-500">···</span>
                  ) : (
                    ''
                  ))}
                </div>
              </div>
            ))}

            {/* Turnstile verification indicator */}
            {!verified && siteKey && (
              <div className="flex flex-col gap-2 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-[11px] font-mono text-zinc-400">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                  <span>Verifying session security…</span>
                </div>
                <Turnstile
                  siteKey={siteKey}
                  onToken={handleTurnstileSuccess}
                  onError={() => setError('Security verification failed. Please refresh the page.')}
                  onExpire={() => {
                    setVerified(false);
                    setTurnstileToken(null);
                    setResetSignal((s) => s + 1);
                  }}
                  resetSignal={resetSignal}
                  className="mt-1"
                />
              </div>
            )}

            {error && (
              <div className="font-mono text-[10px] text-amber-400/90">{error}</div>
            )}
          </div>

          {/* Quick Questions Carousel */}
          {verified && (
            <div className="flex gap-2 overflow-x-auto border-t border-white/[0.06] px-4 py-2.5 [scrollbar-width:none] touch-pan-x overscroll-contain">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void send(q)}
                  disabled={streaming}
                  className="whitespace-nowrap rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] sm:text-[10px] text-zinc-300 sm:text-zinc-400 transition-all hover:border-[#e11d48]/50 hover:text-white active:scale-95 disabled:opacity-40"
                  style={{ transitionDuration: '200ms', transitionTimingFunction: EASE }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Area with Safe Area Bottom Support */}
          <div
            className="flex items-center gap-2 border-t border-white/[0.06] px-4 py-3 bg-[#09090b]/80 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none"
            style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={streaming || !verified}
              placeholder={verified ? 'Ask about a project…' : 'Verifying session…'}
              aria-label="Ask a question about SnapLabs projects"
              enterKeyHint="send"
              autoComplete="off"
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-base sm:text-xs text-zinc-200 placeholder:text-zinc-600 outline-none transition-colors focus:border-[#e11d48]/60 disabled:opacity-50 min-h-[44px]"
              style={{ transitionDuration: '200ms', transitionTimingFunction: EASE }}
            />
            <button
              type="button"
              onClick={() => void send(input)}
              disabled={streaming || !input.trim() || !verified}
              aria-label="Send message"
              className="rounded-xl bg-[#e11d48] px-4 py-2.5 text-xs sm:text-[10px] font-semibold uppercase tracking-widest text-white shadow-md shadow-[#e11d48]/20 transition-all hover:bg-[#be123c] active:scale-95 disabled:opacity-40 min-h-[44px] flex items-center justify-center"
              style={{ transitionDuration: '200ms', transitionTimingFunction: EASE }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Floating Launcher Button */}
      {/* On mobile: visible when chat is closed, hidden when chat is open (so it doesn't obstruct full-screen view) */}
      {/* On desktop: visible in both states, acts as toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close chat' : 'Open chat'}
        aria-expanded={open}
        className={`fixed z-40 h-14 w-14 items-center justify-center rounded-full bg-[#e11d48] text-white shadow-lg shadow-[#e11d48]/30 transition-all hover:bg-[#be123c] active:scale-95 ${
          open ? 'hidden sm:flex' : 'flex'
        } ${className}`}
        style={{
          bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))',
          right: 'calc(1.5rem + env(safe-area-inset-right, 0px))',
          transitionDuration: '200ms',
          transitionTimingFunction: EASE,
        }}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>
    </>
  );
}
