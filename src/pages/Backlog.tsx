import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getBacklog, updateBacklogStatus, removeFromBacklog, addNoteToBacklog, exportData } from "@/lib/storage";
import { BacklogStatus } from "@/lib/types";
import { Trash2, Download, ChevronDown, MessageSquarePlus, StickyNote } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<BacklogStatus, string> = {
  New: 'bg-blue-100 text-blue-700',
  Exploring: 'bg-purple-100 text-purple-700',
  Validated: 'bg-green-100 text-green-700',
  Building: 'bg-yellow-100 text-yellow-700',
  Archived: 'bg-gray-100 text-gray-500',
};

const allStatuses: BacklogStatus[] = ['New', 'Exploring', 'Validated', 'Building', 'Archived'];

export default function Backlog() {
  const [filter, setFilter] = useState<string>("All");
  const [, rerender] = useState(0);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const backlog = useMemo(() => getBacklog(), [filter, rerender]);
  const filtered = filter === "All" ? backlog : backlog.filter(i => i.status === filter);

  const handleStatusChange = (id: string, status: BacklogStatus) => {
    updateBacklogStatus(id, status);
    rerender(n => n + 1);
  };

  const handleRemove = (id: string) => {
    removeFromBacklog(id);
    rerender(n => n + 1);
    toast.success("Removed from ideas");
  };

  const handleAddNote = (id: string) => {
    const text = noteInputs[id]?.trim();
    if (!text) return;
    addNoteToBacklog(id, text);
    setNoteInputs(prev => ({ ...prev, [id]: "" }));
    rerender(n => n + 1);
    toast.success("Note added");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Ideas</h1>
          <p className="text-muted-foreground mt-1">{backlog.length} ideas saved</p>
        </div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              {allStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={exportData}><Download className="h-4 w-4" /></Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="border"><CardContent className="p-10 text-center text-muted-foreground">No ideas saved yet. Generate or validate ideas to add them here.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <Collapsible key={item.id}>
              <Card className="border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge variant="secondary" className="text-[10px] shrink-0">{item.source}</Badge>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.ideaName}</p>
                        <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {(item.demandScore ?? item.overallScore) !== undefined && (
                        <span className="text-xs text-muted-foreground">{item.demandScore ?? item.overallScore}/100</span>
                      )}
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
                          {(item.notes?.length ?? 0) > 0 && (
                            <span className="absolute -top-1 -right-1 text-[9px] bg-primary text-primary-foreground rounded-full h-4 w-4 flex items-center justify-center">
                              {item.notes.length}
                            </span>
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <Select value={item.status} onValueChange={(v) => handleStatusChange(item.id, v as BacklogStatus)}>
                        <SelectTrigger className="w-[110px] h-8">
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${statusColors[item.status]}`}>{item.status}</span>
                        </SelectTrigger>
                        <SelectContent>
                          {allStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemove(item.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>

                  <CollapsibleContent>
                    <div className="mt-3 pt-3 border-t space-y-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a note..."
                          value={noteInputs[item.id] || ""}
                          onChange={e => setNoteInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && handleAddNote(item.id)}
                          className="h-8 text-sm"
                        />
                        <Button size="sm" variant="outline" className="h-8 shrink-0" onClick={() => handleAddNote(item.id)}>
                          <MessageSquarePlus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {(item.notes?.length ?? 0) > 0 ? (
                        <div className="space-y-1.5">
                          {item.notes.map((note, i) => (
                            <p key={i} className="text-xs text-muted-foreground bg-muted/50 rounded px-3 py-2">
                              {note}
                            </p>
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
          ))}
        </div>
      )}
    </div>
  );
}
