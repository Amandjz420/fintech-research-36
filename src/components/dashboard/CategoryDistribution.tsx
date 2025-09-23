import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { BarChart } from 'lucide-react';
import { GroupedQuarterlyData } from '@/services/api';

interface CategoryDistributionProps {
  data: GroupedQuarterlyData[];
}

export const CategoryDistribution: React.FC<CategoryDistributionProps> = ({ data }) => {
  // Calculate category distribution
  const categoryStats = React.useMemo(() => {
    const stats = {
      products: 0,
      processes: 0,
      business_model: 0,
      regions: 0,
      launches: 0,
      security_updates: 0,
      api_updates: 0,
      account_aggregator_updates: 0,
      other: 0
    };

    data.forEach(item => {
      const categories = [
        { key: 'products', data: item.products },
        { key: 'processes', data: item.processes },
        { key: 'business_model', data: item.business_model },
        { key: 'regions', data: item.regions },
        { key: 'launches', data: item.launches },
        { key: 'security_updates', data: item.security_updates },
        { key: 'api_updates', data: item.api_updates },
        { key: 'account_aggregator_updates', data: item.account_aggregator_updates },
        { key: 'other', data: item.other }
      ];

      categories.forEach(category => {
        if (category.data && category.data.trim()) {
          const lines = category.data.split('\n').filter(line => line.trim());
          stats[category.key as keyof typeof stats] += lines.length;
        }
      });
    });

    const total = Object.values(stats).reduce((sum, count) => sum + count, 0);

    return {
      raw: stats,
      total,
      percentages: Object.entries(stats).map(([key, value]) => ({
        category: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count: value,
        percentage: total > 0 ? Math.round((value / total) * 100) : 0
      }))
    };
  }, [data]);

  // Data for pie chart
  const pieData = categoryStats.percentages.filter(item => item.count > 0);

  // Colors for categories
  const colors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(var(--destructive))',
    'hsl(var(--primary))',
    'hsl(var(--secondary))',
    'hsl(var(--accent))'
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-2 shadow-md">
          <p className="font-medium">{data.category}</p>
          <p className="text-sm text-muted-foreground">
            {data.count} updates ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart className="h-5 w-5" />
          Innovation Category Distribution
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Breakdown of {categoryStats.total} total innovations by category
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Progress bars */}
          <div className="space-y-4">
            {categoryStats.percentages.map((item, index) => (
              <div key={item.category} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: colors[index] }}
                    />
                    <span className="text-sm font-medium">{item.category}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
                <Progress 
                  value={item.percentage} 
                  className="h-2"
                  style={{ 
                    '--progress-background': colors[index] 
                  } as React.CSSProperties}
                />
              </div>
            ))}
          </div>

          {/* Pie chart */}
          <div className="h-64">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="count"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <BarChart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No data available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t">
          <div className="text-center">
            <div className="text-lg font-bold text-primary">
              {Math.max(...categoryStats.percentages.map(c => c.count))}
            </div>
            <div className="text-xs text-muted-foreground">Highest category</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-primary">
              {categoryStats.percentages.filter(c => c.count > 0).length}
            </div>
            <div className="text-xs text-muted-foreground">Active categories</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-primary">
              {Math.round(categoryStats.total / data.length) || 0}
            </div>
            <div className="text-xs text-muted-foreground">Avg per record</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-primary">
              {categoryStats.total}
            </div>
            <div className="text-xs text-muted-foreground">Total innovations</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};