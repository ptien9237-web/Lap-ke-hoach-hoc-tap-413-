export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponseData {
  token: string;
  user: AuthUser;
}

export interface OfflineMutation {
  clientMutationId: string;
  entity: 'assignment' | 'course';
  action: 'create' | 'update' | 'toggle' | 'delete';
  payload: Record<string, any>;
  createdAt: string;
  retryCount: number;
}

export interface SyncResultItem {
  clientMutationId: string;
  success: boolean;
  status: 'applied' | 'already_applied' | 'failed';
  error?: string;
  serverEntityId?: string;
}

export interface SyncResponseData {
  serverTime: string;
  processedCount: number;
  results: SyncResultItem[];
}
