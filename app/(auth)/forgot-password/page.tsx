import { Metadata } from "next";
import ForgotPasswordForm from "@/components/forms/ForgotPasswordForm";

export const metadata: Metadata = {
    title: "Forgot Password | AIStudyHub",
    description: "Recover your AIStudyHub account password securely.",
};

const ForgotPasswordPage = () => {
    return <ForgotPasswordForm />;
};

export default ForgotPasswordPage;