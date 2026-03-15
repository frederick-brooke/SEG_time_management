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
  onAvatarClick?: (username: string) => void;
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

function SenderAvatar({
  src,
  username,
  onClick,
}: {
  src: string | null;
  username: string;
  onClick?: () => void;
}) {
  if (src)
    return (
      <img
        src={src}
        alt={username}
        onClick={onClick}
        className="w-7 h-7 rounded-full object-cover flex-shrink-0"
        style={{ cursor: onClick ? "pointer" : "default" }}
      />
    );
  return (
    <div
      onClick={onClick}
      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
      style={{
        background: "linear-gradient(135deg, rgba(88,101,242,0.5), rgba(139,92,246,0.5))",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <span className="text-xs font-semibold" style={{ color: "rgba(220,225,255,0.9)" }}>
        {username?.[0]?.toUpperCase() ?? "?"}
      </span>
    </div>
  );
}

export function MessageBubble({ msg, isMe, isFirst, isLast, showDateDivider, isHovered, onMouseEnter, onMouseLeave, onAvatarClick }: Props) {
  const isOptimistic = msg.id.startsWith("temp-");

  const myRadius = isFirst && isLast ? "rounded-2xl"
    : isFirst ? "rounded-2xl rounded-br-md"
    : isLast ? "rounded-2xl rounded-tr-md"
    : "rounded-2xl rounded-r-md";

  const theirRadius = isFirst && isLast ? "rounded-2xl"
    : isFirst ? "rounded-2xl rounded-bl-md"
    : isLast ? "rounded-2xl rounded-tl-md"
    : "rounded-2xl rounded-l-md";

  return (
    <>
      {showDateDivider && (
        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          <span className="text-xs font-medium px-1" style={{ color: "rgba(148,163,255,0.35)" }}>
            {formatDate(msg.createdAt)}
          </span>
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
        </div>
      )}

      <div
        className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"} ${isFirst ? "mt-1" : "mt-0.5"}`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {!isMe && (
          <div className="w-7 flex-shrink-0 self-end">
            {isLast ? (
              <SenderAvatar
                src={msg.sender.pfp}
                username={msg.sender.username}
                onClick={() => onAvatarClick?.(msg.sender.username)}
              />
            ) : (
              <div className="w-7" />
            )}
          </div>
        )}

        <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[70%]`}>
          {!isMe && isFirst && (
            <span className="text-xs mb-1 ml-1" style={{ color: "rgba(148,163,255,0.45)" }}>
              {msg.sender.username}
            </span>
          )}

          <div className={`flex items-center gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
          <span
            className="text-xs whitespace-nowrap transition-all duration-150"
            style={{
              color: "rgba(148,163,255,0.35)",
              opacity: isHovered ? 1 : 0,
              width: isHovered ? "auto" : 0,
              overflow: "hidden",
              display: "inline-block",
            }}
          >
            {formatTime(msg.createdAt)}
          </span>

            <div
              className={`px-4 py-2 text-sm break-words transition-opacity duration-150 ${isOptimistic ? "opacity-50" : "opacity-100"} ${isMe ? myRadius : theirRadius}`}
              style={isMe ? {
                background: "linear-gradient(135deg, rgba(88,101,242,0.75), rgba(99,111,255,0.65))",
                border: "1px solid rgba(99,111,255,0.3)",
                color: "rgba(230,235,255,0.95)",
                boxShadow: "0 2px 16px rgba(88,101,242,0.15)",
              } : {
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "rgba(200,210,230,0.85)",
              }}
            >
              {msg.content}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}