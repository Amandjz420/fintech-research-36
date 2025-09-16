
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Company, apiService } from '../services/api';
import CompanyCard from '../components/CompanyCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { BarChart3 } from 'lucide-react';

const Landing = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getCompanies();
      setCompanies(data);
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/projects')}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              View Wayback Analysis Projects
            </Button>
            <Button 
              onClick={() => navigate('/comparison')} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Compare Analysis
            </Button>
          </div>
        </div>

        {companies.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No companies found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Landing;
