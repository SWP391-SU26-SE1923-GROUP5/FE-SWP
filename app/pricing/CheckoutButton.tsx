"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { createCheckoutSession } from "@/lib/actions/payment.actions";

function SubmitButton({ isPopular }: { isPopular: boolean }) {
    const { pending } = useFormStatus();

    return (
        <Button
            type="submit"
            disabled={pending}
            className={`w-full py-6 text-base font-bold rounded-full transition-all cursor-pointer ${
                isPopular
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-900"
            }`}
        >
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Connecting to VNPAY...
                </>
            ) : (
                "Upgrade Now"
            )}
        </Button>
    );
}

export default function CheckoutButton({ tierId, isPopular }: { tierId: string, isPopular: boolean }) {
    const checkoutAction = createCheckoutSession.bind(null, tierId);

    return (
        <form action={checkoutAction} className="w-full mt-auto">
            <SubmitButton isPopular={isPopular} />
        </form>
    );
}