
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Entry } from '../services/api';
import { apiService } from '../services/api';
import { ExternalLink, Loader2, MessageSquare, RefreshCw } from 'lucide-react';
import RemarkModal from './RemarkModal';

interface EntryTableProps {
  entries: Entry[];
  onRefreshEntry?: (entryId: number) => void;
}

const EntryTable: React.FC<EntryTableProps> = ({ entries, onRefreshEntry }) => {
  const [processingEntries, setProcessingEntries] = useState<Set<number>>(new Set());
  const [refreshingEntries, setRefreshingEntries] = useState<Set<number>>(new Set());
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false);

  const handleProcessSources = async (entryId: number) => {
    setProcessingEntries(prev => new Set(prev).add(entryId));
    
    try {
      await apiService.processEntrySources(entryId);
      setTimeout(() => {
        setProcessingEntries(prev => {
          const newSet = new Set(prev);
          newSet.delete(entryId);
          return newSet;
        });
      }, 10000);
    } catch (error) {
      console.error('Error processing sources:', error);
      setProcessingEntries(prev => {
        const newSet = new Set(prev);
        newSet.delete(entryId);
        return newSet;
      });
    }
  };

  const handleAddRemark = (entry: Entry) => {
    setSelectedEntry(entry);
    setIsRemarkModalOpen(true);
  };

  const handleRefreshEntry = async (entryId: number) => {
    setRefreshingEntries(prev => new Set(prev).add(entryId));
    
    try {
      const response = await fetch(`https://fintech.devmate.in/api/entries/${entryId}/`);
      if (!response.ok) {
        throw new Error('Failed to refresh entry');
      }
      
      // Call the parent's refresh callback to update the entry data
      if (onRefreshEntry) {
        onRefreshEntry(entryId);
      }
    } catch (error) {
      console.error('Error refreshing entry:', error);
    } finally {
      setRefreshingEntries(prev => {
        const newSet = new Set(prev);
        newSet.delete(entryId);
        return newSet;
      });
    }
  };

  const handleRemarkUpdated = () => {
    // Could refresh data here if needed
    console.log('Remark updated successfully');
  };

  const parseTags = (tagString: string) => {
    if (!tagString) return [];
    return tagString.split(',').map(tag => tag.trim()).filter(tag => tag);
  };

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                Tags
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                Sources
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Numbers
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="px-3 py-4 w-32">
                  <div className="text-sm font-medium text-gray-900 break-words">
                    {entry.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(entry.date).toLocaleDateString()}
                  </div>
                  <div className="space-y-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAddRemark(entry)}
                      className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800"
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Add Remark
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRefreshEntry(entry.id)}
                      disabled={refreshingEntries.has(entry.id)}
                      className="h-6 px-2 text-xs text-green-600 hover:text-green-800"
                    >
                      {refreshingEntries.has(entry.id) ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3 mr-1" />
                      )}
                      Refresh
                    </Button>
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 leading-relaxed max-w-2xl">
                    {entry.description && (
                      <div className="mb-2">
                        <span className="font-medium">Description: </span>
                        {entry.description}
                      </div>
                    )}
                    {entry.extra_info_text ? (
                      <div>
                        <span className="font-medium">Additional Info: </span>
                        {entry.extra_info_text}
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 mt-2">
                        {processingEntries.has(entry.id) ? (
                          <div className="flex items-center space-x-2 text-sm text-blue-600">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Processing... Check back in 10 seconds</span>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleProcessSources(entry.id)}
                            className="text-xs"
                          >
                            Generate Description
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </td>
                
                <td className="px-4 py-4 w-40">
                  <div className="flex flex-wrap gap-1">
                    {parseTags(entry.extra_info_tags).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </td>
                
                <td className="px-4 py-4 w-48">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {entry.sources.map((source, index) => (
                        <Tooltip key={index}>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs"
                              asChild
                            >
                              <a
                                href={source}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Link {index + 1}
                              </a>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs break-all">{source}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                    
                    {processingEntries.has(entry.id) ? (
                      <div className="flex items-center space-x-1 text-xs text-blue-600">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleProcessSources(entry.id)}
                        className="h-6 px-2 text-xs"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Process
                      </Button>
                    )}
                  </div>
                </td>
                
                <td className="px-4 py-4 w-32">
                  <div className="text-sm text-gray-900 text-xs leading-tight">
                    {entry.extra_info_numbers}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedEntry && (
        <RemarkModal
          entry={selectedEntry}
          isOpen={isRemarkModalOpen}
          onClose={() => {
            setIsRemarkModalOpen(false);
            setSelectedEntry(null);
          }}
          onRemarkUpdated={handleRemarkUpdated}
        />
      )}
    </TooltipProvider>
  );
};

export default EntryTable;
