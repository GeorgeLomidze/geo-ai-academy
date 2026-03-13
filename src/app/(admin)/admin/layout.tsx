import { redirect } from "next/navigation";
import { AdminNotificationsProvider } from "@/components/layout/AdminNotificationsProvider";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { syncAuthUser } from "@/lib/auth";
import { getAdminNotifications } from "@/lib/qa";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
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

  if (user.user_metadata?.role !== "admin") {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "ADMIN") {
      redirect("/dashboard");
    }
  }

  const notificationData = await getAdminNotifications(12);

  return (
    <AdminNotificationsProvider
      initialNotifications={notificationData.notifications}
      initialUnreadCount={notificationData.unreadCount}
    >
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex flex-1 flex-col">
          <AdminTopbar />
          <main className="flex-1 bg-brand-background p-4 pb-20 sm:p-6 lg:p-8 lg:pb-8">
            {children}
          </main>
        </div>
      </div>
    </AdminNotificationsProvider>
  );
}
