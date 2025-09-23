
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Company, apiService } from '../services/api';
import CompanyCard from '../components/CompanyCard';
import CompanyListItem from '../components/CompanyListItem';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { Search, Grid3X3, List, BarChart3, TrendingUp, ArrowRight } from 'lucide-react';

const Landing = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const navigate = useNavigate();

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
