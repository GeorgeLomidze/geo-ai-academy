import { createClient } from "@/lib/supabase/server";
import { AdminTopbarProfile } from "@/components/layout/AdminTopbarProfile";
import { prisma } from "@/lib/prisma";

export async function AdminTopbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user
    ? await prisma.user.findUnique({
        where: { id: user.id },
        select: { name: true, avatarUrl: true },
      })
    : null;

  const name = profile?.name ?? user?.user_metadata?.name ?? "ადმინისტრატორი";
  const email = user?.email ?? "";
  const avatarUrl = profile?.avatarUrl ?? undefined;
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-brand-border bg-brand-background px-4 sm:px-6">
      <div />
      <AdminTopbarProfile
        name={name}
        email={email}
        avatarUrl={avatarUrl}
        initials={initials}
      />
    </header>
  );
}
