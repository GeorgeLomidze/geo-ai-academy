const KIE_CREDIT_URL = "https://api.kie.ai/api/v1/chat/credit";
const LOW_BALANCE_THRESHOLD = 5000;
const ALERT_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
const BALANCE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export type KieBalance = {
  credits: number;
  lowBalance: boolean;
};

let lastAlertTimestamp = 0;
let cachedBalance: { expiresAt: number; balance: KieBalance } | null = null;

export function shouldSendLowBalanceAlert(): boolean {
  return Date.now() - lastAlertTimestamp > ALERT_COOLDOWN_MS;
}

export function markAlertSent(): void {
  lastAlertTimestamp = Date.now();
}

export async function fetchKieBalance(): Promise<KieBalance> {
  if (cachedBalance && cachedBalance.expiresAt > Date.now()) {
    return cachedBalance.balance;
  }

  const apiKey = process.env.KIE_AI_API_KEY;

  if (!apiKey) {
    throw new Error("KIE_AI_API_KEY is not configured");
  }

  const response = await fetch(KIE_CREDIT_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Kie.ai credit API returned ${response.status}`);
  }

  const data = (await response.json()) as {
    code?: number;
    data?: number | { credits?: number; balance?: number };
    credits?: number;
    balance?: number;
  };

  // Kie.ai returns { code: 200, data: 478.3 } — data is a plain number
  const credits =
    (typeof data.data === "number"
      ? data.data
      : data.data?.credits ?? data.data?.balance ?? undefined) ??
    data.credits ??
    data.balance ??
    0;

  const result: KieBalance = {
    credits: Math.round(credits),
    lowBalance: credits < LOW_BALANCE_THRESHOLD,
  };

  cachedBalance = { expiresAt: Date.now() + BALANCE_CACHE_TTL_MS, balance: result };

  return result;
}
