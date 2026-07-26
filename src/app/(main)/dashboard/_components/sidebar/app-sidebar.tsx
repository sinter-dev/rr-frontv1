"use client";

import { useMemo } from "react";

import Image from "next/image";
import Link from "next/link";

import { useShallow } from "zustand/react/shallow";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { APP_CONFIG } from "@/config/app-config";
import { useAuthUser } from "@/hooks/use-auth-user";
import { filterSidebarItems, sidebarItems } from "@/navigation/sidebar/sidebar-items";
// import { rootUser } from "@/data/users";
// import { sidebarItems } from "@/navigation/sidebar/sidebar-items";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
// import { SidebarSupportCard } from "./sidebar-support-card";

// const _data = {
//   navSecondary: [
//     {
//       title: "Settings",
//       url: "#",
//       icon: Settings,
//     },
//     {
//       title: "Get Help",
//       url: "#",
//       icon: CircleHelp,
//     },
//     {
//       title: "Search",
//       url: "#",
//       icon: Search,
//     },
//   ],
//   documents: [
//     {
//       name: "Data Library",
//       url: "#",
//       icon: Database,
//     },
//     {
//       name: "Reports",
//       url: "#",
//       icon: ClipboardList,
//     },
//     {
//       name: "Word Assistant",
//       url: "#",
//       icon: File,
//     },
//   ],
// };

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { sidebarVariant, sidebarCollapsible, isSynced } = usePreferencesStore(
    useShallow((s) => ({
      sidebarVariant: s.sidebarVariant,
      sidebarCollapsible: s.sidebarCollapsible,
      isSynced: s.isSynced,
    })),
  );

  const variant = isSynced ? sidebarVariant : props.variant;
  const collapsible = isSynced ? sidebarCollapsible : props.collapsible;

  const user = useAuthUser();
  const visibleItems = useMemo(() => filterSidebarItems(sidebarItems, user), [user]);

  return (
    <Sidebar {...props} variant={variant} collapsible={collapsible}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link prefetch={false} href="/dashboard/default">
                {/* <Command /> */}
                <Image src="/logo.png" alt={`${APP_CONFIG.name} logo`} width={24} height={24} className="rounded" />
                <span className="font-semibold text-base">{APP_CONFIG.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={visibleItems} />
        {/*<NavMain items={sidebarItems} />*/}
        {/* <NavDocuments items={data.documents} /> */}
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        {/* <SidebarSupportCard /> */}
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
