import { supabase } from "@/integrations/supabase/client";

export type DashboardActivityItem =
  | {
      kind: "generator";
      id: string;
      createdAt: string;
      title: string;
      contextLabel: string;
      ideaCount: number;
      topIdea: {
        name: string;
        description?: string;
      } | null;
    }
  | {
      kind: "validation";
      id: string;
      createdAt: string;
      title: string;
      verdict: string | null;
      overallScore: number | null;
    };

export interface DashboardOverviewStats {
  ideasGenerated: number;
  ideasValidated: number;
  ideasInBacklog: number;
}

export interface DashboardOverview {
  recentActivity: DashboardActivityItem[];
  stats: DashboardOverviewStats;
}

export const EMPTY_DASHBOARD_OVERVIEW: DashboardOverview = {
  recentActivity: [],
  stats: {
    ideasGenerated: 0,
    ideasValidated: 0,
    ideasInBacklog: 0,
  },
};

export class DashboardOverviewError extends Error {
  constructor(message = "We couldn't load your dashboard.") {
    super(message);
    this.name = "DashboardOverviewError";
  }
}

type IdeaSuggestionLike = {
  name: string;
  description?: string;
};

export function parseIdeaSuggestions(raw: unknown): IdeaSuggestionLike[] {
  if (!Array.isArray(raw)) return [];
  const ideas: IdeaSuggestionLike[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const name = typeof record.name === "string" ? record.name.trim() : "";
    if (!name) continue;
    const description =
      typeof record.description === "string" && record.description.trim()
        ? record.description.trim()
        : undefined;
    ideas.push({ name, description });
  }
  return ideas;
}

export function parseValidationScores(raw: unknown): {
  demand: number;
  pain: number;
  competition: number;
  mvpFeasibility: number;
} | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const demand = record.demand;
  const pain = record.pain;
  const competition = record.competition;
  const mvpFeasibility = record.mvpFeasibility;
  if (
    typeof demand !== "number" ||
    typeof pain !== "number" ||
    typeof competition !== "number" ||
    typeof mvpFeasibility !== "number" ||
    !Number.isFinite(demand) ||
    !Number.isFinite(pain) ||
    !Number.isFinite(competition) ||
    !Number.isFinite(mvpFeasibility)
  ) {
    return null;
  }
  return { demand, pain, competition, mvpFeasibility };
}

/** Established product overall score used when saving validated ideas. */
export function computeValidationOverallScore(scores: {
  demand: number;
  pain: number;
  competition: number;
  mvpFeasibility: number;
}): number {
  return Math.round(
    (scores.demand + scores.pain + scores.mvpFeasibility - scores.competition) / 3,
  );
}

export function normalizeGeneratorActivity(row: {
  id: string;
  created_at: string;
  persona: string | null;
  category: string | null;
  idea_suggestions: unknown;
}): DashboardActivityItem {
  const ideas = parseIdeaSuggestions(row.idea_suggestions);
  const topIdea = ideas[0]
    ? { name: ideas[0].name, description: ideas[0].description }
    : null;
  const persona = typeof row.persona === "string" ? row.persona.trim() : "";
  const category = typeof row.category === "string" ? row.category.trim() : "";
  let title = "Idea discovery";
  if (topIdea) {
    title = topIdea.name;
  } else if (persona && category) {
    title = `${persona} × ${category}`;
  } else if (persona || category) {
    title = persona || category;
  }

  const parts: string[] = [];
  if (persona) parts.push(persona);
  if (category) parts.push(category);
  parts.push(`${ideas.length} idea${ideas.length === 1 ? "" : "s"}`);

  return {
    kind: "generator",
    id: row.id,
    createdAt: row.created_at,
    title,
    contextLabel: parts.join(" · "),
    ideaCount: ideas.length,
    topIdea,
  };
}

export function normalizeValidationActivity(row: {
  id: string;
  created_at: string;
  idea_text: string | null;
  verdict: string | null;
  scores: unknown;
}): DashboardActivityItem {
  const trimmed =
    typeof row.idea_text === "string" ? row.idea_text.trim() : "";
  const title = trimmed || "Validation report";
  const verdict =
    typeof row.verdict === "string" && row.verdict.trim()
      ? row.verdict.trim()
      : null;
  const scores = parseValidationScores(row.scores);
  return {
    kind: "validation",
    id: row.id,
    createdAt: row.created_at,
    title,
    verdict,
    overallScore: scores ? computeValidationOverallScore(scores) : null,
  };
}

export function combineRecentActivity(
  generators: DashboardActivityItem[],
  validations: DashboardActivityItem[],
  limit: number,
): DashboardActivityItem[] {
  return [...generators, ...validations]
    .sort((a, b) => {
      const aTime = Date.parse(a.createdAt);
      const bTime = Date.parse(b.createdAt);
      const aValid = Number.isFinite(aTime) ? aTime : 0;
      const bValid = Number.isFinite(bTime) ? bTime : 0;
      return bValid - aValid;
    })
    .slice(0, Math.max(0, limit));
}

function countIdeaSuggestions(raw: unknown): number {
  return parseIdeaSuggestions(raw).length;
}

/**
 * Loads dashboard resume data + quick stats for the current user.
 * Throws DashboardOverviewError on query failure (never silent zeros).
 */
export async function getDashboardOverview(
  limit = 3,
): Promise<DashboardOverview> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    throw new DashboardOverviewError();
  }
  if (!user) {
    return EMPTY_DASHBOARD_OVERVIEW;
  }

  const safeLimit = Math.max(1, Math.min(limit, 20));

  const [
    runsResult,
    reportsResult,
    backlogResult,
    ideaRunsResult,
    validatedCountResult,
  ] = await Promise.all([
      supabase
        .from("generator_runs")
        .select("id, created_at, persona, category, idea_suggestions")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(safeLimit),
      supabase
        .from("validation_reports")
        .select("id, created_at, idea_text, verdict, scores")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(safeLimit),
      supabase
        .from("backlog_items")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("generator_runs")
        .select("idea_suggestions")
        .eq("user_id", user.id),
      supabase
        .from("validation_reports")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);

  if (
    runsResult.error ||
    reportsResult.error ||
    backlogResult.error ||
    ideaRunsResult.error ||
    validatedCountResult.error
  ) {
    throw new DashboardOverviewError();
  }

  const generators = (runsResult.data ?? []).map((row) =>
    normalizeGeneratorActivity(row),
  );
  const validations = (reportsResult.data ?? []).map((row) =>
    normalizeValidationActivity(row),
  );

  const ideasGenerated = (ideaRunsResult.data ?? []).reduce(
    (sum, row) => sum + countIdeaSuggestions(row.idea_suggestions),
    0,
  );

  return {
    recentActivity: combineRecentActivity(generators, validations, safeLimit),
    stats: {
      ideasGenerated,
      ideasValidated: validatedCountResult.count ?? 0,
      ideasInBacklog: backlogResult.count ?? 0,
    },
  };
}
