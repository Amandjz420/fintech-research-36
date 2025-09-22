import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Calendar, BarChart3, Package, Download, Play } from 'lucide-react';
import jsPDF from 'jspdf';
import { GroupedEntriesResponse, CompanyQuarterlyData, Company, apiService } from '../services/api';
import YearAccordion from '../components/YearAccordion';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import ProductOfferingsDisplay from '../components/ProductOfferingsDisplay';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from '../hooks/use-toast';

const CompanyDetail = () => {
  console.log('CompanyDetail component rendered');
  const { companyId } = useParams<{ companyId: string }>();
  console.log('Company ID from params:', companyId);
  const navigate = useNavigate();
  const [data, setData] = useState<GroupedEntriesResponse | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includeCitations, setIncludeCitations] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | null>(2024);
  const [selectedQuarter, setSelectedQuarter] = useState<string | null>(null);
  const [quarterlyData, setQuarterlyData] = useState<CompanyQuarterlyData[]>([]);
  const [fetchYear, setFetchYear] = useState<number>(new Date().getFullYear());
  const [fetchMonth, setFetchMonth] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = async () => {
    console.log('fetchData called with companyId:', companyId);
    if (!companyId) {
      console.log('No companyId provided');
      setError('Company ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Fetching data with includeCitations:', includeCitations);
      
      // Load both grouped entries and company details
      console.log('About to fetch data for companyId:', parseInt(companyId));
      const [entriesResponse, companyResponse] = await Promise.all([
        apiService.getGroupedEntries(parseInt(companyId), includeCitations),
        apiService.getCompanyDetails(parseInt(companyId))
      ]);
      
      console.log('Received entriesResponse:', entriesResponse);
      console.log('Received companyResponse:', companyResponse);
      
      setData(entriesResponse);
      setCompany(companyResponse);
    } catch (err) {
      console.error('Detailed error fetching company data:', err);
      setError(`Failed to load company data: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('useEffect triggered for fetchData with companyId:', companyId, 'includeCitations:', includeCitations);
    fetchData();
  }, [companyId, includeCitations]);

  useEffect(() => {
    const loadQuarterlyData = async () => {
      if (!companyId || !selectedYear || !selectedQuarter) {
        setQuarterlyData([]);
        return;
      }
      
      try {
        const data = await apiService.getCompanyQuarterlyData(
          parseInt(companyId),
          selectedYear,
          selectedQuarter
        );
        setQuarterlyData(data);
      } catch (err) {
        console.error('Error loading company quarterly data:', err);
        setQuarterlyData([]);
      }
    };

    loadQuarterlyData();
  }, [companyId, selectedYear, selectedQuarter]);

  const handleCitationToggle = (checked: boolean) => {
    console.log('Toggle changed to:', checked);
    setIncludeCitations(checked);
  };

  const handleRefreshEntry = async (entryId: number) => {
    try {
      const refreshedEntry = await apiService.refreshEntry(entryId);
      
      // Update the entry in the current data
      if (data) {
        const updatedData = { ...data };
        updatedData.entry_year_wise = updatedData.entry_year_wise.map(yearObj => {
          const year = Object.keys(yearObj)[0];
          const monthsData = yearObj[year];
          const updatedMonthsData = { ...monthsData };
          
          Object.keys(updatedMonthsData).forEach(month => {
            updatedMonthsData[month] = updatedMonthsData[month].map(entry => 
              entry.id === entryId ? refreshedEntry : entry
            );
          });
          
          return { [year]: updatedMonthsData };
        });
        
        setData(updatedData);
      }
    } catch (error) {
      console.error('Error refreshing entry:', error);
    }
  };

  const handleFetchYearlyUpdates = async () => {
    if (!companyId) return;
    
    setIsProcessing(true);
    try {
      await apiService.fetchYearlyUpdates(parseInt(companyId), fetchYear, fetchMonth);
      toast({
        title: "Processing Started",
        description: `Yearly updates processing has been initiated for ${fetchYear} starting from month ${fetchMonth}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start yearly updates processing",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadCompanyQuarterlyPDF = (data: CompanyQuarterlyData[], companyName: string, year: number, quarter: string) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const usableWidth = pageWidth - 2 * margin;

    data.forEach((item, index) => {
      if (index > 0) pdf.addPage();
      
      let yPosition = margin;
      
      // Title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${companyName} - ${year} ${quarter} Analysis`, margin, yPosition);
      yPosition += 15;
      
      // Information
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      if (item.information) {
        const infoLines = pdf.splitTextToSize(item.information, usableWidth);
        pdf.text(infoLines, margin, yPosition);
        yPosition += infoLines.length * 6 + 10;
      }
      
      // Business Model
      if (item.extra_info.business_model && item.extra_info.business_model.length > 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Business Model:', margin, yPosition);
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
        item.extra_info.business_model.forEach(businessItem => {
          const lines = pdf.splitTextToSize(`• ${businessItem.content}`, usableWidth - 10);
          pdf.text(lines, margin + 5, yPosition);
          yPosition += lines.length * 6 + 2;
        });
        yPosition += 5;
      }
      
      // Products
      if (item.extra_info.products && item.extra_info.products.length > 0) {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.setFont('helvetica', 'bold');
        pdf.text('Products:', margin, yPosition);
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
        item.extra_info.products.forEach(product => {
          const lines = pdf.splitTextToSize(`• ${product.content}`, usableWidth - 10);
          pdf.text(lines, margin + 5, yPosition);
          yPosition += lines.length * 6 + 2;
        });
        yPosition += 5;
      }
      
      // Processes
      if (item.extra_info.processes && item.extra_info.processes.length > 0) {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.setFont('helvetica', 'bold');
        pdf.text('Processes:', margin, yPosition);
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
        item.extra_info.processes.forEach(process => {
          const lines = pdf.splitTextToSize(`• ${process.content}`, usableWidth - 10);
          pdf.text(lines, margin + 5, yPosition);
          yPosition += lines.length * 6 + 2;
        });
        yPosition += 5;
      }
      
      // Regions
      if (item.extra_info.regions && item.extra_info.regions.length > 0) {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.setFont('helvetica', 'bold');
        pdf.text('Regions:', margin, yPosition);
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
        item.extra_info.regions.forEach(region => {
          const lines = pdf.splitTextToSize(`• ${region.content}`, usableWidth - 10);
          pdf.text(lines, margin + 5, yPosition);
          yPosition += lines.length * 6 + 2;
        });
        yPosition += 5;
      }
      
      // Other
      if (item.extra_info.other && item.extra_info.other.length > 0) {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.setFont('helvetica', 'bold');
        pdf.text('Other Information:', margin, yPosition);
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
        item.extra_info.other.forEach(otherItem => {
          const lines = pdf.splitTextToSize(`• ${otherItem.content}`, usableWidth - 10);
          pdf.text(lines, margin + 5, yPosition);
          yPosition += lines.length * 6 + 2;
        });
      }
    });
    
    pdf.save(`${companyName}_${year}_${quarter}_Analysis.pdf`);
  };

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
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Companies
          </button>
          
        </div>
          <ErrorMessage message={error} onRetry={fetchData} />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No data found for this company.</p>
          </div>
        </div>
      </div>
    );
  }

  // Sort years in descending order
  const sortedYears = data.entry_year_wise
    .map(yearObj => Object.keys(yearObj)[0])
    .sort((a, b) => parseInt(b) - parseInt(a));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="mb-6 inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Companies
        </button>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-6 mb-4">
            <h1 className="text-4xl font-bold text-gray-900">
              {data.company_name}
            </h1>
            <div className="flex items-center space-x-2">
              <Switch
                id="include-citations"
                checked={includeCitations}
                onCheckedChange={handleCitationToggle}
              />
              <Label htmlFor="include-citations" className="text-sm font-medium">
                Include Citation Extra Links
              </Label>
            </div>
          </div>
          <p className="text-xl text-gray-600">
            Company Analytics & Timeline
          </p>
        </div>

        {/* Company Information & Product Offerings */}
        {company && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Company Information
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
        )}

        {/* Fetch Yearly Updates Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Fetch Yearly Updates
            </CardTitle>
            <CardDescription>
              Process yearly updates for this company by selecting a year and starting month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Year</label>
                <Select value={fetchYear.toString()} onValueChange={(value) => setFetchYear(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: new Date().getFullYear() - 2013 }, (_, i) => 2014 + i).map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Starting Month</label>
                <Select value={fetchMonth.toString()} onValueChange={(value) => setFetchMonth(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <SelectItem key={month} value={month.toString()}>
                        {new Date(0, month - 1).toLocaleString('default', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleFetchYearlyUpdates}
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                {isProcessing ? 'Processing...' : 'Start Processing'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quarterly Analysis Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Quarterly Analysis</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-md font-medium mb-2">Select Year</h3>
              <div className="flex flex-wrap gap-2">
                {sortedYears.map(year => (
                  <Button 
                    key={year}
                    variant={selectedYear === parseInt(year) ? "default" : "outline"}
                    onClick={() => {
                      setSelectedYear(parseInt(year));
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

        {/* Quarterly Data Display */}
        {selectedYear && selectedQuarter && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                Analysis for {selectedYear} {selectedQuarter}
              </h2>
              {quarterlyData.length > 0 && (
                <Button
                  onClick={() => downloadCompanyQuarterlyPDF(quarterlyData, data.company_name, selectedYear, selectedQuarter)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
              )}
            </div>
            {quarterlyData.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No analysis found</h3>
                    <p className="text-muted-foreground">
                      No quarterly analysis data available for {selectedYear} {selectedQuarter}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {quarterlyData.map(data => (
                  <CompanyQuarterlyCard key={data.id} data={data} />
                ))}
              </div>
            )}
          </div>
        )}

        {sortedYears.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No entries found for this company.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedYears.map((year) => {
              const yearData = data.entry_year_wise.find(yearObj => 
                Object.keys(yearObj)[0] === year
              );
              if (!yearData) return null;
              
              // Merge all month objects for this year
              const allMonthsData = yearData[year].reduce((acc, monthObj) => {
                return { ...acc, ...monthObj };
              }, {});
              
              return (
                <YearAccordion
                  key={year}
                  year={year}
                  monthsData={allMonthsData}
                  onRefreshEntry={handleRefreshEntry}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

interface CompanyQuarterlyCardProps {
  data: CompanyQuarterlyData;
}

const CompanyQuarterlyCard: React.FC<CompanyQuarterlyCardProps> = ({ data }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-xl">Quarterly Summary</CardTitle>
      <CardDescription className="text-base leading-relaxed">{data.information}</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Business Model */}
        <div>
          <h4 className="font-semibold mb-3 text-primary">Business Model</h4>
          {data.business_model && data.business_model.length > 0 ? (
            <ul className="space-y-2">
              {data.business_model.map((item, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span className="flex-1">{item.content}</span>
                  <a
                    href={item.sources}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground italic">No Updates</p>
          )}
        </div>

        {/* Products */}
        <div>
          <h4 className="font-semibold mb-3 text-primary">Products</h4>
          {data.products && data.products.length > 0 ? (
            <ul className="space-y-2">
              {data.products.map((item, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span className="flex-1">{item.content}</span>
                  <a
                    href={item.sources}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground italic">No Updates</p>
          )}
        </div>

        {/* Processes */}
        <div>
          <h4 className="font-semibold mb-3 text-primary">Processes</h4>
          {data.processes && data.processes.length > 0 ? (
            <ul className="space-y-2">
              {data.processes.map((item, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span className="flex-1">{item.content}</span>
                  <a
                    href={item.sources}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground italic">No Updates</p>
          )}
        </div>

        {/* Regions */}
        <div>
          <h4 className="font-semibold mb-3 text-primary">Regions</h4>
          {data.regions && data.regions.length > 0 ? (
            <ul className="space-y-2">
              {data.regions.map((item, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span className="flex-1">{item.content}</span>
                  <a
                    href={item.sources}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground italic">No Updates</p>
          )}
        </div>

        {/* Launches */}
        <div>
          <h4 className="font-semibold mb-3 text-primary">Launches</h4>
          {data.launches && data.launches.length > 0 ? (
            <ul className="space-y-2">
              {data.launches.map((item, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span className="flex-1">{item.content}</span>
                  <a
                    href={item.sources}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground italic">No Updates</p>
          )}
        </div>

        {/* Security Updates */}
        <div>
          <h4 className="font-semibold mb-3 text-primary">Security Updates</h4>
          {data.security_updates && data.security_updates.length > 0 ? (
            <ul className="space-y-2">
              {data.security_updates.map((item, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span className="flex-1">{item.content}</span>
                  <a
                    href={item.sources}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground italic">No Updates</p>
          )}
        </div>

        {/* API Updates */}
        <div>
          <h4 className="font-semibold mb-3 text-primary">API Updates</h4>
          {data.api_updates && data.api_updates.length > 0 ? (
            <ul className="space-y-2">
              {data.api_updates.map((item, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span className="flex-1">{item.content}</span>
                  <a
                    href={item.sources}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground italic">No Updates</p>
          )}
        </div>

        {/* Account Aggregator Updates */}
        <div>
          <h4 className="font-semibold mb-3 text-primary">Account Aggregator Updates</h4>
          {data.account_aggregator_updates && data.account_aggregator_updates.length > 0 ? (
            <ul className="space-y-2">
              {data.account_aggregator_updates.map((item, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span className="flex-1">{item.content}</span>
                  <a
                    href={item.sources}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground italic">No Updates</p>
          )}
        </div>

        {/* Other */}
        <div className="md:col-span-2">
          <h4 className="font-semibold mb-3 text-primary">Other Information</h4>
          {data.other && data.other.length > 0 ? (
            <ul className="space-y-2">
              {data.other.map((item, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span className="flex-1">{item.content}</span>
                  <a
                    href={item.sources}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground italic">No Updates</p>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);


export default CompanyDetail;
