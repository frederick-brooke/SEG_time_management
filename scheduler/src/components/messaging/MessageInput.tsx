"use client";

type Props = {
  value: string;
  sending: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSend: () => void;
};

export function MessageInput({ value, sending, onChange, onKeyDown, onSend }: Props) {
  return (
    <div className="border-t border-gray-100 px-4 py-3 flex gap-2 items-center">
      <input
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder="Message..."
        className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-gray-400 transition-colors"
      />
      <button
        onClick={onSend}
        disabled={sending || !value.trim()}
        className={`text-sm font-semibold transition-colors px-2 ${value.trim() && !sending ? "text-blue-500 hover:text-blue-600" : "text-gray-300 cursor-default"}`}
      >
        Send
      </button>
    </div>
  );
}