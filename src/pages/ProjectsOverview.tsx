import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { Project, Company, apiService } from '@/services/api';
import { ExternalLink, Calendar, BarChart3 } from 'lucide-react';

const ProjectsOverview: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [projectsData, companiesData] = await Promise.all([
          apiService.getProjectsOverview(),
          apiService.getCompanies()
        ]);
        setProjects(projectsData);
        setCompanies(companiesData);
      } catch (err) {
        setError('Failed to load projects data');
        console.error('Error loading projects:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Wayback Analysis Projects</h1>
          <p className="text-muted-foreground mt-2">
            Explore historical snapshots and changes across fintech companies
          </p>
        </div>
        <Button onClick={() => navigate('/')}>
          Back to Companies
        </Button>
      </div>

      {projects.filter(project => project.is_active).length === 0 ? (
        <div className="text-center py-12">
          <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No active projects found</h3>
          <p className="text-muted-foreground">No active wayback analysis projects are available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.filter(project => project.is_active).map(project => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              onClick={() => navigate(`/projects/${project.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => (
  <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
    <CardHeader>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <CardTitle className="text-lg">{project.name}</CardTitle>
          <CardDescription className="mt-1">{project.company_name}</CardDescription>
        </div>
        <Badge variant={project.is_active ? 'default' : 'secondary'}>
          {project.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BarChart3 className="h-4 w-4" />
          <span>{project.snapshots_count} snapshots</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Updated {new Date(project.updated_at).toLocaleDateString()}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-primary">
          <ExternalLink className="h-4 w-4" />
          <span className="truncate">{project.url}</span>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default ProjectsOverview;