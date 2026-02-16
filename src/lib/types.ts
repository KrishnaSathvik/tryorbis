export interface ProblemCluster {
  id: string;
  theme: string;
  painSummary: string;
  complaintCount: number;
  evidenceLinks: string[];
  complaints: string[];
}

export interface IdeaSuggestion {
  id: string;
  clusterId: string;
  name: string;
  description: string;
  mvpScope: string;
  monetization: string;
  demandScore: number; // 0-100
}

export interface GeneratorRun {
  id: string;
  persona: string;
  category: string;
  region?: string;
  budgetScope?: string;
  platform?: string;
  problemClusters: ProblemCluster[];
  ideaSuggestions: IdeaSuggestion[];
  createdAt: string;
}

export interface ValidationScore {
  demand: number; // 0-100
  pain: number;
  competition: number;
  mvpFeasibility: number;
}

export interface Competitor {
  name: string;
  weakness: string;
  pricing?: string;
}

export interface ValidationReport {
  id: string;
  ideaText: string;
  scores: ValidationScore;
  verdict: 'Build' | 'Pivot' | 'Skip';
  pros: string[];
  cons: string[];
  gapOpportunities: string[];
  mvpWedge: string;
  killTest: string;
  competitors: Competitor[];
  evidenceLinks: string[];
  createdAt: string;
}

export type BacklogStatus = 'New' | 'Exploring' | 'Validated' | 'Building' | 'Archived';

export interface BacklogItem {
  id: string;
  ideaName: string;
  source: 'Generated' | 'Validated';
  sourceId: string;
  demandScore?: number;
  overallScore?: number;
  status: BacklogStatus;
  createdAt: string;
}
