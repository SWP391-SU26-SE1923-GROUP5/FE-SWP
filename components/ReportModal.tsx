import React, { useState } from 'react';
import axios from 'axios';
import { CreateReportRequestDto } from '@/types/report';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  currentUserId: string;
}

const REPORT_REASONS = [
  'Inappropriate content',
  'Copyright infringement',
  'Misleading information',
  'Spam or abuse',
  'Harmful content',
  'Other'
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  documentId,
  currentUserId
}) => {
  const [reason, setReason] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!reason.trim()) {
      setErrorMessage('Please enter a report reason');
      return;
    }

    setIsLoading(true);

    try {
      const payload: CreateReportRequestDto = {
        userId: currentUserId,
        documentId: documentId,
        reason: reason.trim()
      };

      const response = await axios.post('/api/Report', payload);

      if (response.status === 200 || response.status === 201) {
        setSuccessMessage('Your report has been sent successfully. Thank you!');
        setReason('');
        
        setTimeout(() => {
          resetForm();
          onClose();
        }, 2000);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.message || 
          'Failed to send report. Please try again.'
        );
      } else {
        setErrorMessage('An error occurred. Please try again.');
      }
      console.error('Report submission error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setReason('');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={handleCancel}
      />

      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
            <h2 className="text-xl font-bold text-white">Report Document</h2>
            <p className="text-red-100 text-sm mt-1">Help us improve content quality</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Report Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please detail why you are reporting this document..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none transition-all"
                rows={4}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                A detailed description will help us process your report faster
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-600 mb-2">Or select one of the reasons:</p>
              <div className="flex flex-wrap gap-2">
                {REPORT_REASONS.map((quickReason) => (
                  <button
                    key={quickReason}
                    type="button"
                    onClick={() => setReason(quickReason)}
                    className={`px-3 py-1 text-xs rounded-full border transition-all ${
                      reason === quickReason
                        ? 'bg-red-500 text-white border-red-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-red-300'
                    }`}
                    disabled={isLoading}
                  >
                    {quickReason}
                  </button>
                ))}
              </div>
            </div>
          </form>

          <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={(e) => {
                const form = e.currentTarget.closest('form');
                if (form) {
                  form.dispatchEvent(new Event('submit', { bubbles: true }));
                }
              }}
              disabled={isLoading}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                'Submit Report'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReportModal;
