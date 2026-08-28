"use client";

import { MessageCircle, X } from "lucide-react";

type ChatLauncherProps = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export function ChatLauncher({ isOpen, onOpen, onClose }: ChatLauncherProps) {
  return (
    <button
      type="button"
      aria-label={isOpen ? "Close Covers&All chat" : "Open Covers&All chat"}
      aria-expanded={isOpen}
      aria-controls="coversall-chat-panel"
      onClick={isOpen ? onClose : onOpen}
      className="covers-launcher flex h-16 w-16 items-center justify-center rounded-full bg-[var(--covers-blue)] text-white shadow-[0_10px_30px_rgba(21,80,200,0.45)] transition hover:bg-[var(--covers-blue-dark)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      {isOpen ? (
        <X className="h-7 w-7" strokeWidth={2.25} />
      ) : (
        <MessageCircle className="h-7 w-7" strokeWidth={2.25} />
      )}
    </button>
  );
}
