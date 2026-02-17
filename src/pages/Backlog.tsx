import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { getMyBacklog, updateBacklogStatusDb, removeFromBacklogDb, addNoteToBacklogDb, renameBacklogItemDb } from "@/lib/db";
import { Trash2, MessageSquarePlus, Archive, Filter, Pencil, Check, X, StickyNote } from "lucide-react";
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
  const [addingNoteFor, setAddingNoteFor] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
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
    setAddingNoteFor(null);
    fetchBacklog();
    toast.success("Note added");
  };

  const startRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const saveRename = async (id: string) => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    await renameBacklogItemDb(id, trimmed);
    setEditingId(null);
    fetchBacklog();
    toast.success("Idea renamed");
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
            const isEditing = editingId === item.id;
            return (
              <div key={item.id}>
                <Card className="border hover:border-primary/20 transition-colors">
                  <CardContent className="p-5 space-y-0">
                    {/* Top row: name + actions */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') saveRename(item.id); if (e.key === 'Escape') setEditingId(null); }}
                              className="h-8 text-sm font-semibold"
                              autoFocus
                            />
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-green-600" onClick={() => saveRename(item.id)}>
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setEditingId(null)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <div className="group/name flex items-center gap-1.5">
                            <p className="text-sm font-semibold leading-snug">{item.idea_name}</p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover/name:opacity-100 transition-opacity shrink-0"
                              onClick={() => startRename(item.id, item.idea_name)}
                            >
                              <Pencil className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">{new Date(item.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Select value={item.status} onValueChange={(v) => handleStatusChange(item.id, v as BacklogStatus)}>
                          <SelectTrigger className="w-auto h-7 border-0 bg-transparent px-1">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[item.status as BacklogStatus] || ''}`}>{item.status}</span>
                          </SelectTrigger>
                          <SelectContent>
                            {allStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => handleRemove(item.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Notes displayed inline */}
                    {notes.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {notes.map((note: string, i: number) => (
                          <div key={i} className="flex gap-2 items-start">
                            <StickyNote className="h-3 w-3 mt-1 shrink-0 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground leading-relaxed">{note}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add note toggle */}
                    {addingNoteFor === item.id ? (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        <Textarea
                          placeholder="Paste or type your thoughts here..."
                          value={noteInputs[item.id] || ""}
                          onChange={e => setNoteInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddNote(item.id); }}
                          className="text-sm min-h-[80px] resize-y"
                          autoFocus
                        />
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] text-muted-foreground">⌘ + Enter to save</p>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" className="h-8" onClick={() => setAddingNoteFor(null)}>
                              Cancel
                            </Button>
                            <Button size="sm" variant="outline" className="h-8" onClick={() => handleAddNote(item.id)} disabled={!noteInputs[item.id]?.trim()}>
                              <MessageSquarePlus className="h-3.5 w-3.5 mr-1" /> Save Note
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setAddingNoteFor(item.id)}
                      >
                        <MessageSquarePlus className="h-3 w-3" />
                        <span>Add a note</span>
                      </button>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
