// services/auditor/index.ts
export { auditorService, default } from '@services/auditor/auditorService';
export type { 
  AuditableItem, 
  AuditRequest, 
  AuditResponse,
  GetByBranchResponse 
} from '@services/auditor/auditorService';
