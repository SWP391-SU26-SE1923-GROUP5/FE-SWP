"use client";

import { useSearchParams } from "next/navigation";
import OtpModal from "@/components/OTPModal";
import { Suspense } from "react";

const OtpVerificationContent = () => {
    const searchParams = useSearchParams();
    const email = searchParams.get("email") || "";

    return (
        <div className="flex min-h-screen w-full items-center justify-center p-4">
            <div className="w-full max-w-lg p-6">
                <OtpModal email={email} />
            </div>
        </div>
    );
};

const VerifyOtpPage = () => {
    return (
        <Suspense fallback={<div className="text-center mt-20">Loading security values...</div>}>
            <OtpVerificationContent />
        </Suspense>
    );
};

export default VerifyOtpPage;