import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBalance } from "@/lib/credits/manager";
import { prisma } from "@/lib/prisma";
import { ProjectEditor } from "@/components/projects/ProjectEditor";
import type { ProjectNode } from "@/components/projects/types";

export const metadata = {
  title: "პროექტის რედაქტორი - GEO AI Academy",
};

interface ProjectEditorPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectEditorPage({
  params,
}: ProjectEditorPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { projectId } = await params;

  const [project, balance] = await Promise.all([
    prisma.project.findFirst({
      where: { id: projectId, userId: user.id },
    }),
    getBalance(user.id),
  ]);

  if (!project) {
    notFound();
  }

  const nodes = Array.isArray(project.nodes)
    ? (project.nodes as unknown as ProjectNode[])
    : [];

  return (
    <ProjectEditor
      projectId={project.id}
      initialTitle={project.title}
      initialNodes={nodes}
      initialBalance={balance}
    />
  );
}
