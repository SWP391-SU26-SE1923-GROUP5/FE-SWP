/**
 * Report Types - For Admin Management
 */

export interface ReportResponseDto {
  id: string;
  userId: string;
  documentId: string;
  reason: string | null;
  status: 'Pending' | 'Reviewed' | 'Resolved' | 'Rejected';
  createdAt: string;
  updatedAt: string | null;
}

export interface ReportWithDetails extends ReportResponseDto {
  user?: {
    $id: string;
    email: string;
    fullName: string;
    avatar?: string;
  };
  document?: {
    id: string;
    title: string;
    ownerId: string;
    owner?: {
      $id: string;
      email: string;
      fullName: string;
    };
  };
}

export interface UpdateReportRequestDto {
  status: 'Pending' | 'Reviewed' | 'Resolved' | 'Rejected';
  notes?: string;
}

export interface ReportFilterParams {
  status?: 'Pending' | 'Reviewed' | 'Resolved' | 'Rejected';
  documentId?: string;
  userId?: string;
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
