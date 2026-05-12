import { router } from '@kit.ArkUI';
import { ShapeType, ShapeParams, ParamDescription, getParamDescriptions, getDefaultParams } from '../utils/ModelTypes';

interface ParamEditParams {
  shapeType: number;
  shapeName: string;
  defaultParams: ShapeParams;
}

@Entry
@Component
struct ParamEditPage {
  @State shapeType: ShapeType = ShapeType.PARAMETRIC_ELLIPSOID;
  @State shapeName: string = '';
  @State paramA: number = 1.5;
  @State paramB: number = 1.2;
  @State paramC: number = 1.0;
  @State resolutionU: number = 32;
  @State resolutionV: number = 32;
  @State paramDescriptions: ParamDescription[] = [];

  aboutToAppear(): void {
    let params = router.getParams() as ParamEditParams;
    if (params) {
      this.shapeType = params.shapeType as ShapeType;
      this.shapeName = params.shapeName;
      if (params.defaultParams) {
        this.paramA = params.defaultParams.paramA;
        this.paramB = params.defaultParams.paramB;
        this.paramC = params.defaultParams.paramC;
        this.resolutionU = params.defaultParams.resolutionU;
        this.resolutionV = params.defaultParams.resolutionV;
      }
      this.paramDescriptions = getParamDescriptions(this.shapeType);
    }
  }

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

        Text(this.shapeName + ' - 参数设置')
          .fontSize(18)
          .fontWeight(FontWeight.Bold)
          .margin({ left: 12 })
          .maxLines(1)
          .textOverflow({ overflow: TextOverflow.Ellipsis })
      }
      .width('100%')
      .padding({ left: 16, right: 16, top: 12, bottom: 12 })
      .alignItems(VerticalAlign.Center)

      Column() {
        Text(this.getEquationText())
          .fontSize(14)
          .fontColor('#333333')
          .fontFamily('monospace')
          .textAlign(TextAlign.Center)
      }
      .width('100%')
      .padding(16)
      .backgroundColor('#FFFFFF')
      .borderRadius(12)
      .margin({ left: 16, right: 16, top: 12, bottom: 12 })

      Scroll() {
        Column() {
          ForEach(this.paramDescriptions, (desc: ParamDescription, index: number) => {
            Column() {
              Row() {
                Text(desc.label)
                  .fontSize(14)
                  .fontColor('#333333')
                  .fontWeight(FontWeight.Medium)

                Blank()

                Text(this.getParamValue(desc.key).toFixed(1))
                  .fontSize(14)
                  .fontColor('#007DFF')
                  .fontWeight(FontWeight.Bold)
              }
              .width('100%')

              Slider({
                value: this.getParamValue(desc.key),
                min: desc.min,
                max: desc.max,
                step: desc.step,
                style: SliderStyle.InSet
              })
                .showTips(true)
                .trackColor('#E0E0E0')
                .selectedColor('#007DFF')
                .onChange((value: number) => {
                  this.setParamValue(desc.key, value);
                })
                .width('100%')
                .margin({ top: 4, bottom: 12 })
            }
            .width('100%')
            .padding({ left: 20, right: 20, top: 12, bottom: 4 })
            .backgroundColor('#FFFFFF')
            .borderRadius(12)
            .margin({ left: 16, right: 16, top: 4, bottom: 4 })
          })
        }
      }
      .layoutWeight(1)
      .scrollBar(BarState.Off)

      Row({ space: 16 }) {
        Button('恢复默认')
          .fontSize(16)
          .type(ButtonType.Normal)
          .backgroundColor('#F0F0F0')
          .fontColor('#333333')
          .borderRadius(24)
          .layoutWeight(1)
          .onClick(() => {
            let defaults = getDefaultParams();
            this.paramA = defaults.paramA;
            this.paramB = defaults.paramB;
            this.paramC = defaults.paramC;
            this.resolutionU = defaults.resolutionU;
            this.resolutionV = defaults.resolutionV;
          })

        Button('确认应用')
          .fontSize(16)
          .type(ButtonType.Normal)
          .backgroundColor('#007DFF')
          .fontColor('#FFFFFF')
          .borderRadius(24)
          .layoutWeight(1)
          .onClick(() => {
            let shapeParams: ShapeParams = {
              paramA: this.paramA,
              paramB: this.paramB,
              paramC: this.paramC,
              resolutionU: this.resolutionU,
              resolutionV: this.resolutionV
            };
            router.back({
              url: 'pages/Index',
              params: {
                shapeType: this.shapeType,
                shapeParams: shapeParams
              }
            });
          })
      }
      .width('100%')
      .padding({ left: 16, right: 16, top: 12, bottom: 24 })
      .backgroundColor('#FAFAFA')
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#F5F5F5')
  }

  getParamValue(key: string): number {
    switch (key) {
      case 'paramA': return this.paramA;
      case 'paramB': return this.paramB;
      case 'paramC': return this.paramC;
      case 'resolutionU': return this.resolutionU;
      case 'resolutionV': return this.resolutionV;
      default: return 0;
    }
  }

  setParamValue(key: string, value: number): void {
    switch (key) {
      case 'paramA': this.paramA = value; break;
      case 'paramB': this.paramB = value; break;
      case 'paramC': this.paramC = value; break;
      case 'resolutionU': this.resolutionU = value; break;
      case 'resolutionV': this.resolutionV = value; break;
    }
  }

  getEquationText(): string {
    switch (this.shapeType) {
      case ShapeType.PARAMETRIC_ELLIPSOID:
        return 'x\u00B2/' + this.paramA.toFixed(1) + '\u00B2 + y\u00B2/' +
          this.paramB.toFixed(1) + '\u00B2 + z\u00B2/' +
          this.paramC.toFixed(1) + '\u00B2 = 1';
      case ShapeType.PARAMETRIC_HYPERBOLOID:
        return 'x\u00B2/' + this.paramA.toFixed(1) + '\u00B2 + y\u00B2/' +
          this.paramB.toFixed(1) + '\u00B2 \u2212 z\u00B2/' +
          this.paramC.toFixed(1) + '\u00B2 = 1';
      case ShapeType.PARAMETRIC_PARABOLOID:
        return 'z = x\u00B2/' + this.paramA.toFixed(1) + '\u00B2 + y\u00B2/' +
          this.paramB.toFixed(1) + '\u00B2';
      case ShapeType.PARAMETRIC_ELLIPTIC_CONE:
        return 'x\u00B2/' + this.paramA.toFixed(1) + '\u00B2 + y\u00B2/' +
          this.paramB.toFixed(1) + '\u00B2 = z\u00B2/' +
          this.paramC.toFixed(1) + '\u00B2';
      default:
        return '';
    }
  }
}
