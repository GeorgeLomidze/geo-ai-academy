import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBalance } from "@/lib/credits/manager";
import { AUDIO_MODELS, getModelMetadata } from "@/lib/credits/pricing";
import { prisma } from "@/lib/prisma";
import { AudioWorkspace } from "@/components/ai/AudioWorkspace";
import type { AIHistoryItem } from "@/components/ai/types";

export const metadata = {
  title: "აუდიო გენერაცია - GEO AI Academy",
};

async function getInitialAudioHistory(userId: string): Promise<AIHistoryItem[]> {
  const audioModelIds = Object.keys(AUDIO_MODELS);

  try {
    const generations = await prisma.generation.findMany({
      where: {
        userId,
        OR: [
          { type: "AUDIO" },
          { modelId: { in: audioModelIds } },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 48,
      select: {
        id: true,
        modelId: true,
        prompt: true,
        status: true,
        outputUrl: true,
        outputText: true,
        outputData: true,
        errorMessage: true,
        creditsCost: true,
        createdAt: true,
        sourceUrl: true,
      },
    });

    return generations.map((item) => ({
      id: item.id,
      modelId: item.modelId,
      modelName: getModelMetadata(item.modelId)?.name ?? item.modelId,
      type: "AUDIO",
      prompt: item.prompt,
      status: item.status,
      outputUrl: item.outputUrl,
      outputText: item.outputText,
      outputData: item.outputData ?? undefined,
      errorMessage: item.errorMessage,
      creditsUsed: item.creditsCost,
      createdAt: item.createdAt.toISOString(),
      sourceUrl: item.sourceUrl,
    }));
  } catch (error) {
    void error;

    const fallbackGenerations = await prisma.generation.findMany({
      where: {
        userId,
        modelId: { in: audioModelIds },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 48,
      select: {
        id: true,
        modelId: true,
        prompt: true,
        status: true,
        outputUrl: true,
        errorMessage: true,
        creditsCost: true,
        createdAt: true,
        sourceUrl: true,
      },
    });

    return fallbackGenerations.map((item) => ({
      id: item.id,
      modelId: item.modelId,
      modelName: getModelMetadata(item.modelId)?.name ?? item.modelId,
      type: "AUDIO",
      prompt: item.prompt,
      status: item.status,
      outputUrl: item.outputUrl,
      outputText: null,
      outputData: undefined,
      errorMessage: item.errorMessage,
      creditsUsed: item.creditsCost,
      createdAt: item.createdAt.toISOString(),
      sourceUrl: item.sourceUrl,
    }));
  }
}

export default async function AudioGeneratorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [balance, history] = await Promise.all([
    getBalance(user.id),
    getInitialAudioHistory(user.id),
  ]);

  return (
    <AudioWorkspace
      initialBalance={balance}
      initialHistory={history}
    />
  );
}
