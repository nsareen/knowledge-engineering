import React, { useState } from 'react';
import { Search as SearchIcon, Filter, SortDesc } from 'lucide-react';

const Search: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'concept' | 'content' | 'hybrid' | 'semantic'>('hybrid');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Search Knowledge</h1>
        <p className="mt-2 text-gray-600">
          Search across structured knowledge graph and document content
        </p>
      </div>

      {/* Search Form */}
      <div className="card p-6 mb-8">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search concepts, entities, or content..."
                className="input pl-10"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </div>

          {/* Search Options */}
          <div className="flex items-center space-x-6 pt-2">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Search Type:</label>
              <select 
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as any)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="hybrid">Hybrid</option>
                <option value="concept">Concepts Only</option>
                <option value="content">Content Only</option>
                <option value="semantic">Semantic</option>
              </select>
            </div>
            
            <button type="button" className="flex items-center text-sm text-gray-600 hover:text-gray-900">
              <Filter className="w-4 h-4 mr-1" />
              Filters
            </button>
            
            <button type="button" className="flex items-center text-sm text-gray-600 hover:text-gray-900">
              <SortDesc className="w-4 h-4 mr-1" />
              Sort
            </button>
          </div>
        </form>
      </div>

      {/* Search Results */}
      <div className="space-y-6">
        {/* Results Header */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {searchQuery ? `Search results for "${searchQuery}"` : 'Enter a search query to find relevant content'}
          </div>
        </div>

        {/* No Results State */}
        <div className="card p-8">
          <div className="text-center">
            <SearchIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Search Results</h3>
            <p className="text-gray-500">
              {searchQuery 
                ? 'Try adjusting your search query or search type'
                : 'Enter a search query to find concepts, entities, and content'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;