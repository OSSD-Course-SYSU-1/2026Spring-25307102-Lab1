import { router } from '@kit.ArkUI';
import { MODELS, ModelEntry } from '../utils/ModelTypes';

@Entry
@Component
struct ModelSelectPage {
  @State selectedIndex: number = -1;
  @StorageLink('currentBreakpoint') breakpoint: string = 'sm';

  build() {
    Column() {
      Row() {
        Button({ type: ButtonType.Circle, stateEffect: true }) {
          Text('\u2190')
            .fontSize(this.breakpoint === 'sm' ? 18 : 22)
            .fontColor('#333333')
        }
        .width(40)
        .height(40)
        .backgroundColor('#20000000')
        .onClick(() => {
          router.back();
        })

        Text('选择模型')
          .fontSize(this.breakpoint === 'sm' ? 18 : 22)
          .fontWeight(FontWeight.Bold)
          .margin({ left: 12 })
      }
      .width('100%')
      .padding({
        left: this.breakpoint === 'sm' ? 16 : 24,
        right: this.breakpoint === 'sm' ? 16 : 24,
        top: 12,
        bottom: 12
      })
      .alignItems(VerticalAlign.Center)

      Text('3D 几何模型')
        .fontSize(this.breakpoint === 'sm' ? 13 : 15)
        .fontColor('#888888')
        .padding({ left: 20, top: 16, bottom: 8 })
        .width('100%')

      List() {
        ForEach(MODELS, (item: ModelEntry, index: number) => {
          ListItem() {
            Row() {
              Column() {
                Text(item.name)
                  .fontSize(this.breakpoint === 'sm' ? 15 : 17)
                  .fontWeight(FontWeight.Medium)
                  .fontColor('#1A1A1A')
                Text(item.description)
                  .fontSize(this.breakpoint === 'sm' ? 12 : 13)
                  .fontColor('#999999')
                  .margin({ top: 2 })
              }
              .alignItems(HorizontalAlign.Start)

              Blank()

              Text('>')
                .fontSize(20)
                .fontColor('#CCCCCC')
            }
            .width('100%')
            .padding({
              left: this.breakpoint === 'sm' ? 18 : 24,
              right: this.breakpoint === 'sm' ? 18 : 24,
              top: 14,
              bottom: 14
            })
            .backgroundColor(this.selectedIndex === index ? '#1A007DFF' : '#FFFFFF')
            .borderRadius(12)
            .margin({
              left: this.breakpoint === 'sm' ? 12 : 20,
              right: this.breakpoint === 'sm' ? 12 : 20,
              top: 4,
              bottom: 4
            })
          }
          .onClick(() => {
            this.selectedIndex = index;
            router.back({
              url: 'pages/Index',
              params: {
                shapeType: item.shapeType,
              }
            });
          })
        })
      }
      .layoutWeight(1)
      .divider({ strokeWidth: 0 })
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#F5F5F5')
  }
}
