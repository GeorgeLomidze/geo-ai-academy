import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getBalance } from "@/lib/credits/manager"
import { getModelMetadata } from "@/lib/credits/pricing"
import { prisma } from "@/lib/prisma"
import { VideoGenerator } from "@/components/ai/VideoGenerator"
import { AIHistoryItem } from "@/components/ai/types"

export const metadata = {
  title: "ვიდეოს გენერაცია - GEO AI Academy",
}

async function getInitialVideoHistory(userId: string): Promise<AIHistoryItem[]> {
  const generations = await prisma.generation.findMany({
    where: {
      userId,
      type: "VIDEO",
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 36,
    select: {
      id: true,
      modelId: true,
      prompt: true,
      status: true,
      outputUrl: true,
      creditsCost: true,
      createdAt: true,
      sourceUrl: true,
    },
  })

  return generations.map((item) => ({
    id: item.id,
    modelId: item.modelId,
    modelName: getModelMetadata(item.modelId)?.name ?? item.modelId,
    prompt: item.prompt,
    status: item.status,
    outputUrl: item.outputUrl,
    creditsUsed: item.creditsCost,
    createdAt: item.createdAt.toISOString(),
    sourceUrl: item.sourceUrl,
  }))
}

export default async function AIVideoPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const [balance, history] = await Promise.all([
    getBalance(user.id),
    getInitialVideoHistory(user.id),
  ])

  return (
    <VideoGenerator
      initialBalance={balance}
      initialGenerations={history}
    />
  )
}
