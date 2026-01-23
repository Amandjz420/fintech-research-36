import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Download, Search, Filter, BarChart3, TrendingUp, ArrowLeft, RefreshCw } from 'lucide-react';
import { apiService, Company, GroupedQuarterlyData } from '@/services/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { DashboardFilters } from '@/components/dashboard/DashboardFilters';
import { DataTableView } from '@/components/dashboard/DataTableView';
import { CompanyView } from '@/components/dashboard/CompanyView';
import { TimelineView } from '@/components/dashboard/TimelineView';
import { InnovationHeatmap } from '@/components/dashboard/InnovationHeatmap';
import { CategoryDistribution } from '@/components/dashboard/CategoryDistribution';
import { useQuarterlyDataCache } from '@/hooks/useQuarterlyDataCache';

interface FilterState {
  company_id?: number;
  year?: number;
  quarter?: string;
  searchTerm?: string;
}

// Limit records to prevent stack overflow with large datasets
const MAX_RECORDS = 5000;

const FinancialDashboard = () => {
  const [filters, setFilters] = useState<FilterState>({});
  const [activeView, setActiveView] = useState<'table' | 'company' | 'timeline'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if admin mode is enabled via query parameter
  const isAdminMode = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('admin') === 'true';
  }, [location.search]);

  // Fetch companies for filter dropdown
  const { data: companies = [], isLoading: companiesLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: apiService.getCompanies,
  });

  // Use cached quarterly data with background refresh
  const { 
    data: quarterlyData = [], 
    isLoading: dataLoading, 
    isRefreshing,
    error: dataError,
    refetch,
    lastUpdated
  } = useQuarterlyDataCache(Object.keys(filters).length > 0 ? filters : undefined);

  // Limit data for performance - 52k records is too many
  const limitedData = useMemo(() => {
    if (quarterlyData.length <= MAX_RECORDS) return quarterlyData;
    
    // Sort by year/quarter (most recent first) and take first MAX_RECORDS
    const sorted = [...quarterlyData].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      const quarterOrder = { q4: 4, q3: 3, q2: 2, q1: 1 };
      return (quarterOrder[b.quarter as keyof typeof quarterOrder] || 0) - 
             (quarterOrder[a.quarter as keyof typeof quarterOrder] || 0);
    });
    return sorted.slice(0, MAX_RECORDS);
  }, [quarterlyData]);

  const isDataLimited = quarterlyData.length > MAX_RECORDS;

  // Filter data based on search term and filters
  const filteredData = useMemo(() => {
    let result = limitedData;

    // Apply filters
    if (filters.company_id) {
      const companyName = companies.find(c => c.id === filters.company_id)?.name;
      if (companyName) {
        result = result.filter(item => item.company_name === companyName);
      }
    }
    if (filters.year) {
      result = result.filter(item => item.year === filters.year);
    }
    if (filters.quarter) {
      result = result.filter(item => item.quarter.toLowerCase() === filters.quarter?.toLowerCase());
    }

    // Apply search term
    if (searchTerm) {
      result = result.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        const companyMatch = item.company_name.toLowerCase().includes(searchLower);
        
        const contentMatch = [
          item.products,
          item.processes,
          item.business_model,
          item.regions,
          item.launches,
          item.security_updates,
          item.api_updates,
          item.account_aggregator_updates,
          item.other
        ].some(content => content && content.toLowerCase().includes(searchLower));
        
        return companyMatch || contentMatch;
      });
    }
    
    return result;
  }, [limitedData, searchTerm, filters, companies]);

  // Export functions
  const exportToCSV = (data: GroupedQuarterlyData[], filename: string) => {
    const headers = [
      'Company_name', 'year', 'quarter', 'products', 'processes', 'business_model',
      'regions', 'launches', 'security_updates', 'api_updates', 'account_aggregator_updates', 'other'
    ];
    const rows = [headers];

    data.forEach(item => {
      const formatCategoryData = (categoryData: any) => {
        if (!categoryData) return '';
        
        // If it's already a string, return as is
        if (typeof categoryData === 'string') {
          return categoryData;
        }
        
        // If it's an array with content/sources structure
        if (Array.isArray(categoryData)) {
          return categoryData
            .map((item, index) => {
              const content = typeof item === 'object' && item.content ? item.content : item;
              return `${index + 1}. ${content}`;
            })
            .join('\n');
        }
        
        return categoryData.toString();
      };

      const row = [
        item.company_name,
        item.year.toString(),
        item.quarter.toUpperCase(),
        formatCategoryData(item.products),
        formatCategoryData(item.processes),
        formatCategoryData(item.business_model),
        formatCategoryData(item.regions),
        formatCategoryData(item.launches),
        formatCategoryData(item.security_updates),
        formatCategoryData(item.api_updates),
        formatCategoryData(item.account_aggregator_updates),
        formatCategoryData(item.other)
      ];

      rows.push(row);
    });

    const csvContent = rows.map(row => 
      row.map(field => `"${field.toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
    
    toast({
      title: "Export Successful",
      description: `Data exported to ${filename}.csv`,
    });
  };

  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const hasActiveFilters = Object.keys(filters).length > 0 || searchTerm;

  // Show loading spinner only on initial load without cached data
  if (companiesLoading || (dataLoading && quarterlyData.length === 0)) {
    return <LoadingSpinner />;
  }

  if (dataError && quarterlyData.length === 0) {
    return <ErrorMessage message="Failed to load dashboard data" onRetry={() => refetch()} />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        {/* Navigation breadcrumb */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Homepage
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium">Financial Innovation Dashboard</span>
        </div>
        
        {/* Main header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Financial Innovation Dashboard</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>Track and analyze fintech innovation across companies and quarters</span>
                {isRefreshing && (
                  <Badge variant="outline" className="animate-pulse gap-1">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Refreshing...
                  </Badge>
                )}
                {lastUpdated && !isRefreshing && (
                  <Badge variant="secondary" className="text-xs">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => exportToCSV(quarterlyData, 'all-quarterly-data')}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export All Data
            </Button>
            
            {hasActiveFilters && (
              <Button 
                variant="outline"
                onClick={() => exportToCSV(filteredData, 'filtered-quarterly-data')}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export Filtered
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Data limit warning */}
      {isDataLimited && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-center gap-3">
          <div className="text-amber-600">⚠️</div>
          <div>
            <p className="font-medium text-amber-700 dark:text-amber-400">
              Showing most recent {MAX_RECORDS.toLocaleString()} of {quarterlyData.length.toLocaleString()} records
            </p>
            <p className="text-sm text-muted-foreground">
              Use filters to narrow down data. Export includes all records.
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredData.length}</div>
            {isDataLimited && (
              <p className="text-xs text-muted-foreground">of {quarterlyData.length.toLocaleString()} total</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(filteredData.map(d => d.company_name)).size}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Years Covered</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(filteredData.map(d => d.year)).size}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quarters</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(filteredData.map(d => d.quarter)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DashboardFilters
            companies={companies}
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
            currentFilters={filters}
          />
          
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search across all data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
          
          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Active filters:</span>
          {filters.company_id && (
            <Badge variant="secondary">
              Company: {companies.find(c => c.id === filters.company_id)?.name}
            </Badge>
          )}
              {filters.year && <Badge variant="secondary">Year: {filters.year}</Badge>}
              {filters.quarter && <Badge variant="secondary">Quarter: {filters.quarter.toUpperCase()}</Badge>}
              {searchTerm && <Badge variant="secondary">Search: {searchTerm}</Badge>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InnovationHeatmap data={filteredData} isAdminMode={isAdminMode} />
        <CategoryDistribution data={filteredData} />
      </div>

      {/* Data Views */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Innovation Data</CardTitle>
            <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)}>
              <TabsList>
                <TabsTrigger value="table">Table View</TabsTrigger>
                <TabsTrigger value="company">Company View</TabsTrigger>
                <TabsTrigger value="timeline">Timeline View</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeView}>
            <TabsContent value="table">
              <DataTableView 
                data={filteredData} 
                onExport={(data, filename) => exportToCSV(data, filename)}
              />
            </TabsContent>
            
            <TabsContent value="company">
              <CompanyView 
                data={filteredData} 
                onExport={(data, filename) => exportToCSV(data, filename)}
              />
            </TabsContent>
            
            <TabsContent value="timeline">
              <TimelineView 
                data={filteredData} 
                onExport={(data, filename) => exportToCSV(data, filename)}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialDashboard;