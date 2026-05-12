/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { LengthMetrics, window, router } from '@kit.ArkUI';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { Logger } from '../utils/Logger';
import tetrahedron_napi from 'libtetrahedron_napi.so';
import { RotationType } from '../utils/Constants';
import { ShapeType, ShapeParams } from '../utils/ModelTypes';

interface Areas {
  top: number,
  right: number,
  bottom: number,
  left: number,
  heightBreakpoint: number,
  widthBreakpoint: number
}

interface RouteResult {
  shapeType: number;
  shapeParams: ShapeParams | null;
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
  @State modelScale: number = 1.0;

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

  @StorageLink('cutout') @Watch('cutoutChange')
  avoidAreas: window.AvoidAreaOptions | undefined = undefined;
  @StorageLink('windowHeight') windowHeight: number = 0;
  @StorageLink('windowWidth') windowWidth: number = 0;

  private xComponentId = 'tetrahedron';
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
  }

  onPageShow(): void {
    Logger.info('onPageShow');
    let params = router.getParams() as RouteResult;
    if (params && params.shapeType !== undefined) {
      this.applyShapeSelection(params.shapeType, params.shapeParams);
      router.clear();
    }
  }

  applyShapeSelection(shapeType: number, shapeParams: ShapeParams | null): void {
    Logger.info('applyShapeSelection type=' + shapeType);

    tetrahedron_napi.selectShape(shapeType);

    if (shapeParams !== null) {
      tetrahedron_napi.setShapeParams(shapeParams);
    }

    let names = [
      '四面体', '球体', '正方体', '圆锥',
      '椭球面', '单叶双曲面', '椭圆抛物面', '椭圆锥面'
    ];
    if (shapeType >= 0 && shapeType < names.length) {
      this.currentShapeName = names[shapeType];
    }
  }

  build() {
    Stack({ alignContent: Alignment.Bottom }) {
      Column() {
        Column() {
          XComponent({
            id: this.xComponentId,
            type: XComponentType.SURFACE,
            libraryname: 'tetrahedron_napi'
          })
            .onLoad(() => {
              Logger.info('onLoad');
            })
            .id('tetrahedron')
            .onDestroy(() => {
              Logger.info('onDestroy');
            })
            .id('xComponent')
            .backgroundColor('#FFFFFF')
        }
        .justifyContent(FlexAlign.SpaceAround)
        .alignItems(HorizontalAlign.Center)
        .height('100%')
        .width('100%')
        .backgroundColor('#FFFFFF')
        .borderRadius(24)
      }
      .gesture(
        PanGesture(this.panOption)
          .onActionStart(() => {
            Logger.info('Gesture onActionStart');
          })
          .onActionUpdate((event: GestureEvent) => {
            tetrahedron_napi.setRotate(RotationType.STOP);
            this.enableRotate = false;
            this.angleArray = tetrahedron_napi.updateAngle(event.offsetX, event.offsetY);
            Logger.info('Gesture onActionUpdate : offSet ' + event.offsetX + ',' + event.offsetY);
          })
          .onActionEnd(() => {
            Logger.info('Gesture onActionEnd');
          })
      )
      .height('100%')
      .justifyContent(FlexAlign.SpaceBetween)

      Row() {
        Button() {
          Row({ space: 6 }) {
            Text('\u2630')
              .fontSize(18)
              .fontColor('#FFFFFF')
            Text('模型')
              .fontSize(14)
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
      .justifyContent(FlexAlign.Start)
      .padding({ left: 16, top: 16 })
      .hitTestBehavior(HitTestMode.Transparent)
      .position({ x: 0, y: 0 })
      .zIndex(10)

      Text('当前: ' + this.currentShapeName)
        .fontSize(11)
        .fontColor('#99FFFFFF')
        .backgroundColor('#40000000')
        .borderRadius(10)
        .padding({ left: 10, right: 10, top: 4, bottom: 4 })
        .position({ x: 16, y: 56 })
        .zIndex(10)

      Row() {
        Text('缩小')
          .fontSize(11)
          .fontColor('#999999')
          .margin({ right: 8 })

        Slider({
          value: this.modelScale,
          min: 0.3,
          max: 2.5,
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
          .fontSize(11)
          .fontColor('#999999')
          .margin({ left: 8 })
      }
      .width('100%')
      .padding({ left: 24, right: 24 })
      .hitTestBehavior(HitTestMode.Transparent)

      Row({ space: 12 }) {
        Button(this.enableRotate ? $r('app.string.btn_stop_rotation') : $r('app.string.btn_auto_rotation'),
          { type: ButtonType.Capsule, stateEffect: true })
          .fontSize(16)
          .onClick(() => {
            if (this.enableRotate) {
              tetrahedron_napi.setRotate(RotationType.STOP);
              this.enableRotate = false;
            } else {
              tetrahedron_napi.setRotate(RotationType.AUTO);
              this.enableRotate = true;
            }
          })
          .layoutWeight(1)

        Button($r('app.string.btn_damping_rotation'), { type: ButtonType.Capsule, stateEffect: true })
          .fontSize(16)
          .onClick(() => {
            this.enableRotate = false;
            tetrahedron_napi.setRotate(RotationType.DAMPING);
          })
          .layoutWeight(1)
      }
      .hitTestBehavior(HitTestMode.Transparent)
      .padding({
        left: this.widthBreakpoint === WidthBreakpoint.WIDTH_SM ? 12 : 24,
        right: this.widthBreakpoint === WidthBreakpoint.WIDTH_SM ? 12 : 24,
        bottom: 50
      })
    }
    .padding(this.localPadding)
  }
}
