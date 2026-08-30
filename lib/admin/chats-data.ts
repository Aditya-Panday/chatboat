export type ChatFilterTab = "all" | "unassigned" | "resolved";

export type ConversationStatus = "open" | "unassigned" | "resolved";

export type SessionStatus =
  | "AI"
  | "WAITING_FOR_AGENT"
  | "ASSIGNED"
  | "ACTIVE"
  | "CLOSED";

export type ConversationCustomer = {
  name: string;
  initials: string;
  avatarClassName: string;
  status: "online" | "offline";
  source: string;
};

export type Conversation = {
  id: string;
  customer: ConversationCustomer;
  preview: string;
  time: string;
  unreadCount: number;
  status: ConversationStatus;
  sessionStatus: SessionStatus;
  statusLabel: string;
};

export type ChatMessage =
  | {
      id: string;
      type: "date";
      label: string;
    }
  | {
      id: string;
      type: "customer";
      content: string;
      time: string;
    }
  | {
      id: string;
      type: "agent";
      content: string;
      time: string;
      seen: boolean;
    }
  | {
      id: string;
      type: "ai";
      content: string;
      time: string;
    }
  | {
      id: string;
      type: "system";
      content: string;
    }
  | {
      id: string;
      type: "attachment";
      from: "customer" | "agent";
      fileName: string;
      fileSize: string;
      time: string;
    };

export const CHAT_FILTER_TABS: { value: ChatFilterTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unassigned", label: "Unassigned" },
  { value: "resolved", label: "Resolved" },
];

export const CONVERSATIONS: Conversation[] = [
  {
    id: "chat-sarah",
    customer: {
      name: "Sarah Jenkins",
      initials: "SJ",
      avatarClassName: "bg-[var(--covers-blue)] text-white",
      status: "online",
      source: "Online via Web Widget",
    },
    preview: "I'm having trouble with my custom cover order...",
    time: "Just now",
    unreadCount: 1,
    status: "open",
    sessionStatus: "ACTIVE",
    statusLabel: "Active",
  },
  {
    id: "chat-michael",
    customer: {
      name: "Michael Chen",
      initials: "MC",
      avatarClassName: "bg-violet-100 text-violet-700",
      status: "online",
      source: "Online via Web Widget",
    },
    preview: "Can you help me track my shipment?",
    time: "Yesterday",
    unreadCount: 0,
    status: "open",
    sessionStatus: "ASSIGNED",
    statusLabel: "Assigned",
  },
  {
    id: "chat-tech",
    customer: {
      name: "Tech Support",
      initials: "TS",
      avatarClassName: "bg-slate-100 text-slate-600",
      status: "offline",
      source: "Internal channel",
    },
    preview: "API integration issue reported by widget team.",
    time: "Oct 12",
    unreadCount: 3,
    status: "unassigned",
    sessionStatus: "WAITING_FOR_AGENT",
    statusLabel: "Waiting",
  },
  {
    id: "chat-alerts",
    customer: {
      name: "System Alerts",
      initials: "!",
      avatarClassName: "bg-amber-100 text-amber-700",
      status: "offline",
      source: "Automated",
    },
    preview: "Rate limit threshold reached on /v1/users",
    time: "Oct 12",
    unreadCount: 0,
    status: "resolved",
    sessionStatus: "CLOSED",
    statusLabel: "Closed",
  },
  {
    id: "chat-elena",
    customer: {
      name: "Elena Rodriguez",
      initials: "ER",
      avatarClassName: "bg-emerald-100 text-emerald-700",
      status: "offline",
      source: "Online via Web Widget",
    },
    preview: "Thanks for the quick response!",
    time: "Oct 11",
    unreadCount: 0,
    status: "resolved",
    sessionStatus: "CLOSED",
    statusLabel: "Closed",
  },
];

export const CONVERSATION_MESSAGES: Record<string, ChatMessage[]> = {
  "chat-sarah": [
    { id: "d1", type: "date", label: "Today, 10:42 AM" },
    {
      id: "m1",
      type: "customer",
      content:
        "Hi, I'm having trouble with my custom cover order #CA-92841. The dimensions don't seem right.",
      time: "10:42 AM",
    },
    {
      id: "m2",
      type: "ai",
      content:
        "Hello Sarah! I'd be happy to help with your custom cover order. Could you tell me which product you ordered and what dimensions you provided?",
      time: "10:42 AM",
    },
    {
      id: "m3",
      type: "customer",
      content:
        "It's the patio furniture cover. I measured 84\" x 42\" x 36\" but the cover seems too loose.",
      time: "10:43 AM",
    },
    {
      id: "m4",
      type: "system",
      content: "Aditya joined the conversation",
    },
    {
      id: "m5",
      type: "agent",
      content:
        "Hi Sarah, I'm Aditya from Covers&All support. Let me pull up your order details right away.",
      time: "10:45 AM",
      seen: true,
    },
    {
      id: "m6",
      type: "customer",
      content: "Here's a photo of the issue:",
      time: "10:46 AM",
    },
    {
      id: "m7",
      type: "attachment",
      from: "customer",
      fileName: "screenshot_error.png",
      fileSize: "245 KB",
      time: "10:46 AM",
    },
    {
      id: "m8",
      type: "agent",
      content:
        "Thank you for the screenshot. I can see the fit issue. I'll arrange a replacement with adjusted dimensions at no extra cost.",
      time: "10:48 AM",
      seen: false,
    },
  ],
  "chat-michael": [
    { id: "d1", type: "date", label: "Yesterday, 2:15 PM" },
    {
      id: "m1",
      type: "customer",
      content: "Can you help me track my shipment? Order #CA-91002.",
      time: "2:15 PM",
    },
    {
      id: "m2",
      type: "agent",
      content:
        "Hi Michael, your order shipped yesterday via FedEx. Tracking: 7842 9284 1234.",
      time: "2:18 PM",
      seen: true,
    },
  ],
  "chat-tech": [
    { id: "d1", type: "date", label: "Oct 12, 2023" },
    {
      id: "m1",
      type: "system",
      content: "New unassigned chat from widget integration",
    },
    {
      id: "m2",
      type: "customer",
      content: "API integration issue reported by widget team.",
      time: "9:00 AM",
    },
  ],
  "chat-alerts": [
    { id: "d1", type: "date", label: "Oct 12, 2023" },
    {
      id: "m1",
      type: "system",
      content: "Rate limit threshold reached on /v1/users",
    },
  ],
  "chat-elena": [
    { id: "d1", type: "date", label: "Oct 11, 2023" },
    {
      id: "m1",
      type: "customer",
      content: "Thanks for the quick response!",
      time: "4:30 PM",
    },
    {
      id: "m2",
      type: "agent",
      content: "You're welcome, Elena! Let us know if you need anything else.",
      time: "4:32 PM",
      seen: true,
    },
  ],
};

export function filterConversations(
  conversations: Conversation[],
  tab: ChatFilterTab,
  query: string,
): Conversation[] {
  const normalizedQuery = query.trim().toLowerCase();

  return conversations.filter((conversation) => {
    const matchesTab =
      tab === "all" ||
      (tab === "unassigned" && conversation.status === "unassigned") ||
      (tab === "resolved" && conversation.status === "resolved");

    if (!matchesTab) return false;
    if (!normalizedQuery) return true;

    const haystack = [
      conversation.customer.name,
      conversation.preview,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function createAgentMessage(content: string): ChatMessage {
  const now = new Date();
  const time = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return {
    id: `msg-${Date.now()}`,
    type: "agent",
    content,
    time,
    seen: false,
  };
}
