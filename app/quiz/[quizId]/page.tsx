import { redirect } from "next/navigation";

type Props = {
    params: Promise<{
        quizId: string;
    }>;
};

export default async function LegacyQuizRedirectPage({ params }: Props) {
    const { quizId } = await params;
    redirect(`/quizzes/${quizId}`);
}