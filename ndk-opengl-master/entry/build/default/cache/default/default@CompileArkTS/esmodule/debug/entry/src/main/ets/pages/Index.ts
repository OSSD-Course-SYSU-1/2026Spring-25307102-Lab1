if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface Index_Params {
    angleArray?: Array<number>;
    enableRotate?: boolean;
    currentShapeName?: string;
    modelScale?: number;
    cutoutAreas?: Areas;
    localPadding?: LocalizedPadding;
    heightBreakpoint?: HeightBreakpoint;
    widthBreakpoint?: WidthBreakpoint;
    avoidAreas?: window.AvoidAreaOptions | undefined;
    windowHeight?: number;
    windowWidth?: number;
    xComponentId?;
    panOption?: PanGestureOptions;
}
import { LengthMetrics } from "@ohos:arkui.node";
import type window from "@ohos:window";
import router from "@ohos:router";
import hilog from "@ohos:hilog";
import { Logger } from "@bundle:com.samples.ndkopengl/entry/ets/utils/Logger";
import tetrahedron_napi from "@app:com.samples.ndkopengl/entry/tetrahedron_napi";
import { RotationType } from "@bundle:com.samples.ndkopengl/entry/ets/utils/Constants";
import type { ShapeParams } from '../utils/ModelTypes';
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
    shapeParams: ShapeParams | null;
}
function getTop(avoidArea: window.AvoidAreaOptions | undefined): number {
    let result: number = 0;
    if (avoidArea !== undefined) {
        if (avoidArea.area.topRect.height) {
            result = avoidArea.area.topRect.top + avoidArea.area.topRect.height;
        }
    }
    else {
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
    }
    else {
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
    }
    else {
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
    }
    else {
        hilog.error(0x0000, '3D', 'Can not get RightSafeAreaPixel, avoidArea visible false');
    }
    return result;
}
class Index extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__angleArray = new ObservedPropertyObjectPU(new Array<number>(), this, "angleArray");
        this.__enableRotate = new ObservedPropertySimplePU(false, this, "enableRotate");
        this.__currentShapeName = new ObservedPropertySimplePU('四面体', this, "currentShapeName");
        this.__modelScale = new ObservedPropertySimplePU(1.0, this, "modelScale");
        this.__cutoutAreas = new ObservedPropertyObjectPU({
            top: 0, right: 0, bottom: 0, left: 0,
            heightBreakpoint: 0, widthBreakpoint: 0
        }, this, "cutoutAreas");
        this.__localPadding = new ObservedPropertyObjectPU({
            top: LengthMetrics.vp(0),
            start: LengthMetrics.vp(0)
        }, this, "localPadding");
        this.__heightBreakpoint = this.createStorageLink('currentHeightBreakpoint', HeightBreakpoint.HEIGHT_SM, "heightBreakpoint");
        this.__widthBreakpoint = this.createStorageLink('currentWidthBreakpoint', WidthBreakpoint.WIDTH_XS, "widthBreakpoint");
        this.__avoidAreas = this.createStorageLink('cutout', undefined, "avoidAreas");
        this.__windowHeight = this.createStorageLink('windowHeight', 0, "windowHeight");
        this.__windowWidth = this.createStorageLink('windowWidth', 0, "windowWidth");
        this.xComponentId = 'tetrahedron';
        this.panOption = new PanGestureOptions({ direction: PanDirection.All });
        this.setInitiallyProvidedValue(params);
        this.declareWatch("heightBreakpoint", this.breakPointChange);
        this.declareWatch("widthBreakpoint", this.breakPointChange);
        this.declareWatch("avoidAreas", this.cutoutChange);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: Index_Params) {
        if (params.angleArray !== undefined) {
            this.angleArray = params.angleArray;
        }
        if (params.enableRotate !== undefined) {
            this.enableRotate = params.enableRotate;
        }
        if (params.currentShapeName !== undefined) {
            this.currentShapeName = params.currentShapeName;
        }
        if (params.modelScale !== undefined) {
            this.modelScale = params.modelScale;
        }
        if (params.cutoutAreas !== undefined) {
            this.cutoutAreas = params.cutoutAreas;
        }
        if (params.localPadding !== undefined) {
            this.localPadding = params.localPadding;
        }
        if (params.xComponentId !== undefined) {
            this.xComponentId = params.xComponentId;
        }
        if (params.panOption !== undefined) {
            this.panOption = params.panOption;
        }
    }
    updateStateVars(params: Index_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__angleArray.purgeDependencyOnElmtId(rmElmtId);
        this.__enableRotate.purgeDependencyOnElmtId(rmElmtId);
        this.__currentShapeName.purgeDependencyOnElmtId(rmElmtId);
        this.__modelScale.purgeDependencyOnElmtId(rmElmtId);
        this.__cutoutAreas.purgeDependencyOnElmtId(rmElmtId);
        this.__localPadding.purgeDependencyOnElmtId(rmElmtId);
        this.__heightBreakpoint.purgeDependencyOnElmtId(rmElmtId);
        this.__widthBreakpoint.purgeDependencyOnElmtId(rmElmtId);
        this.__avoidAreas.purgeDependencyOnElmtId(rmElmtId);
        this.__windowHeight.purgeDependencyOnElmtId(rmElmtId);
        this.__windowWidth.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__angleArray.aboutToBeDeleted();
        this.__enableRotate.aboutToBeDeleted();
        this.__currentShapeName.aboutToBeDeleted();
        this.__modelScale.aboutToBeDeleted();
        this.__cutoutAreas.aboutToBeDeleted();
        this.__localPadding.aboutToBeDeleted();
        this.__heightBreakpoint.aboutToBeDeleted();
        this.__widthBreakpoint.aboutToBeDeleted();
        this.__avoidAreas.aboutToBeDeleted();
        this.__windowHeight.aboutToBeDeleted();
        this.__windowWidth.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __angleArray: ObservedPropertyObjectPU<Array<number>>;
    get angleArray() {
        return this.__angleArray.get();
    }
    set angleArray(newValue: Array<number>) {
        this.__angleArray.set(newValue);
    }
    private __enableRotate: ObservedPropertySimplePU<boolean>;
    get enableRotate() {
        return this.__enableRotate.get();
    }
    set enableRotate(newValue: boolean) {
        this.__enableRotate.set(newValue);
    }
    private __currentShapeName: ObservedPropertySimplePU<string>;
    get currentShapeName() {
        return this.__currentShapeName.get();
    }
    set currentShapeName(newValue: string) {
        this.__currentShapeName.set(newValue);
    }
    private __modelScale: ObservedPropertySimplePU<number>;
    get modelScale() {
        return this.__modelScale.get();
    }
    set modelScale(newValue: number) {
        this.__modelScale.set(newValue);
    }
    private __cutoutAreas: ObservedPropertyObjectPU<Areas>;
    get cutoutAreas() {
        return this.__cutoutAreas.get();
    }
    set cutoutAreas(newValue: Areas) {
        this.__cutoutAreas.set(newValue);
    }
    private __localPadding: ObservedPropertyObjectPU<LocalizedPadding>;
    get localPadding() {
        return this.__localPadding.get();
    }
    set localPadding(newValue: LocalizedPadding) {
        this.__localPadding.set(newValue);
    }
    private __heightBreakpoint: ObservedPropertyAbstractPU<HeightBreakpoint>;
    get heightBreakpoint() {
        return this.__heightBreakpoint.get();
    }
    set heightBreakpoint(newValue: HeightBreakpoint) {
        this.__heightBreakpoint.set(newValue);
    }
    private __widthBreakpoint: ObservedPropertyAbstractPU<WidthBreakpoint>;
    get widthBreakpoint() {
        return this.__widthBreakpoint.get();
    }
    set widthBreakpoint(newValue: WidthBreakpoint) {
        this.__widthBreakpoint.set(newValue);
    }
    private __avoidAreas: ObservedPropertyAbstractPU<window.AvoidAreaOptions | undefined>;
    get avoidAreas() {
        return this.__avoidAreas.get();
    }
    set avoidAreas(newValue: window.AvoidAreaOptions | undefined) {
        this.__avoidAreas.set(newValue);
    }
    private __windowHeight: ObservedPropertyAbstractPU<number>;
    get windowHeight() {
        return this.__windowHeight.get();
    }
    set windowHeight(newValue: number) {
        this.__windowHeight.set(newValue);
    }
    private __windowWidth: ObservedPropertyAbstractPU<number>;
    get windowWidth() {
        return this.__windowWidth.get();
    }
    set windowWidth(newValue: number) {
        this.__windowWidth.set(newValue);
    }
    private xComponentId;
    private panOption: PanGestureOptions;
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
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Stack.create({ alignContent: Alignment.Bottom });
            Stack.padding(ObservedObject.GetRawObject(this.localPadding));
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Gesture.create(GesturePriority.Low);
            PanGesture.create(this.panOption);
            PanGesture.onActionStart(() => {
                Logger.info('Gesture onActionStart');
            });
            PanGesture.onActionUpdate((event: GestureEvent) => {
                tetrahedron_napi.setRotate(RotationType.STOP);
                this.enableRotate = false;
                this.angleArray = tetrahedron_napi.updateAngle(event.offsetX, event.offsetY);
                Logger.info('Gesture onActionUpdate : offSet ' + event.offsetX + ',' + event.offsetY);
            });
            PanGesture.onActionEnd(() => {
                Logger.info('Gesture onActionEnd');
            });
            PanGesture.pop();
            Gesture.pop();
            Column.height('100%');
            Column.justifyContent(FlexAlign.SpaceBetween);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.justifyContent(FlexAlign.SpaceAround);
            Column.alignItems(HorizontalAlign.Center);
            Column.height('100%');
            Column.width('100%');
            Column.backgroundColor('#FFFFFF');
            Column.borderRadius(24);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            XComponent.create({
                id: this.xComponentId,
                type: XComponentType.SURFACE,
                libraryname: 'tetrahedron_napi'
            }, "com.samples.ndkopengl/entry");
            XComponent.onLoad(() => {
                Logger.info('onLoad');
            });
            XComponent.id('tetrahedron');
            XComponent.onDestroy(() => {
                Logger.info('onDestroy');
            });
            XComponent.id('xComponent');
            XComponent.backgroundColor('#FFFFFF');
        }, XComponent);
        Column.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.justifyContent(FlexAlign.Start);
            Row.padding({ left: 16, top: 16 });
            Row.hitTestBehavior(HitTestMode.Transparent);
            Row.position({ x: 0, y: 0 });
            Row.zIndex(10);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithChild();
            Button.type(ButtonType.Capsule);
            Button.backgroundColor('#80000000');
            Button.borderRadius(20);
            Button.onClick(() => {
                router.pushUrl({ url: 'pages/ModelSelectPage' });
            });
        }, Button);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 6 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('\u2630');
            Text.fontSize(18);
            Text.fontColor('#FFFFFF');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('模型');
            Text.fontSize(14);
            Text.fontColor('#FFFFFF');
            Text.fontWeight(FontWeight.Medium);
        }, Text);
        Text.pop();
        Row.pop();
        Button.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('当前: ' + this.currentShapeName);
            Text.fontSize(11);
            Text.fontColor('#99FFFFFF');
            Text.backgroundColor('#40000000');
            Text.borderRadius(10);
            Text.padding({ left: 10, right: 10, top: 4, bottom: 4 });
            Text.position({ x: 16, y: 56 });
            Text.zIndex(10);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.padding({ left: 24, right: 24 });
            Row.hitTestBehavior(HitTestMode.Transparent);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('缩小');
            Text.fontSize(11);
            Text.fontColor('#999999');
            Text.margin({ right: 8 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Slider.create({
                value: this.modelScale,
                min: 0.3,
                max: 2.5,
                step: 0.05,
                style: SliderStyle.InSet
            });
            Slider.showTips(true);
            Slider.trackColor('#40000000');
            Slider.selectedColor('#FFFFFF');
            Slider.layoutWeight(1);
            Slider.onChange((value: number) => {
                this.modelScale = value;
                tetrahedron_napi.setScale(value);
            });
        }, Slider);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('放大');
            Text.fontSize(11);
            Text.fontColor('#999999');
            Text.margin({ left: 8 });
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 12 });
            Row.hitTestBehavior(HitTestMode.Transparent);
            Row.padding({
                left: this.widthBreakpoint === WidthBreakpoint.WIDTH_SM ? 12 : 24,
                right: this.widthBreakpoint === WidthBreakpoint.WIDTH_SM ? 12 : 24,
                bottom: 50
            });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel(this.enableRotate ? { "id": 16777222, "type": 10003, params: [], "bundleName": "com.samples.ndkopengl", "moduleName": "entry" } : { "id": 16777220, "type": 10003, params: [], "bundleName": "com.samples.ndkopengl", "moduleName": "entry" }, { type: ButtonType.Capsule, stateEffect: true });
            Button.fontSize(16);
            Button.onClick(() => {
                if (this.enableRotate) {
                    tetrahedron_napi.setRotate(RotationType.STOP);
                    this.enableRotate = false;
                }
                else {
                    tetrahedron_napi.setRotate(RotationType.AUTO);
                    this.enableRotate = true;
                }
            });
            Button.layoutWeight(1);
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel({ "id": 16777221, "type": 10003, params: [], "bundleName": "com.samples.ndkopengl", "moduleName": "entry" }, { type: ButtonType.Capsule, stateEffect: true });
            Button.fontSize(16);
            Button.onClick(() => {
                this.enableRotate = false;
                tetrahedron_napi.setRotate(RotationType.DAMPING);
            });
            Button.layoutWeight(1);
        }, Button);
        Button.pop();
        Row.pop();
        Stack.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName(): string {
        return "Index";
    }
}
registerNamedRoute(() => new Index(undefined, {}), "", { bundleName: "com.samples.ndkopengl", moduleName: "entry", pagePath: "pages/Index", pageFullPath: "entry/src/main/ets/pages/Index", integratedHsp: "false", moduleType: "followWithHap" });
