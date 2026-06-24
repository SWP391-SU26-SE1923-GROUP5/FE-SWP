import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { auth } from "@/auth";

type Props = {
    searchParams: Promise<{ [key: string]: string | undefined }>;
};

export default async function VNPayReturnPage({ searchParams }: Props) {
    const params = await searchParams;

    const queryString = new URLSearchParams(params as Record<string, string>).toString();

    const session = await auth();
    let isSuccess = false;
    let errorMessage = "We couldn't complete your payment. Don't worry, no charges were made to your account.";

    try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5171";
        const res = await fetch(`${backendUrl}/api/Payment/vnpay-return?${queryString}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${session?.accessToken}`,
                'Content-Type': 'application/json'
            },
            cache: 'no-store'
        });

        const data = await res.json();

        if (data?.success) {
            isSuccess = true;
        } else {
            errorMessage = data?.message || errorMessage;
        }
    } catch (error) {
        console.error("Backend verification failed:", error);
        errorMessage = "Failed to communicate with the verification server. Please check your dashboard.";
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
            <div
                className={`absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 blur-[120px] opacity-60 pointer-events-none transition-colors duration-1000 ${
                    isSuccess ? 'bg-emerald-200' : 'bg-red-200'
                }`}
            />

            <div className="p-6 sm:px-10 relative z-10 w-full max-w-7xl mx-auto">
                <Button variant="ghost" asChild className="text-slate-500 hover:text-slate-900 rounded-full cursor-pointer">
                    <Link href="/home">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
                    </Link>
                </Button>
            </div>

            <div className="flex-1 flex items-center justify-center p-6 relative z-10 -mt-16">
                <div className="max-w-lg w-full bg-white p-10 sm:p-12 rounded-[2.5rem] shadow-xl border border-slate-100 text-center flex flex-col items-center transform transition-all hover:scale-[1.01] duration-300">

                    {isSuccess ? (
                        <>
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-20"></div>
                                <div className="relative h-20 w-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center ring-8 ring-emerald-50">
                                    <CheckCircle2 className="h-10 w-10" />
                                </div>
                            </div>

                            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Payment Successful</h1>
                            <p className="text-slate-500 text-base mb-8 leading-relaxed">
                                You are all set! Your transaction via VNPAY was completed successfully. Your new storage limits and AI tokens have been instantly applied to your workspace.
                            </p>

                            <Button asChild className="w-full rounded-full py-6 text-base font-semibold bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer shadow-md hover:shadow-lg transition-all">
                                <Link href="/home" className="flex items-center justify-center">
                                    Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </>
                    ) : (
                        <>
                            <div className="relative mb-8">
                                <div className="relative h-20 w-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center ring-8 ring-red-50">
                                    <XCircle className="h-10 w-10" />
                                </div>
                            </div>

                            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Transaction Failed</h1>
                            <p className="text-slate-500 text-base mb-8 leading-relaxed">
                                {errorMessage}
                            </p>

                            <div className="flex flex-col gap-3 w-full">
                                <Button asChild className="w-full rounded-full py-6 text-base font-semibold cursor-pointer shadow-sm hover:shadow-md transition-all">
                                    <Link href="/pricing" className="flex items-center justify-center">
                                        Try Payment Again <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                                <Button asChild variant="ghost" className="w-full rounded-full py-6 text-base font-semibold text-slate-500 hover:text-slate-900 cursor-pointer bg-slate-50 hover:bg-slate-100">
                                    <Link href="/home">
                                        Return to Dashboard
                                    </Link>
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}