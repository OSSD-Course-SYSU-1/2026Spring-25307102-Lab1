if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface ParamEditPage_Params {
    shapeType?: ShapeType;
    shapeName?: string;
    paramA?: number;
    paramB?: number;
    paramC?: number;
    resolutionU?: number;
    resolutionV?: number;
    paramDescriptions?: ParamDescription[];
}
import router from "@ohos:router";
import { ShapeType, getParamDescriptions, getDefaultParams } from "@bundle:com.samples.ndkopengl/entry/ets/utils/ModelTypes";
import type { ShapeParams, ParamDescription } from "@bundle:com.samples.ndkopengl/entry/ets/utils/ModelTypes";
interface ParamEditParams {
    shapeType: number;
    shapeName: string;
    defaultParams: ShapeParams;
}
class ParamEditPage extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__shapeType = new ObservedPropertySimplePU(ShapeType.PARAMETRIC_ELLIPSOID, this, "shapeType");
        this.__shapeName = new ObservedPropertySimplePU('', this, "shapeName");
        this.__paramA = new ObservedPropertySimplePU(1.5, this, "paramA");
        this.__paramB = new ObservedPropertySimplePU(1.2, this, "paramB");
        this.__paramC = new ObservedPropertySimplePU(1.0, this, "paramC");
        this.__resolutionU = new ObservedPropertySimplePU(32, this, "resolutionU");
        this.__resolutionV = new ObservedPropertySimplePU(32, this, "resolutionV");
        this.__paramDescriptions = new ObservedPropertyObjectPU([], this, "paramDescriptions");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: ParamEditPage_Params) {
        if (params.shapeType !== undefined) {
            this.shapeType = params.shapeType;
        }
        if (params.shapeName !== undefined) {
            this.shapeName = params.shapeName;
        }
        if (params.paramA !== undefined) {
            this.paramA = params.paramA;
        }
        if (params.paramB !== undefined) {
            this.paramB = params.paramB;
        }
        if (params.paramC !== undefined) {
            this.paramC = params.paramC;
        }
        if (params.resolutionU !== undefined) {
            this.resolutionU = params.resolutionU;
        }
        if (params.resolutionV !== undefined) {
            this.resolutionV = params.resolutionV;
        }
        if (params.paramDescriptions !== undefined) {
            this.paramDescriptions = params.paramDescriptions;
        }
    }
    updateStateVars(params: ParamEditPage_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__shapeType.purgeDependencyOnElmtId(rmElmtId);
        this.__shapeName.purgeDependencyOnElmtId(rmElmtId);
        this.__paramA.purgeDependencyOnElmtId(rmElmtId);
        this.__paramB.purgeDependencyOnElmtId(rmElmtId);
        this.__paramC.purgeDependencyOnElmtId(rmElmtId);
        this.__resolutionU.purgeDependencyOnElmtId(rmElmtId);
        this.__resolutionV.purgeDependencyOnElmtId(rmElmtId);
        this.__paramDescriptions.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__shapeType.aboutToBeDeleted();
        this.__shapeName.aboutToBeDeleted();
        this.__paramA.aboutToBeDeleted();
        this.__paramB.aboutToBeDeleted();
        this.__paramC.aboutToBeDeleted();
        this.__resolutionU.aboutToBeDeleted();
        this.__resolutionV.aboutToBeDeleted();
        this.__paramDescriptions.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __shapeType: ObservedPropertySimplePU<ShapeType>;
    get shapeType() {
        return this.__shapeType.get();
    }
    set shapeType(newValue: ShapeType) {
        this.__shapeType.set(newValue);
    }
    private __shapeName: ObservedPropertySimplePU<string>;
    get shapeName() {
        return this.__shapeName.get();
    }
    set shapeName(newValue: string) {
        this.__shapeName.set(newValue);
    }
    private __paramA: ObservedPropertySimplePU<number>;
    get paramA() {
        return this.__paramA.get();
    }
    set paramA(newValue: number) {
        this.__paramA.set(newValue);
    }
    private __paramB: ObservedPropertySimplePU<number>;
    get paramB() {
        return this.__paramB.get();
    }
    set paramB(newValue: number) {
        this.__paramB.set(newValue);
    }
    private __paramC: ObservedPropertySimplePU<number>;
    get paramC() {
        return this.__paramC.get();
    }
    set paramC(newValue: number) {
        this.__paramC.set(newValue);
    }
    private __resolutionU: ObservedPropertySimplePU<number>;
    get resolutionU() {
        return this.__resolutionU.get();
    }
    set resolutionU(newValue: number) {
        this.__resolutionU.set(newValue);
    }
    private __resolutionV: ObservedPropertySimplePU<number>;
    get resolutionV() {
        return this.__resolutionV.get();
    }
    set resolutionV(newValue: number) {
        this.__resolutionV.set(newValue);
    }
    private __paramDescriptions: ObservedPropertyObjectPU<ParamDescription[]>;
    get paramDescriptions() {
        return this.__paramDescriptions.get();
    }
    set paramDescriptions(newValue: ParamDescription[]) {
        this.__paramDescriptions.set(newValue);
    }
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
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width('100%');
            Column.height('100%');
            Column.backgroundColor('#F5F5F5');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.padding({ left: 16, right: 16, top: 12, bottom: 12 });
            Row.alignItems(VerticalAlign.Center);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithChild({ type: ButtonType.Circle, stateEffect: true });
            Button.width(40);
            Button.height(40);
            Button.backgroundColor('#20000000');
            Button.onClick(() => {
                router.back();
            });
        }, Button);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('\u2190');
            Text.fontSize(20);
            Text.fontColor('#333333');
        }, Text);
        Text.pop();
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.shapeName + ' - 参数设置');
            Text.fontSize(18);
            Text.fontWeight(FontWeight.Bold);
            Text.margin({ left: 12 });
            Text.maxLines(1);
            Text.textOverflow({ overflow: TextOverflow.Ellipsis });
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width('100%');
            Column.padding(16);
            Column.backgroundColor('#FFFFFF');
            Column.borderRadius(12);
            Column.margin({ left: 16, right: 16, top: 12, bottom: 12 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.getEquationText());
            Text.fontSize(14);
            Text.fontColor('#333333');
            Text.fontFamily('monospace');
            Text.textAlign(TextAlign.Center);
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Scroll.create();
            Scroll.layoutWeight(1);
            Scroll.scrollBar(BarState.Off);
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = (_item, index: number) => {
                const desc = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create();
                    Column.width('100%');
                    Column.padding({ left: 20, right: 20, top: 12, bottom: 4 });
                    Column.backgroundColor('#FFFFFF');
                    Column.borderRadius(12);
                    Column.margin({ left: 16, right: 16, top: 4, bottom: 4 });
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Row.create();
                    Row.width('100%');
                }, Row);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(desc.label);
                    Text.fontSize(14);
                    Text.fontColor('#333333');
                    Text.fontWeight(FontWeight.Medium);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Blank.create();
                }, Blank);
                Blank.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(this.getParamValue(desc.key).toFixed(1));
                    Text.fontSize(14);
                    Text.fontColor('#007DFF');
                    Text.fontWeight(FontWeight.Bold);
                }, Text);
                Text.pop();
                Row.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Slider.create({
                        value: this.getParamValue(desc.key),
                        min: desc.min,
                        max: desc.max,
                        step: desc.step,
                        style: SliderStyle.InSet
                    });
                    Slider.showTips(true);
                    Slider.trackColor('#E0E0E0');
                    Slider.selectedColor('#007DFF');
                    Slider.onChange((value: number) => {
                        this.setParamValue(desc.key, value);
                    });
                    Slider.width('100%');
                    Slider.margin({ top: 4, bottom: 12 });
                }, Slider);
                Column.pop();
            };
            this.forEachUpdateFunction(elmtId, this.paramDescriptions, forEachItemGenFunction, undefined, true, false);
        }, ForEach);
        ForEach.pop();
        Column.pop();
        Scroll.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 16 });
            Row.width('100%');
            Row.padding({ left: 16, right: 16, top: 12, bottom: 24 });
            Row.backgroundColor('#FAFAFA');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('恢复默认');
            Button.fontSize(16);
            Button.type(ButtonType.Normal);
            Button.backgroundColor('#F0F0F0');
            Button.fontColor('#333333');
            Button.borderRadius(24);
            Button.layoutWeight(1);
            Button.onClick(() => {
                let defaults = getDefaultParams();
                this.paramA = defaults.paramA;
                this.paramB = defaults.paramB;
                this.paramC = defaults.paramC;
                this.resolutionU = defaults.resolutionU;
                this.resolutionV = defaults.resolutionV;
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('确认应用');
            Button.fontSize(16);
            Button.type(ButtonType.Normal);
            Button.backgroundColor('#007DFF');
            Button.fontColor('#FFFFFF');
            Button.borderRadius(24);
            Button.layoutWeight(1);
            Button.onClick(() => {
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
            });
        }, Button);
        Button.pop();
        Row.pop();
        Column.pop();
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
            case 'paramA':
                this.paramA = value;
                break;
            case 'paramB':
                this.paramB = value;
                break;
            case 'paramC':
                this.paramC = value;
                break;
            case 'resolutionU':
                this.resolutionU = value;
                break;
            case 'resolutionV':
                this.resolutionV = value;
                break;
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
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName(): string {
        return "ParamEditPage";
    }
}
registerNamedRoute(() => new ParamEditPage(undefined, {}), "", { bundleName: "com.samples.ndkopengl", moduleName: "entry", pagePath: "pages/ParamEditPage", pageFullPath: "entry/src/main/ets/pages/ParamEditPage", integratedHsp: "false", moduleType: "followWithHap" });
