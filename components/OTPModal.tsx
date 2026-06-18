"use client"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {toast} from "sonner"

import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp"
import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { resendOtp, verifyOtp } from "@/lib/actions/user.actions";

const OtpModal = ({ email }: {email: string}) => {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(true);
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await verifyOtp({ email, otp: password });
            toast.success("Account Verification Successful!");
            router.push("/sign-in");
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("An unexpected error occurred.");
            }
        } finally {
            setIsLoading(false);
        }
    }

    const handleResendOtp = async () => {
        try {
            await resendOtp({ email });
            toast.success("OTP resent successfully.");
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("Failed to resend verification code. Please try again.");
            }
        }
    }

    const handleClose = () => {
        setIsOpen(false);
        router.push("/sign-up");
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => {
            if (!open) handleClose();
        }}>
            <AlertDialogContent className="shad-alert-dialog">
                <AlertDialogHeader className="relative flex-col items-center">
                    <AlertDialogTitle className="h2 text-center w-full relative">
                        <p>Enter your OTP</p>
                        <Image src="/assets/icons/close-dark.svg"
                               alt="close"
                               width={20}
                               height={20}
                               onClick={handleClose}
                               className="otp-close-button top-0.5 right-1 cursor-pointer"
                        />
                    </AlertDialogTitle>
                    <AlertDialogDescription className="subtitle-2 text-center text-light-100">
                        We&#39;ve sent a code to <span className="pl-1 text-brand">{email}</span>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="flex flex-col items-center justify-center gap-4">
                    <InputOTP maxLength={6} value={password} onChange={setPassword}>
                        <InputOTPGroup className="shad-otp">
                            <InputOTPSlot index={0} className="shad-otp-slot"/>
                            <InputOTPSlot index={1} className="shad-otp-slot"/>
                            <InputOTPSlot index={2} className="shad-otp-slot"/>
                            <InputOTPSlot index={3} className="shad-otp-slot"/>
                            <InputOTPSlot index={4} className="shad-otp-slot"/>
                            <InputOTPSlot index={5} className="shad-otp-slot"/>
                        </InputOTPGroup>
                    </InputOTP>
                </div>

                <AlertDialogFooter>
                    <div className="flex w-full flex-col gap-4">
                        <AlertDialogAction
                            onClick={handleSubmit}
                            className="shad-submit-btn h-12 cursor-pointer"
                            type="button"
                            disabled={isLoading || password.length < 6}
                        >
                            <p>Submit</p>
                            {isLoading && (
                                <Image
                                    src="/assets/icons/loader.svg"
                                    alt="loader"
                                    width={24}
                                    height={24}
                                    className="animate-spin ml-2"
                                />
                            )}
                        </AlertDialogAction>

                        <div className="subtitle-2 text-center text-light-100">
                            <p>Didn&#39;t get a code?</p>
                            <Button type="button" variant="link" className="pl-1 text-brand cursor-pointer" onClick={handleResendOtp}>
                                Click to resend
                            </Button>
                        </div>
                    </div>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
export default OtpModal