import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Download, Building2, Calendar, TrendingUp } from 'lucide-react';
import { Company, CompanyQuarterlyData } from '@/services/api';

interface CompanyViewProps {
  data: CompanyQuarterlyData[];
  companies: Company[];
  onExport: (data: CompanyQuarterlyData[], filename: string) => void;
}

export const CompanyView: React.FC<CompanyViewProps> = ({ data, companies, onExport }) => {
  // Group data by company
  const groupedData = React.useMemo(() => {
    const groups = new Map<number, CompanyQuarterlyData[]>();
    
    data.forEach(item => {
      if (!groups.has(item.company)) {
        groups.set(item.company, []);
      }
      groups.get(item.company)!.push(item);
    });

    // Sort quarters within each company
    groups.forEach(quarters => {
      quarters.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        const quarterOrder = { q1: 1, q2: 2, q3: 3, q4: 4 };
        return quarterOrder[b.quarter as keyof typeof quarterOrder] - quarterOrder[a.quarter as keyof typeof quarterOrder];
      });
    });

    return groups;
  }, [data]);

  const getInnovationCount = (items: CompanyQuarterlyData[]) => {
    return items.reduce((total, item) => {
      return total + [
        ...(item.products || []),
        ...(item.processes || []),
        ...(item.business_model || []),
        ...(item.regions || []),
        ...(item.launches || []),
        ...(item.other || [])
      ].length;
    }, 0);
  };

  const renderCategorySection = (title: string, items: Array<{ content: string; sources: string }>) => {
    if (!items || items.length === 0) return null;

    return (
      <div className="mb-4">
        <h5 className="font-medium text-sm text-primary mb-2">{title}</h5>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="pl-3 border-l-2 border-primary/20">
              <p className="text-sm text-foreground">{item.content}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {Array.from(groupedData.entries()).map(([companyId, quarters]) => {
        const company = companies.find(c => c.id === companyId);
        const innovationCount = getInnovationCount(quarters);

        return (
          <Card key={companyId}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-xl">{company?.name || 'Unknown Company'}</CardTitle>
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
                    onClick={() => onExport(quarters, `${company?.name || 'company'}-all-quarters`)}
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
                  const quarterInnovations = [
                    ...(quarter.products || []),
                    ...(quarter.processes || []),
                    ...(quarter.business_model || []),
                    ...(quarter.regions || []),
                    ...(quarter.launches || []),
                    ...(quarter.other || [])
                  ].length;

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
                              onExport([quarter], `${company?.name || 'company'}-${quarter.year}-${quarter.quarter}`);
                            }}
                            className="gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Download className="h-3 w-3" />
                            Export Quarter
                          </Button>
                        </div>
                      </AccordionTrigger>
                      
                      <AccordionContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
                          {renderCategorySection('Products', quarter.products || [])}
                          {renderCategorySection('Processes', quarter.processes || [])}
                          {renderCategorySection('Business Model', quarter.business_model || [])}
                          {renderCategorySection('Regions', quarter.regions || [])}
                          {renderCategorySection('Launches', quarter.launches || [])}
                          {renderCategorySection('Other', quarter.other || [])}
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

      {groupedData.size === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No company data found matching the current filters.</p>
        </div>
      )}
    </div>
  );
};