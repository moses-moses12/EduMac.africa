import { apiClient } from '@/lib/api';
import { PaginatedResponse, QueryParams } from './types';

export interface AuditLogItem {
  id: string;
  user?: {
    email: string;
    first_name: string;
    last_name: string;
  };
  action: string;
  object_type?: string;
  model_name?: string;
  object_id?: string;
  ip_address?: string;
  timestamp: string;
  status?: string;
  metadata?: Record<string, any>;
  changes_json?: Record<string, any>;
  details?: Record<string, any>;
}

export const auditService = {
  async getAuditLogs(params?: QueryParams): Promise<PaginatedResponse<AuditLogItem>> {
    const response = await apiClient.get<PaginatedResponse<AuditLogItem>>('/audit/logs/', { params });
    return response.data;
  },
};
