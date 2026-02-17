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

// ─── Phase 1 Intelligence Layers ───

export interface WtpSignal {
  quote: string;
  source: string;
  context: string;
}

export interface WtpSignals {
  strength: 'strong' | 'moderate' | 'weak' | 'none';
  signals: WtpSignal[];
  priceRange: { low: number; mid: number; high: number; currency: string };
  summary: string;
}

export type CompetitionLevel = 'blue_ocean' | 'fragmented' | 'crowded' | 'winner_take_most';

export interface CompetitionDensity {
  level: CompetitionLevel;
  competitorCount: number;
  totalFundingEstimate: string;
  keyIncumbents: string[];
  switchingCosts: string;
  summary: string;
}

export type MarketPhase = 'emerging' | 'growing' | 'saturated' | 'declining';

export interface MarketTiming {
  phase: MarketPhase;
  signals: string[];
  summary: string;
}

export interface ICP {
  businessType: string;
  companySize: string;
  revenueRange: string;
  industry: string;
  techStack: string[];
  buyingTriggers: string[];
  budgetRange: string;
  summary: string;
}

// ─── Phase 2 Intelligence Layers ───

export interface Workaround {
  description: string;
  source: string;
  investmentLevel: 'low' | 'medium' | 'high';
}

export interface WorkaroundDetection {
  workarounds: Workaround[];
  severity: 'strong' | 'moderate' | 'weak' | 'none';
  summary: string;
}

export interface FeatureGapEntry {
  feature: string;
  competitorCoverage: 'none' | 'weak' | 'strong' | 'commodity';
  opportunity: 'high' | 'medium' | 'low';
}

export interface FeatureGapMap {
  gaps: FeatureGapEntry[];
  topWedge: string;
  summary: string;
}

export type PlatformRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface PlatformRiskSignal {
  signal: string;
  riskType: 'bundling' | 'api_limitation' | 'roadmap_overlap' | 'regulation' | 'dependency';
}

export interface PlatformRisk {
  level: PlatformRiskLevel;
  signals: PlatformRiskSignal[];
  summary: string;
}

// ─── Existing types ───

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
  notes: string[];
  createdAt: string;
}
