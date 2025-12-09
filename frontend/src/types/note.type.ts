export type Note = {
  id: number;
  projectId?: number | null;
  title: string;
  body: string;
  tag?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type NotePayload = {
  projectId?: number | null;
  title: string;
  body: string;
  tag?: string | null;
};

export type NoteScope = "generalScope" | "projectScope";
