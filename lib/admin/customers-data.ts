export type RecentCustomer = {
  id: string;
  name: string;
  email: string;
  role: "Customer" | string;
  initials: string;
  avatarClassName: string;
  blocked: boolean;
};

export const INITIAL_RECENT_CUSTOMERS: RecentCustomer[] = [
  {
    id: "cust-1",
    name: "Sarah Jenkins",
    email: "sarah.jenkins@example.com",
    role: "Customer",
    initials: "SJ",
    avatarClassName: "bg-[var(--covers-blue)] text-white",
    blocked: false,
  },
  {
    id: "cust-2",
    name: "Michael Chen",
    email: "michael.chen@example.com",
    role: "Customer",
    initials: "MC",
    avatarClassName: "bg-violet-100 text-violet-700",
    blocked: false,
  },
  {
    id: "cust-3",
    name: "Laura Cooper",
    email: "laura.cooper@example.com",
    role: "Customer",
    initials: "LC",
    avatarClassName: "bg-emerald-100 text-emerald-700",
    blocked: false,
  },
];

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const AVATAR_CLASSES = [
  "bg-[var(--covers-blue)] text-white",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-orange-100 text-orange-700",
  "bg-rose-100 text-rose-700",
] as const;

export function pickAvatarClass(index: number): string {
  return AVATAR_CLASSES[index % AVATAR_CLASSES.length];
}

export function createCustomerRecord(
  name: string,
  email: string,
  index: number,
): RecentCustomer {
  return {
    id: `cust-${Date.now()}`,
    name,
    email,
    role: "Customer",
    initials: getInitials(name),
    avatarClassName: pickAvatarClass(index),
    blocked: false,
  };
}
