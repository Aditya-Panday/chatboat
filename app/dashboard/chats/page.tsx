import dynamic from "next/dynamic";

const ChatInbox = dynamic(
  () =>
    import("@/components/admin/chats/ChatInbox").then(
      (module) => module.ChatInbox,
    ),
  { loading: () => <ChatInboxSkeleton /> },
);

function ChatInboxSkeleton() {
  return (
    <div className="h-full min-h-[480px] animate-pulse rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="h-full bg-slate-100/70" />
    </div>
  );
}

export default function ChatsPage() {
  return (
    <div className="-mx-4 -my-6 flex h-[calc(100dvh-4rem)] min-h-0 flex-col sm:-mx-6 lg:-mx-8">
      <ChatInbox />
    </div>
  );
}
