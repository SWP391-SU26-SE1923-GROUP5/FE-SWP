import { getMembershipTiers, getCurrentUserTier } from "@/lib/actions/payment.actions";
import { Check, ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import CheckoutButton from "./CheckoutButton";

export default async function PricingPage() {
    const [tiers, currentUserTier] = await Promise.all([
        getMembershipTiers(),
        getCurrentUserTier()
    ]);

    const isFreePlan = !currentUserTier || currentUserTier.tierName.toLowerCase().includes("free");
    const hasPaidPlan = !isFreePlan;

    return (
        <div className="min-h-screen bg-light-800 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto mb-12">
                <Button variant="ghost" asChild className="flex-start gap-2 text-light-400 hover:text-dark-100 w-fit cursor-pointer">
                    <Link href="/home">
                        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                    </Link>
                </Button>
            </div>

            <div className="text-center max-w-3xl mx-auto mb-16">
                <h1 className="text-4xl font-extrabold text-dark-100 sm:text-5xl tracking-tight mb-4">
                    Unlock your full potential
                </h1>
                <p className="text-lg text-light-400">
                    Choose the perfect workspace plan to expand your storage and generate more AI study materials.
                </p>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                {tiers.map((tier, index) => {
                    const isPopular = index === 1;
                    const isCurrentTier = tier.id === currentUserTier?.tierId;

                    const isUpgradeLocked = hasPaidPlan && !isCurrentTier;

                    return (
                        <div
                            key={tier.id}
                            className={`relative flex flex-col p-8 rounded-[24px] bg-white transition-all duration-300 ${
                                isPopular
                                    ? "ring-2 ring-brand shadow-drop-1 scale-105 z-10"
                                    : "border light-border shadow-sm hover:shadow-md"
                            }`}
                        >
                            {isPopular && (
                                <div className="absolute top-0 inset-x-0 flex justify-center -mt-4">
                                    <span className="flex-center gap-1 bg-brand text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                                        <Sparkles className="h-3 w-3" /> Most Popular
                                    </span>
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-2xl font-bold text-dark-100 mb-2">{tier.tierName}</h3>
                                <p className="text-light-400 text-sm">Perfect for growing your knowledge base.</p>
                            </div>

                            <ul className="flex-1 space-y-4 mb-8">
                                <li className="flex items-start gap-3">
                                    <div className="flex-shrink-0 mt-1">
                                        <Check className="h-5 w-5 text-brand" />
                                    </div>
                                    <span className="text-dark-200">
                                        <strong className="font-semibold text-dark-100">{tier.storageLimitMb} MB</strong> of secure cloud storage
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="flex-shrink-0 mt-1">
                                        <Check className="h-5 w-5 text-brand" />
                                    </div>
                                    <span className="text-dark-200">
                                        <strong className="font-semibold text-dark-100">{tier.aiTokens}</strong> AI generation tokens
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="flex-shrink-0 mt-1">
                                        <Check className="h-5 w-5 text-brand" />
                                    </div>
                                    <span className="text-dark-200">Priority email support</span>
                                </li>
                            </ul>

                            {isCurrentTier ? (
                                <Button disabled className="w-full h-[52px] rounded-full bg-light-300 text-light-400 font-bold opacity-100 cursor-default">
                                    Current Plan
                                </Button>
                            ) : isUpgradeLocked ? (
                                <Button disabled className="w-full h-[52px] rounded-full bg-light-300 text-light-400 font-bold opacity-100 cursor-not-allowed">
                                    Upgrade Unavailable
                                </Button>
                            ) : (
                                <CheckoutButton tierId={tier.id} isPopular={isPopular} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}