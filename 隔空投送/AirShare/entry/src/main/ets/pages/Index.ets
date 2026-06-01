import router from '@ohos.router';
import preferences from '@ohos.data.preferences';
import { Constants } from '../common/Constants';

@Entry
@Component
struct Index {
  @State serverIp: string = Constants.DEFAULT_SERVER_IP;
  @State serverPort: string = Constants.DEFAULT_SERVER_PORT;
  @State deviceName: string = Constants.DEFAULT_DEVICE_NAME;
  @State connecting: boolean = false;
  @StorageLink('currentBreakpoint') breakpoint: string = 'sm';
  private context: Context | null = null;

  async aboutToAppear(): Promise<void> {
    this.context = getContext(this);
    try {
      let prefs = await preferences.getPreferences(this.context!, 'airshare_config');
      this.serverIp = await prefs.get(Constants.SERVER_IP_KEY, Constants.DEFAULT_SERVER_IP) as string;
      this.serverPort = await prefs.get(Constants.SERVER_PORT_KEY, Constants.DEFAULT_SERVER_PORT) as string;
      this.deviceName = await prefs.get(Constants.DEVICE_NAME_KEY, Constants.DEFAULT_DEVICE_NAME) as string;
    } catch (e) {}
  }

  async saveAndConnect(): Promise<void> {
    this.connecting = true;
    try {
      let prefs = await preferences.getPreferences(this.context!, 'airshare_config');
      await prefs.put(Constants.SERVER_IP_KEY, this.serverIp);
      await prefs.put(Constants.SERVER_PORT_KEY, this.serverPort);
      await prefs.put(Constants.DEVICE_NAME_KEY, this.deviceName);
      await prefs.flush();
    } catch (e) {}

    let url = `http://${this.serverIp}:${this.serverPort}`;
    router.pushUrl({
      url: 'pages/TransferPage',
      params: { serverUrl: url, deviceName: this.deviceName }
    }).catch(() => { this.connecting = false; });
  }

  build() {
    Column() {
      Column() {
        // Logo area
        Text('AirShare')
          .fontSize(this.breakpoint === 'sm' ? 42 : (this.breakpoint === 'md' ? 52 : 60))
          .fontWeight(FontWeight.Bold)
          .fontColor('#4facfe')
          .letterSpacing(4)

        Text('跨设备双向互传')
          .fontSize(this.breakpoint === 'sm' ? 14 : 16)
          .fontColor('#888888')
          .margin({ top: 6, bottom: this.breakpoint === 'sm' ? 24 : 32 })

        // LAN Warning - responsive positioning
        Row() {
          Text('!')
            .fontSize(16)
            .fontWeight(FontWeight.Bold)
            .fontColor('#ffa726')
            .width(28)
            .height(28)
            .borderRadius(14)
            .backgroundColor('rgba(255,167,38,0.15)')
            .textAlign(TextAlign.Center)

          Text('所有设备必须在同一局域网（WiFi）下')
            .fontSize(this.breakpoint === 'sm' ? 13 : 14)
            .fontColor('#ffa726')
            .margin({ left: 10 })
            .flexShrink(1)
        }
        .width('100%')
        .padding(14)
        .borderRadius(10)
        .backgroundColor('rgba(255,167,38,0.06)')
        .border({ width: 1, color: 'rgba(255,167,38,0.2)' })
        .margin({ bottom: this.breakpoint === 'sm' ? 24 : 32 })

        // Config section - responsive layout
        Flex({ wrap: FlexWrap.Wrap, justifyContent: FlexAlign.SpaceBetween }) {
          // Device Name
          Column() {
            Text('设备名称')
              .fontSize(12)
              .fontColor('#666666')
              .alignSelf(ItemAlign.Start)
              .margin({ bottom: 6 })

            TextInput({ text: this.deviceName, placeholder: '输入设备名称' })
              .fontSize(15)
              .fontColor('#ffffff')
              .backgroundColor('rgba(255,255,255,0.06)')
              .borderRadius(10)
              .border({ width: 1, color: 'rgba(255,255,255,0.15)' })
              .padding(12)
              .width(this.breakpoint === 'sm' ? '100%' : '100%')
              .onChange((value: string) => { this.deviceName = value; })
          }
          .width(this.breakpoint === 'sm' ? '100%' : '48%')
          .margin({ bottom: 14 })

          // Server IP
          Column() {
            Text('服务器地址（运行 start.bat 的电脑IP）')
              .fontSize(12)
              .fontColor('#666666')
              .alignSelf(ItemAlign.Start)
              .margin({ bottom: 6 })

            Row() {
              TextInput({ text: this.serverIp, placeholder: '192.168.x.x' })
                .fontSize(15)
                .fontColor('#ffffff')
                .backgroundColor('rgba(255,255,255,0.06)')
                .borderRadius(10)
                .border({ width: 1, color: 'rgba(255,255,255,0.15)' })
                .padding(12)
                .layoutWeight(1)
                .onChange((value: string) => { this.serverIp = value; })

              Text(':')
                .fontSize(16)
                .fontColor('#888888')
                .margin({ left: 6, right: 6 })

              TextInput({ text: this.serverPort, placeholder: '3000' })
                .fontSize(15)
                .fontColor('#ffffff')
                .backgroundColor('rgba(255,255,255,0.06)')
                .borderRadius(10)
                .border({ width: 1, color: 'rgba(255,255,255,0.15)' })
                .padding(12)
                .width(72)
                .type(InputType.Number)
                .onChange((value: string) => { this.serverPort = value; })
            }
            .width('100%')
          }
          .width(this.breakpoint === 'sm' ? '100%' : '48%')
          .margin({ bottom: 14 })
        }
        .width('100%')
        .margin({ bottom: this.breakpoint === 'sm' ? 28 : 36 })

        Button(this.connecting ? '连接中...' : '开始使用')
          .fontSize(16)
          .fontWeight(FontWeight.Medium)
          .fontColor('#000000')
          .backgroundColor('#4facfe')
          .borderRadius(12)
          .width('100%')
          .height(52)
          .enabled(!this.connecting)
          .onClick(() => { this.saveAndConnect(); })

        Text('提示：请先在电脑上运行 start.bat 启动服务器')
          .fontSize(11)
          .fontColor('#555555')
          .margin({ top: 16 })
          .textAlign(TextAlign.Center)
      }
      .width(this.breakpoint === 'sm' ? '86%' : (this.breakpoint === 'md' ? '70%' : '50%'))
      .constraintSize({ maxWidth: 560 })
      .alignItems(HorizontalAlign.Center)
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .backgroundColor('#0a0a0a')
  }
}
