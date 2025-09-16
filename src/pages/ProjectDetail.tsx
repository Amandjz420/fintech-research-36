import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import ProductOfferingsDisplay from '@/components/ProductOfferingsDisplay';
import { Project, Snapshot, QuarterlyAnalysis, Company, apiService } from '@/services/api';
import { ArrowLeft, ExternalLink, Calendar, FileText, BarChart3, Package, Download } from 'lucide-react';
import jsPDF from 'jspdf';

const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(2024);
  const [selectedQuarter, setSelectedQuarter] = useState<string | null>(null);
  const [groupedSnapshots, setGroupedSnapshots] = useState<Record<number, Snapshot[]>>({});
  const [quarterlyAnalysis, setQuarterlyAnalysis] = useState<QuarterlyAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const groupSnapshotsByYear = (snapshots: Snapshot[]): Record<number, Snapshot[]> => {
    return snapshots.reduce((acc, snapshot) => {
      const year = snapshot.year;
      if (!acc[year]) acc[year] = [];
      acc[year].push(snapshot);
      return acc;
    }, {} as Record<number, Snapshot[]>);
  };

  const sortSnapshotsByDate = (snapshots: Snapshot[]): Snapshot[] => {
    return snapshots.sort((a, b) =>
      new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime()
    );
  };

  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return;
      
      try {
        setLoading(true);
        const projectData = await apiService.getProjectDetails(parseInt(projectId));
        
        setProject(projectData);

        // Load company details using the company ID from project
        if (projectData.company) {
          try {
            const companyData = await apiService.getCompanyDetails(projectData.company);
            setCompany(companyData);
          } catch (err) {
            console.error('Error loading company details:', err);
          }
        }
        
        // Use snapshots from project data instead of calling separate snapshots API
        if (projectData.snapshots) {
          let filteredSnapshots = projectData.snapshots;
          
          // Filter by selected year if specified
          if (selectedYear) {
            filteredSnapshots = projectData.snapshots.filter(snapshot => snapshot.year === selectedYear);
          }
          
          const sortedSnapshots = sortSnapshotsByDate(filteredSnapshots);
          setSnapshots(sortedSnapshots);
          setGroupedSnapshots(groupSnapshotsByYear(projectData.snapshots));
        } else {
          setSnapshots([]);
          setGroupedSnapshots({});
        }
      } catch (err) {
        setError('Failed to load project data');
        console.error('Error loading project:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId, selectedYear]);

  useEffect(() => {
    const loadQuarterlyAnalysis = async () => {
      if (!projectId || !selectedYear || !selectedQuarter) {
        setQuarterlyAnalysis([]);
        return;
      }
      
      try {
        const analysisData = await apiService.getQuarterlyAnalysis(
          parseInt(projectId),
          selectedYear,
          selectedQuarter
        );
        setQuarterlyAnalysis(analysisData);
      } catch (err) {
        console.error('Error loading quarterly analysis:', err);
        setQuarterlyAnalysis([]);
      }
    };

    loadQuarterlyAnalysis();
  }, [projectId, selectedYear, selectedQuarter]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!project) return <ErrorMessage message="Project not found" />;

  const availableYears = Object.keys(groupedSnapshots).map(Number).sort((a, b) => b - a);

  const downloadQuarterlyAnalysisPDF = (analyses: QuarterlyAnalysis[], projectName: string, year: number, quarter: string) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const usableWidth = pageWidth - 2 * margin;

    analyses.forEach((analysis, index) => {
      if (index > 0) pdf.addPage();
      
      let yPosition = margin;
      
      // Title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${projectName} - ${year} ${quarter} Analysis`, margin, yPosition);
      yPosition += 15;
      
      // Information
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      if (analysis.information) {
        const infoLines = pdf.splitTextToSize(analysis.information, usableWidth);
        pdf.text(infoLines, margin, yPosition);
        yPosition += infoLines.length * 6 + 10;
      }
      
      // Business Model
      if (analysis.business_model && analysis.business_model.length > 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Business Model:', margin, yPosition);
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
        analysis.business_model.forEach(item => {
          const lines = pdf.splitTextToSize(`• ${item.content}`, usableWidth - 10);
          pdf.text(lines, margin + 5, yPosition);
          yPosition += lines.length * 6 + 2;
        });
        yPosition += 5;
      }
      
      // Products
      if (analysis.products && analysis.products.length > 0) {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.setFont('helvetica', 'bold');
        pdf.text('Products:', margin, yPosition);
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
        analysis.products.forEach(item => {
          const lines = pdf.splitTextToSize(`• ${item.content}`, usableWidth - 10);
          pdf.text(lines, margin + 5, yPosition);
          yPosition += lines.length * 6 + 2;
        });
        yPosition += 5;
      }
      
      // Processes
      if (analysis.processes && analysis.processes.length > 0) {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.setFont('helvetica', 'bold');
        pdf.text('Processes:', margin, yPosition);
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
        analysis.processes.forEach(item => {
          const lines = pdf.splitTextToSize(`• ${item.content}`, usableWidth - 10);
          pdf.text(lines, margin + 5, yPosition);
          yPosition += lines.length * 6 + 2;
        });
        yPosition += 5;
      }
      
      // Regions
      if (analysis.regions && analysis.regions.length > 0) {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.setFont('helvetica', 'bold');
        pdf.text('Regions:', margin, yPosition);
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
        analysis.regions.forEach(item => {
          const lines = pdf.splitTextToSize(`• ${item.content}`, usableWidth - 10);
          pdf.text(lines, margin + 5, yPosition);
          yPosition += lines.length * 6 + 2;
        });
        yPosition += 5;
      }
      
      // Other
      if (analysis.other && analysis.other.length > 0) {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.setFont('helvetica', 'bold');
        pdf.text('Other Information:', margin, yPosition);
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
        analysis.other.forEach(item => {
          const lines = pdf.splitTextToSize(`• ${item.content}`, usableWidth - 10);
          pdf.text(lines, margin + 5, yPosition);
          yPosition += lines.length * 6 + 2;
        });
      }
    });
    
    pdf.save(`${projectName}_${year}_${quarter}_Analysis.pdf`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Button>
      </div>

      {/* Project Header */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{project.name}</CardTitle>
              <CardDescription className="text-lg mt-2">
                Company: {project.company_name}
              </CardDescription>
            </div>
            <Badge variant={project.is_active ? 'default' : 'secondary'}>
              {project.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <span>Total Snapshots: {project.snapshots_count}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span>Updated: {new Date(project.updated_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-primary" />
              <a 
                href={project.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline truncate"
              >
                {project.url}
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

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
                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-muted-foreground">{company.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Founded</h4>
                      <p className="text-muted-foreground">{new Date(company.founded_since).getFullYear()}</p>
                    </div>
                    
                    {company.metadata?.industry && (
                      <div>
                        <h4 className="font-semibold mb-2">Industry</h4>
                        <Badge variant="outline">{company.metadata.industry}</Badge>
                      </div>
                    )}
                    
                    {company.metadata?.funding_stage && (
                      <div>
                        <h4 className="font-semibold mb-2">Funding Stage</h4>
                        <Badge variant="outline">{company.metadata.funding_stage}</Badge>
                      </div>
                    )}
                    
                    {company.metadata?.employee_count && (
                      <div>
                        <h4 className="font-semibold mb-2">Employee Count</h4>
                        <Badge variant="outline">{company.metadata.employee_count}</Badge>
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

      {/* Year Selection */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Analysis by Year & Quarter</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-md font-medium mb-2">Select Year</h3>
            <div className="flex flex-wrap gap-2">
              {availableYears.map(year => (
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

      {/* Quarterly Analysis Display */}
      {selectedYear && selectedQuarter && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              Analysis for {selectedYear} {selectedQuarter}
            </h2>
            {quarterlyAnalysis.length > 0 && (
              <Button
                onClick={() => downloadQuarterlyAnalysisPDF(quarterlyAnalysis, project.name, selectedYear, selectedQuarter)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            )}
          </div>
          {quarterlyAnalysis.length === 0 ? (
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
              {quarterlyAnalysis.map(analysis => (
                <QuarterlyAnalysisCard key={analysis.id} analysis={analysis} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Snapshots Timeline */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Snapshots Timeline</h2>
        <div className="mb-4">
          <h3 className="text-md font-medium mb-2">Filter by Year</h3>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={selectedYear === null ? "default" : "outline"}
              onClick={() => setSelectedYear(null)}
            >
              All Years
            </Button>
            {availableYears.map(year => (
              <Button
                key={year}
                variant={selectedYear === year ? "default" : "outline"}
                onClick={() => setSelectedYear(year)}
              >
                {year} ({groupedSnapshots[year]?.length || 0})
              </Button>
            ))}
          </div>
        </div>
        
        {snapshots.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No snapshots found</h3>
            <p className="text-muted-foreground">
              {selectedYear ? `No snapshots available for ${selectedYear}` : 'No snapshots available for this project'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {snapshots.map(snapshot => (
              <SnapshotCard 
                key={snapshot.id}
                snapshot={snapshot}
                onClick={() => navigate(`/snapshots/${snapshot.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface SnapshotCardProps {
  snapshot: Snapshot;
  onClick: () => void;
}

const SnapshotCard: React.FC<SnapshotCardProps> = ({ snapshot, onClick }) => (
  <Card className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary" onClick={onClick}>
    <CardContent className="pt-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-semibold text-lg">
            {new Date(snapshot.snapshot_date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </h4>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {snapshot.word_count.toLocaleString()} words
            </p>
            {snapshot.relevant_links.length > 0 && (
              <p className="text-xs text-primary flex items-center gap-2">
                <ExternalLink className="h-3 w-3" />
                {snapshot.relevant_links.length} relevant links extracted
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <Badge variant="outline">{snapshot.year}</Badge>
          {snapshot.analysis && (
            <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              AI Analyzed
            </div>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

interface QuarterlyAnalysisCardProps {
  analysis: QuarterlyAnalysis;
}

const QuarterlyAnalysisCard: React.FC<QuarterlyAnalysisCardProps> = ({ analysis }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-xl">Quarterly Analysis</CardTitle>
      <CardDescription>{analysis.information}</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Business Model */}
        {analysis.business_model && analysis.business_model.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 text-primary">Business Model</h4>
            <div className="space-y-3">
              {analysis.business_model.map((item, index) => (
                <div key={index} className="text-sm">
                  <div className="flex items-start gap-2">
                    <span>{item.content}</span>
                    <button
                      onClick={() => window.open(item.sources, '_blank')}
                      className="text-primary hover:text-primary/80 transition-colors"
                      title="View source"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Products */}
        {analysis.products && analysis.products.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 text-primary">Products</h4>
            <div className="space-y-3">
              {analysis.products.map((item, index) => (
                <div key={index} className="text-sm">
                  <div className="flex items-start gap-2">
                    <span>{item.content}</span>
                    <button
                      onClick={() => window.open(item.sources, '_blank')}
                      className="text-primary hover:text-primary/80 transition-colors"
                      title="View source"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Processes */}
        {analysis.processes && analysis.processes.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 text-primary">Processes</h4>
            <div className="space-y-3">
              {analysis.processes.map((item, index) => (
                <div key={index} className="text-sm">
                  <div className="flex items-start gap-2">
                    <span>{item.content}</span>
                    <button
                      onClick={() => window.open(item.sources, '_blank')}
                      className="text-primary hover:text-primary/80 transition-colors"
                      title="View source"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Regions */}
        {analysis.regions && analysis.regions.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 text-primary">Regions</h4>
            <div className="space-y-3">
              {analysis.regions.map((item, index) => (
                <div key={index} className="text-sm">
                  <div className="flex items-start gap-2">
                    <span>{item.content}</span>
                    <button
                      onClick={() => window.open(item.sources, '_blank')}
                      className="text-primary hover:text-primary/80 transition-colors"
                      title="View source"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other */}
        {analysis.other && analysis.other.length > 0 && (
          <div className="md:col-span-2">
            <h4 className="font-semibold mb-3 text-primary">Other</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.other.map((item, index) => (
                <div key={index} className="text-sm">
                  <div className="flex items-start gap-2">
                    <span>{item.content}</span>
                    <button
                      onClick={() => window.open(item.sources, '_blank')}
                      className="text-primary hover:text-primary/80 transition-colors"
                      title="View source"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);


export default ProjectDetail;