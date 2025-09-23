import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Download, ExternalLink } from 'lucide-react';
import { Company, CompanyQuarterlyData } from '@/services/api';

interface DataTableViewProps {
  data: CompanyQuarterlyData[];
  companies: Company[];
  onExport: (data: CompanyQuarterlyData[], filename: string) => void;
}

export const DataTableView: React.FC<DataTableViewProps> = ({ data, companies, onExport }) => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const toggleRow = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'company':
          aValue = companies.find(c => c.id === a.company)?.name || '';
          bValue = companies.find(c => c.id === b.company)?.name || '';
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
  }, [data, sortConfig, companies]);

  const getInnovationCount = (item: CompanyQuarterlyData) => {
    return [
      ...(item.products || []),
      ...(item.processes || []),
      ...(item.business_model || []),
      ...(item.regions || []),
      ...(item.launches || []),
      ...(item.other || [])
    ].length;
  };

  const renderCategorySection = (title: string, items: Array<{ content: string; sources: string }>) => {
    if (!items || items.length === 0) return null;

    return (
      <div className="mb-4">
        <h4 className="font-semibold text-sm text-primary mb-2">{title}</h4>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="pl-4 border-l-2 border-muted">
              <p className="text-sm text-foreground mb-1">{item.content}</p>
              {item.sources && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <ExternalLink className="h-3 w-3" />
                  <span>Sources available</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
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
            {sortedData.map((item) => {
              const companyName = companies.find(c => c.id === item.company)?.name || 'Unknown';
              const isExpanded = expandedRows.has(item.id);
              const innovationCount = getInnovationCount(item);

              return (
                <React.Fragment key={item.id}>
                  <TableRow className="hover:bg-muted/50">
                    <TableCell>
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRow(item.id)}
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
                    <TableCell className="font-medium">{companyName}</TableCell>
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
                        onClick={() => onExport([item], `${companyName}-${item.year}-${item.quarter}`)}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {renderCategorySection('Products', item.products || [])}
                          {renderCategorySection('Processes', item.processes || [])}
                          {renderCategorySection('Business Model', item.business_model || [])}
                          {renderCategorySection('Regions', item.regions || [])}
                          {renderCategorySection('Launches', item.launches || [])}
                          {renderCategorySection('Other', item.other || [])}
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
    </div>
  );
};