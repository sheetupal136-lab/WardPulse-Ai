import { apiClient } from './client';
import type { HealthStatus } from '../types/api';

export async function checkBackendHealth(): Promise<HealthStatus> {
  return apiClient<HealthStatus>('/health');
}
