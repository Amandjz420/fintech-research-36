import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Clock, Building2, Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { GroupedQuarterlyData } from '@/services/api';
import { CATEGORY_COLORS } from './InnovationHeatmap';

interface TimelineViewProps {
  data: GroupedQuarterlyData[];
  onExport: (data: GroupedQuarterlyData[], filename: string) => void;
}

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

export const TimelineView: React.FC<TimelineViewProps> = ({ data, onExport }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Sort data chronologically (newest first)
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      const quarterOrder = { q4: 4, q3: 3, q2: 2, q1: 1 };
      return quarterOrder[b.quarter as keyof typeof quarterOrder] - quarterOrder[a.quarter as keyof typeof quarterOrder];
    });
  }, [data]);

  // Group by year and quarter for timeline structure
  const timelineData = useMemo(() => {
    const timeline = new Map<string, GroupedQuarterlyData[]>();
    
    sortedData.forEach(item => {
      const key = `${item.year}-${item.quarter}`;
      if (!timeline.has(key)) {
        timeline.set(key, []);
      }
      timeline.get(key)!.push(item);
    });

    return Array.from(timeline.entries()).map(([key, items]) => {
      const [year, quarter] = key.split('-');
      return {
        year: parseInt(year),
        quarter,
        items: items.sort((a, b) => a.company_name.localeCompare(b.company_name))
      };
    });
  }, [sortedData]);

  // Pagination
  const totalPages = Math.ceil(timelineData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTimeline = useMemo(() => 
    timelineData.slice(startIndex, startIndex + pageSize),
    [timelineData, startIndex, pageSize]
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handlePageSizeChange = (size: string) => {
    setPageSize(Number(size));
    setCurrentPage(1);
  };

  const getInnovationCount = (item: GroupedQuarterlyData) => {
    const categories = [
      item.products,
      item.processes,
      item.business_model,
      item.regions,
      item.launches,
      item.security_updates,
      item.api_updates,
      item.account_aggregator_updates,
      item.other
    ];

    return categories.reduce((total, category) => {
      if (!category || !category.trim()) return total;
      return total + category.split('\n').filter(line => line.trim()).length;
    }, 0);
  };

  const renderInnovationSummary = (item: GroupedQuarterlyData) => {
    const categories = [
      { name: 'Products', data: item.products, key: 'products' },
      { name: 'Processes', data: item.processes, key: 'processes' },
      { name: 'Business Model', data: item.business_model, key: 'business_model' },
      { name: 'Regions', data: item.regions, key: 'regions' },
      { name: 'Launches', data: item.launches, key: 'launches' },
      { name: 'Security Updates', data: item.security_updates, key: 'security_updates' },
      { name: 'API Updates', data: item.api_updates, key: 'api_updates' },
      { name: 'AA Updates', data: item.account_aggregator_updates, key: 'account_aggregator_updates' },
      { name: 'Other', data: item.other, key: 'other' }
    ];

    return (
      <div className="space-y-3">
        {categories.map(category => {
          if (!category.data || !category.data.trim()) return null;
          
          const lines = category.data.split('\n').filter(line => line.trim());
          
          return (
            <div key={category.name}>
              <div className="flex items-center gap-2 mb-2">
                <Badge 
                  variant="outline" 
                  style={{
                    backgroundColor: `${CATEGORY_COLORS[category.key as keyof typeof CATEGORY_COLORS]}15`,
                    borderColor: CATEGORY_COLORS[category.key as keyof typeof CATEGORY_COLORS],
                    color: CATEGORY_COLORS[category.key as keyof typeof CATEGORY_COLORS]
                  }}
                >
                  {category.name} ({lines.length})
                </Badge>
              </div>
              <div className="space-y-1 pl-4">
                {lines.slice(0, 2).map((line, index) => (
                  <p key={index} className="text-sm text-muted-foreground line-clamp-2">
                    {line.replace(/^\d+\.\s*/, '').trim()}
                  </p>
                ))}
                {lines.length > 2 && (
                  <p className="text-xs text-muted-foreground italic">
                    +{lines.length - 2} more updates...
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Showing</span>
          <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map(size => (
                <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>of {timelineData.length.toLocaleString()} periods ({sortedData.length.toLocaleString()} records)</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm px-2">
            Page {currentPage} of {totalPages.toLocaleString()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {paginatedTimeline.map((period, periodIndex) => (
        <div key={`${period.year}-${period.quarter}`} className="relative">
          {/* Timeline line */}
          {periodIndex < paginatedTimeline.length - 1 && (
            <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-border" />
          )}
          
          {/* Period header */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative z-10 flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-full">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="flex items-center justify-between flex-1">
              <div>
                <h3 className="text-lg font-semibold">
                  {period.quarter.toUpperCase()} {period.year}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {period.items.length} companies with updates
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onExport(period.items, `timeline-${period.year}-${period.quarter}`)}
                className="gap-1"
              >
                <Download className="h-3 w-3" />
                Export Period
              </Button>
            </div>
          </div>

          {/* Company updates for this period - limit to first 10 for performance */}
          <div className="ml-16 space-y-4">
            {period.items.slice(0, 10).map((item) => {
              const innovationCount = getInnovationCount(item);

              return (
                <Card key={`${item.company_name}-${item.year}-${item.quarter}`} className="border-l-4 border-l-primary">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-primary" />
                        <div>
                          <CardTitle className="text-base">{item.company_name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {innovationCount} innovation updates
                          </p>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onExport([item], `${item.company_name}-${period.year}-${period.quarter}`)}
                        className="gap-1"
                      >
                        <Download className="h-3 w-3" />
                        Export
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {renderInnovationSummary(item)}
                  </CardContent>
                </Card>
              );
            })}
            {period.items.length > 10 && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                +{period.items.length - 10} more companies in this period
              </div>
            )}
          </div>

          {periodIndex < paginatedTimeline.length - 1 && (
            <Separator className="my-8 ml-16" />
          )}
        </div>
      ))}

      {timelineData.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No timeline data found matching the current filters.</p>
        </div>
      )}

      {/* Bottom Pagination */}
      {timelineData.length > 0 && (
        <div className="flex items-center justify-between pt-4 border-t text-sm text-muted-foreground">
          <span>
            Showing periods {startIndex + 1} to {Math.min(startIndex + pageSize, timelineData.length)} of {timelineData.length.toLocaleString()}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
