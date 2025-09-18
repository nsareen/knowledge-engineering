import React, { useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Filter, RefreshCw } from 'lucide-react';
import { graphApi } from '../services/api';

const GraphView: React.FC = () => {
  const graphRef = useRef<HTMLDivElement>(null);
  const [graphData, setGraphData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [filter, setFilter] = useState<string>('');

  const loadGraphData = async () => {
    setLoading(true);
    try {
      const [graphResponse, statsResponse] = await Promise.all([
        graphApi.getGraph({ 
          nodeTypes: filter || undefined,
          limit: 100 
        }),
        graphApi.getStats()
      ]);
      
      setGraphData(graphResponse);
      setStats(statsResponse);
      console.log('Graph data loaded:', graphResponse);
      console.log('Graph stats:', statsResponse);
    } catch (error) {
      console.error('Failed to load graph data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraphData();
  }, [filter]);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Knowledge Graph</h1>
            <p className="text-gray-600">Interactive visualization of extracted knowledge</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="">All Node Types</option>
              <option value="Concept">Concepts Only</option>
              <option value="Entity">Entities Only</option>
              <option value="Document">Documents Only</option>
            </select>
            
            <button 
              onClick={loadGraphData}
              disabled={loading}
              className="btn btn-secondary"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            <button className="btn btn-secondary">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button className="btn btn-secondary">
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Graph Container */}
      <div className="flex-1 relative">
        <div 
          ref={graphRef} 
          className="w-full h-full bg-gray-50"
          id="graph-container"
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <RefreshCw className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-spin" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Knowledge Graph</h3>
                <p className="text-gray-500">Retrieving extracted knowledge...</p>
              </div>
            </div>
          ) : !graphData || graphData.nodes.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zM13 12a1 1 0 11-2 0 1 1 0 012 0zM20 12a1 1 0 11-2 0 1 1 0 012 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Knowledge Graph Data</h3>
                <p className="text-gray-500 mb-4">Process some documents to see the extracted knowledge</p>
                <button className="btn btn-primary">
                  Upload Documents
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 h-full overflow-auto">
              {/* Temporary data display until Cytoscape is implemented */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
                {/* Nodes Display */}
                <div className="bg-white rounded-lg p-4 overflow-auto">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Extracted Knowledge ({graphData.totalNodes} nodes)
                  </h4>
                  <div className="space-y-2 max-h-96 overflow-auto">
                    {graphData.nodes.map((node: any) => (
                      <div key={node.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{node.properties.name || node.id}</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            node.labels.includes('Concept') ? 'bg-green-100 text-green-800' :
                            node.labels.includes('Entity') ? 'bg-blue-100 text-blue-800' :
                            node.labels.includes('Document') ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {node.labels[0]}
                          </span>
                        </div>
                        {node.properties.definition && (
                          <p className="text-xs text-gray-600 mt-1">{node.properties.definition}</p>
                        )}
                        {node.properties.type && (
                          <p className="text-xs text-gray-500 mt-1">Type: {node.properties.type}</p>
                        )}
                        {node.properties.confidence && (
                          <div className="mt-1">
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div 
                                className="bg-blue-600 h-1 rounded-full" 
                                style={{ width: `${(node.properties.confidence * 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500">Confidence: {(node.properties.confidence * 100).toFixed(0)}%</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Relationships Display */}
                <div className="bg-white rounded-lg p-4 overflow-auto">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Relationships ({graphData.totalRelationships})
                  </h4>
                  <div className="space-y-2 max-h-96 overflow-auto">
                    {graphData.relationships.map((rel: any) => (
                      <div key={rel.id} className="p-3 border rounded-lg">
                        <div className="text-sm">
                          <span className="font-medium">{rel.startNodeId}</span>
                          <span className="mx-2 text-gray-500">→</span>
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">{rel.type}</span>
                          <span className="mx-2 text-gray-500">→</span>
                          <span className="font-medium">{rel.endNodeId}</span>
                        </div>
                        {rel.properties.description && (
                          <p className="text-xs text-gray-600 mt-1">{rel.properties.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Statistics Panel */}
        {stats && (
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
            <h4 className="font-medium text-gray-900 mb-3">Knowledge Graph Stats</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Nodes:</span>
                <span className="font-medium">{stats.totalNodes}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Relationships:</span>
                <span className="font-medium">{stats.totalRelationships}</span>
              </div>
              <div className="mt-3 pt-3 border-t">
                <div className="text-xs text-gray-600 mb-2">Node Types:</div>
                {stats.nodeCounts.map((item: any) => (
                  <div key={item.type} className="flex justify-between text-xs">
                    <span className={`px-2 py-1 rounded-full ${
                      item.type === 'Concept' ? 'bg-green-100 text-green-800' :
                      item.type === 'Entity' ? 'bg-blue-100 text-blue-800' :
                      item.type === 'Document' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {item.type}
                    </span>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GraphView;