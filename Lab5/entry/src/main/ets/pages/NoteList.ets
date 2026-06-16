import router from '@ohos.router';
import { NoteItem } from '../model/NoteModel';
import { AppState } from '../common/AppState';
import promptAction from '@ohos.promptAction';

@Entry
@Component
struct NoteList {
  @State notes: NoteItem[] = [];
  @State showEmpty: boolean = true;

  aboutToAppear(): void {
    this.loadNotes();
    this.showEmpty = this.notes.length === 0;

    let isCont = AppState.get<boolean>('isContinuation');
    if (isCont) {
      let note = AppState.get<NoteItem>('continuationNote');
      AppState.set('isContinuation', false);
      AppState.set('continuationNote', undefined);
      if (note) {
        this.openEditor(note, true);
      }
    }
  }

  loadNotes(): void {
    let saved = AppState.get<NoteItem[]>('noteflowNotes');
    if (!saved || saved.length === 0) {
      let n1 = new NoteItem('开会纪要', '1. Q1业绩增长20%\n2. 下季度重点: 海外市场\n3. 团队新增3人');
      let n2 = new NoteItem('购物清单', '牛奶、面包、鸡蛋、苹果、洗衣液');
      saved = [n1, n2];
      AppState.set('noteflowNotes', saved as Object);
    }
    this.notes = saved;
    this.showEmpty = this.notes.length === 0;
  }

  openEditor(note: NoteItem, isContinuation: boolean): void {
    AppState.set('currentNote', note as Object);
    router.pushUrl({
      url: 'pages/NoteEditor',
      params: {
        noteId: note.id,
        title: note.title,
        content: note.content,
        isContinuation: isContinuation
      }
    }).catch(() => {});
  }

  createNote(): void {
    let note = new NoteItem('新笔记', '');
    let arr = AppState.get<NoteItem[]>('noteflowNotes') || [];
    arr.unshift(note);
    AppState.set('noteflowNotes', arr as Object);
    this.notes = arr;
    this.showEmpty = false;
    this.openEditor(note, false);
  }

  deleteNote(id: string): void {
    let arr = AppState.get<NoteItem[]>('noteflowNotes') || [];
    let idx = arr.findIndex((n: NoteItem) => n.id === id);
    if (idx >= 0) {
      arr.splice(idx, 1);
      AppState.set('noteflowNotes', arr as Object);
      this.notes = arr;
      this.showEmpty = this.notes.length === 0;
    }
  }

  triggerFlow(note: NoteItem): void {
    AppState.set('currentNote', note as Object);
    promptAction.showToast({ message: '请从最近任务界面发起流转', duration: 2000 });
  }

  formatTime(ts: number): string {
    let d = new Date(ts);
    let m = (d.getMonth() + 1).toString().padStart(2, '0');
    let day = d.getDate().toString().padStart(2, '0');
    let h = d.getHours().toString().padStart(2, '0');
    let min = d.getMinutes().toString().padStart(2, '0');
    return m + '-' + day + ' ' + h + ':' + min;
  }

  build() {
    Column() {
      Row() {
        Text('NoteFlow')
          .fontSize(24)
          .fontWeight(FontWeight.Bold)
          .fontColor('#ffffff')

        Blank()

        Button('+ 新建')
          .fontSize(14)
          .fontColor('#4facfe')
          .backgroundColor('rgba(79,172,254,0.1)')
          .border({ width: 1, color: 'rgba(79,172,254,0.3)' })
          .borderRadius(8)
          .padding({ left: 16, right: 16, top: 8, bottom: 8 })
          .onClick(() => { this.createNote(); })
      }
      .width('100%')
      .padding({ left: 20, right: 20, top: 16, bottom: 12 })

      Text('长按笔记可删除')
        .fontSize(12)
        .fontColor('#666666')
        .padding({ left: 20, bottom: 12 })

      if (this.showEmpty) {
        Column() {
          Text('还没有笔记')
            .fontSize(16)
            .fontColor('#555555')
            .margin({ bottom: 12 })
          Button('创建第一篇')
            .fontSize(14)
            .fontColor('#ffffff')
            .backgroundColor('#4facfe')
            .borderRadius(10)
            .padding({ left: 24, right: 24, top: 10, bottom: 10 })
            .onClick(() => { this.createNote(); })
        }
        .width('100%')
        .layoutWeight(1)
        .justifyContent(FlexAlign.Center)
      } else {
        List() {
          ForEach(this.notes, (note: NoteItem) => {
            ListItem() {
              Row() {
                Column() {
                  Text(note.title || '无标题')
                    .fontSize(16)
                    .fontWeight(FontWeight.Medium)
                    .fontColor('#e0e0e0')
                    .maxLines(1)
                    .textOverflow({ overflow: TextOverflow.Ellipsis })

                  Text(note.content || '空内容')
                    .fontSize(13)
                    .fontColor('#888888')
                    .maxLines(2)
                    .textOverflow({ overflow: TextOverflow.Ellipsis })
                    .margin({ top: 4 })
                }
                .alignItems(HorizontalAlign.Start)
                .layoutWeight(1)

                Column() {
                  Text(this.formatTime(note.time))
                    .fontSize(11)
                    .fontColor('#555555')

                  Button('流转')
                    .fontSize(11)
                    .fontColor('#ffa726')
                    .backgroundColor('rgba(255,167,38,0.1)')
                    .border({ width: 1, color: 'rgba(255,167,38,0.25)' })
                    .borderRadius(6)
                    .padding({ left: 10, right: 10, top: 4, bottom: 4 })
                    .margin({ top: 6 })
                    .onClick(() => {
                      this.triggerFlow(note);
                    })
                }
                .alignItems(HorizontalAlign.End)
                .margin({ left: 12 })
              }
              .width('100%')
              .padding(16)
              .borderRadius(12)
              .backgroundColor('rgba(255,255,255,0.05)')
              .border({ width: 1, color: 'rgba(255,255,255,0.06)' })
              .onClick(() => { this.openEditor(note, false); })
              .gesture(
                LongPressGesture()
                  .onAction(() => {
                    this.deleteNote(note.id);
                  })
              )
            }
            .margin({ bottom: 10 })
          })
        }
        .layoutWeight(1)
        .padding({ left: 16, right: 16 })
      }
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#0a0a0a')
  }
}
