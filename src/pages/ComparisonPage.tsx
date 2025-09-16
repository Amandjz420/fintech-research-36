import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Package, Download, GitCompare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import ProductOfferingsDisplay from '@/components/ProductOfferingsDisplay';
import { Company, Project, QuarterlyAnalysis, CompanyQuarterlyData, apiService } from '@/services/api';
import jsPDF from 'jspdf';

const ComparisonPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(
    searchParams.get('companyId') ? parseInt(searchParams.get('companyId')!) : null
  );
  const [company, setCompany] = useState<Company | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(2024);
  const [selectedQuarter, setSelectedQuarter] = useState<string | null>(null);
  const [companyQuarterlyData, setCompanyQuarterlyData] = useState<CompanyQuarterlyData[]>([]);
  const [projectQuarterlyData, setProjectQuarterlyData] = useState<QuarterlyAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load companies on mount
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const companiesData = await apiService.getCompanies();
        setCompanies(companiesData);
      } catch (err) {
        console.error('Error loading companies:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCompanies();
  }, []);

  // Load company and project data when company is selected
  useEffect(() => {
    const loadData = async () => {
      if (!selectedCompanyId) {
        setCompany(null);
        setProject(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Load both company details and project details (using same ID)
        const [companyData, projectData] = await Promise.all([
          apiService.getCompanyDetails(selectedCompanyId),
          apiService.getProjectDetails(selectedCompanyId)
        ]);
        
        setCompany(companyData);
        setProject(projectData);
        
        // Update URL
        setSearchParams({ companyId: selectedCompanyId.toString() });
      } catch (err) {
        setError('Failed to load data. Please try again.');
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedCompanyId, setSearchParams]);

  // Load quarterly data when year and quarter are selected
  useEffect(() => {
    const loadQuarterlyData = async () => {
      if (!selectedCompanyId || !selectedYear || !selectedQuarter) {
        setCompanyQuarterlyData([]);
        setProjectQuarterlyData([]);
        return;
      }
      
      try {
        const [companyData, projectData] = await Promise.all([
          apiService.getCompanyQuarterlyData(selectedCompanyId, selectedYear, selectedQuarter),
          apiService.getQuarterlyAnalysis(selectedCompanyId, selectedYear, selectedQuarter)
        ]);
        
        setCompanyQuarterlyData(companyData);
        setProjectQuarterlyData(projectData);
      } catch (err) {
        console.error('Error loading quarterly data:', err);
        setCompanyQuarterlyData([]);
        setProjectQuarterlyData([]);
      }
    };

    loadQuarterlyData();
  }, [selectedCompanyId, selectedYear, selectedQuarter]);

  const downloadComparisonPDF = () => {
    if (!company || !project || !selectedYear || !selectedQuarter) return;
    
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const usableWidth = pageWidth - 2 * margin;
    
    let yPosition = margin;
    
    // Title
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Comparison: ${company.name} - ${selectedYear} ${selectedQuarter}`, margin, yPosition);
    yPosition += 20;
    
    // Company Analysis
    if (companyQuarterlyData.length > 0) {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Company Analysis:', margin, yPosition);
      yPosition += 10;
      
      companyQuarterlyData.forEach(data => {
        // Add company analysis content
        if (data.information) {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          const infoLines = pdf.splitTextToSize(data.information, usableWidth);
          pdf.text(infoLines, margin, yPosition);
          yPosition += infoLines.length * 4 + 5;
        }
      });
    }
    
    yPosition += 10;
    
    // Project Analysis
    if (projectQuarterlyData.length > 0) {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Project Analysis:', margin, yPosition);
      yPosition += 10;
      
      projectQuarterlyData.forEach(analysis => {
        if (analysis.information) {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          const infoLines = pdf.splitTextToSize(analysis.information, usableWidth);
          pdf.text(infoLines, margin, yPosition);
          yPosition += infoLines.length * 4 + 5;
        }
      });
    }
    
    pdf.save(`${company.name}_Comparison_${selectedYear}_${selectedQuarter}.pdf`);
  };

  if (loading && companies.length === 0) {
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
          <Button
            onClick={() => navigate('/')}
            className="mb-6 inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Home
          </Button>
          <ErrorMessage message={error} onRetry={() => window.location.reload()} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Button
          onClick={() => navigate('/')}
          className="mb-6 inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          variant="ghost"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Home
        </Button>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <GitCompare className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-gray-900">
              Company vs Project Comparison
            </h1>
          </div>
          <p className="text-xl text-gray-600">
            Side-by-side quarterly analysis comparison
          </p>
        </div>

        {/* Company Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Select Company</CardTitle>
            <CardDescription>Choose a company to compare its data and project analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedCompanyId?.toString()}
              onValueChange={(value) => setSelectedCompanyId(parseInt(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a company..." />
              </SelectTrigger>
              <SelectContent>
                {companies.map((comp) => (
                  <SelectItem key={comp.id} value={comp.id.toString()}>
                    {comp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedCompanyId && company && project && (
          <>
            {/* Company Information & Product Offerings */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {company.name} - Company Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="overview">Company Overview</TabsTrigger>
                    <TabsTrigger value="products">Product Offerings</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="mt-6">
                    <div className="space-y-4">
                      {company.description && (
                        <div>
                          <h4 className="font-semibold mb-2">Description</h4>
                          <p className="text-muted-foreground leading-relaxed">{company.description}</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold mb-2">Founded</h4>
                          <p className="text-muted-foreground">{new Date(company.founded_since).getFullYear()}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-2">Website</h4>
                          <a 
                            href={company.url.startsWith('http') ? company.url : `https://${company.url}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            {company.url}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-2">Status</h4>
                          <Badge variant={company.is_active ? 'default' : 'secondary'}>
                            {company.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>

                        {(company.regional_presence?.countries || company.regional_presence?.primary_markets) && (
                          <div>
                            <h4 className="font-semibold mb-2">Regional Presence</h4>
                            <div className="flex flex-wrap gap-1">
                              {(company.regional_presence.countries || company.regional_presence.primary_markets || []).map((region, index) => (
                                <Badge key={index} variant="outline">{region}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="products" className="mt-6">
                    {company.product_offerings ? (
                      <ProductOfferingsDisplay offerings={company.product_offerings} />
                    ) : (
                      <div className="text-center py-8">
                        <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No product offerings available</h3>
                        <p className="text-muted-foreground">Product information not available for this company</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Year and Quarter Selection */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Select Time Period for Comparison</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-md font-medium mb-2">Select Year</h3>
                  <div className="flex flex-wrap gap-2">
                    {[2024, 2023, 2022].map(year => (
                      <Button 
                        key={year}
                        variant={selectedYear === year ? "default" : "outline"}
                        onClick={() => {
                          setSelectedYear(year);
                          setSelectedQuarter(null);
                        }}
                      >
                        {year}
                      </Button>
                    ))}
                  </div>
                </div>

                {selectedYear && (
                  <div>
                    <h3 className="text-md font-medium mb-2">Select Quarter</h3>
                    <div className="flex flex-wrap gap-2">
                      {['Q1', 'Q2', 'Q3', 'Q4'].map(quarter => (
                        <Button
                          key={quarter}
                          variant={selectedQuarter === quarter ? "default" : "outline"}
                          onClick={() => setSelectedQuarter(quarter)}
                        >
                          {quarter}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Comparison Display */}
            {selectedYear && selectedQuarter && (
              <div className="mb-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold">
                    Comparison for {selectedYear} {selectedQuarter}
                  </h2>
                  {(companyQuarterlyData.length > 0 || projectQuarterlyData.length > 0) && (
                    <Button
                      onClick={downloadComparisonPDF}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download Comparison PDF
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Company Analysis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Company Analysis</CardTitle>
                      <CardDescription>Direct company data analysis</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {companyQuarterlyData.length === 0 ? (
                        <div className="text-center py-8">
                          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold text-foreground mb-2">No company analysis found</h3>
                          <p className="text-muted-foreground">
                            No company analysis data available for {selectedYear} {selectedQuarter}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {companyQuarterlyData.map(data => (
                            <div key={data.id} className="space-y-3">
                              <p className="text-sm leading-relaxed">{data.information}</p>
                              
                              {/* Show key sections */}
                              {data.extra_info.business_model && data.extra_info.business_model.length > 0 && (
                                <div>
                                  <h5 className="font-medium text-primary mb-2">Business Model</h5>
                                  <ul className="space-y-1">
                                    {data.extra_info.business_model.slice(0, 3).map((item, index) => (
                                      <li key={index} className="text-xs flex items-start gap-2">
                                        <span className="text-primary">•</span>
                                        <span className="flex-1">{item.content}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {data.extra_info.products && data.extra_info.products.length > 0 && (
                                <div>
                                  <h5 className="font-medium text-primary mb-2">Products</h5>
                                  <ul className="space-y-1">
                                    {data.extra_info.products.slice(0, 3).map((item, index) => (
                                      <li key={index} className="text-xs flex items-start gap-2">
                                        <span className="text-primary">•</span>
                                        <span className="flex-1">{item.content}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Project Analysis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Project Analysis</CardTitle>
                      <CardDescription>Website/project evolution analysis</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {projectQuarterlyData.length === 0 ? (
                        <div className="text-center py-8">
                          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold text-foreground mb-2">No project analysis found</h3>
                          <p className="text-muted-foreground">
                            No project analysis data available for {selectedYear} {selectedQuarter}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {projectQuarterlyData.map(analysis => (
                            <div key={analysis.id} className="space-y-3">
                              <p className="text-sm leading-relaxed">{analysis.information}</p>
                              
                              {/* Show key sections */}
                              {analysis.business_model && analysis.business_model.length > 0 && (
                                <div>
                                  <h5 className="font-medium text-primary mb-2">Business Model</h5>
                                  <ul className="space-y-1">
                                    {analysis.business_model.slice(0, 3).map((item, index) => (
                                      <li key={index} className="text-xs flex items-start gap-2">
                                        <span className="text-primary">•</span>
                                        <span className="flex-1">{item.content}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {analysis.products && analysis.products.length > 0 && (
                                <div>
                                  <h5 className="font-medium text-primary mb-2">Products</h5>
                                  <ul className="space-y-1">
                                    {analysis.products.slice(0, 3).map((item, index) => (
                                      <li key={index} className="text-xs flex items-start gap-2">
                                        <span className="text-primary">•</span>
                                        <span className="flex-1">{item.content}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ComparisonPage;