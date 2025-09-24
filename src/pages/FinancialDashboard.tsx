import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, Search, Filter, RefreshCw, BarChart3, TrendingUp, Home, ArrowLeft } from 'lucide-react';
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

interface FilterState {
  company_id?: number;
  year?: number;
  quarter?: string;
  searchTerm?: string;
}

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

  // Fetch quarterly data based on filters
  const { 
    data: quarterlyData = [], 
    isLoading: dataLoading, 
    error: dataError,
    refetch 
  } = useQuery({
    queryKey: ['grouped-quarterly-data', filters],
    queryFn: () => apiService.getGroupedQuarterlyData(filters),
    enabled: true,
  });

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return quarterlyData;
    
    return quarterlyData.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      const companyMatch = item.company_name.toLowerCase().includes(searchLower);
      
      // Search in all content fields (now strings)
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
  }, [quarterlyData, searchTerm]);

  // Export functions
  const exportToCSV = (data: GroupedQuarterlyData[], filename: string) => {
    const headers = ['Company', 'Year', 'Quarter', 'Category', 'Content'];
    const rows = [headers];

    data.forEach(item => {
      const categories = [
        { name: 'Products', data: item.products },
        { name: 'Processes', data: item.processes },
        { name: 'Business Model', data: item.business_model },
        { name: 'Regions', data: item.regions },
        { name: 'Launches', data: item.launches },
        { name: 'Security Updates', data: item.security_updates },
        { name: 'API Updates', data: item.api_updates },
        { name: 'Account Aggregator Updates', data: item.account_aggregator_updates },
        { name: 'Other', data: item.other }
      ];

      categories.forEach(category => {
        if (category.data && category.data.trim()) {
          // Split by numbered lines and clean up
          const lines = category.data.split('\n').filter(line => line.trim());
          lines.forEach(line => {
            rows.push([
              item.company_name,
              item.year.toString(),
              item.quarter.toUpperCase(),
              category.name,
              line.replace(/^\d+\.\s*/, '').trim() // Remove numbering
            ]);
          });
        }
      });
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

  if (companiesLoading || dataLoading) {
    return <LoadingSpinner />;
  }

  if (dataError) {
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
              <p className="text-muted-foreground">
                Track and analyze fintech innovation across companies and quarters
              </p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredData.length}</div>
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