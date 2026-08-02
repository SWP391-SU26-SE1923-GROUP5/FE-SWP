import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { parseStringify } from "@/lib/utils";
import { 
    ISubjectService, 
    Subject, 
    SubjectResponseDto, 
    GetSubjectsProps, 
    CreateSubjectDto, 
    UpdateSubjectDto 
} from "@/types";

const connection_url = process.env.NEXT_PUBLIC_API_URL;

if (!connection_url) {
    throw new Error("Missing NEXT_PUBLIC_API_URL environment variable.");
}

export class LocalSubject implements ISubjectService {
    private async getHeaders() {
        const session = await auth();

        if (!session?.accessToken || session.error === "RefreshAccessTokenError") {
            redirect("/sign-in");
        }

        return {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json'
        };
    }

    private handleError(error: unknown, context: string): never {
        const err = error as Record<string, unknown>;
        if (err && typeof err === 'object' && typeof err.digest === 'string' && err.digest.startsWith('NEXT_REDIRECT')) {
            throw error;
        }
        console.error(`${context} Error:`, error);
        throw error;
    }

    async getSubjects(props?: GetSubjectsProps): Promise<SubjectResponseDto> {
        try {
            const headers = await this.getHeaders();
            const url = new URL(`${connection_url}/api/Subject`);
            
            if (props) {
                if (props.offset !== undefined) url.searchParams.append('Offset', props.offset.toString());
                if (props.limit !== undefined) url.searchParams.append('Limit', props.limit.toString());
                if (props.searchTerm) url.searchParams.append('SearchTerm', props.searchTerm);
                if (props.sortBy) url.searchParams.append('SortBy', props.sortBy);
                if (props.isDescending !== undefined) url.searchParams.append('IsDescending', props.isDescending.toString());
            }

            const res = await fetch(url.toString(), {
                method: 'GET',
                headers,
                cache: 'no-store',
            });

            if (!res.ok) {
                if (res.status === 404 || res.status === 400 || res.status === 403 || res.status === 401) {
                    return { items: [], totalCount: 0, offset: props?.offset || 0, limit: props?.limit || 10 };
                }
                throw new Error(`[${res.status}] Failed to fetch subjects`);
            }

            const data = await res.json() as SubjectResponseDto;
            return parseStringify(data);
        } catch (error) {
            this.handleError(error, "GetSubjects");
        }
    }

    async getSubjectById(id: string): Promise<Subject> {
        try {
            const headers = await this.getHeaders();
            const res = await fetch(`${connection_url}/api/Subject/${id}`, {
                method: 'GET',
                headers,
                cache: 'no-store',
            });

            if (!res.ok) {
                throw new Error(`[${res.status}] Failed to fetch subject`);
            }

            const data = await res.json() as Subject;
            return parseStringify(data);
        } catch (error) {
            this.handleError(error, "GetSubjectById");
        }
    }

    async createSubject(data: CreateSubjectDto): Promise<Subject> {
        try {
            const headers = await this.getHeaders();
            const res = await fetch(`${connection_url}/api/Subject`, {
                method: 'POST',
                headers,
                body: JSON.stringify(data),
                cache: 'no-store',
            });

            if (!res.ok) {
                throw new Error(`[${res.status}] Failed to create subject`);
            }

            const resData = await res.json() as Subject;
            return parseStringify(resData);
        } catch (error) {
            this.handleError(error, "CreateSubject");
        }
    }

    async updateSubject(data: UpdateSubjectDto): Promise<Subject> {
        try {
            const headers = await this.getHeaders();
            const { id, ...updatePayload } = data;
            const res = await fetch(`${connection_url}/api/Subject/${id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(updatePayload),
                cache: 'no-store',
            });

            if (!res.ok) {
                throw new Error(`[${res.status}] Failed to update subject`);
            }

            const resData = await res.json() as Subject;
            return parseStringify(resData);
        } catch (error) {
            this.handleError(error, "UpdateSubject");
        }
    }

    async deleteSubject(id: string): Promise<void> {
        try {
            const headers = await this.getHeaders();
            const res = await fetch(`${connection_url}/api/Subject/${id}`, {
                method: 'DELETE',
                headers,
                cache: 'no-store',
            });

            if (!res.ok) {
                let errorMessage = `[${res.status}] Failed to delete subject`;
                try {
                    const errorData = await res.json();
                    if (errorData?.detail) errorMessage = errorData.detail;
                    else if (errorData?.message) errorMessage = errorData.message;
                    else if (errorData?.title) errorMessage = errorData.title;
                } catch (e) {
                    // Ignore parsing error
                }
                throw new Error(errorMessage);
            }
        } catch (error) {
            this.handleError(error, "DeleteSubject");
        }
    }
}
