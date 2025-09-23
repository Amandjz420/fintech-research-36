const API_BASE_URL = 'https://fintech.devmate.in';

export interface ProductOffering {
  name: string;
  features: string[];
  platform: string;
  description: string;
  target_market: string;
}

export interface Company {
  id: number;
  name: string;
  description: string;
  founded_since: string;
  url: string;
  is_active: boolean;
  metadata: {
    industry?: string;
    funding_stage?: string;
    employee_count?: string;
  };
  extra_info: string;
  product_offerings?: Record<string, ProductOffering[]>;
  regional_presence?: {
    primary_markets?: string[];
    served_cities?: string[];
    expansion_plans?: string[];
    licensing?: Record<string, string>;
    countries?: string[];
    major_cities?: string[];
    states_or_provinces?: string[];
  };
  created_at: string;
  updated_at: string;
}

export interface Entry {
  id: number;
  date: string;
  year: number;
  month: number;
  type: string;
  title: string;
  description: string;
  sources: string[];
  metadata: any;
  extra_info_text: string;
  extra_info_tags: string;
  extra_info_numbers: string;
}

export interface MonthData {
  [month: string]: Entry[];
}

export interface YearData {
  [year: string]: MonthData[];
}

export interface GroupedEntriesResponse {
  company_name: string;
  entry_year_wise: YearData[];
}

// Snapshots interfaces
export interface Project {
  id: number;
  name: string;
  url: string;
  company: number;
  company_name: string;
  is_active: boolean;
  snapshots_count: number;
  snapshots?: Snapshot[];
  created_at: string;
  updated_at: string;
}

export interface Snapshot {
  id: number;
  project: number;
  project_name: string;
  company_name: string;
  year: number;
  month: number;
  day: number;
  snapshot_date: string;
  snapshot_url: string;
  snapshot_text: string;
  word_count: number;
  relevant_links_data: string;
  relevant_links: RelevantLink[];
  analysis?: SnapshotAnalysis;
  created_at: string;
}

export interface RelevantLink {
  id: number;
  url: string;
  text: string;
  link_type: 'faq' | 'terms' | 'product' | 'about' | 'other';
  extracted_content?: ExtractedContent;
  created_at: string;
}

export interface ExtractedContent {
  id: number;
  content: string;
  extraction_method: 'crawl4ai' | 'crawl4ai_llm';
  created_at: string;
}

export interface SnapshotAnalysis {
  id: number;
  extracted_content: any;
  innovation_features: string[];
  loan_terms: any;
  business_model: any;
  technology_adoption: string[];
  process_innovations: any;
}

export interface QuarterlyAnalysis {
  id: number;
  quarter?: string;
  year?: number;
  information?: string;
  source?: string;
  business_model?: Array<{ content: string; sources: string }>;
  other?: Array<{ content: string; sources: string }>;
  processes?: Array<{ content: string; sources: string }>;
  products?: Array<{ content: string; sources: string }>;
  regions?: Array<{ content: string; sources: string }>;
  company?: number;
  created_at: string;
  updated_at: string;
}

export interface CompanyQuarterlyData {
  id: number;
  quarter: string;
  year: number;
  information: string;
  source: string;
  products?: Array<{ content: string; sources: string }>;
  processes?: Array<{ content: string; sources: string }>;
  business_model?: Array<{ content: string; sources: string }>;
  regions?: Array<{ content: string; sources: string }>;
  launches?: Array<{ content: string; sources: string }>;
  security_updates?: Array<{ content: string; sources: string }>;
  api_updates?: Array<{ content: string; sources: string }>;
  account_aggregator_updates?: Array<{ content: string; sources: string }>;
  other?: Array<{ content: string; sources: string }>;
  extra_info?: any;
  company: number;
}

export const apiService = {
  async getCompanies(): Promise<Company[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/companies`);
      if (!response.ok) {
        throw new Error('Failed to fetch companies');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
  },

  async getCompanyDetails(id: number): Promise<Company> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/companies/${id}/`);
      if (!response.ok) {
        throw new Error('Failed to fetch company details');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching company details:', error);
      throw error;
    }
  },

  async getGroupedEntries(companyId: number, includeCitations: boolean = false): Promise<GroupedEntriesResponse> {
    try {
      let response;
      if (includeCitations) {
        response = await fetch(`${API_BASE_URL}/api/grouped-entries/?company_id=${companyId}&include_citations=${includeCitations}`);
      } else {
        response = await fetch(`${API_BASE_URL}/api/grouped-entries/?company_id=${companyId}`);
      }
      if (!response.ok) {
        throw new Error('Failed to fetch grouped entries');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching grouped entries:', error);
      throw error;
    }
  },

  async processEntrySources(entryId: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/entries/${entryId}/process-sources/`, {
        method: 'GET',
      });
      if (!response.ok) {
        throw new Error('Failed to process entry sources');
      }
    } catch (error) {
      console.error('Error processing entry sources:', error);
      throw error;
    }
  },

  async updateRemarks(entryId: number, remarks: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/entries/${entryId}/update_remarks/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ remarks }),
      });
      if (!response.ok) {
        throw new Error('Failed to update remarks');
      }
    } catch (error) {
      console.error('Error updating remarks:', error);
      throw error;
    }
  },

  // Snapshots API methods
  async getProjectsOverview(): Promise<Project[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/snapshots/projects/`);
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  },

  async getProjectDetails(projectId: number): Promise<Project> {
    try {
      const response = await fetch(`${API_BASE_URL}/snapshots/projects/${projectId}/`);
      if (!response.ok) {
        throw new Error('Failed to fetch project details');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching project details:', error);
      throw error;
    }
  },

  async getProjectSnapshots(projectId: number, year?: number): Promise<Snapshot[]> {
    try {
      let url = `${API_BASE_URL}/snapshots/snapshots/?project=${projectId}`;
      if (year) url += `&year=${year}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch snapshots');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching snapshots:', error);
      throw error;
    }
  },

  async getSnapshotDetails(snapshotId: number): Promise<Snapshot> {
    try {
      const response = await fetch(`${API_BASE_URL}/snapshots/snapshots/${snapshotId}/`);
      if (!response.ok) {
        throw new Error('Failed to fetch snapshot details');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching snapshot details:', error);
      throw error;
    }
  },

  async processWayback(projectId: number, year: number, intervalDays: number = 30): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/snapshots/projects/${projectId}/process_wayback/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, interval_days: intervalDays })
      });
      if (!response.ok) {
        throw new Error('Failed to process wayback');
      }
      return await response.json();
    } catch (error) {
      console.error('Error processing wayback:', error);
      throw error;
    }
  },

  async checkUrlContent(url: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/snapshots/check-url-content/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      if (!response.ok) {
        throw new Error('Failed to check URL content');
      }
      return await response.json();
    } catch (error) {
      console.error('Error checking URL content:', error);
      throw error;
    }
  },

  async getQuarterlyAnalysis(projectId: number, year: number, quarter: string): Promise<QuarterlyAnalysis[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/snapshots/snapshot-analysis/?year=${year}&project=${projectId}&quarter=${quarter}`);
      if (!response.ok) {
        throw new Error('Failed to fetch quarterly analysis');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching quarterly analysis:', error);
      throw error;
    }
  },

  async getCompanyQuarterlyData(companyId: number, year: number, quarter: string): Promise<CompanyQuarterlyData[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/quarter-data/?company_id=${companyId}&year=${year}&quarter=${quarter.toLowerCase()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch company quarterly data');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching company quarterly data:', error);
      throw error;
    }
  },

  async processProjectQuarterlyAnalysis(projectId: number): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/snapshots/projects/${projectId}/quarterly_analysis/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        throw new Error('Failed to process project quarterly analysis');
      }
      return await response.json();
    } catch (error) {
      console.error('Error processing project quarterly analysis:', error);
      throw error;
    }
  },

  async processCompanyQuarterlyAnalysis(companyId: number): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/companies/${companyId}/quarterly_entry_analysis/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        throw new Error('Failed to process company quarterly analysis');
      }
      return await response.json();
    } catch (error) {
      console.error('Error processing company quarterly analysis:', error);
      throw error;
    }
  },

  async refreshEntry(entryId: number): Promise<Entry> {
    try {
      const response = await fetch(`https://fintech.devmate.in/api/entries/${entryId}/`);
      if (!response.ok) {
        throw new Error('Failed to refresh entry');
      }
      return await response.json();
    } catch (error) {
      console.error('Error refreshing entry:', error);
      throw error;
    }
  },

  async fetchYearlyUpdates(companyId: number, year: number, monthToStart: number): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/companies/${companyId}/fetch_yearly_updates/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year,
          month_to_start: monthToStart
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch yearly updates');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching yearly updates:', error);
      throw error;
    }
  },

  async getGroupedQuarterlyData(filters?: {
    company_id?: number;
    year?: number;
    quarter?: string;
  }): Promise<CompanyQuarterlyData[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.company_id) params.append('company_id', filters.company_id.toString());
      if (filters?.year) params.append('year', filters.year.toString());
      if (filters?.quarter) params.append('quarter', filters.quarter);

      const url = `${API_BASE_URL}/api/grouped-quarterly-data/${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch grouped quarterly data');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching grouped quarterly data:', error);
      throw error;
    }
  }
};
