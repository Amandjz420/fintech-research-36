import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Download, ChevronLeft, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { GroupedQuarterlyData } from '@/services/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DataTableViewProps {
  data: GroupedQuarterlyData[];
  onExport: (data: GroupedQuarterlyData[], filename: string) => void;
}

const PAGE_SIZE_OPTIONS = [25, 50, 100, 250];

export const DataTableView: React.FC<DataTableViewProps> = ({ data, onExport }) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const toggleRow = (key: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedRows(newExpanded);
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Reset to first page on sort
  };

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'company':
          aValue = a.company_name;
          bValue = b.company_name;
          break;
        case 'year':
          aValue = a.year;
          bValue = b.year;
          break;
        case 'quarter':
          aValue = a.quarter;
          bValue = b.quarter;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  // Pagination calculations
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = useMemo(() => sortedData.slice(startIndex, endIndex), [sortedData, startIndex, endIndex]);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    setExpandedRows(new Set()); // Clear expanded rows on page change
  };

  const handlePageSizeChange = (size: string) => {
    setPageSize(Number(size));
    setCurrentPage(1);
    setExpandedRows(new Set());
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

  const renderCategorySection = (title: string, content: string) => {
    if (!content || !content.trim()) return null;

    const lines = content.split('\n').filter(line => line.trim());

    return (
      <div className="mb-4">
        <h4 className="font-semibold text-sm text-primary mb-2">{title}</h4>
        <div className="space-y-2">
          {lines.map((line, index) => (
            <div key={index} className="pl-4 border-l-2 border-muted">
              <p className="text-sm text-foreground">
                {line.replace(/^\d+\.\s*/, '').trim()}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Pagination Controls - Top */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
          <span>of {sortedData.length.toLocaleString()} records</span>
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

      {/* Table */}
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('company')}
              >
                Company {sortConfig?.key === 'company' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('year')}
              >
                Year {sortConfig?.key === 'year' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('quarter')}
              >
                Quarter {sortConfig?.key === 'quarter' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead>Innovations</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((item) => {
              const rowKey = `${item.company_name}-${item.year}-${item.quarter}`;
              const isExpanded = expandedRows.has(rowKey);
              const innovationCount = getInnovationCount(item);

              return (
                <React.Fragment key={rowKey}>
                  <TableRow className="hover:bg-muted/50">
                    <TableCell>
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRow(rowKey)}
                            className="p-0 h-8 w-8"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      </Collapsible>
                    </TableCell>
                    <TableCell className="font-medium">{item.company_name}</TableCell>
                    <TableCell>{item.year}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.quarter.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{innovationCount} updates</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onExport([item], `${item.company_name}-${item.year}-${item.quarter}`)}
                        className="gap-1"
                      >
                        <Download className="h-3 w-3" />
                        Export
                      </Button>
                    </TableCell>
                  </TableRow>
                  
                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={6} className="p-6 bg-muted/20">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {renderCategorySection('Products', item.products)}
                          {renderCategorySection('Processes', item.processes)}
                          {renderCategorySection('Business Model', item.business_model)}
                          {renderCategorySection('Regions', item.regions)}
                          {renderCategorySection('Launches', item.launches)}
                          {renderCategorySection('Security Updates', item.security_updates)}
                          {renderCategorySection('API Updates', item.api_updates)}
                          {renderCategorySection('Account Aggregator Updates', item.account_aggregator_updates)}
                          {renderCategorySection('Other', item.other)}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {sortedData.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No data found matching the current filters.
        </div>
      )}

      {/* Pagination Controls - Bottom */}
      {sortedData.length > 0 && (
        <div className="flex items-center justify-between pt-4 border-t text-sm text-muted-foreground">
          <span>
            Showing {startIndex + 1} to {Math.min(endIndex, sortedData.length)} of {sortedData.length.toLocaleString()} records
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
