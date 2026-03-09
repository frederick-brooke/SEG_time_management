"use client";

type Message = {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; username: string; pfp: string | null };
};

type Props = {
  msg: Message;
  isMe: boolean;
  isFirst: boolean;
  isLast: boolean;
  showDateDivider: boolean;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return date.toLocaleDateString([], { weekday: "long" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function Avatar({ src, username }: { src: string | null; username: string }) {
  if (src) return <img src={src} alt={username} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />;
  return (
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center flex-shrink-0">
      <span className="text-white text-xs font-semibold">{username?.[0]?.toUpperCase() ?? "?"}</span>
    </div>
  );
}

export function MessageBubble({ msg, isMe, isFirst, isLast, showDateDivider, isHovered, onMouseEnter, onMouseLeave }: Props) {
  const isOptimistic = msg.id.startsWith("temp-");

  const myRadius = isFirst && isLast ? "rounded-2xl" : isFirst ? "rounded-2xl rounded-br-md" : isLast ? "rounded-2xl rounded-tr-md" : "rounded-2xl rounded-r-md";
  const theirRadius = isFirst && isLast ? "rounded-2xl" : isFirst ? "rounded-2xl rounded-bl-md" : isLast ? "rounded-2xl rounded-tl-md" : "rounded-2xl rounded-l-md";

  return (
    <>
      {showDateDivider && (
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400 font-medium px-1">{formatDate(msg.createdAt)}</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>
      )}
      <div
        className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"} ${isFirst ? "mt-2" : "mt-0.5"}`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {!isMe && (
          <div className="w-7 flex-shrink-0 self-end">
            {isLast ? <Avatar src={msg.sender.pfp} username={msg.sender.username} /> : <div className="w-7" />}
          </div>
        )}
        <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[70%]`}>
          {!isMe && isFirst && (
            <span className="text-xs text-gray-400 mb-1 ml-1">{msg.sender.username}</span>
          )}
          <div className={`flex items-center gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
            <span className={`text-xs text-gray-400 whitespace-nowrap transition-opacity duration-150 ${isHovered ? "opacity-100" : "opacity-0"}`}>
              {formatTime(msg.createdAt)}
            </span>
            <div className={`px-4 py-2 text-sm break-words transition-opacity duration-150 ${isOptimistic ? "opacity-50" : "opacity-100"} ${isMe ? `bg-blue-500 text-white ${myRadius}` : `bg-gray-100 text-gray-800 ${theirRadius}`}`}>
              {msg.content}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}