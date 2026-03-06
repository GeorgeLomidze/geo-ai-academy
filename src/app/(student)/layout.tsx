import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { StudentSidebar } from "@/components/layout/StudentSidebar";
import { syncAuthUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await syncAuthUser(user);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1">
        <StudentSidebar />
        <main className="flex-1 bg-brand-background p-4 pb-20 sm:p-6 sm:pb-20 lg:p-8 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
