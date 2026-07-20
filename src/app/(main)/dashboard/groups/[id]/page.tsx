import { GroupMembersView } from "./_components/group-members-view";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GroupMembersPage({ params }: PageProps) {
  const { id } = await params;
  return <GroupMembersView groupId={Number(id)} />;
}
