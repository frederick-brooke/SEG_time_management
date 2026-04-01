"use client";

/**
 * @file MessageInput.tsx
 * @description Auto-growing textarea input for composing and sending messages.
 * Expands vertically with content up to a max height, then scrolls.
 * The Send button is disabled while a message is in-flight or the input is empty.
 */

import { useEffect, useRef } from "react";
import { Button } from "../ui/Button";

type Props = {
  value: string;
  sending: boolean;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
};

export function MessageInput({ value, sending, onChange, onKeyDown, onSend }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow height as content increases
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <div
      className="px-4 py-3 border-t border-white/[0.05] bg-white/[0.02]"
    >
      <div
        className="flex items-end gap-3 rounded-2xl px-4 py-2.5 bg-white/[0.04] border border-white/[0.08]"
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder="Message..."
          disabled={sending}
          rows={1}
          className="flex-1 bg-transparent outline-none text-sm resize-none overflow-y-auto max-h-[120px] leading-[1.5] text-[rgba(210,220,255,0.85)] caret-[rgba(99,111,255,0.8)]"
        />
        <Button
          onClick={onSend}
          disabled={sending || !value.trim()}
          className={`text-sm font-medium transition-colors disabled:opacity-30 pb-0.5 ${
            value.trim()
              ? "text-[rgba(148,163,255,0.8)] hover:text-[rgba(148,163,255,1)]"
              : "text-[rgba(148,163,255,0.3)]"
          }`}
        >
          Send
        </Button>
      </div>
    </div>
  );
}