export class NoteItem {
  id: string = '';
  title: string = '';
  content: string = '';
  cursorPos: number = 0;
  time: number = Date.now();

  constructor(title?: string, content?: string) {
    this.id = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
    this.title = title || '';
    this.content = content || '';
    this.time = Date.now();
  }
}

export class ContinuationState {
  noteId: string = '';
  title: string = '';
  content: string = '';
  cursorPos: number = 0;

  static fromNote(note: NoteItem): ContinuationState {
    let state = new ContinuationState();
    state.noteId = note.id;
    state.title = note.title;
    state.content = note.content;
    state.cursorPos = note.cursorPos;
    return state;
  }

  static toNote(state: ContinuationState): NoteItem {
    let n = new NoteItem();
    n.id = state.noteId;
    n.title = state.title;
    n.content = state.content;
    n.cursorPos = state.cursorPos;
    return n;
  }
}
