import { router } from '@kit.ArkUI';
import { MODELS, ModelEntry } from '../utils/ModelTypes';

@Entry
@Component
struct ModelSelectPage {
  @State selectedIndex: number = -1;

  build() {
    Column() {
      Row() {
        Button({ type: ButtonType.Circle, stateEffect: true }) {
          Text('\u2190')
            .fontSize(20)
            .fontColor('#333333')
        }
        .width(40)
        .height(40)
        .backgroundColor('#20000000')
        .onClick(() => {
          router.back();
        })

        Text('选择模型')
          .fontSize(20)
          .fontWeight(FontWeight.Bold)
          .margin({ left: 12 })
      }
      .width('100%')
      .padding({ left: 16, right: 16, top: 12, bottom: 12 })
      .alignItems(VerticalAlign.Center)

      Text('3D 几何模型')
        .fontSize(14)
        .fontColor('#888888')
        .padding({ left: 20, top: 16, bottom: 8 })
        .width('100%')

      List() {
        ForEach(MODELS, (item: ModelEntry, index: number) => {
          ListItem() {
            Row() {
              Column() {
                Text(item.name)
                  .fontSize(16)
                  .fontWeight(FontWeight.Medium)
                  .fontColor('#1A1A1A')
                Text(item.description)
                  .fontSize(12)
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
            .padding({ left: 20, right: 20, top: 16, bottom: 16 })
            .backgroundColor(this.selectedIndex === index ? '#1A007DFF' : '#FFFFFF')
            .borderRadius(12)
            .margin({ left: 12, right: 12, top: 4, bottom: 4 })
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
