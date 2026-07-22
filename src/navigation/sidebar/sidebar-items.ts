// src/navigation/sidebar/sidebar-items.ts
// Project navigation, filtered by what the logged-in user is allowed to
// see. This is the AUTHORITATIVE list — the sidebar renders only the
// filtered result (see filterSidebarItems + app-sidebar.tsx).
//
// access rules:
//   "all"          -> every authenticated user
//   "super_admin"  -> role.code === "super_admin"
//   "leader"       -> is_group_leader === true

import {
  LayoutDashboard,
  type LucideIcon,
  Scale,
  Settings,
  ShieldCheck,
  UserPlus,
  Users,
  Wallet,
  WalletCards,
} from "lucide-react";

import type { AuthUser } from "@/lib/auth/auth-api";

export type NavBadge = "new" | "soon";
export type NavAccess = "all" | "super_admin" | "leader";

export interface NavSubItem {
  id: string;
  title: string;
  url: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
  access?: NavAccess;
}

interface NavItemBase {
  id: string;
  title: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
  access?: NavAccess;
}

export interface NavMainLinkItem extends NavItemBase {
  url: string;
  subItems?: never;
}

export interface NavMainParentItem extends NavItemBase {
  subItems: NavSubItem[];
}

export type NavMainItem = NavMainLinkItem | NavMainParentItem;

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Overview",
    items: [
      {
        id: "dashboard",
        title: "Dashboard",
        url: "/dashboard/default",
        icon: LayoutDashboard,
        access: "all",
      },
      {
        id: "my-wallet",
        title: "My Wallet",
        url: "/dashboard/my-wallet",
        icon: Wallet,
        access: "all",
      },
    ],
  },
  {
    id: 2,
    label: "My Group",
    items: [
      {
        id: "my-group",
        title: "My Group",
        url: "/dashboard/my-group",
        icon: Users,
        access: "leader",
      },
    ],
  },
  {
    id: 3,
    label: "Administration",
    items: [
      {
        id: "group-leaders",
        title: "Group Leaders",
        url: "/dashboard/leaders",
        icon: UserPlus,
        access: "super_admin",
      },
      {
        id: "groups",
        title: "Groups",
        url: "/dashboard/groups",
        icon: Users,
        access: "super_admin",
      },
      {
        id: "roles",
        title: "Roles",
        url: "/dashboard/roles",
        icon: ShieldCheck,
        access: "super_admin",
      },
    ],
  },
  {
    id: 4,
    label: "Money",
    items: [
      {
        id: "wallets",
        title: "All Wallets",
        url: "/dashboard/wallets",
        icon: WalletCards,
        access: "super_admin",
      },
      {
        id: "wallet-settings",
        title: "Wallet Settings",
        url: "/dashboard/wallets/settings",
        icon: Settings,
        access: "super_admin",
      },
      {
        id: "reconciliation",
        title: "Reconciliation",
        url: "/dashboard/wallets/reconciliation",
        icon: Scale,
        access: "super_admin",
      },
    ],
  },
];

// ---- Filtering ----

function canSee(access: NavAccess | undefined, user: AuthUser | null): boolean {
  const rule = access ?? "all";
  if (rule === "all") return true;
  if (!user) return false; // restricted items hidden until the user is known
  if (rule === "super_admin") return user.role?.code === "super_admin";
  return user.is_group_leader; // "leader"
}

export function filterSidebarItems(groups: NavGroup[], user: AuthUser | null): NavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items
        .filter((item) => canSee(item.access, user))
        .map((item) =>
          item.subItems ? { ...item, subItems: item.subItems.filter((sub) => canSee(sub.access, user)) } : item,
        ),
    }))
    .filter((group) => group.items.length > 0);
}
