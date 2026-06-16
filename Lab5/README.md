# NoteFlow — 跨设备自由流转笔记

基于 HarmonyOS 自由流转能力实现的跨设备笔记接力应用。

## 项目结构

```
Lab5/
├── AppScope/app.json5
├── build-profile.json5
├── entry/src/main/
│   ├── ets/
│   │   ├── entryability/EntryAbility.ets   # 流转入口：onContinue + onCreate 状态恢复
│   │   ├── pages/NoteList.ets              # 笔记列表，每项支持「流转」按钮
│   │   ├── pages/NoteEditor.ets            # 笔记编辑页，支持从流转恢复
│   │   ├── model/NoteModel.ets             # 笔记数据模型 + 流转状态打包
│   │   └── common/ContinuationHelper.ets   # 流转状态序列化工具
│   └── module.json5                        # continuable: true 启用流转
└── hvigor/
```

## 功能

| 功能 | 说明 |
|------|------|
| 笔记列表 | 展示所有笔记，支持新建和长按删除 |
| 笔记编辑 | 标题 + 正文编辑，自动保存 |
| 跨设备流转 | 点击「流转」按钮，将当前编辑状态传递到附近设备 |
| 状态恢复 | 流转后另一设备自动打开同一笔记，标题、正文和光标位置全部还原 |

## 流转流程

```
设备A（手机）                        设备B（平板）
─────────                          ─────────
1. 正在编辑笔记                     
2. 点击列表中的「流转」按钮
3. EntryAbility.onContinue()
   → 打包 noteId, title,
     content, cursorPos
4. 系统发现附近设备B ══════════→  5. EntryAbility.onCreate(want)
                                     → 从参数恢复笔记数据
                                  6. 自动进入 NoteEditor
                                     → 填充内容，显示「已从其他设备恢复」
```

## 核心技术

- `AbilityContinuation`：UIAbility 的 `continuable: true` + `onContinue()` 回调
- `DistributedObject`（可选）：编辑时多设备实时同步内容
- 流转状态通过 `Want.parameters` 在设备间传递

## 要求

- DevEco Studio 6.0.2+，API 12 (5.0.0)
- 需要两台 HarmonyOS 设备进行流转演示
- 需要在 `local.properties` 中配置 SDK 路径
