import type { Note } from "@/types/note.type";

export const STARTER_NOTES: Note[] = [
  {
    id: 1,
    title: "Launch readiness",
    body: "Confirm sign-offs for copy, QA on success/error paths, and handoff to support.",
    tag: "Release",
    createdAt: "Today",
    projectId: null,
  },
  {
    id: 2,
    title: "Stakeholder reminders",
    body: "Share dashboards before Thursday. Add risks to the next steering deck.",
    tag: "Follow up",
    createdAt: "1 day ago",
    projectId: null,
  },
  {
    id: 3,
    title: "Research nuggets",
    body: "Top 3 callouts: reduce form fields, surface recent projects, and clarify ownership.",
    tag: "Research",
    createdAt: "This week",
    projectId: null,
  },
  {
    id: 4,
    title: "Research project",
    body: "Top 3 callouts: reduce form fields, surface recent projects, and clarify ownership.",
    tag: "Research",
    createdAt: "This week",
    projectId: 1,
  },
];
