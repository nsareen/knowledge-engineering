import React, { useEffect, useState } from 'react';
import { FileText, GitBranch, Search, MessageCircle, TrendingUp } from 'lucide-react';
import { graphApi, documentsApi } from '../services/api';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState([
    { name: 'Documents Processed', value: '0', icon: FileText, color: 'text-blue-600' },
    { name: 'Concepts Extracted', value: '0', icon: GitBranch, color: 'text-green-600' },
    { name: 'Entities Identified', value: '0', icon: Search, color: 'text-purple-600' },
    { name: 'Relationships Mapped', value: '0', icon: MessageCircle, color: 'text-orange-600' },
  ]);
  const [loading, setLoading] = useState(true);
  const [recentDocuments, setRecentDocuments] = useState<any[]>([]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [graphStats, documentsResponse] = await Promise.all([
        graphApi.getStats(),
        documentsApi.getAll()
      ]);

      // Calculate stats from graph data
      const documentCount = graphStats.nodeCounts.find((n: any) => n.type === 'Document')?.count || 0;
      const conceptCount = graphStats.nodeCounts.find((n: any) => n.type === 'Concept')?.count || 0;
      const entityCount = graphStats.nodeCounts.find((n: any) => n.type === 'Entity')?.count || 0;
      const relationshipCount = graphStats.totalRelationships || 0;

      setStats([
        { name: 'Documents Processed', value: documentCount.toString(), icon: FileText, color: 'text-blue-600' },
        { name: 'Concepts Extracted', value: conceptCount.toString(), icon: GitBranch, color: 'text-green-600' },
        { name: 'Entities Identified', value: entityCount.toString(), icon: Search, color: 'text-purple-600' },
        { name: 'Relationships Mapped', value: relationshipCount.toString(), icon: MessageCircle, color: 'text-orange-600' },
      ]);

      // Set recent documents for activity feed
      setRecentDocuments(documentsResponse.documents || []);
      
      console.log('Dashboard data loaded:', { graphStats, documentsResponse });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Knowledge Engineering Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Multimodal document analysis and knowledge graph construction
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="card p-6">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${stat.color} bg-opacity-10`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                Loading recent activity...
              </div>
            ) : recentDocuments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No recent activity. Upload your first document to get started.
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-auto">
                {recentDocuments.slice(0, 5).map((doc: any) => (
                  <div key={doc.documentId} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <FileText className="w-8 h-8 text-blue-500" />
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {doc.filename}
                      </p>
                      <p className="text-xs text-gray-500">
                        {doc.status === 'completed' ? 'Processing completed' : 'Processing...'}
                        {doc.extractionStats && (
                          <span className="ml-2">
                            • {doc.extractionStats.concepts} concepts 
                            • {doc.extractionStats.entities} entities
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-xs text-gray-400">
                      {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full btn btn-primary text-left">
              Upload Document
            </button>
            <button className="w-full btn btn-secondary text-left">
              View Knowledge Graph
            </button>
            <button className="w-full btn btn-secondary text-left">
              Search Content
            </button>
            <button className="w-full btn btn-secondary text-left">
              Start Chat Session
            </button>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="mt-8 card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 ${loading ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
            <span className="text-sm text-gray-600">
              {loading ? 'Checking Neo4j...' : 'Neo4j Connected'}
            </span>
          </div>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 ${loading ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
            <span className="text-sm text-gray-600">
              {loading ? 'Checking API...' : 'OpenAI API Ready'}
            </span>
          </div>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 ${
              loading ? 'bg-yellow-500' : 
              recentDocuments.some((doc: any) => doc.status === 'processing') ? 'bg-blue-500' : 'bg-yellow-500'
            }`}></div>
            <span className="text-sm text-gray-600">
              {loading ? 'Checking queue...' : 
               recentDocuments.some((doc: any) => doc.status === 'processing') ? 'Processing Documents' : 'Processing Queue Empty'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;