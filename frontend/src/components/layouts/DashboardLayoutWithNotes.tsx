import { StickyNote } from "lucide-react";
import { useMatch } from "react-router-dom";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { Footer } from "./Footer";
import { Navigation } from "./Navigation";
import { NotesSidebar } from "../NotesSidebar";
import { Sidebar } from "./Sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Note, NoteScope } from "@/types/note.type";
import { STARTER_NOTES } from "@/lib/constants/note";
import {
  createNote,
  deleteNote as deleteNoteApi,
  fetchNotes,
  updateNote,
} from "@/lib/api/notes.api";

const groupNotesByProject = (notes: Note[]) =>
  notes.reduce<Record<number, Note[]>>((acc, note) => {
    if (typeof note.projectId === "number") {
      const projectId = note.projectId;
      acc[projectId] = [...(acc[projectId] ?? []), note];
    }
    return acc;
  }, {});
const isProjectKey = (value: number | null): value is number =>
  typeof value === "number" && !Number.isNaN(value);
const isProjectId = (value: Note["projectId"]): value is number =>
  typeof value === "number";

interface DashboardLayoutWithNotesProps {
  children: ReactNode;
  initialNotes?: Note[];
}

//---------------------------------------------------------------------------
// Component
//---------------------------------------------------------------------------
export function DashboardLayoutWithNotes({
  children,
}: DashboardLayoutWithNotesProps) {
  //--------------------------------------------------------------------------
  // States
  //--------------------------------------------------------------------------
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [generalNotes, setGeneralNotes] = useState<Note[]>(
    STARTER_NOTES.filter((note) => !note.projectId),
  );
  const [projectNotes, setProjectNotes] = useState<Record<number, Note[]>>(
    groupNotesByProject(STARTER_NOTES),
  );

  const [noteForm, setNoteForm] = useState({ title: "", body: "" });
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);

  const matchProject = useMatch("/projects/:id");
  const matchCreate = useMatch("/projects/create");
  const projectId = matchProject?.params?.id;
  const parsedProjectId = projectId ? Number(projectId) : null;
  const projectKey = isProjectKey(parsedProjectId) ? parsedProjectId : null;
  const SCOPE_GENERAL: NoteScope = "generalScope";
  const SCOPE_PROJECT: NoteScope = "projectScope";
  const [activeScope, setActiveScope] = useState<NoteScope>(
    matchCreate ? SCOPE_GENERAL : projectId ? SCOPE_PROJECT : SCOPE_GENERAL,
  );

  //--------------------------------------------------------------------------
  // Helpers
  //--------------------------------------------------------------------------
  const canUseProjectScope = isProjectKey(projectKey);
  const effectiveScope: NoteScope = canUseProjectScope
    ? activeScope
    : SCOPE_GENERAL;
  const scopedNotes =
    effectiveScope === SCOPE_PROJECT && isProjectKey(projectKey)
      ? (projectNotes[projectKey] ?? [])
      : generalNotes;
  const findNoteById = (id: number) => {
    const generalMatch = generalNotes.find((note) => note.id === id);
    if (generalMatch) return generalMatch;

    for (const notes of Object.values(projectNotes)) {
      const match = notes.find((note) => note.id === id);
      if (match) return match;
    }
    return undefined;
  };

  //--------------------------------------------------------------------------
  // useMemos
  //--------------------------------------------------------------------------

  const nextNoteId = useMemo(
    () => () => Date.now() + Math.floor(Math.random() * 1000),
    [],
  );

  //--------------------------------------------------------------------------
  // useEffects
  //--------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    const loadNotes = async () => {
      try {
        const response = await fetchNotes();
        if (!isMounted) return;

        const notes = response?.data ?? [];
        setGeneralNotes(notes.filter((note) => !note.projectId));
        setProjectNotes(groupNotesByProject(notes));
      } catch (error) {
        console.error("Failed to load notes", error);
      }
    };

    loadNotes();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isProjectKey(projectKey)) return;
    let isMounted = true;

    const loadProjectNotes = async () => {
      try {
        const response = await fetchNotes({ projectId: projectKey });
        if (!isMounted) return;

        const notes = response?.data ?? [];
        setProjectNotes((prev) => ({
          ...prev,
          [projectKey]: notes,
        }));
      } catch (error) {
        console.error("Failed to load project notes", error);
      }
    };

    loadProjectNotes();

    return () => {
      isMounted = false;
    };
  }, [projectKey]);

  //--------------------------------------------------------------------------
  // Functions
  //--------------------------------------------------------------------------

  const onAddNote = async () => {
    const title = noteForm.title.trim();
    const body = noteForm.body.trim();

    if (!title && !body) return;

    const targetProjectId =
      effectiveScope === SCOPE_PROJECT && isProjectKey(projectKey)
        ? projectKey
        : null;

    try {
      const payload = {
        title: title || "Untitled note",
        body: body || "No details added.",
        projectId: targetProjectId,
      };

      if (editingNoteId) {
        const previousNote = findNoteById(editingNoteId);
        const previousProjectId = previousNote?.projectId ?? null;

        try {
          const updatedNote = (await updateNote(
            editingNoteId,
            payload,
          )) as Note;
          const noteToPersist: Note = {
            id: updatedNote?.id ?? editingNoteId,
            title: updatedNote?.title ?? payload.title,
            body: updatedNote?.body ?? payload.body,
            projectId: updatedNote?.projectId ?? payload.projectId ?? null,
            tag: updatedNote?.tag,
            createdAt: updatedNote?.createdAt ?? previousNote?.createdAt,
            updatedAt: updatedNote?.updatedAt,
          };

          // Handle scope changes (general <-> project or project swap)
          if (
            previousProjectId &&
            previousProjectId !== noteToPersist.projectId
          ) {
            setProjectNotes((prev) => {
              const scoped = prev[previousProjectId] ?? [];
              const remaining = scoped.filter(
                (note) => note.id !== noteToPersist.id,
              );

              const next = { ...prev, [previousProjectId]: remaining };

              if (isProjectId(noteToPersist.projectId)) {
                const newProjectId = noteToPersist.projectId;
                next[newProjectId] = [
                  noteToPersist,
                  ...(next[newProjectId] ?? []),
                ];
              }

              return next;
            });

            if (!noteToPersist.projectId) {
              setGeneralNotes((prev) => [noteToPersist, ...prev]);
            }
          } else if (
            !previousProjectId &&
            isProjectId(noteToPersist.projectId)
          ) {
            const newProjectId = noteToPersist.projectId;
            setGeneralNotes((prev) =>
              prev.filter((note) => note.id !== noteToPersist.id),
            );
            setProjectNotes((prev) => ({
              ...prev,
              [newProjectId]: [noteToPersist, ...(prev[newProjectId] ?? [])],
            }));
          } else if (isProjectId(noteToPersist.projectId)) {
            const newProjectId = noteToPersist.projectId;
            setProjectNotes((prev) => ({
              ...prev,
              [newProjectId]: (prev[newProjectId] ?? []).map((note) =>
                note.id === noteToPersist.id ? noteToPersist : note,
              ),
            }));
          } else {
            setGeneralNotes((prev) =>
              prev.map((note) =>
                note.id === noteToPersist.id ? noteToPersist : note,
              ),
            );
          }
        } catch (error) {
          console.error("Failed to update note", error);
        }

        setNoteForm({ title: "", body: "" });
        setEditingNoteId(null);
        setIsNotesOpen(true);
        return;
      }

      const createdNote = (await createNote(payload)) as Note;
      const noteToPersist: Note = {
        id: createdNote?.id ?? nextNoteId(),
        title: createdNote?.title ?? payload.title,
        body: createdNote?.body ?? payload.body,
        projectId: createdNote?.projectId ?? payload.projectId ?? null,
        tag: createdNote?.tag,
        createdAt: createdNote?.createdAt,
        updatedAt: createdNote?.updatedAt,
      };

      if (isProjectId(noteToPersist.projectId)) {
        const projectNoteId = noteToPersist.projectId;
        setProjectNotes((prev) => ({
          ...prev,
          [projectNoteId]: [noteToPersist, ...(prev[projectNoteId] ?? [])],
        }));
      } else {
        setGeneralNotes((prev) => [noteToPersist, ...prev]);
      }

      setNoteForm({ title: "", body: "" });
      setEditingNoteId(null);
      setIsNotesOpen(true);
    } catch (error) {
      console.error("Failed to save note", error);
    }
  };

  const cancelEdit = () => {
    setNoteForm({ title: "", body: "" });
    setEditingNoteId(null);
  };

  const onDeleteNote = async (id: number) => {
    try {
      await deleteNoteApi(id);

      if (effectiveScope === SCOPE_PROJECT && isProjectKey(projectKey)) {
        setProjectNotes((prev) => {
          const scoped = prev[projectKey] ?? [];
          const updated = scoped.filter((note) => note.id !== id);

          return {
            ...prev,
            [projectKey]: updated,
          };
        });
        return;
      }

      setGeneralNotes((prev) => prev.filter((note) => note.id !== id));
    } catch (error) {
      console.error("Failed to delete note", error);
    }
  };

  const onEditNote = (
    note: Note,
    scope: typeof SCOPE_GENERAL | typeof SCOPE_PROJECT,
  ) => {
    setActiveScope(scope);
    setEditingNoteId(note.id);
    setNoteForm({ title: note.title, body: note.body });
    setIsNotesOpen(true);
  };

  //--------------------------------------------------------------------------
  // Render
  //--------------------------------------------------------------------------
  return (
    <div className="bg-background flex min-h-screen flex-col">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      <Navigation
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        isSidebarCollapsed={isSidebarCollapsed}
      />

      {!isNotesOpen && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsNotesOpen(true)}
          className="bg-background/95 fixed right-4 bottom-12 z-40 shadow"
        >
          <StickyNote className="h-4 w-4" />
          Notes
        </Button>
      )}

      <NotesSidebar
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        notes={scopedNotes}
        noteForm={noteForm}
        onNoteFormChange={setNoteForm}
        onAddNote={onAddNote}
        onDeleteNote={onDeleteNote}
        onEditNote={onEditNote}
        isEditing={editingNoteId !== null}
        onCancelEdit={cancelEdit}
        activeScope={activeScope}
        onScopeChange={(scope) => {
          if (scope === SCOPE_PROJECT && !projectId) return;
          setActiveScope(scope);
        }}
        hasProjectContext={canUseProjectScope}
      />

      <main
        className={cn(
          "flex-1 pt-16",
          "transition-[margin] duration-300 ease-in-out",
          isSidebarCollapsed ? "md:ml-16" : "md:ml-64",
          isNotesOpen ? "md:mr-[380px]" : "md:mr-6",
        )}
      >
        <div className="container mx-auto max-w-[1600px] p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>

      <div
        className={cn(
          "transition-[margin] duration-300 ease-in-out",
          isNotesOpen ? "md:mr-[380px]" : "md:mr-0",
        )}
      >
        <Footer isSidebarCollapsed={isSidebarCollapsed} />
      </div>
    </div>
  );
}
