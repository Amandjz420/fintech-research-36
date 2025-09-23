import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Company } from '@/services/api';

interface FilterState {
  company_id?: number;
  year?: number;
  quarter?: string;
}

interface DashboardFiltersProps {
  companies: Company[];
  onApplyFilters: (filters: FilterState) => void;
  onResetFilters: () => void;
  currentFilters: FilterState;
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  companies,
  onApplyFilters,
  onResetFilters,
  currentFilters
}) => {
  const [localFilters, setLocalFilters] = useState<FilterState>(currentFilters);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  const quarters = ['q1', 'q2', 'q3', 'q4'];

  const handleApply = () => {
    onApplyFilters(localFilters);
  };

  const handleReset = () => {
    setLocalFilters({});
    onResetFilters();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
      <div className="space-y-2">
        <Label htmlFor="company-select">Company</Label>
        <Select
          value={localFilters.company_id?.toString() || "all"}
          onValueChange={(value) => {
            setLocalFilters(prev => ({ 
              ...prev, 
              company_id: value === "all" ? undefined : parseInt(value)
            }));
          }}
        >
          <SelectTrigger id="company-select">
            <SelectValue placeholder="Select company" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Companies</SelectItem>
            {companies.map(company => (
              <SelectItem key={company.id} value={company.id.toString()}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="year-select">Year</Label>
        <Select
          value={localFilters.year?.toString() || "all"}
          onValueChange={(value) => 
            setLocalFilters(prev => ({ 
              ...prev, 
              year: value === "all" ? undefined : parseInt(value)
            }))
          }
        >
          <SelectTrigger id="year-select">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {years.map(year => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Quarter</Label>
        <RadioGroup
          value={localFilters.quarter || "all"}
          onValueChange={(value) => 
            setLocalFilters(prev => ({ 
              ...prev, 
              quarter: value === "all" ? undefined : value
            }))
          }
          className="flex flex-row space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="all-quarters" />
            <Label htmlFor="all-quarters" className="text-sm">All</Label>
          </div>
          {quarters.map(quarter => (
            <div key={quarter} className="flex items-center space-x-2">
              <RadioGroupItem value={quarter} id={quarter} />
              <Label htmlFor={quarter} className="text-sm">{quarter.toUpperCase()}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="md:col-span-3 flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={handleReset}>
          Reset Filters
        </Button>
        <Button onClick={handleApply}>
          Apply Filters
        </Button>
      </div>
    </div>
  );
};