import { ContinuationState, NoteItem } from '../model/NoteModel';

export class ContinuationHelper {
  static pack(note: NoteItem): Record<string, Object> {
    let state = ContinuationState.fromNote(note);
    let result: Record<string, Object> = {};
    result['noteId'] = state.noteId;
    result['title'] = state.title;
    result['content'] = state.content;
    result['cursorPos'] = state.cursorPos;
    return result;
  }

  static unpack(params: Record<string, Object>): NoteItem | null {
    let noteId = params['noteId'] as string;
    if (!noteId || noteId.length === 0) {
      return null;
    }
    let note = new NoteItem();
    note.id = noteId;
    note.title = (params['title'] as string) || '';
    note.content = (params['content'] as string) || '';
    note.cursorPos = (params['cursorPos'] as number) || 0;
    return note;
  }
}
