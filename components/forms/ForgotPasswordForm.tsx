"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, KeyRound, Mail, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import {
    ForgotPasswordEmailSchema,
    ForgotPasswordOtpSchema,
    ResetPasswordSchema,
} from "@/lib/validations";
import ROUTES from "@/constants/routes";
import { forgotPassword, resetPassword, verifyPasswordResetOtp } from "@/lib/actions/user.actions";

type StepType = "EMAIL" | "OTP" | "RESET" | "SUCCESS";

const ForgotPasswordForm = () => {
    const router = useRouter();
    const [step, setStep] = useState<StepType>("EMAIL");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const emailForm = useForm<z.infer<typeof ForgotPasswordEmailSchema>>({
        resolver: zodResolver(ForgotPasswordEmailSchema),
        defaultValues: { email: "" }
    });

    const otpForm = useForm<z.infer<typeof ForgotPasswordOtpSchema>>({
        resolver: zodResolver(ForgotPasswordOtpSchema),
        defaultValues: { otp: "" }
    });

    const resetForm = useForm<z.infer<typeof ResetPasswordSchema>>({
        resolver: zodResolver(ResetPasswordSchema),
        defaultValues: { newPassword: "", confirmPassword: "" }
    });

    const handleEmailSubmit = async (data: z.infer<typeof ForgotPasswordEmailSchema>) => {
        setIsLoading(true);
        try {
            await forgotPassword({ email: data.email });
            setEmail(data.email);
            setStep("OTP");
            toast.success("If the email exists, an OTP has been sent.");
        } catch (error: any) {
            toast.error(error?.message || "Failed to send verification code. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpSubmit = async (data: z.infer<typeof ForgotPasswordOtpSchema>) => {
        setIsLoading(true);
        try {
            await verifyPasswordResetOtp({ email, otp: data.otp });
            setOtp(data.otp);
            setStep("RESET");
            toast.success("OTP verified. Please enter your new password.");
        } catch (error: any) {
            toast.error(error?.message || "Invalid or expired verification code.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetSubmit = async (data: z.infer<typeof ResetPasswordSchema>) => {
        setIsLoading(true);
        try {
            await resetPassword({
                email,
                newPassword: data.newPassword
            });
            setStep("SUCCESS");
            toast.success("Password reset successfully.");
        } catch (error: any) {
            toast.error(error?.message || "Failed to reset password. Please verify your OTP or try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (!email) return;
        try {
            await forgotPassword({ email });
            toast.success("OTP sent successfully to your email.");
        } catch (error: any) {
            toast.error(error?.message || "Failed to resend OTP.");
        }
    };

    if (step === "EMAIL") {
        return (
            <div className="mt-8 space-y-6">
                <div className="flex items-center gap-3 border-b border-light-800 pb-4 dark:border-dark-400">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
                        <Mail className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="paragraph-semibold text-dark100_light900">Reset Your Password</h2>
                        <p className="text-xs text-dark500_light400">Enter your email to receive a verification code.</p>
                    </div>
                </div>

                <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="paragraph-medium text-dark400_light700">
                            Email Address
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            {...emailForm.register("email")}
                            className="paragraph-regular background-light900_dark300 light-border-2 text-dark300_light700 no-focus min-h-12 rounded-1.5 border"
                        />
                        {emailForm.formState.errors.email && (
                            <p className="text-sm font-medium text-destructive">
                                {emailForm.formState.errors.email.message}
                            </p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="primary-gradient paragraph-medium min-h-12 w-full rounded-2 px-4 py-3 font-inter !text-light-900 cursor-pointer"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <Image src="/assets/icons/loader.svg" alt="loader" width={20} height={20} className="animate-spin" />
                                Sending Code...
                            </span>
                        ) : (
                            "Send Verification Code"
                        )}
                    </Button>

                    <div className="text-center pt-2">
                        <Link
                            href={ROUTES.SIGN_IN}
                            className="inline-flex items-center gap-2 text-sm font-medium text-dark400_light700 hover:text-primary-500 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Sign In
                        </Link>
                    </div>
                </form>
            </div>
        );
    }

    if (step === "OTP") {
        return (
            <div className="mt-8 space-y-6">
                <div className="flex items-center gap-3 border-b border-light-800 pb-4 dark:border-dark-400">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
                        <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="paragraph-semibold text-dark100_light900">Verify Your Email</h2>
                        <p className="text-xs text-dark500_light400">
                            Code sent to <span className="font-semibold text-primary-500">{email}</span>
                        </p>
                    </div>
                </div>

                <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="space-y-6">
                    <div className="flex flex-col items-center justify-center space-y-4 py-2">
                        <Label className="paragraph-medium text-dark400_light700 text-center">
                            Enter the 6-digit code
                        </Label>
                        <InputOTP
                            maxLength={6}
                            value={otpForm.watch("otp")}
                            onChange={(val) => otpForm.setValue("otp", val, { shouldValidate: true })}
                        >
                            <InputOTPGroup className="shad-otp">
                                <InputOTPSlot index={0} className="shad-otp-slot" />
                                <InputOTPSlot index={1} className="shad-otp-slot" />
                                <InputOTPSlot index={2} className="shad-otp-slot" />
                                <InputOTPSlot index={3} className="shad-otp-slot" />
                                <InputOTPSlot index={4} className="shad-otp-slot" />
                                <InputOTPSlot index={5} className="shad-otp-slot" />
                            </InputOTPGroup>
                        </InputOTP>
                        {otpForm.formState.errors.otp && (
                            <p className="text-sm font-medium text-destructive text-center">
                                {otpForm.formState.errors.otp.message}
                            </p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading || otpForm.watch("otp")?.length < 6}
                        className="primary-gradient paragraph-medium min-h-12 w-full rounded-2 px-4 py-3 font-inter !text-light-900 cursor-pointer"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <Image src="/assets/icons/loader.svg" alt="loader" width={20} height={20} className="animate-spin" />
                                Verifying...
                            </span>
                        ) : (
                            "Verify Code"
                        )}
                    </Button>

                    <div className="flex flex-col items-center gap-3 pt-2 text-sm">
                        <div className="text-dark400_light700">
                            Didn&#39;t get a code?{" "}
                            <button
                                type="button"
                                onClick={handleResendOtp}
                                className="paragraph-semibold primary-text-gradient cursor-pointer hover:underline"
                            >
                                Click to resend
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => setStep("EMAIL")}
                            className="inline-flex items-center gap-2 text-xs text-dark500_light400 hover:text-primary-500 transition-colors"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Change email address
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    if (step === "RESET") {
        return (
            <div className="mt-8 space-y-6">
                <div className="flex items-center gap-3 border-b border-light-800 pb-4 dark:border-dark-400">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
                        <KeyRound className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="paragraph-semibold text-dark100_light900">Create New Password</h2>
                        <p className="text-xs text-dark500_light400">Must be at least 12 characters without whitespace.</p>
                    </div>
                </div>

                <form onSubmit={resetForm.handleSubmit(handleResetSubmit)} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="newPassword" className="paragraph-medium text-dark400_light700">
                            New Password
                        </Label>
                        <Input
                            id="newPassword"
                            type="password"
                            placeholder="••••••••••••"
                            {...resetForm.register("newPassword")}
                            className="paragraph-regular background-light900_dark300 light-border-2 text-dark300_light700 no-focus min-h-12 rounded-1.5 border"
                        />
                        {resetForm.formState.errors.newPassword && (
                            <p className="text-sm font-medium text-destructive">
                                {resetForm.formState.errors.newPassword.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="paragraph-medium text-dark400_light700">
                            Confirm New Password
                        </Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="••••••••••••"
                            {...resetForm.register("confirmPassword")}
                            className="paragraph-regular background-light900_dark300 light-border-2 text-dark300_light700 no-focus min-h-12 rounded-1.5 border"
                        />
                        {resetForm.formState.errors.confirmPassword && (
                            <p className="text-sm font-medium text-destructive">
                                {resetForm.formState.errors.confirmPassword.message}
                            </p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="primary-gradient paragraph-medium min-h-12 w-full rounded-2 px-4 py-3 font-inter !text-light-900 cursor-pointer mt-2"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <Image src="/assets/icons/loader.svg" alt="loader" width={20} height={20} className="animate-spin" />
                                Updating Password...
                            </span>
                        ) : (
                            "Reset Password"
                        )}
                    </Button>
                </form>
            </div>
        );
    }

    return (
        <div className="mt-8 flex flex-col items-center justify-center space-y-6 text-center py-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 animate-bounce">
                <CheckCircle2 className="h-10 w-10" />
            </div>
            <div className="space-y-2">
                <h3 className="h3-bold text-dark100_light900">Password Reset Successfully!</h3>
                <p className="paragraph-regular text-dark500_light400 max-w-sm">
                    Your account security has been updated. You can now use your new password to access your AIStudyHub dashboard.
                </p>
            </div>
            <Button
                onClick={() => router.push(ROUTES.SIGN_IN)}
                className="primary-gradient paragraph-medium min-h-12 w-full max-w-xs rounded-2 px-6 py-3 font-inter !text-light-900 cursor-pointer"
            >
                Continue to Sign In
            </Button>
        </div>
    );
};

export default ForgotPasswordForm;