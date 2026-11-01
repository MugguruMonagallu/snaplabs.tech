import React, { useEffect, useRef, useState } from 'react';
import { GREETING } from '../lib/chat/prompts';

export interface ChatWidgetProps {
  className?: string;
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

export default function ChatWidget({ className = '' }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageView[]>([
    { role: 'assistant', content: GREETING },
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
  }, [messages, open]);

  // Abort any in-flight request when the panel closes or unmounts.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  async function send(text: string) {
    const query = text.trim();
    if (!query || streaming) return;
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
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: controller.signal,
      });
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
        setMessages([...nextMessages, { role: 'assistant', content: 'Something went wrong. Try again, or email contact@snaplabs.tech.' }]);
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
    <div className={`fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 ${className}`}>
      {open && (
        <div
          className="flex h-[520px] w-[calc(100vw-3rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121216]/70 shadow-2xl shadow-black/60 backdrop-blur-[16px] motion-safe:animate-[chat-in_220ms] motion-reduce:animate-none"
          style={{ animationTimingFunction: EASE }}
          role="dialog"
          aria-label="Ask about SnapLabs projects"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <div>
              <div className="tag-line !text-[10px]">Ask about our projects</div>
              <div className="mt-1 font-serif text-lg font-normal text-white">SnapLabs Assistant</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                online
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="rounded-lg border border-white/10 px-2 py-1 font-mono text-[10px] text-zinc-400 transition-all hover:border-white/25 hover:text-white active:scale-95"
                style={{ transitionDuration: '200ms', transitionTimingFunction: EASE }}
              >
                esc
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
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
            {error && (
              <div className="font-mono text-[10px] text-amber-400/90">{error}</div>
            )}
          </div>

          {/* Quick questions */}
          <div className="flex gap-1.5 overflow-x-auto border-t border-white/[0.06] px-4 py-2.5 [scrollbar-width:none]">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => void send(q)}
                disabled={streaming}
                className="whitespace-nowrap rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-[10px] text-zinc-400 transition-all hover:border-[#e11d48]/50 hover:text-white active:scale-95 disabled:opacity-40"
                style={{ transitionDuration: '200ms', transitionTimingFunction: EASE }}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-white/[0.06] px-3 py-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={streaming}
              placeholder="Ask about a project…"
              aria-label="Ask a question about SnapLabs projects"
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none transition-colors focus:border-[#e11d48]/60 disabled:opacity-50"
              style={{ transitionDuration: '200ms', transitionTimingFunction: EASE }}
            />
            <button
              type="button"
              onClick={() => void send(input)}
              disabled={streaming || !input.trim()}
              aria-label="Send message"
              className="rounded-xl bg-[#e11d48] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-white shadow-md shadow-[#e11d48]/20 transition-all hover:bg-[#be123c] active:scale-95 disabled:opacity-40"
              style={{ transitionDuration: '200ms', transitionTimingFunction: EASE }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close chat' : 'Open chat'}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e11d48] text-white shadow-lg shadow-[#e11d48]/25 transition-all hover:bg-[#be123c] active:scale-95"
        style={{ transitionDuration: '200ms', transitionTimingFunction: EASE }}
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
    </div>
  );
}
