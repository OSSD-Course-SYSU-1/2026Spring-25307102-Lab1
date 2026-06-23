if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface Index_Params {
    angleArray?: Array<number>;
    enableRotate?: boolean;
    currentShapeName?: string;
    currentShapeType?: number;
    modelScale?: number;
    isWireframe?: boolean;
    isFromContinuation?: boolean;
    cutoutAreas?: Areas;
    localPadding?: LocalizedPadding;
    heightBreakpoint?: HeightBreakpoint;
    widthBreakpoint?: WidthBreakpoint;
    breakpoint?: string;
    avoidAreas?: window.AvoidAreaOptions | undefined;
    windowHeight?: number;
    windowWidth?: number;
    xComponentId?: string;
    panOption?: PanGestureOptions;
}
import { LengthMetrics } from "@ohos:arkui.node";
import type window from "@ohos:window";
import router from "@ohos:router";
import hilog from "@ohos:hilog";
import { Logger } from "@bundle:com.samples.ndkopengl/entry/ets/utils/Logger";
import tetrahedron_napi from "@app:com.samples.ndkopengl/entry/tetrahedron_napi";
import { RotationType } from "@bundle:com.samples.ndkopengl/entry/ets/utils/Constants";
import { ModelState } from "@bundle:com.samples.ndkopengl/entry/ets/utils/ContinuationHelper";
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
        this.__currentShapeType = new ObservedPropertySimplePU(0, this, "currentShapeType");
        this.__modelScale = new ObservedPropertySimplePU(1.0, this, "modelScale");
        this.__isWireframe = new ObservedPropertySimplePU(false, this, "isWireframe");
        this.__isFromContinuation = new ObservedPropertySimplePU(false, this, "isFromContinuation");
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
        this.__breakpoint = this.createStorageLink('currentBreakpoint', 'sm', "breakpoint");
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
        if (params.currentShapeType !== undefined) {
            this.currentShapeType = params.currentShapeType;
        }
        if (params.modelScale !== undefined) {
            this.modelScale = params.modelScale;
        }
        if (params.isWireframe !== undefined) {
            this.isWireframe = params.isWireframe;
        }
        if (params.isFromContinuation !== undefined) {
            this.isFromContinuation = params.isFromContinuation;
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
        this.__currentShapeType.purgeDependencyOnElmtId(rmElmtId);
        this.__modelScale.purgeDependencyOnElmtId(rmElmtId);
        this.__isWireframe.purgeDependencyOnElmtId(rmElmtId);
        this.__isFromContinuation.purgeDependencyOnElmtId(rmElmtId);
        this.__cutoutAreas.purgeDependencyOnElmtId(rmElmtId);
        this.__localPadding.purgeDependencyOnElmtId(rmElmtId);
        this.__heightBreakpoint.purgeDependencyOnElmtId(rmElmtId);
        this.__widthBreakpoint.purgeDependencyOnElmtId(rmElmtId);
        this.__breakpoint.purgeDependencyOnElmtId(rmElmtId);
        this.__avoidAreas.purgeDependencyOnElmtId(rmElmtId);
        this.__windowHeight.purgeDependencyOnElmtId(rmElmtId);
        this.__windowWidth.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__angleArray.aboutToBeDeleted();
        this.__enableRotate.aboutToBeDeleted();
        this.__currentShapeName.aboutToBeDeleted();
        this.__currentShapeType.aboutToBeDeleted();
        this.__modelScale.aboutToBeDeleted();
        this.__isWireframe.aboutToBeDeleted();
        this.__isFromContinuation.aboutToBeDeleted();
        this.__cutoutAreas.aboutToBeDeleted();
        this.__localPadding.aboutToBeDeleted();
        this.__heightBreakpoint.aboutToBeDeleted();
        this.__widthBreakpoint.aboutToBeDeleted();
        this.__breakpoint.aboutToBeDeleted();
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
    private __currentShapeType: ObservedPropertySimplePU<number>;
    get currentShapeType() {
        return this.__currentShapeType.get();
    }
    set currentShapeType(newValue: number) {
        this.__currentShapeType.set(newValue);
    }
    private __modelScale: ObservedPropertySimplePU<number>;
    get modelScale() {
        return this.__modelScale.get();
    }
    set modelScale(newValue: number) {
        this.__modelScale.set(newValue);
    }
    private __isWireframe: ObservedPropertySimplePU<boolean>;
    get isWireframe() {
        return this.__isWireframe.get();
    }
    set isWireframe(newValue: boolean) {
        this.__isWireframe.set(newValue);
    }
    private __isFromContinuation: ObservedPropertySimplePU<boolean>;
    get isFromContinuation() {
        return this.__isFromContinuation.get();
    }
    set isFromContinuation(newValue: boolean) {
        this.__isFromContinuation.set(newValue);
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
    private __breakpoint: ObservedPropertyAbstractPU<string>;
    get breakpoint() {
        return this.__breakpoint.get();
    }
    set breakpoint(newValue: string) {
        this.__breakpoint.set(newValue);
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
    private xComponentId: string;
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
    canvasView(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.justifyContent(FlexAlign.SpaceAround);
            Column.alignItems(HorizontalAlign.Center);
            Column.height('100%');
            Column.width('100%');
            Column.backgroundColor('#FFFFFF');
            Column.borderRadius(this.breakpoint === 'sm' ? 0 : 24);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            XComponent.create({
                id: this.xComponentId,
                type: XComponentType.SURFACE,
                libraryname: 'tetrahedron_napi'
            }, "com.samples.ndkopengl/entry");
            XComponent.onLoad(() => { Logger.info('onLoad'); });
            XComponent.id('tetrahedron');
            XComponent.onDestroy(() => { Logger.info('onDestroy'); });
            XComponent.id('xComponent');
            XComponent.backgroundColor('#FFFFFF');
        }, XComponent);
        Column.pop();
        Column.pop();
    }
    controlsPanel(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.isFromContinuation) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('已从其他设备恢复');
                        Text.fontSize(11);
                        Text.fontColor('#4caf50');
                        Text.backgroundColor('#1A4caf50');
                        Text.borderRadius(6);
                        Text.padding({ left: 8, right: 8, top: 3, bottom: 3 });
                        Text.margin({ bottom: this.breakpoint === 'sm' ? 6 : 10 });
                    }, Text);
                    Text.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.justifyContent(FlexAlign.Center);
            Row.margin({ bottom: this.breakpoint === 'sm' ? 6 : 10 });
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
            Text.fontSize(this.breakpoint === 'sm' ? 16 : 18);
            Text.fontColor('#FFFFFF');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('模型');
            Text.fontSize(this.breakpoint === 'sm' ? 13 : 14);
            Text.fontColor('#FFFFFF');
            Text.fontWeight(FontWeight.Medium);
        }, Text);
        Text.pop();
        Row.pop();
        Button.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('当前: ' + this.currentShapeName);
            Text.fontSize(this.breakpoint === 'sm' ? 11 : 13);
            Text.fontColor('#99FFFFFF');
            Text.backgroundColor('#40000000');
            Text.borderRadius(10);
            Text.padding({ left: 10, right: 10, top: 4, bottom: 4 });
            Text.margin({ bottom: this.breakpoint === 'sm' ? 8 : 14 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.margin({ bottom: this.breakpoint === 'sm' ? 6 : 12 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('缩小');
            Text.fontSize(this.breakpoint === 'sm' ? 10 : 12);
            Text.fontColor('#999999');
            Text.margin({ right: 8 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Slider.create({
                value: this.modelScale,
                min: 0.1,
                max: 3.0,
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
            Text.fontSize(this.breakpoint === 'sm' ? 10 : 12);
            Text.fontColor('#999999');
            Text.margin({ left: 8 });
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 8 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel(this.enableRotate ? '停止' : '自动', { type: ButtonType.Capsule, stateEffect: true });
            Button.fontSize(this.breakpoint === 'sm' ? 13 : 14);
            Button.layoutWeight(1);
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
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('阻尼', { type: ButtonType.Capsule, stateEffect: true });
            Button.fontSize(this.breakpoint === 'sm' ? 13 : 14);
            Button.layoutWeight(1);
            Button.onClick(() => {
                this.enableRotate = false;
                tetrahedron_napi.setRotate(RotationType.DAMPING);
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel(this.isWireframe ? '实体' : '线框', { type: ButtonType.Capsule, stateEffect: true });
            Button.fontSize(this.breakpoint === 'sm' ? 12 : 13);
            Button.layoutWeight(0.6);
            Button.onClick(() => {
                this.isWireframe = !this.isWireframe;
                tetrahedron_napi.toggleWireframe();
            });
        }, Button);
        Button.pop();
        Row.pop();
        Column.pop();
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Stack.create();
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.breakpoint === 'sm') {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.height('100%');
                        Column.width('100%');
                        Column.backgroundColor('#1A1A2E');
                        Column.padding(ObservedObject.GetRawObject(this.localPadding));
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Gesture.create(GesturePriority.Low);
                        PanGesture.create(this.panOption);
                        PanGesture.onActionStart(() => { Logger.info('Gesture onActionStart'); });
                        PanGesture.onActionUpdate((event: GestureEvent) => {
                            tetrahedron_napi.setRotate(RotationType.STOP);
                            this.enableRotate = false;
                            this.angleArray = tetrahedron_napi.updateAngle(event.offsetX, event.offsetY);
                        });
                        PanGesture.onActionEnd(() => { Logger.info('Gesture onActionEnd'); });
                        PanGesture.pop();
                        Gesture.pop();
                        Column.height('58%');
                        Column.width('100%');
                    }, Column);
                    this.canvasView.bind(this)();
                    Column.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.width('92%');
                        Column.margin({ top: 12 });
                    }, Column);
                    this.controlsPanel.bind(this)();
                    Column.pop();
                    Column.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.height('100%');
                        Row.width('100%');
                        Row.backgroundColor('#1A1A2E');
                        Row.padding(ObservedObject.GetRawObject(this.localPadding));
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Gesture.create(GesturePriority.Low);
                        PanGesture.create(this.panOption);
                        PanGesture.onActionStart(() => { Logger.info('Gesture onActionStart'); });
                        PanGesture.onActionUpdate((event: GestureEvent) => {
                            tetrahedron_napi.setRotate(RotationType.STOP);
                            this.enableRotate = false;
                            this.angleArray = tetrahedron_napi.updateAngle(event.offsetX, event.offsetY);
                        });
                        PanGesture.onActionEnd(() => { Logger.info('Gesture onActionEnd'); });
                        PanGesture.pop();
                        Gesture.pop();
                        Column.layoutWeight(1);
                        Column.height('100%');
                    }, Column);
                    this.canvasView.bind(this)();
                    Column.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.width(this.breakpoint === 'md' ? 220 : 280);
                        Column.height('100%');
                        Column.justifyContent(FlexAlign.Center);
                        Column.padding({ left: 16, right: 16, top: 40, bottom: 40 });
                        Column.backgroundColor('#16213E');
                    }, Column);
                    this.controlsPanel.bind(this)();
                    Column.pop();
                    Row.pop();
                });
            }
        }, If);
        If.pop();
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
