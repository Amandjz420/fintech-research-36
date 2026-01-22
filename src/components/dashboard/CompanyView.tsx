import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Building2, Calendar, TrendingUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { GroupedQuarterlyData } from '@/services/api';

interface CompanyViewProps {
  data: GroupedQuarterlyData[];
  onExport: (data: GroupedQuarterlyData[], filename: string) => void;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export const CompanyView: React.FC<CompanyViewProps> = ({ data, onExport }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Group data by company
  const groupedData = useMemo(() => {
    const groups = new Map<string, GroupedQuarterlyData[]>();
    
    data.forEach(item => {
      if (!groups.has(item.company_name)) {
        groups.set(item.company_name, []);
      }
      groups.get(item.company_name)!.push(item);
    });

    // Sort quarters within each company
    groups.forEach(quarters => {
      quarters.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        const quarterOrder = { q1: 1, q2: 2, q3: 3, q4: 4 };
        return quarterOrder[b.quarter as keyof typeof quarterOrder] - quarterOrder[a.quarter as keyof typeof quarterOrder];
      });
    });

    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [data]);

  // Pagination
  const totalPages = Math.ceil(groupedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCompanies = useMemo(() => 
    groupedData.slice(startIndex, startIndex + pageSize), 
    [groupedData, startIndex, pageSize]
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handlePageSizeChange = (size: string) => {
    setPageSize(Number(size));
    setCurrentPage(1);
  };

  const getInnovationCount = (items: GroupedQuarterlyData[]) => {
    return items.reduce((total, item) => {
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

      return total + categories.reduce((categoryTotal, category) => {
        if (!category || !category.trim()) return categoryTotal;
        return categoryTotal + category.split('\n').filter(line => line.trim()).length;
      }, 0);
    }, 0);
  };

  const getQuarterInnovationCount = (item: GroupedQuarterlyData) => {
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
        <h5 className="font-medium text-sm text-primary mb-2">{title}</h5>
        <div className="space-y-2">
          {lines.map((line, index) => (
            <div key={index} className="pl-3 border-l-2 border-primary/20">
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
    <div className="space-y-6">
      {/* Pagination Controls */}
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
          <span>of {groupedData.length.toLocaleString()} companies</span>
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

      {paginatedCompanies.map(([companyName, quarters]) => {
        const innovationCount = getInnovationCount(quarters);

        return (
          <Card key={companyName}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-xl">{companyName}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {quarters.length} quarters • {innovationCount} total innovations
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {innovationCount} updates
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onExport(quarters, `${companyName}-all-quarters`)}
                    className="gap-1"
                  >
                    <Download className="h-3 w-3" />
                    Export Company
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {quarters.map((quarter) => {
                  const quarterInnovations = getQuarterInnovationCount(quarter);

                  return (
                    <AccordionItem key={`${quarter.year}-${quarter.quarter}`} value={`${quarter.year}-${quarter.quarter}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {quarter.quarter.toUpperCase()} {quarter.year}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {quarterInnovations} updates
                            </Badge>
                          </div>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              onExport([quarter], `${companyName}-${quarter.year}-${quarter.quarter}`);
                            }}
                            className="gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Download className="h-3 w-3" />
                            Export Quarter
                          </Button>
                        </div>
                      </AccordionTrigger>
                      
                      <AccordionContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-7">
                          {renderCategorySection('Products', quarter.products)}
                          {renderCategorySection('Processes', quarter.processes)}
                          {renderCategorySection('Business Model', quarter.business_model)}
                          {renderCategorySection('Regions', quarter.regions)}
                          {renderCategorySection('Launches', quarter.launches)}
                          {renderCategorySection('Security Updates', quarter.security_updates)}
                          {renderCategorySection('API Updates', quarter.api_updates)}
                          {renderCategorySection('Account Aggregator Updates', quarter.account_aggregator_updates)}
                          {renderCategorySection('Other', quarter.other)}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        );
      })}

      {groupedData.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No company data found matching the current filters.</p>
        </div>
      )}

      {/* Bottom Pagination */}
      {groupedData.length > 0 && (
        <div className="flex items-center justify-between pt-4 border-t text-sm text-muted-foreground">
          <span>
            Showing {startIndex + 1} to {Math.min(startIndex + pageSize, groupedData.length)} of {groupedData.length.toLocaleString()} companies
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
