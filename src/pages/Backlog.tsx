import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getMyBacklog, updateBacklogStatusDb, removeFromBacklogDb, addNoteToBacklogDb, renameBacklogItemDb, updateNoteInBacklogDb, addToBacklogDb } from "@/lib/db";
import { Lightbulb, Trash2, MessageSquarePlus, Archive, Filter, Pencil, Check, X, StickyNote, Plus } from "lucide-react";
import { toast } from "sonner";

type BacklogStatus = 'New' | 'Exploring' | 'Validated' | 'Building' | 'Archived';

const statusColors: Record<BacklogStatus, string> = {
  New: 'bg-primary/10 text-primary',
  Exploring: 'bg-purple-500/10 text-purple-600',
  Validated: 'bg-green-500/10 text-green-600',
  Building: 'bg-yellow-500/10 text-yellow-600',
  Archived: 'bg-muted text-muted-foreground',
};

const statusDots: Record<BacklogStatus, string> = {
  New: 'bg-primary',
  Exploring: 'bg-purple-500',
  Validated: 'bg-green-500',
  Building: 'bg-yellow-500',
  Archived: 'bg-muted-foreground',
};

const allStatuses: BacklogStatus[] = ['New', 'Exploring', 'Validated', 'Building', 'Archived'];

export default function Backlog() {
  const [filter, setFilter] = useState<string>("All");
  const [backlog, setBacklog] = useState<any[]>([]);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [addingNoteFor, setAddingNoteFor] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editingNote, setEditingNote] = useState<{ itemId: string; index: number } | null>(null);
  const [editNoteText, setEditNoteText] = useState("");
  const [showAddIdea, setShowAddIdea] = useState(false);
  const [newIdeaName, setNewIdeaName] = useState("");
  const [newIdeaNote, setNewIdeaNote] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchBacklog = async () => { const data = await getMyBacklog(); setBacklog(data); setLoading(false); };
  useEffect(() => { fetchBacklog(); }, []);

  const filtered = filter === "All" ? backlog : backlog.filter(i => i.status === filter);

  const handleStatusChange = async (id: string, status: BacklogStatus) => { await updateBacklogStatusDb(id, status); fetchBacklog(); };
  const handleRemove = async (id: string) => { await removeFromBacklogDb(id); fetchBacklog(); toast.success("Removed from ideas"); };
  const handleAddNote = async (id: string) => {
    const text = noteInputs[id]?.trim(); if (!text) return;
    await addNoteToBacklogDb(id, text); setNoteInputs(prev => ({ ...prev, [id]: "" })); setAddingNoteFor(null); fetchBacklog(); toast.success("Note added");
  };
  const startEditNote = (itemId: string, index: number, currentText: string) => { setEditingNote({ itemId, index }); setEditNoteText(currentText); };
  const saveEditNote = async () => {
    if (!editingNote || !editNoteText.trim()) return;
    await updateNoteInBacklogDb(editingNote.itemId, editingNote.index, editNoteText.trim()); setEditingNote(null); fetchBacklog(); toast.success("Note updated");
  };
  const startRename = (id: string, currentName: string) => { setEditingId(id); setEditName(currentName); };
  const saveRename = async (id: string) => { const trimmed = editName.trim(); if (!trimmed) return; await renameBacklogItemDb(id, trimmed); setEditingId(null); fetchBacklog(); toast.success("Idea renamed"); };
  const handleAddIdea = async () => {
    const name = newIdeaName.trim(); if (!name) return;
    const notes = newIdeaNote.trim() ? [newIdeaNote.trim()] : [];
    await addToBacklogDb({ ideaName: name, source: "Manual", notes }); setNewIdeaName(""); setNewIdeaNote(""); setShowAddIdea(false); fetchBacklog(); toast.success("Idea added");
  };

  if (loading) return <div className="text-center text-muted-foreground py-20">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight font-nunito">My Ideas</h1>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-muted-foreground text-sm">{backlog.length} idea{backlog.length !== 1 ? 's' : ''} saved</p>
          <div className="flex items-center gap-2 ml-auto">
            <Button size="sm" variant="outline" className="h-9 rounded-xl" onClick={() => setShowAddIdea(v => !v)}>
              <Lightbulb className="h-4 w-4 mr-1.5" /> Add Idea
            </Button>
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[110px] h-9 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                {allStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {showAddIdea && (
        <Card className="rounded-[32px] border border-primary/20 shadow-lg">
          <CardContent className="p-6 space-y-3">
            <p className="text-sm font-semibold font-nunito">New Idea</p>
            <Input placeholder="What's your idea?" value={newIdeaName} onChange={e => setNewIdeaName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newIdeaName.trim()) handleAddIdea(); }} className="rounded-xl" autoFocus />
            <Textarea placeholder="Add initial notes (optional)..." value={newIdeaNote} onChange={e => setNewIdeaNote(e.target.value)} className="text-sm min-h-[60px] resize-y rounded-xl" />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" className="rounded-full" onClick={() => { setShowAddIdea(false); setNewIdeaName(""); setNewIdeaNote(""); }}>Cancel</Button>
              <Button size="sm" className="rounded-full" onClick={handleAddIdea} disabled={!newIdeaName.trim()}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Save Idea
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {filtered.length === 0 ? (
        <Card className="rounded-2xl border-0 bg-secondary">
          <CardContent className="p-12 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-card flex items-center justify-center mx-auto shadow-sm">
              <Archive className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">No ideas saved yet. Generate or validate ideas to add them here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((item: any) => {
            const notes: string[] = Array.isArray(item.notes) ? item.notes : [];
            const isEditing = editingId === item.id;
            return (
              <Card key={item.id} className="rounded-2xl border-border/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Input value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveRename(item.id); if (e.key === 'Escape') setEditingId(null); }} className="h-8 text-sm font-semibold rounded-lg" autoFocus />
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-primary" onClick={() => saveRename(item.id)}><Check className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setEditingId(null)}><X className="h-3.5 w-3.5" /></Button>
                        </div>
                      ) : (
                        <div className="group/name flex items-center gap-1.5">
                          <p className="text-sm font-semibold leading-snug">{item.idea_name}</p>
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/name:opacity-100 transition-opacity shrink-0" onClick={() => startRename(item.id, item.idea_name)}>
                            <Pencil className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-0.5">
                        <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</p>
                        {notes.length > 0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><StickyNote className="h-3 w-3" />{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Select value={item.status} onValueChange={(v) => handleStatusChange(item.id, v as BacklogStatus)}>
                        <SelectTrigger className="w-auto h-7 border-0 bg-transparent px-1">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full ${statusColors[item.status as BacklogStatus] || ''}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${statusDots[item.status as BacklogStatus] || ''}`} />
                            {item.status}
                          </span>
                        </SelectTrigger>
                        <SelectContent>{allStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-nunito">Delete this idea?</AlertDialogTitle>
                            <AlertDialogDescription>This action cannot be undone. The idea and all its notes will be permanently deleted.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemove(item.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  {addingNoteFor === item.id ? (
                    <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                      <Textarea placeholder="Paste or type your thoughts here..." value={noteInputs[item.id] || ""} onChange={e => setNoteInputs(prev => ({ ...prev, [item.id]: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddNote(item.id); }} className="text-sm min-h-[80px] resize-y rounded-xl" autoFocus />
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-muted-foreground">⌘ + Enter to save</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" className="h-7 text-xs rounded-full" onClick={() => setAddingNoteFor(null)}>Cancel</Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs rounded-full" onClick={() => handleAddNote(item.id)} disabled={!noteInputs[item.id]?.trim()}>
                            <MessageSquarePlus className="h-3 w-3 mr-1" /> Save Note
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors" onClick={() => setAddingNoteFor(item.id)}>
                      <Plus className="h-3 w-3" /><span>Add a note</span>
                    </button>
                  )}

                  {notes.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {notes.map((note: string, i: number) => {
                        const isEditingThis = editingNote?.itemId === item.id && editingNote?.index === i;
                        return (
                          <div key={i} className="group/note rounded-xl bg-secondary/60 border border-border/30 px-4 py-3">
                            {isEditingThis ? (
                              <div className="space-y-2">
                                <Textarea value={editNoteText} onChange={e => setEditNoteText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveEditNote(); }} className="text-sm min-h-[60px] resize-y rounded-xl" autoFocus />
                                <div className="flex justify-end gap-2">
                                  <Button size="sm" variant="ghost" className="h-7 text-xs rounded-full" onClick={() => setEditingNote(null)}>Cancel</Button>
                                  <Button size="sm" variant="outline" className="h-7 text-xs rounded-full" onClick={saveEditNote}><Check className="h-3 w-3 mr-1" /> Update</Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap flex-1">{note}</p>
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/note:opacity-100 transition-opacity shrink-0" onClick={() => startEditNote(item.id, i, note)}>
                                  <Pencil className="h-3 w-3 text-muted-foreground" />
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
