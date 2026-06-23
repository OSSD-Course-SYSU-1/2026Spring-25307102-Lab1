# HarmonyOS NDK OpenGL 三棱锥渲染项目

## 项目概述

基于 **HarmonyOS NDK + OpenGL ES** 的 3D 图形渲染示例，通过 XComponent 组件实现可交互的 3D 三棱锥绘制。

### 核心特性
- 3D 图形渲染：OpenGL ES 2.0 绘制三棱锥，含光照效果
- 交互旋转：支持触摸滑动、自动旋转、阻尼旋转
- 多设备适配：直板机、折叠屏、平板自适应
- 安全区域适配：自动避让刘海屏、摄像头区域

---

## 项目结构

```
ndk-opengl-master/
├── .github/workflows/        # CI/CD 配置
│   ├── ci-cd.yml             # 主流水线
│   └── pr-check.yml          # PR 检查
├── entry/src/main/
│   ├── cpp/                  # Native C++ 代码
│   │   ├── tetrahedron.cpp   # OpenGL 渲染核心
│   │   ├── app_napi.cpp      # NAPI 接口层
│   │   ├── frame_handle.cpp  # 动画控制
│   │   └── module.cpp        # 模块注册
│   └── ets/                  # ArkTS 前端
│       ├── pages/Index.ets   # 主页面
│       └── entryability/     # 生命周期
└── build-profile.json5       # 构建配置
```

---

## 核心代码解析

### 1. OpenGL 渲染 (tetrahedron.cpp)
- EGL 环境初始化
- Shader 编译与链接
- 顶点数据绑定（位置、颜色、法向量）
- 每帧渲染与缓冲区交换

### 2. NAPI 接口 (app_napi.cpp)
- XComponent 回调注册（Surface 创建/销毁/变化）
- 触摸事件分发
- ArkTS 与 C++ 数据桥接

### 3. 动画控制 (frame_handle.cpp)
- 匀速旋转：ConstantSpeedRotation()
- 阻尼旋转：DampingRotation()（指数衰减）

---

## 使用说明

### 环境要求
- DevEco Studio 5.0+
- HarmonyOS SDK API 12
- Node.js 18+

### 运行步骤
1. 克隆项目并导入 DevEco Studio
2. 执行 `ohpm install`
3. 连接设备或启动模拟器
4. 点击运行

### 交互操作
- 触摸滑动：旋转三棱锥
- 自动旋转按钮：开始/停止匀速旋转
- 阻尼旋转按钮：执行减速旋转

---

## CI/CD 自动化

### 流水线阶段
```
代码检查 -> 构建(HAP) -> 测试 -> 安全扫描 -> 发布
```

### 触发条件
- push 到 main/master/develop 分支
- Pull Request 创建/更新
- 手动触发（可选 debug/release，arm64-v8a/x86_64）

---

## 代码润色与升级

### 本次改进

#### 1. 代码结构优化
- 使用 constexpr 替代宏定义
- 添加 Doxygen 风格注释
- 逻辑模块分段

#### 2. Bug 修复
| 问题 | 修复 |
|------|------|
| 空指针风险 | 添加 nullptr 检查 |
| 内存泄漏 | 完善 EGL 资源释放 |
| 未初始化变量 | 静态变量显式初始化 |
| 边界条件 | 添加宽高有效性验证 |

#### 3. 示例
```cpp
// 修复前
static Tetrahedron *tetrahedron_;

// 修复后
static Tetrahedron* tetrahedron_ = nullptr;
AppNapi* instance = new (std::nothrow) AppNapi(id);
if (instance == nullptr) {
    LOGE("Failed to allocate");
    return nullptr;
}
```

---

## 技术架构

```
┌─────────────────────────────┐
│   ArkTS 前端 (Index.ets)     │
│   XComponent + 手势交互      │
└──────────────┬──────────────┘
               │ NAPI
┌──────────────▼──────────────┐
│   Native C++ (app_napi)      │
│   事件分发 + 生命周期        │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│   OpenGL ES (tetrahedron)    │
│   EGL + Shader + 渲染        │
└─────────────────────────────┘
```

---

## 许可证

Apache License 2.0
Copyright (c) Huawei Technologies Co., Ltd. 2025
