import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  isAdminMode?: boolean;
}

export const InnovationHeatmap: React.FC<InnovationHeatmapProps> = ({ data, isAdminMode = false }) => {
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
            <div className="min-w-[1200px]">
              {/* Year headers */}
              <div className="flex mb-3">
                <div className="w-48 flex-shrink-0"></div>
                {heatmapData.years.map(year => (
                  <div key={year} className="w-80 text-center">
                    <div className="text-lg font-semibold text-foreground border-b-2 border-primary/20 pb-2 mb-3">
                      {year}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quarter headers */}
              <div className="flex mb-4">
                <div className="w-48 flex-shrink-0"></div>
                {heatmapData.years.map(year => (
                  <div key={`quarters-${year}`} className="w-80 grid grid-cols-4 gap-2">
                    {heatmapData.quarters.map(quarter => (
                      <div key={`${year}-${quarter}`} className="text-center text-sm font-medium text-muted-foreground py-1">
                        {quarter}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Company rows - Conditional rendering based on admin mode */}
              {isAdminMode ? (
                <ScrollArea className="h-[600px] w-full">
                  <div className="space-y-3 pr-4">
                    {heatmapData.companies.map(company => (
                      <div key={company} className="flex items-center">
                        <div className="w-48 flex-shrink-0 pr-4">
                          <div className="text-sm font-medium text-foreground" title={company}>
                            {company.length > 20 ? `${company.slice(0, 20)}...` : company}
                          </div>
                        </div>
                        {heatmapData.years.map(year => (
                          <div key={`${company}-${year}`} className="w-80 grid grid-cols-4 gap-2">
                            {heatmapData.quarters.map(quarter => {
                              const key = `${company}-${year}-${quarter.toLowerCase()}`;
                              const count = heatmapData.matrix.get(key) || 0;
                              return (
                                <div
                                  key={key}
                                  className={`h-12 w-full rounded-md ${getIntensityClass(count)} flex items-center justify-center cursor-pointer transition-all hover:scale-105 hover:shadow-md border border-border/50 hover:border-primary/50`}
                                  title={`${company} - ${quarter.toUpperCase()} ${year}: ${count} innovations`}
                                >
                                  <span className="text-sm font-semibold text-foreground">
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
                </ScrollArea>
              ) : (
                <div className="space-y-3">
                  {heatmapData.companies.slice(0, 15).map(company => (
                    <div key={company} className="flex items-center">
                      <div className="w-48 flex-shrink-0 pr-4">
                        <div className="text-sm font-medium text-foreground" title={company}>
                          {company.length > 20 ? `${company.slice(0, 20)}...` : company}
                        </div>
                      </div>
                      {heatmapData.years.map(year => (
                        <div key={`${company}-${year}`} className="w-80 grid grid-cols-4 gap-2">
                          {heatmapData.quarters.map(quarter => {
                            const key = `${company}-${year}-${quarter.toLowerCase()}`;
                            const count = heatmapData.matrix.get(key) || 0;
                            return (
                              <div
                                key={key}
                                className={`h-12 w-full rounded-md ${getIntensityClass(count)} flex items-center justify-center cursor-pointer transition-all hover:scale-105 hover:shadow-md border border-border/50 hover:border-primary/50`}
                                title={`${company} - ${quarter.toUpperCase()} ${year}: ${count} innovations`}
                              >
                                <span className="text-sm font-semibold text-foreground">
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
              )}

              {/* Company count info */}
              <div className="mt-4 text-center">
                <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                  {isAdminMode 
                    ? `Showing all ${heatmapData.companies.length} companies. Scroll to view more.`
                    : `Showing top 15 of ${heatmapData.companies.length} companies. Add ?admin=true to view all.`
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{maxCount}</div>
              <div className="text-sm text-muted-foreground">Max per quarter</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {isAdminMode ? heatmapData.companies.length : Math.min(15, heatmapData.companies.length)}
              </div>
              <div className="text-sm text-muted-foreground">
                {isAdminMode ? 'Total companies' : 'Companies shown'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {Array.from(heatmapData.matrix.values()).filter(v => v > 0).length}
              </div>
              <div className="text-sm text-muted-foreground">Active quarters</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {heatmapData.years.length}
              </div>
              <div className="text-sm text-muted-foreground">Years covered</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};