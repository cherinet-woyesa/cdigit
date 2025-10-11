import axios from 'axios';

const API_BASE_URL = 'http://localhost:5268/api';

export interface DocumentRecord {
  id: string;
  title: string;
  documentType: string;
  referenceNumber?: string;
  accountNumber?: string;
  tellerId?: string;
  branchId?: string;
  customerSegment?: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  version: number;
  status: string;
  tags?: string;
}

export interface CreateDocumentDto {
  title: string;
  documentType: string;
  referenceNumber?: string;
  accountNumber?: string;
  tellerId?: string;
  branchId?: string;
  customerSegment?: string;
  tags?: string;
  file: File;
}

export interface DocumentSearchDto {
  accountNumber?: string;
  customerName?: string;
  referenceNumber?: string;
  tellerId?: string;
  branchId?: string;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
  page?: number;
  pageSize?: number;
}

export interface DocumentAuditLog {
  id: string;
  documentId: string;
  userId: string;
  action: string;
  timestamp: string;
  deviceId?: string;
  ipAddress?: string;
}

// Document status constants
export const DocumentStatus = {
  Active: 'Active',
  Archived: 'Archived',
  Deleted: 'Deleted',
  Purged: 'Purged'
} as const;

// Document action constants
export const DocumentAction = {
  Create: 'Create',
  View: 'View',
  Edit: 'Edit',
  Delete: 'Delete',
  Download: 'Download',
  Export: 'Export',
  Archive: 'Archive',
  Restore: 'Restore'
} as const;

/**
 * Upload a new document
 * @param dto The document data to upload
 * @returns The created document record
 */
export const uploadDocument = async (dto: CreateDocumentDto): Promise<DocumentRecord> => {
  const formData = new FormData();
  formData.append('title', dto.title);
  formData.append('documentType', dto.documentType);
  if (dto.referenceNumber) formData.append('referenceNumber', dto.referenceNumber);
  if (dto.accountNumber) formData.append('accountNumber', dto.accountNumber);
  if (dto.tellerId) formData.append('tellerId', dto.tellerId);
  if (dto.branchId) formData.append('branchId', dto.branchId.toString());
  if (dto.customerSegment) formData.append('customerSegment', dto.customerSegment);
  if (dto.tags) formData.append('tags', dto.tags);
  formData.append('file', dto.file);

  const response = await axios.post<any>(`${API_BASE_URL}/document/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  const body: any = response.data as any;
  return (body && 'data' in body) ? body.data as DocumentRecord : (response.data as any);
};

/**
 * Get document by ID
 * @param id The document ID
 * @returns The document record
 */
export const getDocumentById = async (id: string): Promise<DocumentRecord> => {
  const response = await axios.get<any>(`${API_BASE_URL}/document/${id}`);
  const body: any = response.data as any;
  return (body && 'data' in body) ? body.data as DocumentRecord : (response.data as any);
};

/**
 * Search documents with filters
 * @param dto The search criteria
 * @returns Array of document records
 */
export const searchDocuments = async (dto: DocumentSearchDto): Promise<DocumentRecord[]> => {
  const response = await axios.post<any>(`${API_BASE_URL}/document/search`, dto);
  const body: any = response.data as any;
  return (body && 'data' in body) ? body.data as DocumentRecord[] : (response.data as any);
};

/**
 * Get document file content
 * @param id The document ID
 * @returns The file blob
 */
export const getDocumentFile = async (id: string): Promise<Blob> => {
  const response = await axios.get(`${API_BASE_URL}/document/${id}/file`, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Get document preview (first page or thumbnail)
 * @param id The document ID
 * @returns The preview blob
 */
export const getDocumentPreview = async (id: string): Promise<Blob> => {
  const response = await axios.get(`${API_BASE_URL}/document/${id}/file`, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Export documents to PDF
 * @param dto The search criteria
 * @returns The PDF blob
 */
export const exportDocumentsToPdf = async (dto: DocumentSearchDto): Promise<Blob> => {
  const response = await axios.post(`${API_BASE_URL}/document/export/pdf`, dto, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Export documents to CSV
 * @param dto The search criteria
 * @returns The CSV blob
 */
export const exportDocumentsToCsv = async (dto: DocumentSearchDto): Promise<Blob> => {
  const response = await axios.post(`${API_BASE_URL}/document/export/csv`, dto, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Export documents to XML
 * @param dto The search criteria
 * @returns The XML blob
 */
export const exportDocumentsToXml = async (dto: DocumentSearchDto): Promise<Blob> => {
  const response = await axios.post(`${API_BASE_URL}/document/export/xml`, dto, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Get document audit logs
 * @param id The document ID
 * @returns Array of audit logs
 */
export const getDocumentAuditLogs = async (id: string): Promise<DocumentAuditLog[]> => {
  const response = await axios.get<any>(`${API_BASE_URL}/document/${id}/audit-logs`);
  const body: any = response.data as any;
  return (body && 'data' in body) ? body.data as DocumentAuditLog[] : (response.data as any);
};

/**
 * Archive a document
 * @param id The document ID
 * @returns The archived document record
 */
export const archiveDocument = async (id: string): Promise<DocumentRecord> => {
  const response = await axios.post<any>(`${API_BASE_URL}/document/${id}/archive`);
  const body: any = response.data as any;
  return (body && 'data' in body) ? body.data as DocumentRecord : (response.data as any);
};

/**
 * Delete a document (soft delete)
 * @param id The document ID
 * @returns Success status
 */
export const deleteDocument = async (id: string): Promise<boolean> => {
  const response = await axios.delete<any>(`${API_BASE_URL}/document/${id}`);
  const body: any = response.data as any;
  return (body && 'success' in body) ? body.success as boolean : false;
};

/**
 * Get document versions
 * @param id The document ID
 * @returns Array of document versions
 */
export const getDocumentVersions = async (id: string): Promise<DocumentRecord[]> => {
  const response = await axios.get<any>(`${API_BASE_URL}/document/${id}/versions`);
  const body: any = response.data as any;
  return (body && 'data' in body) ? body.data as DocumentRecord[] : (response.data as any);
};
