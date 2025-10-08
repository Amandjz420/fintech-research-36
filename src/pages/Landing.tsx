
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Company, apiService } from '../services/api';
import CompanyCard from '../components/CompanyCard';
import CompanyListItem from '../components/CompanyListItem';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { Search, Grid3X3, List, BarChart3, TrendingUp, ArrowRight, Sparkles, Send, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

const Landing = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const navigate = useNavigate();
  
  // Intelligent Query states
  const [queryText, setQueryText] = useState('');
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<number[]>([]);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<{
    query: string;
    answer: string;
    tool_calls: Array<{
      function: string;
      arguments: Record<string, any>;
      result: any;
    }>;
    iterations: number;
    refined_query: Record<string, any>;
  } | null>(null);
  const [companySearchTerm, setCompanySearchTerm] = useState('');

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getCompanies();
      setCompanies(data);
      setFilteredCompanies(data);
    } catch (err) {
      setError('Failed to load companies. Please try again.');
      console.error('Error fetching companies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCompanies(companies);
    } else {
      const filtered = companies.filter(company =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCompanies(filtered);
    }
  }, [searchTerm, companies]);

  const handleCompanyToggle = (companyId: number) => {
    setSelectedCompanyIds(prev => 
      prev.includes(companyId) 
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    );
  };

  const handleIntelligentQuery = async () => {
    if (!queryText.trim()) {
      toast.error('Please enter a query');
      return;
    }

    if (selectedCompanyIds.length === 0) {
      toast.error('Please select at least one company');
      return;
    }

    setQueryLoading(true);
    setQueryResult(null);

    try {
      // Get company names from selected IDs
      const selectedCompanyNames = companies
        .filter(c => selectedCompanyIds.includes(c.id))
        .map(c => c.name);
      
      const result = await apiService.intelligentQuery(
        queryText, 
        selectedCompanyNames
      );
      
      // The API returns the data directly, not nested under 'result'
      setQueryResult(result as any);
      toast.success('Query executed successfully');
    } catch (err) {
      toast.error('Failed to execute query. Please try again.');
      console.error('Error executing intelligent query:', err);
    } finally {
      setQueryLoading(false);
    }
  };

  // Sort companies alphabetically
  const sortedCompanies = [...companies].sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  // Filter companies for the intelligent query section
  const filteredCompaniesForQuery = sortedCompanies.filter(company =>
    company.name.toLowerCase().includes(companySearchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <ErrorMessage message={error} onRetry={fetchCompanies} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Company Analytics Dashboard
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
            Explore detailed analytics and insights for companies in our database
          </p>
          
          {/* Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto mb-8">
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-6 rounded-lg border border-primary/20">
              <div className="flex items-center justify-center mb-4">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Financial Innovation Dashboard
              </h3>
              <p className="text-gray-600 mb-4 text-sm">
                Comprehensive quarterly analysis, filtering, and data visualization for financial innovation tracking
              </p>
              <Button 
                onClick={() => navigate('/dashboard')}
                className="w-full group"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Access Dashboard
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            
            <div className="bg-gradient-to-br from-secondary/5 to-secondary/10 p-6 rounded-lg border border-secondary/20">
              <div className="flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-secondary-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Company Explorer
              </h3>
              <p className="text-gray-600 mb-4 text-sm">
                Browse and search through our comprehensive database of fintech companies
              </p>
              <Button 
                variant="outline"
                onClick={() => {
                  const searchSection = document.getElementById('company-search');
                  searchSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full"
              >
                Explore Companies
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
          
          {/* Intelligent Query Section */}
          <Card className="max-w-5xl mx-auto mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Intelligent Query
              </CardTitle>
              <CardDescription>
                Ask questions about companies and get AI-powered insights from our database
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="query" className="mb-2 block">Your Question</Label>
                <Textarea
                  id="query"
                  placeholder="e.g., What were the updates of PhonePe in September 2015?"
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              
              <div>
                <Label className="mb-2 block">Select Companies <span className="text-destructive">*</span></Label>
                <div className="mb-2">
                  <Input
                    type="text"
                    placeholder="Search companies..."
                    value={companySearchTerm}
                    onChange={(e) => setCompanySearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <ScrollArea className="h-48 border rounded-md p-4">
                  <div className="space-y-3">
                    {filteredCompaniesForQuery.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No companies found
                      </p>
                    ) : (
                      filteredCompaniesForQuery.map((company) => (
                        <div key={company.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`company-${company.id}`}
                            checked={selectedCompanyIds.includes(company.id)}
                            onCheckedChange={() => handleCompanyToggle(company.id)}
                          />
                          <Label
                            htmlFor={`company-${company.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {company.name}
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
                {selectedCompanyIds.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {companies
                      .filter(c => selectedCompanyIds.includes(c.id))
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(company => (
                        <Badge 
                          key={company.id} 
                          variant="secondary"
                          className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                          onClick={() => handleCompanyToggle(company.id)}
                        >
                          {company.name}
                          <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                  </div>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  {selectedCompanyIds.length === 0 
                    ? 'Please select at least one company'
                    : `${selectedCompanyIds.length} ${selectedCompanyIds.length === 1 ? 'company' : 'companies'} selected`
                  }
                </p>
              </div>

              <Button 
                onClick={handleIntelligentQuery} 
                disabled={queryLoading}
                className="w-full"
              >
                {queryLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Ask Question
                  </>
                )}
              </Button>

              {(queryResult || queryLoading) && (
                <div className="mt-4 space-y-4">
                  
                  {queryResult && (
                    <>
                      <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-primary">
                          <Sparkles className="h-5 w-5" />
                          Answer
                        </h4>
                        <div className="prose prose-sm max-w-none">
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{queryResult.answer}</p>
                        </div>
                      </div>

                      {queryResult.refined_query && Object.keys(queryResult.refined_query).length > 0 && (
                        <div className="p-4 bg-muted rounded-lg border border-border">
                          <h4 className="font-semibold mb-2 text-sm">Refined Query Analysis</h4>
                          <div className="space-y-1 text-sm">
                            {queryResult.refined_query.company && (
                              <p><span className="font-medium">Company:</span> {queryResult.refined_query.company}</p>
                            )}
                            {queryResult.refined_query.query_type && (
                              <p><span className="font-medium">Query Type:</span> {queryResult.refined_query.query_type}</p>
                            )}
                            {queryResult.refined_query.keywords && queryResult.refined_query.keywords.length > 0 && (
                              <p><span className="font-medium">Keywords:</span> {queryResult.refined_query.keywords.join(', ')}</p>
                            )}
                            {queryResult.refined_query.refined_query && (
                              <p><span className="font-medium">Refined Query:</span> {queryResult.refined_query.refined_query}</p>
                            )}
                          </div>
                        </div>
                      )}


                      <div className="p-3 bg-muted/50 rounded-lg border border-border">
                        <p className="text-xs text-muted-foreground">
                          Completed in <span className="font-medium">{queryResult.iterations}</span> iteration{queryResult.iterations !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div id="company-search" className="flex flex-col items-center gap-4 mb-8">
            <div className="max-w-md w-full">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search companies by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
              <Button
                variant={viewMode === 'card' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('card')}
                className="flex items-center gap-2"
              >
                <Grid3X3 className="h-4 w-4" />
                Cards
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="flex items-center gap-2"
              >
                <List className="h-4 w-4" />
                List
              </Button>
            </div>
          </div>
        </div>

        {filteredCompanies.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {searchTerm ? `No companies found matching "${searchTerm}"` : 'No companies found.'}
            </p>
          </div>
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            {filteredCompanies.map((company) => (
              <CompanyListItem key={company.id} company={company} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Landing;
