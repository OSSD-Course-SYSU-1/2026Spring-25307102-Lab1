if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface Index_Params {
    serverIp?: string;
    serverPort?: string;
    deviceName?: string;
    connecting?: boolean;
    breakpoint?: string;
    context?: Context | null;
}
import router from "@ohos:router";
import preferences from "@ohos:data.preferences";
import { Constants } from "@normalized:N&&&entry/src/main/ets/common/Constants&";
class Index extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__serverIp = new ObservedPropertySimplePU(Constants.DEFAULT_SERVER_IP, this, "serverIp");
        this.__serverPort = new ObservedPropertySimplePU(Constants.DEFAULT_SERVER_PORT, this, "serverPort");
        this.__deviceName = new ObservedPropertySimplePU(Constants.DEFAULT_DEVICE_NAME, this, "deviceName");
        this.__connecting = new ObservedPropertySimplePU(false, this, "connecting");
        this.__breakpoint = this.createStorageLink('currentBreakpoint', 'sm', "breakpoint");
        this.context = null;
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: Index_Params) {
        if (params.serverIp !== undefined) {
            this.serverIp = params.serverIp;
        }
        if (params.serverPort !== undefined) {
            this.serverPort = params.serverPort;
        }
        if (params.deviceName !== undefined) {
            this.deviceName = params.deviceName;
        }
        if (params.connecting !== undefined) {
            this.connecting = params.connecting;
        }
        if (params.context !== undefined) {
            this.context = params.context;
        }
    }
    updateStateVars(params: Index_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__serverIp.purgeDependencyOnElmtId(rmElmtId);
        this.__serverPort.purgeDependencyOnElmtId(rmElmtId);
        this.__deviceName.purgeDependencyOnElmtId(rmElmtId);
        this.__connecting.purgeDependencyOnElmtId(rmElmtId);
        this.__breakpoint.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__serverIp.aboutToBeDeleted();
        this.__serverPort.aboutToBeDeleted();
        this.__deviceName.aboutToBeDeleted();
        this.__connecting.aboutToBeDeleted();
        this.__breakpoint.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __serverIp: ObservedPropertySimplePU<string>;
    get serverIp() {
        return this.__serverIp.get();
    }
    set serverIp(newValue: string) {
        this.__serverIp.set(newValue);
    }
    private __serverPort: ObservedPropertySimplePU<string>;
    get serverPort() {
        return this.__serverPort.get();
    }
    set serverPort(newValue: string) {
        this.__serverPort.set(newValue);
    }
    private __deviceName: ObservedPropertySimplePU<string>;
    get deviceName() {
        return this.__deviceName.get();
    }
    set deviceName(newValue: string) {
        this.__deviceName.set(newValue);
    }
    private __connecting: ObservedPropertySimplePU<boolean>;
    get connecting() {
        return this.__connecting.get();
    }
    set connecting(newValue: boolean) {
        this.__connecting.set(newValue);
    }
    private __breakpoint: ObservedPropertyAbstractPU<string>;
    get breakpoint() {
        return this.__breakpoint.get();
    }
    set breakpoint(newValue: string) {
        this.__breakpoint.set(newValue);
    }
    private context: Context | null;
    async aboutToAppear(): Promise<void> {
        this.context = getContext(this);
        try {
            let prefs = await preferences.getPreferences(this.context!, 'airshare_config');
            this.serverIp = await prefs.get(Constants.SERVER_IP_KEY, Constants.DEFAULT_SERVER_IP) as string;
            this.serverPort = await prefs.get(Constants.SERVER_PORT_KEY, Constants.DEFAULT_SERVER_PORT) as string;
            this.deviceName = await prefs.get(Constants.DEVICE_NAME_KEY, Constants.DEFAULT_DEVICE_NAME) as string;
        }
        catch (e) { }
    }
    async saveAndConnect(): Promise<void> {
        this.connecting = true;
        try {
            let prefs = await preferences.getPreferences(this.context!, 'airshare_config');
            await prefs.put(Constants.SERVER_IP_KEY, this.serverIp);
            await prefs.put(Constants.SERVER_PORT_KEY, this.serverPort);
            await prefs.put(Constants.DEVICE_NAME_KEY, this.deviceName);
            await prefs.flush();
        }
        catch (e) { }
        let url = `http://${this.serverIp}:${this.serverPort}`;
        router.pushUrl({
            url: 'pages/TransferPage',
            params: { serverUrl: url, deviceName: this.deviceName }
        }).catch(() => { this.connecting = false; });
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width('100%');
            Column.height('100%');
            Column.justifyContent(FlexAlign.Center);
            Column.backgroundColor('#0a0a0a');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width(this.breakpoint === 'sm' ? '86%' : (this.breakpoint === 'md' ? '70%' : '50%'));
            Column.constraintSize({ maxWidth: 560 });
            Column.alignItems(HorizontalAlign.Center);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Logo area
            Text.create('AirShare');
            // Logo area
            Text.fontSize(this.breakpoint === 'sm' ? 42 : (this.breakpoint === 'md' ? 52 : 60));
            // Logo area
            Text.fontWeight(FontWeight.Bold);
            // Logo area
            Text.fontColor('#4facfe');
            // Logo area
            Text.letterSpacing(4);
        }, Text);
        // Logo area
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('跨设备双向互传');
            Text.fontSize(this.breakpoint === 'sm' ? 14 : 16);
            Text.fontColor('#888888');
            Text.margin({ top: 6, bottom: this.breakpoint === 'sm' ? 24 : 32 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // LAN Warning - responsive positioning
            Row.create();
            // LAN Warning - responsive positioning
            Row.width('100%');
            // LAN Warning - responsive positioning
            Row.padding(14);
            // LAN Warning - responsive positioning
            Row.borderRadius(10);
            // LAN Warning - responsive positioning
            Row.backgroundColor('rgba(255,167,38,0.06)');
            // LAN Warning - responsive positioning
            Row.border({ width: 1, color: 'rgba(255,167,38,0.2)' });
            // LAN Warning - responsive positioning
            Row.margin({ bottom: this.breakpoint === 'sm' ? 24 : 32 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('!');
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor('#ffa726');
            Text.width(28);
            Text.height(28);
            Text.borderRadius(14);
            Text.backgroundColor('rgba(255,167,38,0.15)');
            Text.textAlign(TextAlign.Center);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('所有设备必须在同一局域网（WiFi）下');
            Text.fontSize(this.breakpoint === 'sm' ? 13 : 14);
            Text.fontColor('#ffa726');
            Text.margin({ left: 10 });
            Text.flexShrink(1);
        }, Text);
        Text.pop();
        // LAN Warning - responsive positioning
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Config section - responsive layout
            Flex.create({ wrap: FlexWrap.Wrap, justifyContent: FlexAlign.SpaceBetween });
            // Config section - responsive layout
            Flex.width('100%');
            // Config section - responsive layout
            Flex.margin({ bottom: this.breakpoint === 'sm' ? 28 : 36 });
        }, Flex);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Device Name
            Column.create();
            // Device Name
            Column.width(this.breakpoint === 'sm' ? '100%' : '48%');
            // Device Name
            Column.margin({ bottom: 14 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('设备名称');
            Text.fontSize(12);
            Text.fontColor('#666666');
            Text.alignSelf(ItemAlign.Start);
            Text.margin({ bottom: 6 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ text: this.deviceName, placeholder: '输入设备名称' });
            TextInput.fontSize(15);
            TextInput.fontColor('#ffffff');
            TextInput.backgroundColor('rgba(255,255,255,0.06)');
            TextInput.borderRadius(10);
            TextInput.border({ width: 1, color: 'rgba(255,255,255,0.15)' });
            TextInput.padding(12);
            TextInput.width(this.breakpoint === 'sm' ? '100%' : '100%');
            TextInput.onChange((value: string) => { this.deviceName = value; });
        }, TextInput);
        // Device Name
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Server IP
            Column.create();
            // Server IP
            Column.width(this.breakpoint === 'sm' ? '100%' : '48%');
            // Server IP
            Column.margin({ bottom: 14 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('服务器地址（运行 start.bat 的电脑IP）');
            Text.fontSize(12);
            Text.fontColor('#666666');
            Text.alignSelf(ItemAlign.Start);
            Text.margin({ bottom: 6 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ text: this.serverIp, placeholder: '192.168.x.x' });
            TextInput.fontSize(15);
            TextInput.fontColor('#ffffff');
            TextInput.backgroundColor('rgba(255,255,255,0.06)');
            TextInput.borderRadius(10);
            TextInput.border({ width: 1, color: 'rgba(255,255,255,0.15)' });
            TextInput.padding(12);
            TextInput.layoutWeight(1);
            TextInput.onChange((value: string) => { this.serverIp = value; });
        }, TextInput);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(':');
            Text.fontSize(16);
            Text.fontColor('#888888');
            Text.margin({ left: 6, right: 6 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ text: this.serverPort, placeholder: '3000' });
            TextInput.fontSize(15);
            TextInput.fontColor('#ffffff');
            TextInput.backgroundColor('rgba(255,255,255,0.06)');
            TextInput.borderRadius(10);
            TextInput.border({ width: 1, color: 'rgba(255,255,255,0.15)' });
            TextInput.padding(12);
            TextInput.width(72);
            TextInput.type(InputType.Number);
            TextInput.onChange((value: string) => { this.serverPort = value; });
        }, TextInput);
        Row.pop();
        // Server IP
        Column.pop();
        // Config section - responsive layout
        Flex.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel(this.connecting ? '连接中...' : '开始使用');
            Button.fontSize(16);
            Button.fontWeight(FontWeight.Medium);
            Button.fontColor('#000000');
            Button.backgroundColor('#4facfe');
            Button.borderRadius(12);
            Button.width('100%');
            Button.height(52);
            Button.enabled(!this.connecting);
            Button.onClick(() => { this.saveAndConnect(); });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('提示：请先在电脑上运行 start.bat 启动服务器');
            Text.fontSize(11);
            Text.fontColor('#555555');
            Text.margin({ top: 16 });
            Text.textAlign(TextAlign.Center);
        }, Text);
        Text.pop();
        Column.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName(): string {
        return "Index";
    }
}
registerNamedRoute(() => new Index(undefined, {}), "", { bundleName: "com.airshare.app", moduleName: "entry", pagePath: "pages/Index", pageFullPath: "entry/src/main/ets/pages/Index", integratedHsp: "false", moduleType: "followWithHap" });
