if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface ModelSelectPage_Params {
    selectedIndex?: number;
    breakpoint?: string;
}
import router from "@ohos:router";
import { MODELS } from "@bundle:com.samples.ndkopengl/entry/ets/utils/ModelTypes";
import type { ModelEntry } from "@bundle:com.samples.ndkopengl/entry/ets/utils/ModelTypes";
class ModelSelectPage extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__selectedIndex = new ObservedPropertySimplePU(-1, this, "selectedIndex");
        this.__breakpoint = this.createStorageLink('currentBreakpoint', 'sm', "breakpoint");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: ModelSelectPage_Params) {
        if (params.selectedIndex !== undefined) {
            this.selectedIndex = params.selectedIndex;
        }
    }
    updateStateVars(params: ModelSelectPage_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__selectedIndex.purgeDependencyOnElmtId(rmElmtId);
        this.__breakpoint.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__selectedIndex.aboutToBeDeleted();
        this.__breakpoint.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __selectedIndex: ObservedPropertySimplePU<number>;
    get selectedIndex() {
        return this.__selectedIndex.get();
    }
    set selectedIndex(newValue: number) {
        this.__selectedIndex.set(newValue);
    }
    private __breakpoint: ObservedPropertyAbstractPU<string>;
    get breakpoint() {
        return this.__breakpoint.get();
    }
    set breakpoint(newValue: string) {
        this.__breakpoint.set(newValue);
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
            Row.padding({
                left: this.breakpoint === 'sm' ? 16 : 24,
                right: this.breakpoint === 'sm' ? 16 : 24,
                top: 12,
                bottom: 12
            });
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
            Text.fontSize(this.breakpoint === 'sm' ? 18 : 22);
            Text.fontColor('#333333');
        }, Text);
        Text.pop();
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('选择模型');
            Text.fontSize(this.breakpoint === 'sm' ? 18 : 22);
            Text.fontWeight(FontWeight.Bold);
            Text.margin({ left: 12 });
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('3D 几何模型');
            Text.fontSize(this.breakpoint === 'sm' ? 13 : 15);
            Text.fontColor('#888888');
            Text.padding({ left: 20, top: 16, bottom: 8 });
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            List.create();
            List.layoutWeight(1);
            List.divider({ strokeWidth: 0 });
        }, List);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = (_item, index: number) => {
                const item = _item;
                {
                    const itemCreation = (elmtId, isInitialRender) => {
                        ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
                        ListItem.create(deepRenderFunction, true);
                        if (!isInitialRender) {
                            ListItem.pop();
                        }
                        ViewStackProcessor.StopGetAccessRecording();
                    };
                    const itemCreation2 = (elmtId, isInitialRender) => {
                        ListItem.create(deepRenderFunction, true);
                        ListItem.onClick(() => {
                            this.selectedIndex = index;
                            router.back({
                                url: 'pages/Index',
                                params: {
                                    shapeType: item.shapeType,
                                }
                            });
                        });
                    };
                    const deepRenderFunction = (elmtId, isInitialRender) => {
                        itemCreation(elmtId, isInitialRender);
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Row.create();
                            Row.width('100%');
                            Row.padding({
                                left: this.breakpoint === 'sm' ? 18 : 24,
                                right: this.breakpoint === 'sm' ? 18 : 24,
                                top: 14,
                                bottom: 14
                            });
                            Row.backgroundColor(this.selectedIndex === index ? '#1A007DFF' : '#FFFFFF');
                            Row.borderRadius(12);
                            Row.margin({
                                left: this.breakpoint === 'sm' ? 12 : 20,
                                right: this.breakpoint === 'sm' ? 12 : 20,
                                top: 4,
                                bottom: 4
                            });
                        }, Row);
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Column.create();
                            Column.alignItems(HorizontalAlign.Start);
                        }, Column);
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Text.create(item.name);
                            Text.fontSize(this.breakpoint === 'sm' ? 15 : 17);
                            Text.fontWeight(FontWeight.Medium);
                            Text.fontColor('#1A1A1A');
                        }, Text);
                        Text.pop();
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Text.create(item.description);
                            Text.fontSize(this.breakpoint === 'sm' ? 12 : 13);
                            Text.fontColor('#999999');
                            Text.margin({ top: 2 });
                        }, Text);
                        Text.pop();
                        Column.pop();
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Blank.create();
                        }, Blank);
                        Blank.pop();
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Text.create('>');
                            Text.fontSize(20);
                            Text.fontColor('#CCCCCC');
                        }, Text);
                        Text.pop();
                        Row.pop();
                        ListItem.pop();
                    };
                    this.observeComponentCreation2(itemCreation2, ListItem);
                    ListItem.pop();
                }
            };
            this.forEachUpdateFunction(elmtId, MODELS, forEachItemGenFunction, undefined, true, false);
        }, ForEach);
        ForEach.pop();
        List.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName(): string {
        return "ModelSelectPage";
    }
}
registerNamedRoute(() => new ModelSelectPage(undefined, {}), "", { bundleName: "com.samples.ndkopengl", moduleName: "entry", pagePath: "pages/ModelSelectPage", pageFullPath: "entry/src/main/ets/pages/ModelSelectPage", integratedHsp: "false", moduleType: "followWithHap" });
