
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Calendar } from 'lucide-react';
import { Company } from '../services/api';

interface CompanyCardProps {
  company: Company;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ company }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/company/${company.id}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).getFullYear();
  };

  const truncateDescription = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 p-6 cursor-pointer border border-gray-200 hover:border-blue-300 transform hover:-translate-y-1"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
          {company.name}
        </h3>
        {company.url && (
          <a
            href={company.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-gray-400 hover:text-blue-600 transition-colors"
          >
            <ExternalLink size={18} />
          </a>
        )}
      </div>
      
      <p className="text-muted-foreground mb-4 leading-relaxed">{truncateDescription(company.description)}</p>
      
      <div className="flex items-center text-sm text-gray-500">
        <Calendar size={16} className="mr-2" />
        <span>Founded: {formatDate(company.founded_since)}</span>
      </div>
      
      {company.extra_info && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-600">{company.extra_info}</p>
        </div>
      )}
    </div>
  );
};

export default CompanyCard;
