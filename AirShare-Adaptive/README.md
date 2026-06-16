# AirShare Adaptive — 一次开发多端部署（大小屏适配）

基于 HarmonyOS 断点系统的跨设备文件传输 App，同一套代码在手机、平板、2-in-1 上自动呈现不同布局。

## 大小屏适配方案

### 原生 ArkUI 层（配置页 `Index.ets`）

使用 `@StorageLink('currentBreakpoint')` 响应系统断点：

| 断点 | 设备 | 布局变化 |
|------|------|---------|
| **sm**（<600vp） | 手机竖屏 | 单列全宽 86%，字号 42/14 |
| **md**（600-840vp） | 平板/折叠屏 | 双列配置 48%+48%，宽度 70%，字号 52/16 |
| **lg**（≥840vp） | 2-in-1/桌面 | 双列 48%+48%，宽度 50%，字号 60/16 |

**适配点**（共 12 处断点判断）：
- Logo 字号：42 → 52 → 60
- 页面宽度：86% → 70% → 50%
- 配置区布局：单列 100% → 双列 48%
- 间距：自适应放大

### WebView 层（传输页 `TransferPage.ets` + `rawfile/web/style.css`）

Web 界面通过 CSS 媒体查询实现三种布局：

| 断点 | 布局 |
|------|------|
| <640px | 单栏手机布局 |
| 640-1023px | 双栏：左侧设备列表 + 右侧文件传输 |
| ≥1024px | 双栏加宽，更大间距 |

### 安全注入（TransferPage.ets）

设备名称通过 `JSON.stringify` 转义后注入 WebView，防止 XSS：
```typescript
let safeName = JSON.stringify(this.deviceName);
this.controller.runJavaScript(`el.value = ${safeName}`);
```

## 项目结构

```
AirShare-Adaptive/
├── AppScope/app.json5
├── build-profile.json5
├── entry/src/main/
│   ├── ets/
│   │   ├── entryability/EntryAbility.ets
│   │   ├── pages/Index.ets          # 配置页（断点适配）
│   │   ├── pages/TransferPage.ets   # WebView 传输页
│   │   └── common/Constants.ets
│   ├── resources/
│   │   ├── base/element/   # 字符串、颜色
│   │   ├── base/media/     # 图标
│   │   ├── base/profile/   # 页面路由
│   │   └── rawfile/web/    # Web 传输界面（响应式 CSS）
│   └── module.json5
├── local.properties
└── README.md
```

## 后端服务器

详见 `D:\HUAWEI\lab4\server\` 或 `D:\HUAWEI\lab4-windows\`。

局域网内运行 Python 服务器后，App 输入服务器 IP:3000 即可连接传文件。

## 构建

- DevEco Studio 6.0.2+，API 12 (5.0.0)
- 打开 `AirShare-Adaptive` 目录 → Build → Build Hap

## 断点适配对比

```
手机 (sm):                  平板 (md):                    
┌─────────────────┐         ┌────────┬────────┐          
│   AirShare(42)   │         │   AirShare(52)  │          
│   跨设备双向互传   │         │ 跨设备双向互传   │          
│ [LAN 警告横幅]   │         │ [LAN 警告横幅]   │          
│ ┌─────────────┐  │         │ ┌──────┐┌──────┐│          
│ │设备名称  100%│  │         │ │设备名││服务器││          
│ └─────────────┘  │         │ │ 48%  ││ 48%  ││          
│ ┌─────────────┐  │         │ └──────┘└──────┘│          
│ │服务器IP   100%│  │         │ ┌──────────────┐│         
│ └─────────────┘  │         │ │   开始使用    ││          
│ [  开始使用  ]   │         │ └──────────────┘│          
│ 提示文字...       │         │ 提示文字...      │          
│ 宽度: 86%         │         │ 宽度: 70%        │          
└─────────────────┘         └────────────────────────┘          
```
