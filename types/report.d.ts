export interface CreateReportRequestDto {
  userId: string;
  documentId: string;
  reason: string | null;
}

export interface ReportResponseDto {
  id: string;
  userId: string;
  documentId: string;
  reason: string | null;
  createdAt: string;
  updatedAt: string | null;
}
