# AirShare - 鸿蒙多设备局域网双向互传

基于 WebRTC 的局域网跨设备文件双向传输，支持鸿蒙手机、平板、PC 互相传文件。

---

## 项目结构

```
lab4/
├── server/              # Python 服务器（PC端运行）
│   ├── server.py         # 主程序 (aiohttp + WebSocket 信令)
│   ├── start.bat
│   └── public/           # Web 传输界面
│       ├── index.html
│       ├── style.css
│       └── app.js
├── AirShare/             # DevEco Studio 鸿蒙项目
│   ├── AppScope/
│   ├── entry/src/main/ets/
│   │   ├── entryability/EntryAbility.ets
│   │   ├── pages/Index.ets          # 配置页（LAN警告 + 服务器地址）
│   │   ├── pages/TransferPage.ets   # WebView 双向传输
│   │   └── common/Constants.ets
│   └── build-profile.json5
└── lab4-windows/         # Windows 独立版（一键运行）
```

---

## 使用方式

### PC 端（启动服务器）

```bash
cd server
pip install aiohttp qrcode
python server.py
```

或双击 `server\start.bat` 一键启动。

### 鸿蒙端（安装 App）

1. DevEco Studio 打开 `AirShare` 项目
2. 签名 → 构建 → 安装到真机 / 虚拟机
3. 打开 App → 输入 PC 的 IP 地址 → 点击「开始使用」

### 传输流程

1. 一端创建房间 → 显示房间号 + 二维码
2. 另一端输入房间号加入
3. 配对成功后，**两端均可互相发送文件**
4. 支持拖拽、多文件、实时进度条

---

## 要求

| 条件 | 说明 |
|------|------|
| 局域网 | **所有设备必须在同一局域网（WiFi）** |
| Python | PC 需安装 Python 3.8+ |
| 防火墙 | 需开放 **TCP 3000** 端口 |
| 鸿蒙 | HarmonyOS 4.0+ |

---

## 双端通信注意事项

### 1. 网络环境 —— 「同局域网」是硬前提

AirShare 依赖 WebSocket 做信令 + WebRTC 做 P2P 传输，**两台设备必须 IP 可达**：

| 场景 | 是否可行 | 说明 |
|------|----------|------|
| 同一 WiFi 下的两台真机 | ✅ | 理想场景 |
| PC 本机浏览器 + 真机（同 WiFi） | ✅ | 最常用 |
| **虚拟机 NAT 模式** | ❌ | VM 可访问宿主机，但宿主机无法直接访问 VM |
| **虚拟机桥接模式** | ✅ | VM 获得独立局域网 IP，与宿主机对等 |

> 💡 如果你用 DevEco Studio 的虚拟机（NAT），可以这样做：
> - **方案一（推荐）**：VM 验证 ArkUI 界面 → 本机浏览器验证 Web 传输层，分开测试
> - **方案二**：虚拟机网络改为「桥接网卡」（VirtualBox：设置→网络→网卡1→桥接网卡）

### 2. WebRTC 协商冲突 —— 已内置 Polite Peer 模式

原来的实现存在 **双方同时发起 Offer 导致互相丢弃** 的 Glare 问题：

```
修复前（有问题）：
VM: connectAll() → makePC(PC_id) → 发 Offer        ← 被PC丢弃
PC: connectAll() → makePC(VM_id) → 发 Offer        ← 被VM丢弃
结果: 两个Offer都被丢，P2P连接从未建立！

修复后（Polite Peer）：
规则: deviceId 较大的一方为 "礼貌方"，冲突时主动退让
- Polite(大ID): 回滚自己的连接 → 接受对方Offer
- Impolite(小ID): 忽略对方Offer → 保留自己的连接
结果: 始终只有一条PeerConnection，DataChannel双向可达
```

### 3. 端口占用 —— 启动服务器前确认 3000 端口空闲

如遇到 `[Errno 10048]` 端口被占用：

```powershell
# 查看占用端口的进程
netstat -ano | findstr :3000

# 关掉占用进程（替换 PID）
Stop-Process -Id <PID> -Force
```

通常是之前关闭窗口后 Python 进程残留。

### 4. 防火墙

首次运行会弹出 Windows 防火墙提示，请**允许 Python 访问网络**。

### 5. 先后顺序

建议操作顺序：
1. **先在 PC 运行 `start.bat`** 启动服务器
2. 确认终端显示 `http://<本机IP>:3000`
3. 再在鸿蒙 App 中输入该地址并连接

---

## 技术架构

```
┌──────────────┐          ┌──────────────┐
│   鸿蒙 App    │          │   PC 浏览器   │
│  (WebView)   │          │  (或Win独立版) │
└──────┬───────┘          └──────┬───────┘
       │  WebSocket 信令          │
       │◄────────────────────────►│
       │      Python Server       │
       │       (server.py)        │
       │                         │
       │  WebRTC DataChannel      │
       │◄════════════════════════►│
       │    (P2P 文件直传)         │
```

- **信令层**：WebSocket 通过 Python aiohttp 服务器转发 SDP / ICE
- **传输层**：WebRTC DataChannel 点对点直传，不经过服务器
- **鸿蒙桥接**：ArkUI WebView 加载服务器页面，`runJavaScript` 注入设备名

---

## 常见问题

| 问题 | 原因 | 解决 |
|------|------|------|
| App 显示「无法连接」 | 服务器未启动 / IP 错误 | 检查 PC 防火墙 + IP 地址 |
| 看到对方但无法传文件 | WebRTC ICE 不通 | 确认同局域网，关闭 VPN |
| 端口被占用 | 上次 Python 进程未退出 | 任务管理器杀掉 python.exe |
| VM 能发不能收 | WebRTC Glare（已修复） | 拉取最新 app.js |
