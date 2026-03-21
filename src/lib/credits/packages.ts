export type CreditPackage = {
  id: "starter" | "standard" | "premium";
  name: string;
  coins: number;
  bonusCoins: number;
  amount: number;
  currency: "GEL";
  bonusLabel?: string;
  estimatedImages: number;
  estimatedVideos: number;
};

export const CREDIT_PACKAGES = {
  starter: {
    id: "starter",
    name: "სტარტერი",
    coins: 1000,
    bonusCoins: 0,
    bonusLabel: undefined,
    amount: 10,
    currency: "GEL",
    estimatedImages: 250,
    estimatedVideos: 13,
  },
  standard: {
    id: "standard",
    name: "სტანდარტი",
    coins: 2800,
    bonusCoins: 0,
    amount: 25,
    currency: "GEL",
    bonusLabel: "+12% ბონუსი",
    estimatedImages: 700,
    estimatedVideos: 37,
  },
  premium: {
    id: "premium",
    name: "პრემიუმი",
    coins: 6000,
    bonusCoins: 0,
    amount: 50,
    currency: "GEL",
    bonusLabel: "+20% ბონუსი",
    estimatedImages: 1500,
    estimatedVideos: 80,
  },
} as const satisfies Record<string, CreditPackage>;

export function getCreditPackage(packageId: string) {
  return CREDIT_PACKAGES[packageId as keyof typeof CREDIT_PACKAGES] ?? null;
}
