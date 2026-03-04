import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/student/ProfileForm";
import { PasswordForm } from "@/components/student/PasswordForm";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-brand-secondary">
        პროფილი
      </h1>
      <p className="mt-1 text-sm text-brand-muted">
        მართე შენი ანგარიშის მონაცემები
      </p>

      <div className="mt-8 space-y-6">
        <ProfileForm
          defaultName={user?.user_metadata?.name ?? ""}
          defaultAvatarUrl={user?.user_metadata?.avatar_url ?? ""}
          email={user?.email ?? ""}
        />
        <PasswordForm />
      </div>
    </div>
  );
}
