import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';
import { GroupedQuarterlyData } from '@/services/api';

// Category color mapping for consistency across the app
export const CATEGORY_COLORS = {
  products: 'hsl(220, 70%, 50%)',       // Blue
  processes: 'hsl(142, 71%, 45%)',      // Green  
  business_model: 'hsl(262, 83%, 58%)', // Purple
  regions: 'hsl(25, 95%, 53%)',         // Orange
  launches: 'hsl(0, 84%, 60%)',         // Red
  security_updates: 'hsl(48, 96%, 53%)', // Yellow
  api_updates: 'hsl(221, 83%, 53%)',    // Indigo
  account_aggregator_updates: 'hsl(314, 65%, 60%)', // Pink
  other: 'hsl(215, 25%, 27%)'           // Gray
};

interface InnovationHeatmapProps {
  data: GroupedQuarterlyData[];
}

export const InnovationHeatmap: React.FC<InnovationHeatmapProps> = ({ data }) => {
  // Create heatmap data structure
  const heatmapData = React.useMemo(() => {
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    const years = [...new Set(data.map(d => d.year))].sort((a, b) => b - a);
    const companies = [...new Set(data.map(d => d.company_name))].sort();

    const matrix = new Map<string, number>();

    // Initialize matrix
    companies.forEach(company => {
      years.forEach(year => {
        quarters.forEach(quarter => {
          matrix.set(`${company}-${year}-${quarter.toLowerCase()}`, 0);
        });
      });
    });

    // Populate with actual data
    data.forEach(item => {
      const key = `${item.company_name}-${item.year}-${item.quarter}`;
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

      const count = categories.reduce((total, category) => {
        if (!category || !category.trim()) return total;
        return total + category.split('\n').filter(line => line.trim()).length;
      }, 0);

      matrix.set(key, count);
    });

    return { matrix, years, quarters, companies };
  }, [data]);

  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-muted';
    if (count <= 2) return 'bg-primary/20';
    if (count <= 5) return 'bg-primary/40';
    if (count <= 10) return 'bg-primary/60';
    return 'bg-primary/80';
  };

  const maxCount = Math.max(...Array.from(heatmapData.matrix.values()));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Innovation Activity Heatmap
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Innovation intensity by company and quarter
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Activity:</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-muted rounded-sm"></div>
              <span className="text-xs">None</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-primary/20 rounded-sm"></div>
              <span className="text-xs">Low</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-primary/40 rounded-sm"></div>
              <span className="text-xs">Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-primary/60 rounded-sm"></div>
              <span className="text-xs">High</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-primary/80 rounded-sm"></div>
              <span className="text-xs">Very High</span>
            </div>
          </div>

          {/* Heatmap */}
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Year headers */}
              <div className="flex mb-2">
                <div className="w-40 flex-shrink-0"></div>
                {heatmapData.years.map(year => (
                  <div key={year} className="grid grid-cols-4 gap-1 flex-1">
                    <div className="col-span-4 text-center text-sm font-medium text-muted-foreground border-b pb-1 mb-2">
                      {year}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quarter headers */}
              <div className="flex mb-4">
                <div className="w-40 flex-shrink-0"></div>
                {heatmapData.years.map(year => (
                  <div key={`quarters-${year}`} className="grid grid-cols-4 gap-1 flex-1">
                    {heatmapData.quarters.map(quarter => (
                      <div key={`${year}-${quarter}`} className="text-center text-xs text-muted-foreground font-medium">
                        {quarter}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Company rows */}
              <div className="space-y-2">
                {heatmapData.companies.map(company => (
                  <div key={company} className="flex items-center">
                    <div className="w-40 flex-shrink-0 pr-4">
                      <div className="text-sm font-medium truncate" title={company}>
                        {company}
                      </div>
                    </div>
                    {heatmapData.years.map(year => (
                      <div key={`${company}-${year}`} className="grid grid-cols-4 gap-1 flex-1">
                        {heatmapData.quarters.map(quarter => {
                          const key = `${company}-${year}-${quarter.toLowerCase()}`;
                          const count = heatmapData.matrix.get(key) || 0;
                          return (
                            <div
                              key={key}
                              className={`h-8 rounded-sm ${getIntensityClass(count)} flex items-center justify-center cursor-pointer transition-all hover:scale-105 hover:shadow-sm border border-border/50`}
                              title={`${company} - ${quarter} ${year}: ${count} innovations`}
                            >
                              <span className="text-xs font-medium text-foreground">
                                {count > 0 ? count : ''}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-lg font-bold text-primary">{maxCount}</div>
              <div className="text-xs text-muted-foreground">Max per quarter</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-primary">
                {heatmapData.companies.length}
              </div>
              <div className="text-xs text-muted-foreground">Active companies</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-primary">
                {Array.from(heatmapData.matrix.values()).filter(v => v > 0).length}
              </div>
              <div className="text-xs text-muted-foreground">Active quarters</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};