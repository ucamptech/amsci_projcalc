import type { Note, NotePayload } from "@/types/note.type";
import { apiClient, extractApiErrorMessage } from "./axios";

type FetchNotesParams = {
  page?: number;
  limit?: number;
  projectId?: number | null;
};

export async function fetchNotes(params?: FetchNotesParams) {
  const { page = 1, limit = 50, projectId } = params ?? {};
  try {
    const { data } = await apiClient.get<{ data: Note[] }>("/notes", {
      params: { page, limit, projectId },
    });
    return data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "Failed to load notes"));
  }
}

export async function createNote(payload: NotePayload) {
  try {
    const { data } = await apiClient.post<Note>("/notes", payload);
    return data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "Failed to create note"));
  }
}

export async function updateNote(id: number, payload: NotePayload) {
  try {
    const { data } = await apiClient.put<Note>(`/notes/${id}`, payload);
    return data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "Failed to update note"));
  }
}

export async function deleteNote(id: number) {
  try {
    await apiClient.delete(`/notes/${id}`);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "Failed to delete note"));
  }
}
