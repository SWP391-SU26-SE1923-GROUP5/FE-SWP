import { redirect } from "next/navigation";

type Props = { params: Promise<{ flashcardId: string }> };

export default async function LegacyFlashcardRedirectPage({ params }: Props) {
    const { flashcardId } = await params;
    redirect(`/flashcards/${flashcardId}`);
}