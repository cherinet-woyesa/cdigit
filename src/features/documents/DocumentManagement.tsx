import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { type DocumentRecord, type DocumentSearchDto, searchDocuments, uploadDocument, getDocumentById, deleteDocument } from '@services/documentService';
import { useToast } from '@context/ToastContext';

const DocumentManagement: React.FC = () => {
  const { t } = useTranslation();
  const { success, error } = useToast();
  
  // State
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchParams, setSearchParams] = useState<DocumentSearchDto>({
    page: 1,
    pageSize: 10
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    documentType: '',
    referenceNumber: '',
    accountNumber: '',
    tellerId: '',
    customerSegment: ''
  });

  // Load documents
  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const results = await searchDocuments(searchParams);
      setDocuments(results);
      success(t('documents.loaded', 'Documents loaded successfully'));
    } catch (err) {
      console.error('Error loading documents:', err);
      error(t('documents.loadError', 'Failed to load documents'));
    } finally {
      setLoading(false);
    }
  }, [searchParams, t, success, error]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUploadForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle document upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      error(t('documents.selectFile', 'Please select a file to upload'));
      return;
    }

    try {
      const dto = {
        ...uploadForm,
        file: selectedFile
      };
      
      await uploadDocument(dto);
      success(t('documents.uploaded', 'Document uploaded successfully'));
      setUploadForm({
        title: '',
        documentType: '',
        referenceNumber: '',
        accountNumber: '',
        tellerId: '',
        customerSegment: ''
      });
      setSelectedFile(null);
      loadDocuments(); // Refresh the document list
    } catch (err) {
      console.error('Error uploading document:', err);
      error(t('documents.uploadError', 'Failed to upload document'));
    }
  };

  // Handle document deletion
  const handleDelete = async (id: string) => {
    if (window.confirm(t('documents.confirmDelete', 'Are you sure you want to delete this document?'))) {
      try {
        await deleteDocument(id);
        success(t('documents.deleted', 'Document deleted successfully'));
        loadDocuments(); // Refresh the document list
      } catch (err) {
        console.error('Error deleting document:', err);
        error(t('documents.deleteError', 'Failed to delete document'));
      }
    }
  };

  // Load documents on component mount and when search params change
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">{t('documents.title', 'Document Management')}</h1>
      
      {/* Upload Form */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">{t('documents.uploadTitle', 'Upload New Document')}</h2>
        <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('documents.titleLabel', 'Title')}
            </label>
            <input
              type="text"
              name="title"
              value={uploadForm.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('documents.typeLabel', 'Document Type')}
            </label>
            <input
              type="text"
              name="documentType"
              value={uploadForm.documentType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('documents.referenceLabel', 'Reference Number')}
            </label>
            <input
              type="text"
              name="referenceNumber"
              value={uploadForm.referenceNumber}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('documents.accountLabel', 'Account Number')}
            </label>
            <input
              type="text"
              name="accountNumber"
              value={uploadForm.accountNumber}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('documents.tellerLabel', 'Teller ID')}
            </label>
            <input
              type="text"
              name="tellerId"
              value={uploadForm.tellerId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('documents.segmentLabel', 'Customer Segment')}
            </label>
            <select
              name="customerSegment"
              value={uploadForm.customerSegment}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
            >
              <option value="">{t('documents.selectSegment', 'Select Segment')}</option>
              <option value="Retail">{t('documents.retail', 'Retail')}</option>
              <option value="VIP">{t('documents.vip', 'VIP')}</option>
              <option value="Corporate">{t('documents.corporate', 'Corporate')}</option>
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('documents.fileLabel', 'File')}
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              required
            />
          </div>
          
          <div className="md:col-span-2">
            <button
              type="submit"
              className="px-4 py-2 bg-fuchsia-600 text-white rounded-md hover:bg-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
            >
              {t('documents.uploadButton', 'Upload Document')}
            </button>
          </div>
        </form>
      </div>
      
      {/* Search Form */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">{t('documents.searchTitle', 'Search Documents')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('documents.accountLabel', 'Account Number')}
            </label>
            <input
              type="text"
              value={searchParams.accountNumber || ''}
              onChange={(e) => setSearchParams(prev => ({ ...prev, accountNumber: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('documents.referenceLabel', 'Reference Number')}
            </label>
            <input
              type="text"
              value={searchParams.referenceNumber || ''}
              onChange={(e) => setSearchParams(prev => ({ ...prev, referenceNumber: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('documents.tellerLabel', 'Teller ID')}
            </label>
            <input
              type="text"
              value={searchParams.tellerId || ''}
              onChange={(e) => setSearchParams(prev => ({ ...prev, tellerId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
            />
          </div>
          
          <div className="md:col-span-3">
            <button
              onClick={loadDocuments}
              className="px-4 py-2 bg-fuchsia-600 text-white rounded-md hover:bg-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
            >
              {t('documents.searchButton', 'Search')}
            </button>
          </div>
        </div>
      </div>
      
      {/* Documents List */}
      <div className="bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold p-6 pb-0">{t('documents.listTitle', 'Documents')}</h2>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-600 mx-auto"></div>
            <p className="mt-2">{t('documents.loading', 'Loading documents...')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('documents.title', 'Title')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('documents.type', 'Type')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('documents.reference', 'Reference')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('documents.account', 'Account')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('documents.date', 'Date')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('documents.actions', 'Actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {doc.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doc.documentType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doc.referenceNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doc.accountNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        {t('documents.delete', 'Delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {documents.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                {t('documents.noDocuments', 'No documents found')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentManagement;