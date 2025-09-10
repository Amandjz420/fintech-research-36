import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { Snapshot, RelevantLink, SnapshotAnalysis, apiService } from '@/services/api';
import { ArrowLeft, ExternalLink, FileText, Calendar, BarChart3, Link } from 'lucide-react';

const SnapshotDetail: React.FC = () => {
  const { snapshotId } = useParams<{ snapshotId: string }>();
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSnapshot = async () => {
      if (!snapshotId) return;

      try {
        setLoading(true);
        const snapshotData = await apiService.getSnapshotDetails(parseInt(snapshotId));
        setSnapshot(snapshotData);
      } catch (err) {
        setError('Failed to load snapshot details');
        console.error('Error loading snapshot:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSnapshot();
  }, [snapshotId]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!snapshot) return <ErrorMessage message="Snapshot not found" />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(`/projects/${snapshot.project}`)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Project
        </Button>
      </div>

      {/* Snapshot Header */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">
            {snapshot.project_name} - {snapshot.company_name}
          </CardTitle>
          <CardDescription className="text-lg">
            Captured: {new Date(snapshot.snapshot_date).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span>Word Count: {snapshot.word_count.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span>Year: {snapshot.year}</span>
            </div>
            <div className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-primary" />
              <a 
                href={snapshot.snapshot_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                View Original Archive
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Content */}
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content">Snapshot Content</TabsTrigger>
          <TabsTrigger value="links">
            Relevant Links ({snapshot.relevant_links.length})
          </TabsTrigger>
          <TabsTrigger value="analysis" disabled={!snapshot.analysis}>
            AI Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="mt-6">
          <SnapshotContentView 
            content={snapshot.snapshot_text}
            linksData={snapshot.relevant_links_data}
          />
        </TabsContent>

        <TabsContent value="links" className="mt-6">
          <RelevantLinksView links={snapshot.relevant_links} />
        </TabsContent>

        <TabsContent value="analysis" className="mt-6">
          {snapshot.analysis && (
            <AnalysisView analysis={snapshot.analysis} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface SnapshotContentViewProps {
  content: string;
  linksData: string;
}

const SnapshotContentView: React.FC<SnapshotContentViewProps> = ({ content, linksData }) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Main Content
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-muted p-4 rounded-lg max-h-96 overflow-y-auto">
          <pre className="whitespace-pre-wrap text-sm font-mono">{content}</pre>
        </div>
      </CardContent>
    </Card>

    {linksData && (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Link className="h-5 w-5" />
            Extracted Links Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm font-mono">{linksData}</pre>
          </div>
        </CardContent>
      </Card>
    )}
  </div>
);

interface RelevantLinksViewProps {
  links: RelevantLink[];
}

const RelevantLinksView: React.FC<RelevantLinksViewProps> = ({ links }) => {
  const getLinkTypeColor = (type: string) => {
    const colors = {
      faq: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      terms: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      product: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      about: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  if (links.length === 0) {
    return (
      <div className="text-center py-12">
        <Link className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No relevant links found</h3>
        <p className="text-muted-foreground">No relevant links were extracted from this snapshot.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {links.map(link => (
        <Card key={link.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-base">{link.text || 'Untitled Link'}</CardTitle>
              <Badge className={getLinkTypeColor(link.link_type)}>
                {link.link_type}
              </Badge>
            </div>
            <CardDescription>
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                {link.url}
              </a>
            </CardDescription>
          </CardHeader>
          {link.extracted_content && (
            <CardContent>
              <div>
                <h5 className="font-medium text-sm mb-2">Extracted Content:</h5>
                <div className="bg-muted p-3 rounded-lg max-h-48 overflow-y-auto">
                  <p className="text-sm">{link.extracted_content.content}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Method: {link.extracted_content.extraction_method}
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};

interface AnalysisViewProps {
  analysis: SnapshotAnalysis;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {analysis.innovation_features?.length > 0 && (
      <AnalysisSection 
        title="Innovation Features" 
        items={analysis.innovation_features} 
      />
    )}

    {analysis.technology_adoption?.length > 0 && (
      <AnalysisSection 
        title="Technology Adoption" 
        items={analysis.technology_adoption} 
      />
    )}

    {analysis.loan_terms && (
      <AnalysisSection 
        title="Loan Terms" 
        data={analysis.loan_terms} 
      />
    )}

    {analysis.business_model && (
      <AnalysisSection 
        title="Business Model" 
        data={analysis.business_model} 
      />
    )}
  </div>
);

interface AnalysisSectionProps {
  title: string;
  items?: string[];
  data?: any;
}

const AnalysisSection: React.FC<AnalysisSectionProps> = ({ title, items, data }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg flex items-center gap-2">
        <BarChart3 className="h-5 w-5" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      {items && (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
              <span className="text-sm">{item}</span>
            </li>
          ))}
        </ul>
      )}
      {data && (
        <div className="bg-muted p-3 rounded-lg">
          <pre className="text-sm font-mono whitespace-pre-wrap">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </CardContent>
  </Card>
);

export default SnapshotDetail;