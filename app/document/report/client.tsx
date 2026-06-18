'use client';

import React, { useState } from 'react';
import ReportModal from '@/components/ReportModal';

interface DocumentReportClientProps {
  documentId: string;
  currentUserId: string;
}

export default function DocumentReportClient({
  documentId,
  currentUserId
}: DocumentReportClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50">
      <ReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        documentId={documentId}
        currentUserId={currentUserId}
      />
    </div>
  );
}
