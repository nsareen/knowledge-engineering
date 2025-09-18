import axios from 'axios';
import { 
  DocumentUploadResponse, 
  SearchRequest, 
  SearchResult,
  QARequest,
  QAResponse 
} from '@knowledge-poc/shared';

const API_BASE = '/api';

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 300000, // 5 minutes for document processing
});

// Request interceptor for logging
apiClient.interceptors.request.use((config) => {
  console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const documentsApi = {
  upload: async (
    file: File, 
    options?: { 
      domain?: string; 
      metamodel?: string; 
      extractionPrompt?: string;
    }
  ): Promise<DocumentUploadResponse> => {
    const formData = new FormData();
    formData.append('document', file);
    
    if (options?.domain) {
      formData.append('domain', options.domain);
    }
    if (options?.metamodel) {
      formData.append('metamodel', options.metamodel);
    }
    if (options?.extractionPrompt) {
      formData.append('extractionPrompt', options.extractionPrompt);
    }

    const response = await apiClient.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getStatus: async (documentId: string) => {
    const response = await apiClient.get(`/documents/${documentId}/status`);
    return response.data;
  },

  getPages: async (documentId: string) => {
    const response = await apiClient.get(`/documents/${documentId}/pages`);
    return response.data;
  },

  getAll: async () => {
    const response = await apiClient.get('/documents');
    return response.data;
  },
};

export const searchApi = {
  search: async (searchRequest: SearchRequest): Promise<{ results: SearchResult[]; totalResults: number }> => {
    const response = await apiClient.post('/search', searchRequest);
    return response.data;
  },

  getSimilarConcepts: async (conceptId: string, limit = 10) => {
    const response = await apiClient.get(`/search/concepts/${conceptId}/similar`, {
      params: { limit }
    });
    return response.data;
  },
};

export const qaApi = {
  ask: async (qaRequest: QARequest): Promise<QAResponse> => {
    const response = await apiClient.post('/qa', qaRequest);
    return response.data;
  },

  getHistory: async () => {
    const response = await apiClient.get('/qa/history');
    return response.data;
  },
};

export const graphApi = {
  getGraph: async (params?: { 
    nodeTypes?: string; 
    limit?: number; 
    documentId?: string;
  }) => {
    const response = await apiClient.get('/graph', { params });
    return response.data;
  },

  getStats: async () => {
    const response = await apiClient.get('/graph/stats');
    return response.data;
  },

  getNode: async (nodeId: string, depth = 1) => {
    const response = await apiClient.get(`/graph/nodes/${nodeId}`, {
      params: { depth }
    });
    return response.data;
  },

  getPath: async (startNodeId: string, endNodeId: string, maxDepth = 5) => {
    const response = await apiClient.get(`/graph/path/${startNodeId}/${endNodeId}`, {
      params: { maxDepth }
    });
    return response.data;
  },
};

export const healthApi = {
  check: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  },
};