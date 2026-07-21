// src/navigation/sidebar/sidebar-items.ts
// REPLACES the template's demo navigation (dashboards, mail, chat, auth
// screens...) with this project's navigation, filtered by what the
// logged-in user is allowed to do.
//
// access rules:
//   "all"          -> every authenticated user
//   "super_admin"  -> role.code === "super_admin"
//   "leader"       -> is_group_leader === true
//
// Items point to /dashboard/coming-soon until their screens are built —
// we swap URLs as we implement each milestone.

import {
  Globe,
  LayoutDashboard,
  type LucideIcon,
  MapIcon,
  MapPin,
  Settings,
  ShieldCheck,
  UserPlus,
  Users,
  Wallet,
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
        id: "wallet",
        title: "My Wallet",
        url: "/dashboard/my-wallet",
        icon: Wallet,
        access: "all",
      },
    ],
  },
  {
    id: 2,
    label: "Money",
    items: [
      {
        id: "wallets",
        title: "All Wallets",
        url: "/dashboard/wallets",
        icon: Wallet,
        access: "super_admin",
      },
      {
        id: "wallet-settings",
        title: "Wallet Settings",
        url: "/dashboard/wallets/settings",
        icon: Settings,
        access: "super_admin",
      },
    ],
  },
  {
    id: 3,
    label: "Administration",
    items: [
      {
        id: "groups",
        title: "Groups",
        url: "/dashboard/groups",
        icon: UserPlus,
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
    label: "My Group",
    items: [
      {
        id: "members",
        title: "Members",
        url: "/dashboard/my-group",
        icon: Users,
        access: "leader",
      },
    ],
  },
  // /// geography start

  {
    id: 5,
    label: "Geography",
    items: [
      {
        id: "countries",
        title: "Countries",
        url: "/dashboard/geography/countries",
        icon: Globe,
        access: "super_admin",
      },
      {
        id: "parks",
        title: "Parks",
        url: "/dashboard/geography/parks",
        icon: MapIcon,
        access: "super_admin",
      },
      {
        id: "communities",
        title: "Communities",
        url: "/dashboard/geography/communities",
        icon: MapPin,
        access: "super_admin",
      },
    ],
  },

  // //// geography end
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
