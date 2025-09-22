import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Calendar } from 'lucide-react';
import { Company } from '../services/api';

interface CompanyListItemProps {
  company: Company;
}

const CompanyListItem: React.FC<CompanyListItemProps> = ({ company }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/company/${company.id}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).getFullYear();
  };

  return (
    <div
      onClick={handleClick}
      className="bg-card hover:bg-accent/50 transition-colors duration-200 p-4 cursor-pointer border-b border-border last:border-b-0"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground hover:text-primary transition-colors line-clamp-1">
                {company.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {company.description}
              </p>
              {company.extra_info && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {company.extra_info}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>Founded: {formatDate(company.founded_since)}</span>
              </div>
              
              {company.url && (
                <a
                  href={company.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyListItem;