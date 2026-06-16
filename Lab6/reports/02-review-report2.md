# 复审报告 — Lab6 (NewsReader) 修改后二次审查

> **文件**：`02-review-report2.md`  
> **审查日期**：2026-06-16  
> **性质**：对另一 Agent 修改后的复审，含逐条辩论结论  
> **修改 Agent 处理**：修复 2 个 / 保留 4 个（附理由）

---

## 一、复审方法论

上次报告共列 6 个问题。另一 Agent 进行了修改，并对未修改的 4 个问题给出了事由说明。本次复审对每个问题进行独立复核，逐条给出裁决：

| 标记 | 含义 |
|------|------|
| ✅ | 已修复，确认通过 |
| ⚪ | 撤回（原判有误） |
| 🟡 | 接受对方理由，不修改 |
| 🔴 | 仍需修复（新发现或对方遗漏） |

---

## 二、逐条复核

---

### 问题②：HTTP 连接泄漏 — ✅ 确认修复

**原问题**：`NewsApi.ets` 中 `req.destroy()` 仅在 `try` 成功路径执行，异常时连接泄漏。

**修改内容**：将 `req.destroy()` 移入 `finally` 块。

```typescript
// NewsApi.ets:11-27 (修改后)
let req = http.createHttp();
try {
  let resp = await req.request(url, { ... });
  // 处理响应
} catch (e) {
  console.error('News API error: ' + JSON.stringify(e));
} finally {
  req.destroy();   // ✅ 所有路径均执行
}
return [];
```

**裁决**：✅ 修复完成，代码正确。

---

### 问题⑤：source 字段类型转换冲突 — ✅ 确认修复

**原问题**：`NewsData.ets` 第 19 行对 `source` 字段先 `as string` 再 `as Record<string,Object>`，对象值会被转成 `"[object Object]"`。

**修改内容**：改用运行时 `typeof` 判断。

```typescript
// NewsData.ets:20-25 (修改后)
let src = data['source'];
if (typeof src === 'string') {
  a.source = src;
} else if (typeof src === 'object' && src !== null) {
  a.source = ((src as Record<string, Object>)['name'] as string) || '';
}
```

**裁决**：✅ 修复完成，逻辑正确。

---

### 问题③：breakpoint 未初始化 — ⚪ 撤回

**原判**："项目内无代码向 AppStorage 写入 `currentBreakpoint`，自适应布局永不生效。"

**对方论点**：API 12 起，`currentBreakpoint` 是 ArkUI 框架内置的系统级 AppStorage 键，由框架运行时自动根据窗口物理尺寸更新为 `'sm'` / `'md'` / `'lg'`。DevEco Studio 官方模板默认使用 `@StorageLink('currentBreakpoint')` 且不含任何手动初始化代码。

**复审结论**：

- 项目 SDK 版本确为 API 12（构建日志：`target-api-version 12`）
- 对方论点与 HarmonyOS API 12 文档行为一致
- 我的原判基于 API 11 及更早版本经验，不适用于当前版本

**裁决**：⚪ 撤回。原判为假阳性。

---

### 问题④：网络失败无用户提示 — ⚪ 撤回

**原判**："API 失败时静默回退到模拟数据，用户无法区分真假新闻。"

**对方论点**：已有降级策略保证用户能看到内容而非空白页。区分真实/模拟数据属于产品优化而非缺陷，对课堂演示项目投入产出比低。

**复审结论**：

- `fetchNews()` → 空数组 → `getFallbackData()` 填充：这是一个**完整的降级链路**
- 是否加 Toast/横幅提示属于 UX 优化，非功能性缺陷
- 对当前项目规模和定位，可接受

**裁决**：⚪ 撤回。非缺陷，属优化建议。

---

### 问题⑥：JSON 解析无防御 — ⚪ 撤回

**原判**：`JSON.parse` 异常无单独捕获，`results` 结构变更会导致运行时崩溃。

**对方论点**：已有双重防护：
1. 外层 `try-catch` 包裹整个请求体，`JSON.parse` 异常会被捕获
2. `articles && articles.length > 0` 的检查在 `.map` 之前，即便 `results` 不存在或不是数组，也会跳过 `.map`，返回空数组后触发离线回退

**复审确认**（代码路径）：

```typescript
try {
  // ... request ...
  if (resp.responseCode === 200) {
    let json = JSON.parse(body) as Record<string, Object>;           // ← 异常被外层 catch 捕获
    let articles = json['results'] as Array<Record<string, Object>>; // ← 结构不对 → undefined
    if (articles && articles.length > 0) {                           // ← undefined.length → false，跳过
      return articles.map(...);
    }
  }
} catch (e) { /* ... */ }
return [];
```

任何异常或结构不符均 → `return []` → 触发 `getFallbackData()`，无崩溃路径。

**裁决**：⚪ 撤回。已有足够防御层次。

---

### 问题①：API Key 硬编码 — 🟡 接受对方理由

**原判**：API Key 明文写在源码中属安全漏洞。

**对方论点**：
- 该 Key 为 `pub_` 前缀的 newsdata.io 免费套餐密钥，无费用风险
- 免费密钥本身就是公开注册即可获得的，安全模型不同于付费 API
- 项目为学生课堂演示，不存在反编译分发问题

**复审结论**：对方的安全性论证成立。`pub_` 前缀密钥泄漏的后果确实不构成安全事件。

**保留意见**：不修不等于无代价——可移植性受影响，未来若换用其他 API 需改动源码。但对方已将此规范写入 Skill 规则，接受。

**裁决**：🟡 接受对方理由。当前不修改。

---

### 🔴 问题⑦：`ohos.want.action.home` — 对方遗漏，仍需修复

**发现过程**：原 6 个问题审查时遗漏了 `module.json5` 中的 action 配置。二次复审时补检发现。

**问题代码**：

```json5
// module.json5:21-26
"skills": [
  {
    "entities": ["entity.system.home"],
    "actions": ["ohos.want.action.home"]    // ← 🔴 错误
  }
]
```

**根因**：

- `ohos.want.action.home` 将应用注册为**桌面启动器（Home App）**，这是系统级身份
- 普通应用应使用 `ohos.want.action.main` 声明自身为入口 Ability
- 使用 `home` 会导致 DevEco Studio 的 **Run 按钮无法正常启动应用**

**对方处理**：未发现，未处理。

**修复方案**：

```json5
"actions": ["ohos.want.action.main"]   // ✅ 正确
```

**裁决**：🔴 必须修复。这是直接影响开发调试体验的配置错误。

---

## 三、汇总

| 编号 | 问题 | 原严重度 | 最终裁决 |
|------|------|----------|----------|
| ② | HTTP 连接泄漏 | 🟡 | ✅ 已修复 |
| ⑤ | source 类型转换 | 🟢 | ✅ 已修复 |
| ③ | breakpoint 未初始化 | 🟡 | ⚪ 撤回（API 12 框架自动管理） |
| ④ | 网络失败无提示 | 🟡 | ⚪ 撤回（产品优化，非缺陷） |
| ⑥ | JSON 解析无防御 | 🟢 | ⚪ 撤回（防御已足够） |
| ① | API Key 硬编码 | 🔴 | 🟡 接受对方理由，保留可移植性意见 |
| ⑦ | **action.home → action.main** | 🔴 | 🔴 **仍需修复** |

### 修复完成度

| 类别 | 数量 |
|------|------|
| 已修复 & 确认 | 2 |
| 撤回（误判/过度防御） | 3 |
| 接受理由不修改 | 1 |
| **待修复** | **1**（⑦） |

---

## 四、所学教训

1. **API 版本差异陷阱**：`@StorageLink('currentBreakpoint')` 的行为在 API 11 → API 12 之间发生了从"需手动管理"到"框架自动管理"的质变，审查时必须核对项目 target API 版本。

2. **防御深度要结合实际**：存在外层 `try-catch` 且有多重条件守卫的情况下，不必在每一层都加独立防御——需分析"异常是否能逃逸到用户可见层"而非机械地要求每行都有 try-catch。

3. **安全模型的层次差异**：`pub_` 前缀的免费 API Key 和 `sk-` 前缀的付费 Key 属于完全不同的安全模型，不能混为一谈。

4. **配置级遗漏更致命**：代码逻辑问题往往容易发现，但 `module.json5` 中的 action 配置错误（`home` vs `main`）直接阻塞开发流程，审查时应优先关注配置文件。

---

> **生成工具**：HarmonyOS Development Assistant  
> **生成时间**：2026-06-16  
> **文件路径**：`D:/HUAWEI/Lab6/reports/02-review-report2.md`  
> **关联报告**：`D:/HUAWEI/Lab6/reports/error-training-report.md`（初次审查）
