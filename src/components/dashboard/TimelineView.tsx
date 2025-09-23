import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, Clock, Building2, Calendar } from 'lucide-react';
import { GroupedQuarterlyData } from '@/services/api';
import { CATEGORY_COLORS } from './InnovationHeatmap';

interface TimelineViewProps {
  data: GroupedQuarterlyData[];
  onExport: (data: GroupedQuarterlyData[], filename: string) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ data, onExport }) => {
  // Sort data chronologically (newest first)
  const sortedData = React.useMemo(() => {
    return [...data].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      const quarterOrder = { q4: 4, q3: 3, q2: 2, q1: 1 };
      return quarterOrder[b.quarter as keyof typeof quarterOrder] - quarterOrder[a.quarter as keyof typeof quarterOrder];
    });
  }, [data]);

  // Group by year and quarter for timeline structure
  const timelineData = React.useMemo(() => {
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
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Clock className="h-4 w-4" />
        <span>Showing {sortedData.length} records in chronological order</span>
      </div>

      {timelineData.map((period, periodIndex) => (
        <div key={`${period.year}-${period.quarter}`} className="relative">
          {/* Timeline line */}
          {periodIndex < timelineData.length - 1 && (
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

          {/* Company updates for this period */}
          <div className="ml-16 space-y-4">
            {period.items.map((item, itemIndex) => {
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
          </div>

          {periodIndex < timelineData.length - 1 && (
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
    </div>
  );
};