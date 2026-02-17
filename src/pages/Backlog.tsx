import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getMyBacklog, updateBacklogStatusDb, removeFromBacklogDb, addNoteToBacklogDb } from "@/lib/db";
import { Trash2, ChevronDown, MessageSquarePlus, StickyNote, Archive, Filter } from "lucide-react";
import { toast } from "sonner";


type BacklogStatus = 'New' | 'Exploring' | 'Validated' | 'Building' | 'Archived';

const statusColors: Record<BacklogStatus, string> = {
  New: 'bg-primary/10 text-primary',
  Exploring: 'bg-purple-500/10 text-purple-600',
  Validated: 'bg-green-500/10 text-green-600',
  Building: 'bg-yellow-500/10 text-yellow-600',
  Archived: 'bg-muted text-muted-foreground',
};

const allStatuses: BacklogStatus[] = ['New', 'Exploring', 'Validated', 'Building', 'Archived'];

export default function Backlog() {
  const [filter, setFilter] = useState<string>("All");
  const [backlog, setBacklog] = useState<any[]>([]);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const fetchBacklog = async () => {
    const data = await getMyBacklog();
    setBacklog(data);
    setLoading(false);
  };

  useEffect(() => { fetchBacklog(); }, []);

  const filtered = filter === "All" ? backlog : backlog.filter(i => i.status === filter);

  const handleStatusChange = async (id: string, status: BacklogStatus) => {
    await updateBacklogStatusDb(id, status);
    fetchBacklog();
  };

  const handleRemove = async (id: string) => {
    await removeFromBacklogDb(id);
    fetchBacklog();
    toast.success("Removed from ideas");
  };

  const handleAddNote = async (id: string) => {
    const text = noteInputs[id]?.trim();
    if (!text) return;
    await addNoteToBacklogDb(id, text);
    setNoteInputs(prev => ({ ...prev, [id]: "" }));
    fetchBacklog();
    toast.success("Note added");
  };

  if (loading) return <div className="text-center text-muted-foreground py-20">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Ideas</h1>
          <p className="text-muted-foreground mt-1">{backlog.length} idea{backlog.length !== 1 ? 's' : ''} saved — track and manage your pipeline.</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[130px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              {allStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="border">
          <CardContent className="p-12 text-center space-y-3">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto">
              <Archive className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">No ideas saved yet. Generate or validate ideas to add them here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((item: any) => {
            const notes = Array.isArray(item.notes) ? item.notes : [];
            const score = item.demand_score ?? item.overall_score;
            return (
              <Collapsible key={item.id}>
                <Card className="border hover:border-primary/20 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Badge variant="secondary" className="text-[10px] shrink-0 uppercase tracking-wider">{item.source}</Badge>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate">{item.idea_name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{new Date(item.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {score != null && (
                          <span className="text-xs font-semibold text-muted-foreground tabular-nums">{score}/100</span>
                        )}
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 relative">
                            <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
                            {notes.length > 0 && (
                              <span className="absolute -top-1 -right-1 text-[9px] bg-primary text-primary-foreground rounded-full h-4 w-4 flex items-center justify-center">{notes.length}</span>
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <Select value={item.status} onValueChange={(v) => handleStatusChange(item.id, v as BacklogStatus)}>
                          <SelectTrigger className="w-[110px] h-8 border-0 bg-transparent">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[item.status as BacklogStatus] || ''}`}>{item.status}</span>
                          </SelectTrigger>
                          <SelectContent>
                            {allStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => handleRemove(item.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <CollapsibleContent>
                      <div className="mt-4 pt-4 border-t space-y-3">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add a note..."
                            value={noteInputs[item.id] || ""}
                            onChange={e => setNoteInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && handleAddNote(item.id)}
                            className="h-9 text-sm"
                          />
                          <Button size="sm" variant="outline" className="h-9 shrink-0" onClick={() => handleAddNote(item.id)}>
                            <MessageSquarePlus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        {notes.length > 0 ? (
                          <div className="space-y-2">
                            {notes.map((note: string, i: number) => (
                              <p key={i} className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2.5 leading-relaxed">{note}</p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">No notes yet</p>
                        )}
                      </div>
                    </CollapsibleContent>
                  </CardContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      )}
    </div>
  );
}
