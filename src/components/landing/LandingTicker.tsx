import { useEffect, useRef, useState } from "react";
import { Flame, Users, FolderOpen } from "lucide-react";

interface TrendingNow {
  categories: { name: string; count: number }[];
  personas: { name: string; count: number }[];
  recentIdeas: number;
  recentValidations: number;
  recentRuns: number;
}

interface Props {
  trendingNow: TrendingNow;
}

interface TickerItem {
  icon: typeof Flame;
  text: string;
  color: string;
}

export function LandingTicker({ trendingNow }: Props) {
  const { categories, personas } = trendingNow;

  // Build ticker items — show trends without exposing raw counts
  const items: TickerItem[] = [];

  for (const cat of categories.slice(0, 3)) {
    items.push({ icon: FolderOpen, text: `"${cat.name}" trending`, color: "hsl(262, 60%, 55%)" });
  }
  for (const persona of personas.slice(0, 2)) {
    items.push({ icon: Users, text: `"${persona.name}" being researched`, color: "hsl(38, 92%, 50%)" });
  }

  if (items.length === 0) return null;

  // Duplicate for seamless loop
  const doubledItems = [...items, ...items];

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border/50 bg-background/60 backdrop-blur-sm">
      <div className="flex items-center">
        {/* Label */}
        <div className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-primary/10 border-r border-border/50">
          <Flame className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-primary whitespace-nowrap">Trending Now</span>
        </div>

        {/* Scrolling ticker */}
        <div className="flex-1 overflow-hidden relative">
          <div className="flex items-center animate-ticker gap-8 px-4 py-2.5 w-max">
            {doubledItems.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 shrink-0">
                <item.icon className="h-3.5 w-3.5 shrink-0" style={{ color: item.color }} />
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
