import { redirect } from 'next/navigation';
import { getCurrentUser } from "@/lib/actions/user.actions";
import DocumentReportClient from './client';

interface DocumentData {
  id: string;
  ownerId: string;
  title?: string;
  [key: string]: any;
}

export default async function DocumentReportPage({
  searchParams
}: {
  searchParams: { documentId?: string };
}) {
  const currentUser = await getCurrentUser();
  const documentId = searchParams.documentId || '';

  if (!currentUser) {
    redirect("/sign-in");
  }

  if (!documentId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">Document not found for reporting</p>
        </div>
      </div>
    );
  }

  let documentOwnerId: string | null = null;
  let fetchError: string | null = null;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/Document/${documentId}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const document: DocumentData = await response.json();
      documentOwnerId = document.ownerId;

      if (currentUser.$id === document.ownerId) {
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4">⛔</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Cannot Report</h1>
              <p className="text-gray-600 mb-6">You cannot report your own documents.</p>
              <button
                onClick={() => window.history.back()}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-all"
              >
                Go Back
              </button>
            </div>
          </div>
        );
      }
    } else {
      fetchError = 'Unable to load document information';
    }
  } catch (error) {
    console.error('Fetch document error:', error);
    fetchError = 'An error occurred while loading the document';
  }

  if (fetchError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{fetchError}</p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <DocumentReportClient
      documentId={documentId}
      currentUserId={currentUser.$id || ''}
    />
  );
}
