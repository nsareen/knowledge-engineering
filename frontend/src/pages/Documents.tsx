import React, { useState, useRef } from 'react';
import { Upload, FileText, Clock, CheckCircle, AlertCircle, X } from 'lucide-react';
import { documentsApi } from '../services/api';
import { DocumentUploadResponse } from '@knowledge-poc/shared';

const Documents: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<DocumentUploadResponse[]>([]);
  const [domain, setDomain] = useState('');
  const [metamodel, setMetamodel] = useState('');
  const [extractionPrompt, setExtractionPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = async (files: File[]) => {
    for (const file of files) {
      if (!isValidFileType(file)) {
        alert(`${file.name} is not a supported file type. Please upload PDF or PowerPoint files.`);
        continue;
      }
      
      await uploadFile(file);
    }
  };

  const isValidFileType = (file: File): boolean => {
    const supportedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    return supportedTypes.includes(file.type);
  };

  const uploadFile = async (file: File) => {
    try {
      setUploadProgress(0);
      
      const options = {
        domain: domain || undefined,
        metamodel: metamodel || undefined,
        extractionPrompt: extractionPrompt || undefined
      };

      console.log(`Uploading ${file.name}...`);
      
      const response = await documentsApi.upload(file, options);
      
      setUploadedDocuments(prev => [...prev, response]);
      setUploadProgress(null);
      
      console.log(`✅ Upload complete: ${response.filename}`);
      
    } catch (error: any) {
      console.error('Upload failed:', error);
      alert(`Upload failed: ${error.response?.data?.error || error.message}`);
      setUploadProgress(null);
    }
  };

  const clearForm = () => {
    setDomain('');
    setMetamodel('');
    setExtractionPrompt('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
        <p className="mt-2 text-gray-600">
          Upload and process PDF and PowerPoint documents for knowledge extraction
        </p>
      </div>

      {/* Configuration Options */}
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Domain (Optional)</label>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="e.g. healthcare, finance, technology"
            className="input text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Metamodel (Optional)</label>
          <textarea
            value={metamodel}
            onChange={(e) => setMetamodel(e.target.value)}
            placeholder="Provide taxonomy or concept definitions..."
            className="input text-sm h-10 resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Custom Instructions (Optional)</label>
          <textarea
            value={extractionPrompt}
            onChange={(e) => setExtractionPrompt(e.target.value)}
            placeholder="Additional extraction instructions..."
            className="input text-sm h-10 resize-none"
          />
        </div>
      </div>

      {/* Upload Area */}
      <div className="mb-8">
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors relative
            ${isDragging 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-300 bg-white hover:bg-gray-50'
            }
            ${uploadProgress !== null ? 'pointer-events-none opacity-75' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {uploadProgress !== null ? (
            <div className="space-y-4">
              <Clock className="w-12 h-12 mx-auto text-blue-500 animate-spin" />
              <h3 className="text-lg font-medium text-gray-900">Processing Document...</h3>
              <p className="text-gray-500">Converting pages to images and extracting knowledge</p>
              <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs mx-auto">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: '50%' }}></div>
              </div>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Upload Documents
              </h3>
              <p className="text-gray-500 mb-4">
                Drag and drop PDF or PowerPoint files here, or click to browse
              </p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.pptx"
                multiple
                className="hidden"
              />
              <button
                className="btn btn-primary mr-2"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose Files
              </button>
              {(domain || metamodel || extractionPrompt) && (
                <button
                  className="btn btn-secondary"
                  onClick={clearForm}
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Options
                </button>
              )}
              <p className="text-xs text-gray-400 mt-4">
                Supported formats: PDF, PPTX (max 50MB)
                <br />
                Processing uses GPT-4 Vision for multimodal analysis
              </p>
            </>
          )}
        </div>
      </div>

      {/* Documents List */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Processed Documents ({uploadedDocuments.length})
          </h2>
        </div>
        <div className="p-6">
          {uploadedDocuments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No documents uploaded yet</p>
              <p className="text-sm">Upload your first document to see it here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {uploadedDocuments.map((doc) => (
                <div key={doc.documentId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      doc.status === 'completed' ? 'bg-green-100' :
                      doc.status === 'processing' ? 'bg-yellow-100' : 'bg-gray-100'
                    }`}>
                      {doc.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : doc.status === 'processing' ? (
                        <Clock className="w-5 h-5 text-yellow-600" />
                      ) : (
                        <FileText className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{doc.filename}</h3>
                      <p className="text-sm text-gray-500">
                        {doc.totalPages} pages • Status: {doc.status}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">ID: {doc.documentId.slice(0, 8)}...</p>
                    {doc.status === 'completed' && (
                      <button className="text-sm text-primary-600 hover:text-primary-800 mt-1">
                        View Details
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Documents;