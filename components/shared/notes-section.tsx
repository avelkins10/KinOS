"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Pin, PinOff, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { NoteEntityType } from "@/lib/actions/notes";

interface Note {
  id: string;
  content: string;
  author_id: string;
  is_pinned: boolean;
  created_at: string | null;
  author?: { id: string; first_name: string; last_name: string } | null;
}

interface NotesSectionProps {
  entityType: NoteEntityType;
  entityId: string;
  initialNotes?: Note[];
  currentUserId?: string;
  isAdmin?: boolean;
}

export function NotesSection({
  entityType,
  entityId,
  initialNotes = [],
  currentUserId,
  isAdmin,
}: NotesSectionProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const fetchNotes = async () => {
    const res = await fetch(
      `/api/notes?entityType=${entityType}&entityId=${entityId}`,
    );
    const data = await res.json();
    if (Array.isArray(data)) setNotes(data);
  };

  useEffect(() => {
    fetchNotes();
  }, [entityType, entityId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType,
          entityId,
          content: content.trim(),
        }),
      });
      const json = await res.json();
      setLoading(false);
      if (!res.ok) {
        toast.error(json.error ?? "Failed to add note");
        return;
      }
      setContent("");
      fetchNotes();
    } catch {
      setLoading(false);
      toast.error("Failed to add note");
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editContent.trim()) return;
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to update");
        return;
      }
      setEditingId(null);
      fetchNotes();
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this note?")) return;
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to delete");
        return;
      }
      fetchNotes();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handlePin = async (id: string, isPinned: boolean) => {
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned }),
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error ?? "Failed to pin");
        return;
      }
      fetchNotes();
    } catch {
      toast.error("Failed to pin");
    }
  };

  const canEdit = (note: Note) => currentUserId === note.author_id || isAdmin;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleAdd} className="flex gap-2">
          <Textarea
            placeholder="Add a note…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[80px] resize-none"
            disabled={loading}
          />
          <Button type="submit" size="sm" disabled={loading || !content.trim()}>
            Add
          </Button>
        </form>
        <ul className="space-y-3">
          {notes.map((note) => (
            <li
              key={note.id}
              className="rounded-lg border border-border p-3 text-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {note.author
                        ? `${note.author.first_name?.[0] ?? ""}${note.author.last_name?.[0] ?? ""}`.toUpperCase()
                        : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-muted-foreground">
                      {note.author
                        ? `${note.author.first_name} ${note.author.last_name}`.trim()
                        : "Unknown"}
                      {note.is_pinned && (
                        <Pin className="ml-1 inline h-3 w-3 text-amber-500" />
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {note.created_at
                        ? new Date(note.created_at).toLocaleString()
                        : ""}
                    </p>
                    {editingId === note.id ? (
                      <div className="mt-2 flex gap-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-[60px] text-sm"
                        />
                        <div className="flex flex-col gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdate(note.id)}
                          >
                            Save
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingId(null);
                              setEditContent("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1 whitespace-pre-wrap">{note.content}</p>
                    )}
                  </div>
                </div>
                {canEdit(note) && editingId !== note.id && (
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handlePin(note.id, !note.is_pinned)}
                      aria-label={note.is_pinned ? "Unpin" : "Pin"}
                    >
                      {note.is_pinned ? (
                        <PinOff className="h-3 w-3" />
                      ) : (
                        <Pin className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setEditingId(note.id);
                        setEditContent(note.content);
                      }}
                      aria-label="Edit"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDelete(note.id)}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
        {notes.length === 0 && (
          <p className="text-sm text-muted-foreground">No notes yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
