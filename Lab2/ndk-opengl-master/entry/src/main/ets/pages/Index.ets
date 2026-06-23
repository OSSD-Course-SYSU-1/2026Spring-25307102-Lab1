import { LengthMetrics, window, router } from '@kit.ArkUI';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { Logger } from '../utils/Logger';
import tetrahedron_napi from 'libtetrahedron_napi.so';
import { RotationType } from '../utils/Constants';
import { ShapeType } from '../utils/ModelTypes';
import { ModelState, ContinuationHelper } from '../utils/ContinuationHelper';

interface Areas {
  top: number;
  right: number;
  bottom: number;
  left: number;
  heightBreakpoint: number;
  widthBreakpoint: number;
}

interface RouteResult {
  shapeType: number;
}

function getTop(avoidArea: window.AvoidAreaOptions | undefined): number {
  let result: number = 0;
  if (avoidArea !== undefined) {
    if (avoidArea.area.topRect.height) {
      result = avoidArea.area.topRect.top + avoidArea.area.topRect.height;
    }
  } else {
    hilog.error(0x0000, '3D', 'Can not get TopSafeAreaPixel, avoidArea visible false');
  }
  return result;
}

function getBottom(avoidArea: window.AvoidAreaOptions | undefined, windowHeight: number): number {
  let result: number = 0;
  if (avoidArea !== undefined) {
    if (avoidArea.area.bottomRect.height) {
      result = windowHeight - avoidArea.area.bottomRect.top;
    }
  } else {
    hilog.error(0x0000, '3D', 'Can not get BottomSafeAreaPixel, avoidArea visible false');
  }
  return result;
}

function getLeft(avoidArea: window.AvoidAreaOptions | undefined): number {
  let result: number = 0;
  if (avoidArea !== undefined) {
    if (avoidArea.area.leftRect.width) {
      result = avoidArea.area.leftRect.left + avoidArea.area.leftRect.width;
    }
  } else {
    hilog.error(0x0000, '3D', 'Can not get LeftSafeAreaPixel, avoidArea visible false');
  }
  return result;
}

function getRight(avoidArea: window.AvoidAreaOptions | undefined, windowWidth: number): number {
  let result: number = 0;
  if (avoidArea !== undefined) {
    if (avoidArea.area.rightRect.width) {
      result = windowWidth - avoidArea.area.rightRect.left;
    }
  } else {
    hilog.error(0x0000, '3D', 'Can not get RightSafeAreaPixel, avoidArea visible false');
  }
  return result;
}

@Entry
@Component
struct Index {
  @State angleArray: Array<number> = new Array<number>();
  @State enableRotate: boolean = false;
  @State currentShapeName: string = '四面体';
  @State currentShapeType: number = 0;
  @State modelScale: number = 1.0;
  @State isWireframe: boolean = false;
  @State isFromContinuation: boolean = false;

  @State cutoutAreas: Areas = {
    top: 0, right: 0, bottom: 0, left: 0,
    heightBreakpoint: 0, widthBreakpoint: 0
  };
  @State localPadding: LocalizedPadding = {
    top: LengthMetrics.vp(0),
    start: LengthMetrics.vp(0)
  };

  @StorageLink('currentHeightBreakpoint') @Watch('breakPointChange')
  heightBreakpoint: HeightBreakpoint = HeightBreakpoint.HEIGHT_SM;
  @StorageLink('currentWidthBreakpoint') @Watch('breakPointChange')
  widthBreakpoint: WidthBreakpoint = WidthBreakpoint.WIDTH_XS;
  @StorageLink('currentBreakpoint') breakpoint: string = 'sm';

  @StorageLink('cutout') @Watch('cutoutChange')
  avoidAreas: window.AvoidAreaOptions | undefined = undefined;
  @StorageLink('windowHeight') windowHeight: number = 0;
  @StorageLink('windowWidth') windowWidth: number = 0;

  private xComponentId: string = 'tetrahedron';
  private panOption: PanGestureOptions = new PanGestureOptions({ direction: PanDirection.All });

  breakPointChange() {
    this.cutoutAreas.heightBreakpoint = this.heightBreakpoint;
    this.cutoutAreas.widthBreakpoint = this.widthBreakpoint;
    tetrahedron_napi.objectPassing(this.cutoutAreas);
  }

  cutoutChange() {
    let topPX = getTop(this.avoidAreas);
    let rightPX = getRight(this.avoidAreas, this.windowWidth);
    let bottomPX = getBottom(this.avoidAreas, this.windowHeight);
    let leftPX = getLeft(this.avoidAreas);

    this.cutoutAreas = {
      top: topPX, right: rightPX, bottom: bottomPX, left: leftPX,
      heightBreakpoint: this.heightBreakpoint, widthBreakpoint: this.widthBreakpoint
    };
    this.localPadding = {
      top: LengthMetrics.px(topPX),
      end: LengthMetrics.px(rightPX),
      bottom: LengthMetrics.px(bottomPX),
      start: LengthMetrics.px(leftPX)
    };
    tetrahedron_napi.objectPassing(this.cutoutAreas);
  }

  async aboutToAppear() {
    Logger.info('aboutToAppear');
    this.angleArray[0] = 30;
    this.angleArray[1] = 45;

    let topPX = getTop(this.avoidAreas);
    let rightPX = getRight(this.avoidAreas, this.windowWidth);
    let bottomPX = getBottom(this.avoidAreas, this.windowHeight);
    let leftPX = getLeft(this.avoidAreas);

    this.cutoutAreas = {
      top: topPX, right: rightPX, bottom: bottomPX, left: leftPX,
      heightBreakpoint: this.heightBreakpoint, widthBreakpoint: this.widthBreakpoint
    };
    this.localPadding = {
      top: LengthMetrics.px(topPX),
      end: LengthMetrics.px(rightPX),
      bottom: LengthMetrics.px(bottomPX),
      start: LengthMetrics.px(leftPX)
    };
    tetrahedron_napi.objectPassing(this.cutoutAreas);

    let isCont = AppStorage.get('isContinuation') as boolean | undefined;
    if (isCont) {
      let state = AppStorage.get('continuationState') as ModelState | undefined;
      AppStorage.setOrCreate('isContinuation', false);
      AppStorage.setOrCreate('continuationState', null);
      if (state) {
        this.isFromContinuation = true;
        this.restoreFromContinuation(state);
      }
    }
  }

  restoreFromContinuation(state: ModelState): void {
    Logger.info('restoreFromContinuation shape=' + state.shapeType);
    this.currentShapeType = state.shapeType;
    this.modelScale = state.scale;
    this.angleArray[0] = state.angleX;
    this.angleArray[1] = state.angleY;
    this.isWireframe = state.wireframe;

    tetrahedron_napi.selectShape(state.shapeType);
    tetrahedron_napi.setScale(state.scale);
    if (state.wireframe) {
      tetrahedron_napi.toggleWireframe();
    }
    let names = ['四面体', '球体', '正方体', '圆锥'];
    if (state.shapeType >= 0 && state.shapeType < names.length) {
      this.currentShapeName = names[state.shapeType];
    }
  }

  onPageShow(): void {
    Logger.info('onPageShow');
    let params = router.getParams() as RouteResult;
    if (params && params.shapeType !== undefined) {
      this.applyShapeSelection(params.shapeType);
      router.clear();
    }
  }

  applyShapeSelection(shapeType: number): void {
    Logger.info('applyShapeSelection type=' + shapeType);
    this.currentShapeType = shapeType;
    tetrahedron_napi.selectShape(shapeType);
    let names = ['四面体', '球体', '正方体', '圆锥'];
    if (shapeType >= 0 && shapeType < names.length) {
      this.currentShapeName = names[shapeType];
    }
  }

  getModelState(): ModelState {
    let state = new ModelState();
    state.shapeType = this.currentShapeType;
    state.scale = this.modelScale;
    state.angleX = this.angleArray[0] || 30;
    state.angleY = this.angleArray[1] || 45;
    state.wireframe = this.isWireframe;
    return state;
  }

  @Builder
  canvasView() {
    Column() {
      Column() {
        XComponent({
          id: this.xComponentId,
          type: XComponentType.SURFACE,
          libraryname: 'tetrahedron_napi'
        })
          .onLoad(() => { Logger.info('onLoad'); })
          .id('tetrahedron')
          .onDestroy(() => { Logger.info('onDestroy'); })
          .id('xComponent')
          .backgroundColor('#FFFFFF')
      }
      .justifyContent(FlexAlign.SpaceAround)
      .alignItems(HorizontalAlign.Center)
      .height('100%')
      .width('100%')
      .backgroundColor('#FFFFFF')
      .borderRadius(this.breakpoint === 'sm' ? 0 : 24)
    }
  }

  @Builder
  controlsPanel() {
    Column() {
      if (this.isFromContinuation) {
        Text('已从其他设备恢复')
          .fontSize(11)
          .fontColor('#4caf50')
          .backgroundColor('#1A4caf50')
          .borderRadius(6)
          .padding({ left: 8, right: 8, top: 3, bottom: 3 })
          .margin({ bottom: this.breakpoint === 'sm' ? 6 : 10 })
      }

      Row() {
        Button() {
          Row({ space: 6 }) {
            Text('\u2630')
              .fontSize(this.breakpoint === 'sm' ? 16 : 18)
              .fontColor('#FFFFFF')
            Text('模型')
              .fontSize(this.breakpoint === 'sm' ? 13 : 14)
              .fontColor('#FFFFFF')
              .fontWeight(FontWeight.Medium)
          }
        }
        .type(ButtonType.Capsule)
        .backgroundColor('#80000000')
        .borderRadius(20)
        .onClick(() => {
          router.pushUrl({ url: 'pages/ModelSelectPage' });
        })
      }
      .width('100%')
      .justifyContent(FlexAlign.Center)
      .margin({ bottom: this.breakpoint === 'sm' ? 6 : 10 })

      Text('当前: ' + this.currentShapeName)
        .fontSize(this.breakpoint === 'sm' ? 11 : 13)
        .fontColor('#99FFFFFF')
        .backgroundColor('#40000000')
        .borderRadius(10)
        .padding({ left: 10, right: 10, top: 4, bottom: 4 })
        .margin({ bottom: this.breakpoint === 'sm' ? 8 : 14 })

      Row() {
        Text('缩小')
          .fontSize(this.breakpoint === 'sm' ? 10 : 12)
          .fontColor('#999999')
          .margin({ right: 8 })

        Slider({
          value: this.modelScale,
          min: 0.1,
          max: 3.0,
          step: 0.05,
          style: SliderStyle.InSet
        })
          .showTips(true)
          .trackColor('#40000000')
          .selectedColor('#FFFFFF')
          .layoutWeight(1)
          .onChange((value: number) => {
            this.modelScale = value;
            tetrahedron_napi.setScale(value);
          })

        Text('放大')
          .fontSize(this.breakpoint === 'sm' ? 10 : 12)
          .fontColor('#999999')
          .margin({ left: 8 })
      }
      .width('100%')
      .margin({ bottom: this.breakpoint === 'sm' ? 6 : 12 })

      Row({ space: 8 }) {
        Button(this.enableRotate ? '停止' : '自动',
          { type: ButtonType.Capsule, stateEffect: true })
          .fontSize(this.breakpoint === 'sm' ? 13 : 14)
          .layoutWeight(1)
          .onClick(() => {
            if (this.enableRotate) {
              tetrahedron_napi.setRotate(RotationType.STOP);
              this.enableRotate = false;
            } else {
              tetrahedron_napi.setRotate(RotationType.AUTO);
              this.enableRotate = true;
            }
          })

        Button('阻尼', { type: ButtonType.Capsule, stateEffect: true })
          .fontSize(this.breakpoint === 'sm' ? 13 : 14)
          .layoutWeight(1)
          .onClick(() => {
            this.enableRotate = false;
            tetrahedron_napi.setRotate(RotationType.DAMPING);
          })

        Button(this.isWireframe ? '实体' : '线框',
          { type: ButtonType.Capsule, stateEffect: true })
          .fontSize(this.breakpoint === 'sm' ? 12 : 13)
          .layoutWeight(0.6)
          .onClick(() => {
            this.isWireframe = !this.isWireframe;
            tetrahedron_napi.toggleWireframe();
          })
      }
      .width('100%')
    }
  }

  build() {
    Stack() {
      if (this.breakpoint === 'sm') {
        Column() {
          Column() {
            this.canvasView()
          }
          .gesture(
            PanGesture(this.panOption)
              .onActionStart(() => { Logger.info('Gesture onActionStart'); })
              .onActionUpdate((event: GestureEvent) => {
                tetrahedron_napi.setRotate(RotationType.STOP);
                this.enableRotate = false;
                this.angleArray = tetrahedron_napi.updateAngle(event.offsetX, event.offsetY);
              })
              .onActionEnd(() => { Logger.info('Gesture onActionEnd'); })
          )
          .height('58%')
          .width('100%')

          Column() {
            this.controlsPanel()
          }
          .width('92%')
          .margin({ top: 12 })
        }
        .height('100%')
        .width('100%')
        .backgroundColor('#1A1A2E')
        .padding(this.localPadding)
      } else {
        Row() {
          Column() {
            this.canvasView()
          }
          .gesture(
            PanGesture(this.panOption)
              .onActionStart(() => { Logger.info('Gesture onActionStart'); })
              .onActionUpdate((event: GestureEvent) => {
                tetrahedron_napi.setRotate(RotationType.STOP);
                this.enableRotate = false;
                this.angleArray = tetrahedron_napi.updateAngle(event.offsetX, event.offsetY);
              })
              .onActionEnd(() => { Logger.info('Gesture onActionEnd'); })
          )
          .layoutWeight(1)
          .height('100%')

          Column() {
            this.controlsPanel()
          }
          .width(this.breakpoint === 'md' ? 220 : 280)
          .height('100%')
          .justifyContent(FlexAlign.Center)
          .padding({ left: 16, right: 16, top: 40, bottom: 40 })
          .backgroundColor('#16213E')
        }
        .height('100%')
        .width('100%')
        .backgroundColor('#1A1A2E')
        .padding(this.localPadding)
      }
    }
  }
}
