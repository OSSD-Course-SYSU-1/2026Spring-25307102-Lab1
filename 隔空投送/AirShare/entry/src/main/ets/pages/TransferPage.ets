import router from '@ohos.router';
import webview from '@ohos.web.webview';

interface RouterParams {
  serverUrl: string;
  deviceName: string;
}

@Entry
@Component
struct TransferPage {
  @State serverUrl: string = '';
  @State deviceName: string = '';
  @State progress: number = 0;
  @State showError: boolean = false;
  private controller: webview.WebviewController = new webview.WebviewController();

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

  build() {
    Column() {
      if (this.showError) {
        Column() {
          Text('无法连接')
            .fontSize(18)
            .fontColor('#ff5252')
            .margin({ bottom: 12 })

          Text('请检查：')
            .fontSize(13)
            .fontColor('#888888')

          Text('1. 服务器已启动')
            .fontSize(13)
            .fontColor('#666666')
            .margin({ top: 8 })

          Text('2. 设备在同一 WiFi')
            .fontSize(13)
            .fontColor('#666666')
            .margin({ top: 4 })

          Text('3. 防火墙已开放 3000 端口')
            .fontSize(13)
            .fontColor('#666666')
            .margin({ top: 4 })

          Text(`当前地址: ${this.serverUrl}`)
            .fontSize(11)
            .fontColor('#555555')
            .margin({ top: 16, bottom: 24 })

          Button('返回修改')
            .fontSize(14)
            .fontColor('#ffffff')
            .backgroundColor('rgba(255,255,255,0.1)')
            .border({ width: 1, color: 'rgba(255,255,255,0.2)' })
            .borderRadius(10)
            .padding({ left: 24, right: 24, top: 10, bottom: 10 })
            .onClick(() => { router.back(); })
        }
        .width('100%')
        .height('100%')
        .justifyContent(FlexAlign.Center)
        .alignItems(HorizontalAlign.Center)
        .backgroundColor('#0a0a0a')
      } else {
        Stack() {
          Web({ src: this.serverUrl, controller: this.controller })
            .width('100%')
            .height('100%')
            .javaScriptAccess(true)
            .domStorageAccess(true)
            .fileAccess(true)
            .onlineImageAccess(true)
            .zoomAccess(false)
            .onProgressChange((event) => {
              if (event) this.progress = event.newProgress;
            })
            .onErrorReceive((event) => {
              console.error('Web error: ' + (event?.error?.getErrorInfo?.() || ''));
              this.showError = true;
            })
            .onPageEnd(() => {
              this.progress = 100;
              setTimeout(() => { this.updateDeviceName(); }, 500);
            })

          if (this.progress < 100) {
            Column() {
              LoadingProgress()
                .color('#4facfe')
                .width(40)
                .height(40)
              Text(`${this.progress}%`)
                .fontSize(12)
                .fontColor('#888888')
                .margin({ top: 12 })
            }
            .width('100%')
            .height('100%')
            .justifyContent(FlexAlign.Center)
            .alignItems(HorizontalAlign.Center)
          }
        }
        .width('100%')
        .height('100%')
        .backgroundColor('#0a0a0a')
      }
    }
    .width('100%')
    .height('100%')
  }
}
