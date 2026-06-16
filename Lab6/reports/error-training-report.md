# HarmonyOS 项目审查培训报告 — Lab6 (NewsReader)

> **用途**：供 Agent 培训使用，展示一次完整的 HarmonyOS/ArkTS 项目审查流程与发现。
>
> **项目**：`D:/HUAWEI/Lab6` — 多端自适应新闻阅读器  
> **审查日期**：2026-06-16  
> **构建状态**：✅ 编译通过（无语法/构建错误）  
> **问题总数**：6 个（🔴 1 安全 / 🟡 3 逻辑架构 / 🟢 2 代码质量）

---

## 审查方法论

作为 HarmonyOS 开发助手，按以下流程完成审查：

1. **全量文件发现** — `builtin_glob **/*` 枚举所有源文件，排除 `.hvigor/build` 缓存
2. **关键配置审查** — `module.json5`、`main_pages.json`、`build-profile.json5`、`app.json5`
3. **源码逐文件阅读** — 所有 `.ets` 文件全文读取
4. **构建日志分析** — 检查 `.hvigor/outputs/build-logs/build.log`
5. **交叉验证** — 字符串资源引用、权限声明与代码实际调用的一致性

---

## 问题 ① 🔴 API Key 明文硬编码

| 属性 | 值 |
|------|-----|
| **文件** | `entry/src/main/ets/model/NewsApi.ets` |
| **行号** | 5 |
| **严重度** | 🔴 安全漏洞 |
| **分类** | Credential Management |

### 问题代码

```typescript
// NewsApi.ets:4-6
// Free public API: NewsAPI or similar
const API_KEY = 'pub_664720d7128f46efb5cb51a5e42cdfdb867da';
const BASE_URL = 'https://newsdata.io/api/1/news';
```

### 分析

API 密钥以**明文常量**形式写在模块顶层作用域中，任何有权访问源码的人（包括版本控制系统的所有协作者、构建产物反编译者）均可直接获取该密钥。

**后果**：
- 密钥随代码分发而泄露
- 无法轮换密钥而不重新发布应用
- 若为付费 API，可能产生非预期费用

### 修复方向

1. 将 API Key 移至**服务端**，由服务端代理请求（最佳方案）
2. 若必须客户端持有，至少不应硬编码——可考虑：
   - 构建时注入（通过 `build-profile.json5` 的 `buildOption` 传入）
   - 加密存储 + 运行时解密（降低风险但非根除）

---

## 问题 ② 🟡 HTTP 连接泄漏

| 属性 | 值 |
|------|-----|
| **文件** | `entry/src/main/ets/model/NewsApi.ets` |
| **行号** | 12–14（相关区间 9–28） |
| **严重度** | 🟡 资源泄漏 |
| **分类** | Resource Management |

### 问题代码

```typescript
// NewsApi.ets:9-28 (精简)
static async fetchNews(category: string): Promise<NewsArticle[]> {
  let url = `${BASE_URL}?apikey=${API_KEY}&category=${category}&language=zh`;
  try {
    let req = http.createHttp();
    let resp = await req.request(url, {
      method: http.RequestMethod.GET,
      connectTimeout: 10000,
      readTimeout: 10000
    });
    req.destroy();                // ← 只有 try 块成功执行才到这

    if (resp.responseCode === 200) {
      // ...
    }
  } catch (e) {
    console.error('News API error: ' + JSON.stringify(e));
    // ← req.destroy() 永远不会被调用！
  }
  return [];
}
```

### 分析

`req.destroy()` 只在 `try` 块正常完成时执行。一旦 `req.request()` 抛出异常（网络超时、DNS 解析失败、连接被拒等），控制流直接跳入 `catch`，`req` 对象持有的底层连接**永远不被释放**。

HarmonyOS `@ohos.net.http` 的 `createHttp()` 每次调用创建独立的连接句柄，若不销毁会造成：
- 连接池耗尽（反复调用后无法建立新连接）
- 内存占用持续增长

### 修复方向

使用 `finally` 块确保销毁：

```typescript
let req = http.createHttp();
try {
  let resp = await req.request(url, ...);
  // 处理响应
} catch (e) {
  // 错误处理
} finally {
  req.destroy();  // 始终执行
}
```

---

## 问题 ③ 🟡 自适应布局事实上失效（Breakpoint 未初始化）

| 属性 | 值 |
|------|-----|
| **文件** | `entry/src/main/ets/pages/Index.ets` |
| **行号** | 7（影响范围：30–33, 93, 135, 156, 169, 206, 220–307） |
| **严重度** | 🟡 核心功能失效 |
| **分类** | State Management / Responsive Design |

### 问题代码

```typescript
// Index.ets:7
@StorageLink('currentBreakpoint') breakpoint: string = 'sm';
```

### 受影响逻辑（部分列举）

```typescript
// Line 30-33 — 平板自动选中首篇文章
if (this.breakpoint !== 'sm' && data.length > 0) {
  this.selectedArticle = data[0];
}

// Line 220 — 手机布局
if (this.breakpoint === 'sm') { /* 单页堆叠导航 */ }

// Line 229 — 平板布局
if (this.breakpoint === 'md') { /* 双栏: 列表 | 详情 */ }

// Line 253 — 桌面布局
if (this.breakpoint === 'lg') { /* 三栏: 分类 | 列表 | 详情 */ }
```

### 分析

`@StorageLink('currentBreakpoint')` 从 `AppStorage` 中读取键为 `'currentBreakpoint'` 的值。但**整个项目中没有任何代码调用 `AppStorage.setOrCreate('currentBreakpoint', ...)` 来写入该值**。

HarmonyOS 的断点系统（BreakpointSystem）**不会**自动向 AppStorage 注入断点值。开发者必须手动监听窗口尺寸变化并写入。

**当前实际行为**：`breakpoint` 始终为默认值 `'sm'`。
**后果**：
- 组件 `build()` 中的 `if (this.breakpoint === 'md')` 和 `if (this.breakpoint === 'lg')` 分支**永远不会执行**
- 平板/桌面双栏/三栏布局完全不可达
- 多处字号自适应逻辑（`this.breakpoint === 'sm' ? 15 : 16` 等）退化为固定值

### 修复方向

需在 `EntryAbility.ets` 或 `Index.ets` 的 `aboutToAppear()` 中：

1. 使用 `window.getLastWindow()` 获取窗口对象
2. 监听 `on('windowSizeChange')` 事件
3. 根据窗口宽度判断断点（<600vp → sm, 600–840vp → md, >840vp → lg）
4. 调用 `AppStorage.setOrCreate('currentBreakpoint', ...)` 写入

---

## 问题 ④ 🟡 网络失败无用户提示

| 属性 | 值 |
|------|-----|
| **文件** | `entry/src/main/ets/pages/Index.ets` |
| **行号** | 24–26 (loadNews 方法) |
| **严重度** | 🟡 用户体验缺陷 |
| **分类** | UX / Error Feedback |

### 问题代码

```typescript
// Index.ets:18-28
async loadNews(): Promise<void> {
  this.isLoading = true;
  // ...

  let data = await NewsApi.fetchNews(this.currentCategory);
  if (data.length === 0) {
    data = NewsApi.getFallbackData(this.currentCategory);  // ← 静默回退
  }
  this.articles = data;
  this.isLoading = false;
  // ...
}
```

### 分析

当 `fetchNews()` 因网络不可达返回空数组时，代码静默切换到 `getFallbackData()` 生成的模拟数据。用户看到的是"科技日报"的假新闻，但**完全不知道**当前显示的不是真实数据。

**后果**：
- 用户可能基于虚假信息做判断
- 无法区分"真的没有新闻"和"网络不通"
- 缺乏重试引导

**修复方向**：

在 `NewsApi.fetchNews()` 中区分"网络错误"和"API 返回空结果"，使用有状态的返回值（如 `{ data, error }` 结构），UI 层据此显示 Toast/横幅提示："当前网络不可用，显示离线数据"。

---

## 问题 ⑤ 🟢 JSON 字段类型转换自相矛盾

| 属性 | 值 |
|------|-----|
| **文件** | `entry/src/main/ets/model/NewsData.ets` |
| **行号** | 19 |
| **严重度** | 🟢 潜在数据损坏 |
| **分类** | Type Safety / Data Mapping |

### 问题代码

```typescript
// NewsData.ets:19
a.source = (data['source'] as string)
        || ((data['source'] as Record<string,Object>)?.['name'] as string)
        || '';
```

### 分析

newsdata.io API 的 `source` 字段实际是一个**嵌套对象**（如 `{ name: "科技日报", url: "..." }`），而不是字符串。

此处的防御逻辑是：
1. 先尝试把 `source` 当 `string` 用
2. 如果第一步拿到的是空值，再尝试解析为对象的 `.name` 属性

但问题在于：如果 `source` 确实是一个对象，第一步 `data['source'] as string` 并不会返回空值——TypeScript 的 `as` 是纯编译期断言，运行时该对象经过 `||` 运算符时是 truthy 的，于是 `a.source` 被赋值为 **`"[object Object]"`**（对象隐式转字符串的结果）。

**后果**：用户看到新闻来源显示为 `[object Object]` 而非真正的来源名称。

### 修复方向

先判断类型再取值：

```typescript
const src = data['source'];
if (typeof src === 'string') {
  a.source = src;
} else if (typeof src === 'object' && src !== null) {
  a.source = (src as Record<string, Object>)['name'] as string || '';
}
```

---

## 问题 ⑥ 🟢 API JSON 解析无防御

| 属性 | 值 |
|------|-----|
| **文件** | `entry/src/main/ets/model/NewsApi.ets` |
| **行号** | 18–20 |
| **严重度** | 🟢 运行时崩溃风险 |
| **分类** | Defensive Programming |

### 问题代码

```typescript
// NewsApi.ets:16-22
if (resp.responseCode === 200) {
  let body = resp.result as string;
  let json = JSON.parse(body) as Record<string, Object>;
  let articles = json['results'] as Array<Record<string, Object>>;
  if (articles && articles.length > 0) {
    return articles.map(item => NewsArticle.fromApi(item));
  }
}
```

### 分析

两个假设未经校验：
1. `JSON.parse(body)` 假设 body 是合法 JSON —— 若 API 返回 HTML 错误页或空响应，`JSON.parse` 抛异常，被外层 `catch` 吞掉后静默返回 `[]`，开发者难以排查
2. `json['results']` 假设 `results` 字段存在且为数组 —— 若 API 结构变更（如字段改名），结果为 `undefined`，`.map` 调用失败

**当前后果**：异常被 `catch` 吞掉 + `console.error` 输出，UI 层回退到模拟数据，用户和开发者都难以发现真实根因。

### 修复方向

对 `JSON.parse` 单独 `try-catch` 并记录详细错误；对 `results` 做类型校验（`Array.isArray`）后再 `.map`。

---

## 附加发现：构建环境注意事项

| 发现 | 详情 |
|------|------|
| **SDK 版本** | API 12 (5.0.0.12), 编译 API 6.0.2.130 |
| **Cangjie 缺失** | 构建日志警告 `Cannot find module '@ohos/cangjie-build-support'` — 项目未使用仓颉，可忽略 |
| **签名配置** | `No signingConfig found` — 使用默认调试签名，正式发布需配置 |
| **syscap.json** | 文件不存在（`File is not exists, just ignore`）— 非必须，可忽略 |
| **排除架构** | `x86_64` 被排除（`nativeLib.filter.excludes: ["x86_64"]`）— 无原生库的项目无实际影响 |
| **断点系统** | 构建日志未提及任何 breakpoint 配置注入 — 与问题③一致 |

---

## 问题统计

| 严重度 | 数量 | 问题编号 |
|--------|------|----------|
| 🔴 安全漏洞 | 1 | ① |
| 🟡 逻辑/架构缺陷 | 3 | ② ③ ④ |
| 🟢 代码质量问题 | 2 | ⑤ ⑥ |
| ⚪ 环境注意事项 | — | 附加 |
| **合计** | **6** | |

---

## 给受训 Agent 的要点总结

1. **不要只看文件内容，要做交叉验证** — 如 breakpoint 问题：代码里用了 `@StorageLink`，就必须找谁在写 `AppStorage`，找不到就是 bug
2. **异步资源的生命周期管理** — `createHttp()` 这类"创建-销毁"对必须检查所有代码路径，特别是异常路径
3. **硬编码凭证的识别** — 模块顶层作用域的常量中包含 `key`/`secret`/`token` 等关键字是红旗
4. **类型转换 (`as`) 的风险** — ArkTS 的 `as` 是编译期断言，不改变运行时值，靠 `||` 做类型兜底非常脆弱
5. **API 对接层的防御纵深** — HTTP 状态码 ✅ → JSON 解析 ✅ → 结构校验 ✅ → 字段类型适配 ✅，每一步都不能跳过

---

> **生成工具**：HarmonyOS Development Assistant  
> **生成时间**：2026-06-16  
> **文件路径**：`D:/HUAWEI/Lab6/reports/error-training-report.md`
