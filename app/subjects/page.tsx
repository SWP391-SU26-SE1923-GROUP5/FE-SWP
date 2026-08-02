import SubjectsDashboardClient from "./SubjectsDashboardClient";
import { getSubjects } from "@/lib/actions/subject.actions";
import { SubjectResponseDto } from "@/types";
import { redirect } from "next/navigation";

export const metadata = {
    title: "Subjects | Smart Store",
    description: "Manage your study subjects and categories",
};

export default async function SubjectsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;
    const page = parseInt(params.page as string || "1", 10);
    const limit = 10;
    const offset = (page - 1) * limit;
    const searchText = (params.query as string) || "";
    
    let subjectsData: SubjectResponseDto = { items: [], totalCount: 0, offset, limit };
    let error = false;

    try {
        subjectsData = await getSubjects({
            offset,
            limit,
            searchTerm: searchText,
            sortBy: "UpdatedAt",
            isDescending: true,
        });
    } catch (e) {
        console.error("Failed to fetch subjects:", e);
        error = true;
    }

    if (error) {
        // Fallback for unauthorized/error
        redirect("/sign-in");
    }

    return (
        <SubjectsDashboardClient 
            initialData={subjectsData} 
            currentPage={page}
            searchText={searchText}
        />
    );
}
