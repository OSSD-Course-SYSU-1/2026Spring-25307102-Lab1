import router from '@ohos.router';
import { NoteItem } from '../model/NoteModel';
import { AppState } from '../common/AppState';

@Entry
@Component
struct NoteEditor {
  @State noteId: string = '';
  @State title: string = '';
  @State content: string = '';
  @State isContinuation: boolean = false;
  @State hasChanges: boolean = false;

  aboutToAppear(): void {
    let params = router.getParams() as Record<string, Object>;
    if (params) {
      this.noteId = (params['noteId'] as string) || '';
      this.title = (params['title'] as string) || '';
      this.content = (params['content'] as string) || '';
      this.isContinuation = (params['isContinuation'] as boolean) || false;
    }

    let note = new NoteItem(this.title, this.content);
    note.id = this.noteId;
    AppState.set('currentNote', note as Object);
  }

  saveAndBack(): void {
    let arr = AppState.get<NoteItem[]>('noteflowNotes') || [];
    let found = arr.find((n: NoteItem) => n.id === this.noteId);
    if (found) {
      found.title = this.title;
      found.content = this.content;
      found.time = Date.now();
      AppState.set('noteflowNotes', arr as Object);
    }
    router.back();
  }

  build() {
    Column() {
      Row() {
        Button('返回')
          .fontSize(14)
          .fontColor('#888888')
          .backgroundColor('transparent')
          .onClick(() => {
            if (this.hasChanges) {
              this.saveAndBack();
            } else {
              router.back();
            }
          })

        Blank()

        if (this.isContinuation) {
          Text('已从其他设备恢复')
            .fontSize(12)
            .fontColor('#4caf50')
            .margin({ right: 12 })
        }

        Button('保存')
          .fontSize(14)
          .fontColor('#ffffff')
          .backgroundColor('#4facfe')
          .borderRadius(8)
          .padding({ left: 16, right: 16, top: 6, bottom: 6 })
          .onClick(() => {
            this.hasChanges = false;
            this.saveAndBack();
          })
      }
      .width('100%')
      .padding({ left: 16, right: 16, top: 12, bottom: 8 })

      TextInput({ text: $$this.title, placeholder: '笔记标题' })
        .fontSize(22)
        .fontWeight(FontWeight.Bold)
        .fontColor('#ffffff')
        .placeholderColor('#444444')
        .backgroundColor('transparent')
        .border({ width: 0 })
        .padding({ left: 20, right: 20, top: 8, bottom: 8 })
        .onChange((value: string) => {
          this.hasChanges = true;
          let note = AppState.get<NoteItem>('currentNote');
          if (note) {
            note.title = value;
            note.cursorPos = value.length;
            AppState.set('currentNote', note as Object);
          }
        })

      Divider()
        .color('rgba(255,255,255,0.06)')
        .margin({ left: 20, right: 20 })

      TextArea({ text: $$this.content, placeholder: '开始写笔记...' })
        .fontSize(15)
        .fontColor('#cccccc')
        .placeholderColor('#444444')
        .backgroundColor('transparent')
        .border({ width: 0 })
        .padding({ left: 20, right: 20, top: 12 })
        .layoutWeight(1)
        .onChange((value: string) => {
          this.hasChanges = true;
          let note = AppState.get<NoteItem>('currentNote');
          if (note) {
            note.content = value;
            AppState.set('currentNote', note as Object);
          }
        })

      Text('支持跨设备流转：在另一台设备上继续编辑')
        .fontSize(11)
        .fontColor('#444444')
        .textAlign(TextAlign.Center)
        .padding({ top: 8, bottom: 16 })
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#0a0a0a')
  }
}
