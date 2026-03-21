import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ProjectsGrid } from "@/components/projects/ProjectsGrid";
import type { ProjectSummary } from "@/components/projects/types";

export const metadata = {
  title: "პროექტები - GEO AI Academy",
};

export default async function ProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      thumbnail: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const serialized: ProjectSummary[] = projects.map((p) => ({
    id: p.id,
    title: p.title,
    thumbnail: p.thumbnail,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-6xl">
      <ProjectsGrid initialProjects={serialized} />
    </div>
  );
}
