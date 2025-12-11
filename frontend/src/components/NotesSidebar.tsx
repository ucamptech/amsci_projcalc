import {
  ArrowRight,
  ChevronRight,
  Pencil,
  Plus,
  StickyNote,
  Trash2,
  X,
} from "lucide-react";
import type { Note, NoteScope } from "@/types/note.type";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const formatRelativeTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfGiven = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const diffMs = startOfToday.getTime() - startOfGiven.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

interface NotesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  noteForm: { title: string; body: string };
  onNoteFormChange: (value: { title: string; body: string }) => void;
  onAddNote: () => void;
  onDeleteNote: (id: number) => void;
  onEditNote: (note: Note, scope: NoteScope) => void;
  isEditing: boolean;
  onCancelEdit: () => void;
  activeScope: NoteScope;
  onScopeChange: (scope: NoteScope) => void;
  hasProjectContext: boolean;
}

export function NotesSidebar({
  isOpen,
  onClose,
  notes,
  noteForm,
  onNoteFormChange,
  onAddNote,
  onDeleteNote,
  onEditNote,
  isEditing,
  onCancelEdit,
  activeScope,
  onScopeChange,
  hasProjectContext,
}: NotesSidebarProps) {
  return (
    <>
      {isOpen && (
        <div
          className="bg-background/80 fixed inset-0 z-40 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "bg-background fixed top-0 right-0 z-50 h-full border-l shadow-lg",
          "w-full max-w-md md:w-[380px]",
          "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-full flex-col pt-0">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl">
                <StickyNote className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Notes</span>
                {/* <span className="text-muted-foreground text-xs">
                  Pin ideas, reminders, and rough drafts.
                </span> */}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex"
                onClick={onClose}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            <div className="bg-muted/20 rounded-lg border p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="bg-background text-primary flex h-6 w-6 items-center justify-center rounded-md border">
                  <Plus className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">
                    {isEditing ? "Update note" : "Add new note"}
                  </span>
                  {/* <span className="text-muted-foreground text-xs">
                    Keep it short and actionable.
                  </span> */}
                </div>
              </div>

              <div className="space-y-3">
                <Input
                  value={noteForm.title}
                  placeholder="Title"
                  onChange={(event) =>
                    onNoteFormChange({ ...noteForm, title: event.target.value })
                  }
                />
                <Textarea
                  value={noteForm.body}
                  placeholder="Details"
                  className="min-h-24"
                  onChange={(event) =>
                    onNoteFormChange({ ...noteForm, body: event.target.value })
                  }
                />
                <div className="flex gap-2">
                  {isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-28"
                      onClick={onCancelEdit}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    className="flex-1"
                    onClick={onAddNote}
                    disabled={!noteForm.title.trim() && !noteForm.body.trim()}
                  >
                    <ArrowRight className="h-4 w-4" />
                    {isEditing ? "Save note" : "Save note"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {notes.map((note) => (
                <article
                  key={note.id}
                  className="border-border/80 bg-card text-card-foreground rounded-xl border px-4 py-3 shadow-sm"
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <StickyNote className="text-muted-foreground h-4 w-4 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">
                          {note.title}
                        </span>
                        <span className="text-muted-foreground text-[11px]">
                          {formatRelativeTime(note.updatedAt ?? note.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 focus-visible:bg-destructive/10 active:bg-destructive/20 h-8 w-8"
                        onClick={() => onDeleteNote(note.id)}
                        aria-label="Delete note"
                      >
                        <Trash2 className="text-destructive h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          onEditNote(
                            note,
                            activeScope === "projectScope"
                              ? "projectScope"
                              : "generalScope",
                          )
                        }
                        aria-label="Edit note"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {note.body}
                  </p>
                </article>
              ))}
            </div>
          </div>

          {hasProjectContext && (
            <div className="bg-background border-t px-4 py-3">
              <div className="text-muted-foreground mb-2 text-[11px] font-semibold tracking-[0.08em] uppercase">
                Note scope
              </div>
              <div className="bg-muted/30 relative flex items-center gap-1 rounded-full border p-1">
                <button
                  className={cn(
                    "relative z-10 flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors",
                    activeScope === "generalScope"
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                  onClick={() => onScopeChange("generalScope")}
                >
                  General
                </button>
                <button
                  className={cn(
                    "relative z-10 flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors",
                    activeScope === "projectScope"
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                  onClick={() => onScopeChange("projectScope")}
                >
                  This project
                </button>

                <div
                  className={cn(
                    "bg-background absolute inset-1 z-0 rounded-full shadow-sm transition-transform duration-200",
                    activeScope === "projectScope"
                      ? "translate-x-[calc(100%-4px)]"
                      : "translate-x-0",
                  )}
                  style={{ width: "calc(50% - 2px)" }}
                  aria-hidden
                />
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
