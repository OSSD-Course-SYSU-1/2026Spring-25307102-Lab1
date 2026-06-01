if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface TransferPage_Params {
    serverUrl?: string;
    deviceName?: string;
    progress?: number;
    showError?: boolean;
    controller?: webview.WebviewController;
}
import router from "@ohos:router";
import webview from "@ohos:web.webview";
interface RouterParams {
    serverUrl: string;
    deviceName: string;
}
class TransferPage extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__serverUrl = new ObservedPropertySimplePU('', this, "serverUrl");
        this.__deviceName = new ObservedPropertySimplePU('', this, "deviceName");
        this.__progress = new ObservedPropertySimplePU(0, this, "progress");
        this.__showError = new ObservedPropertySimplePU(false, this, "showError");
        this.controller = new webview.WebviewController();
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: TransferPage_Params) {
        if (params.serverUrl !== undefined) {
            this.serverUrl = params.serverUrl;
        }
        if (params.deviceName !== undefined) {
            this.deviceName = params.deviceName;
        }
        if (params.progress !== undefined) {
            this.progress = params.progress;
        }
        if (params.showError !== undefined) {
            this.showError = params.showError;
        }
        if (params.controller !== undefined) {
            this.controller = params.controller;
        }
    }
    updateStateVars(params: TransferPage_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__serverUrl.purgeDependencyOnElmtId(rmElmtId);
        this.__deviceName.purgeDependencyOnElmtId(rmElmtId);
        this.__progress.purgeDependencyOnElmtId(rmElmtId);
        this.__showError.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__serverUrl.aboutToBeDeleted();
        this.__deviceName.aboutToBeDeleted();
        this.__progress.aboutToBeDeleted();
        this.__showError.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __serverUrl: ObservedPropertySimplePU<string>;
    get serverUrl() {
        return this.__serverUrl.get();
    }
    set serverUrl(newValue: string) {
        this.__serverUrl.set(newValue);
    }
    private __deviceName: ObservedPropertySimplePU<string>;
    get deviceName() {
        return this.__deviceName.get();
    }
    set deviceName(newValue: string) {
        this.__deviceName.set(newValue);
    }
    private __progress: ObservedPropertySimplePU<number>;
    get progress() {
        return this.__progress.get();
    }
    set progress(newValue: number) {
        this.__progress.set(newValue);
    }
    private __showError: ObservedPropertySimplePU<boolean>;
    get showError() {
        return this.__showError.get();
    }
    set showError(newValue: boolean) {
        this.__showError.set(newValue);
    }
    private controller: webview.WebviewController;
    aboutToAppear(): void {
        let params = router.getParams() as RouterParams;
        if (params) {
            this.serverUrl = params.serverUrl;
            this.deviceName = params.deviceName;
        }
    }
    onPageShow(): void {
        // 页面显示时无需手动延时注入，onPageEnd 回调会处理
    }
    updateDeviceName(): void {
        // 使用 JSON.stringify 安全转义设备名称，防止特殊字符破坏 JS 语法
        let safeName = JSON.stringify(this.deviceName);
        let script = `(function(){ var el = document.getElementById('dev-name'); if (el) el.value = ${safeName}; })();`;
        this.controller.runJavaScript(script);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width('100%');
            Column.height('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.showError) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.width('100%');
                        Column.height('100%');
                        Column.justifyContent(FlexAlign.Center);
                        Column.alignItems(HorizontalAlign.Center);
                        Column.backgroundColor('#0a0a0a');
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('无法连接');
                        Text.fontSize(18);
                        Text.fontColor('#ff5252');
                        Text.margin({ bottom: 12 });
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('请检查：');
                        Text.fontSize(13);
                        Text.fontColor('#888888');
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('1. 服务器已启动');
                        Text.fontSize(13);
                        Text.fontColor('#666666');
                        Text.margin({ top: 8 });
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('2. 设备在同一 WiFi');
                        Text.fontSize(13);
                        Text.fontColor('#666666');
                        Text.margin({ top: 4 });
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('3. 防火墙已开放 3000 端口');
                        Text.fontSize(13);
                        Text.fontColor('#666666');
                        Text.margin({ top: 4 });
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(`当前地址: ${this.serverUrl}`);
                        Text.fontSize(11);
                        Text.fontColor('#555555');
                        Text.margin({ top: 16, bottom: 24 });
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Button.createWithLabel('返回修改');
                        Button.fontSize(14);
                        Button.fontColor('#ffffff');
                        Button.backgroundColor('rgba(255,255,255,0.1)');
                        Button.border({ width: 1, color: 'rgba(255,255,255,0.2)' });
                        Button.borderRadius(10);
                        Button.padding({ left: 24, right: 24, top: 10, bottom: 10 });
                        Button.onClick(() => { router.back(); });
                    }, Button);
                    Button.pop();
                    Column.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Stack.create();
                        Stack.width('100%');
                        Stack.height('100%');
                        Stack.backgroundColor('#0a0a0a');
                    }, Stack);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Web.create({ src: this.serverUrl, controller: this.controller });
                        Web.width('100%');
                        Web.height('100%');
                        Web.javaScriptAccess(true);
                        Web.domStorageAccess(true);
                        Web.fileAccess(true);
                        Web.onlineImageAccess(true);
                        Web.zoomAccess(false);
                        Web.onProgressChange((event) => {
                            if (event)
                                this.progress = event.newProgress;
                        });
                        Web.onErrorReceive((event) => {
                            console.error('Web error: ' + (event?.error?.getErrorInfo?.() || ''));
                            this.showError = true;
                        });
                        Web.onPageEnd(() => {
                            this.progress = 100;
                            setTimeout(() => { this.updateDeviceName(); }, 500);
                        });
                    }, Web);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        If.create();
                        if (this.progress < 100) {
                            this.ifElseBranchUpdateFunction(0, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Column.create();
                                    Column.width('100%');
                                    Column.height('100%');
                                    Column.justifyContent(FlexAlign.Center);
                                    Column.alignItems(HorizontalAlign.Center);
                                }, Column);
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    LoadingProgress.create();
                                    LoadingProgress.color('#4facfe');
                                    LoadingProgress.width(40);
                                    LoadingProgress.height(40);
                                }, LoadingProgress);
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create(`${this.progress}%`);
                                    Text.fontSize(12);
                                    Text.fontColor('#888888');
                                    Text.margin({ top: 12 });
                                }, Text);
                                Text.pop();
                                Column.pop();
                            });
                        }
                        else {
                            this.ifElseBranchUpdateFunction(1, () => {
                            });
                        }
                    }, If);
                    If.pop();
                    Stack.pop();
                });
            }
        }, If);
        If.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName(): string {
        return "TransferPage";
    }
}
registerNamedRoute(() => new TransferPage(undefined, {}), "", { bundleName: "com.airshare.app", moduleName: "entry", pagePath: "pages/TransferPage", pageFullPath: "entry/src/main/ets/pages/TransferPage", integratedHsp: "false", moduleType: "followWithHap" });
