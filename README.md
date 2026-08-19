# Stellaris 存档查看器

纯浏览器端的《群星》(Stellaris) 存档可视化工具。选择 gamestate 存档文件后，在浏览器中交互式浏览银河地图、恒星系、舰队、行星等信息。

## 技术栈

- **解析层**：Rust + [jomini 0.35](https://crates.io/crates/jomini)（Clausewitz 引擎文本格式解析器），编译为 WebAssembly
- **前端**：Vite + 原生 ES Module + Canvas 2D
- **桥接**：wasm-bindgen + serde-wasm-bindgen（Rust 结构体直传 JsValue）

## 项目结构

```
stellaris/
├── parser/                  # Rust WASM 解析器
│   ├── src/
│   │   ├── lib.rs           # WASM 入口 + 文本扫描器（hyperlane/fleet_owner/design_info）
│   │   ├── models.rs        # jomini 反序列化数据结构
│   │   ├── extract.rs       # 视图数据提取（GalaxyData, SystemView, FleetDetail 等）
│   │   └── bin/
│   │       └── debug_parse.rs  # 本地原生测试二进制（不依赖 WASM）
│   └── Cargo.toml
├── web/                     # 前端
│   ├── index.html           # 入口页面（中文 UI）
│   ├── main.js              # 应用状态管理、视图切换、WASM 加载
│   ├── galaxy-map.js        # 银河地图渲染器（缩放/拖动/超空间航道/领土）
│   ├── system-view.js       # 恒星系轨道视图（缩放/拖动/行星/舰队）
│   ├── fleet-window-generated.js   # fleet_view UI 与真实舰队数据适配
│   ├── fleet-view-binding.js       # 舰队、司令、舰船行及状态绑定
│   ├── overview-panel-generated.js # outliner tabs/content/controller 外壳与原生弹窗
│   ├── overview-panel-binding.js   # 行星、舰队、空间站及帝国指标绑定
│   ├── ship-window.js       # 舰船详情弹窗
│   ├── planet-window.js     # 行星详情全屏窗口
│   ├── gui-compiler.js      # 构建期解析 Stellaris .gui/.gfx
│   ├── gui-runtime.js       # 通用静态 UI DOM 渲染器
│   ├── ship-window-generated.js    # ship_view UI、真实舰船数据与交互适配
│   ├── ship-view-binding.js        # 舰船字段、组件图标与槽位帧绑定
│   ├── planet-window-generated.js  # planet_view 静态 UI 接入与分支裁剪
│   ├── ui-components.js     # 资源栏、状态栏
│   ├── style.css            # 全局样式（由 main.js 导入）
│   ├── package.json         # Vite 开发/构建命令及前端依赖
│   ├── vite.config.js       # Vite 构建与静态资源配置
│   └── pkg/                 # wasm-pack 输出（自动生成）
├── example/gamestate        # 示例存档
├── screenshot/              # 截图
└── build.bat                # Windows 一键构建脚本
```

## 构建与运行

### 前置条件

- Rust toolchain + `wasm32-unknown-unknown` target
- [wasm-pack](https://rustwasm.github.io/wasm-pack/)
- Node.js 20.19+ 或 22.12+

### 构建 WASM

```bat
:: Windows
build.bat

:: 或手动（注意 bash 中必须用正斜杠）
cd parser
wasm-pack build --target web --out-dir ../web/pkg
```

### 安装前端依赖

```bash
cd web
npm install
```

### 本地开发（热更新）

```bash
cd web
npm run dev
```

按终端提示打开本地地址，然后选择 `example/gamestate` 或任意 Stellaris 存档文件即可。CSS 修改会热替换，JS/HTML 修改由 Vite 自动刷新页面。

### 生产构建

```bash
cd web
npm run build
npm run preview
```

产物输出到 `web/dist/`。根目录的 `build.bat` 会依次构建 WASM 和前端生产包。

### 本地测试解析器（不需要 WASM）

```bash
cd parser
cargo run --bin debug_parse --release
```

直接读取 `example/gamestate`，逐段验证 jomini 解析和文本扫描结果。

## 功能

- **银河地图**：597 个恒星系、853 条超空间航道、领土边界（凸包）、舰队图标，支持缩放/拖动
- **恒星系视图**：轨道环、恒星、行星（按类型着色）、舰队位置，支持缩放/拖动，按 M 返回银河地图
- **舰队详情**：舰船列表、指挥官、军事力量
- **舰船详情**：船型、设计段位、组件槽
- **行星详情**：区划、建筑、人口、资源产出
- **概览面板**：玩家帝国资源、舰队列表、行星列表
- **资源栏/状态栏**：模拟游戏内 HUD

## 关键技术点

### jomini 解析注意事项

- 未在结构体中声明的字段会被自动跳过，不会报错
- `HashMap<u32, T>` 处理整数键段（如 `0={ ... } 1={ ... }`）
- `#[jomini(duplicated)]` 处理重复键（如 Fleet 中多次出现的 `station=yes`）
- `#[jomini(default)]` 处理可能缺失的 Vec 字段
- 预处理：移除 `N=none` 行（jomini 跳过含 `=none` 的未声明段时会出错）

### 匿名嵌套对象的文本扫描

存档中 `hyperlane={ { to=N } }`、`owned_fleets={ { fleet=N } }` 等匿名嵌套对象无法被 jomini 反序列化为命名结构体。采用逐行文本扫描状态机提取：

```
hyperlane=        ← key= 和 { 在不同行
{
    {
        to=42
    }
}
```

关键：退出条件必须是 `depth <= 0 && closes > 0`，否则在 `key=` 行（depth 仍为 0）就会错误退出。

### 共享 Canvas 多视图

GalaxyMap 和 SystemView 共享同一个 `<canvas>` 元素：

- 每个视图维护 `active` 标志，事件处理器在非活跃时直接 return
- 视图切换时必须先 hide 旧视图再 show 新视图（否则后者的 `display:none` 会覆盖前者的 `display:block`）

### GUI/GFX 静态编译

前端可以在构建期读取游戏的 `.gui` 和 `.gfx`，生成不依赖游戏引擎的静态 UI 定义，再由通用运行时转换成 DOM：

```text
assets/interface/*.gui + assets/interface/*.gfx
    -> gui-compiler.js
    -> virtual:stellaris-*-view-ui
    -> gui-runtime.js
    -> *-window-generated.js
```

当前已接入 `main.gui`、`fleet_view.gui`、`ship_view.gui`、`planet_view.gui` 和 `outliner.gui`。`main.gui` 由 `main-gui-generated.js` 保留资源栏子树，`main-gui-binding.js` 负责存档资源、指标与下拉明细。该流程主要用于还原窗口层级、位置、尺寸、图片、文字和基础控件；游戏引擎通过控件名完成的动态赋值、可见性判断和事件绑定不会由 `.gui/.gfx` 自动推导。

#### 接入一个新页面

1. 在 `web/vite.config.js` 的 `GUI_VIEWS` 中登记页面：

```js
const GUI_VIEWS = [
    // 已有页面……
    {
        id: 'virtual:stellaris-foo-view-ui',
        gui: 'foo_view.gui',
        rootName: 'foo_view',
    },
];
```

- `gui` 是相对于 `web/assets/interface/` 的文件名。
- `rootName` 必须对应 `.gui` 中作为页面根节点的 `name`。
- 不需要逐个登记 `.gfx`；工厂会扫描 `assets/interface/`，共享全局 GFX 注册表。

2. 新建页面适配文件，例如 `web/foo-window-generated.js`：

```js
import definition from 'virtual:stellaris-foo-view-ui';
import { mountGui } from './gui-runtime.js';

export function renderFooWindow(container, _data = {}, callbacks = {}) {
    const view = mountGui(container, definition, {
        localize: key => key,
    });

    view.find('close')?.addEventListener('click', () => callbacks.onClose?.());
    return view;
}
```

3. 在页面入口中调用 `renderFooWindow(container, data, callbacks)`。如果需要单独检查布局，可以仿照 `ship-view-preview.html` 或 `planet-view-preview.html` 增加预览入口。

`mountGui()` 返回以下常用接口：

- `view.root`：页面根 DOM。
- `view.find(name, scope?)`：按 GUI `name` 查找首个节点。
- `view.findIn(scope, name, type?)`：在指定节点内按名称和可选类型查找。
- `view.findAll(name, scope?, type?)`：查找所有同名节点。
- `view.instantiate(templateName, parent, { name? })`：把 `.gui` 中的命名模板实例化到列表或容器中。
- `view.localizeAll(localize?)`：本地化所有带文本 key 的节点。
- `view.setProgress(name, value, max?, scope?)`：给已生成的进度条或 `progressBarType` GFX 设置当前值；值本身仍由 adapter 提供。
- `view.setDropdownExpanded(name, expanded, scope?)`：显式控制 `dropDownBoxType`，声明内的 `expandButton` 也会自动切换它。
- `view.setControlValue(name, value, scope?)`：设置 spinner/scrollbar 的声明式数值；业务含义和写回仍由 adapter 负责。

`mountGui()` 还接受 `resolution`、`scaledResolution` 或 `uiScale`，用于运行时求值 `if_resolution` / `if_scaled_resolution`。默认会应用根节点的 position/orientation/origo；如果外层 Web 容器已经负责窗口定位，adapter 应传 `applyRootPosition: false`。编译结果的 `diagnostics` 会列出未解析/重复变量和缺失纹理，接入新页面时应检查这些诊断，而不能只检查 `unresolvedSprites`。

#### 动态内容和占位

`.gui` 通常没有显式的 binding 声明。诸如 `planet_name`、`close`、`components` 等 `name` 是游戏引擎与 C++/脚本逻辑之间的隐式约定，编译器只能保留这些名字，不能仅从文件判断它们应绑定哪个存档字段。

能力边界如下：

| 可以自动编译 | 需要页面 adapter 或其它 Web 实现 |
|---|---|
| 文件内能够确定的布局、层级、静态文字、贴图、帧、九宫格、`frameAnimatedSpriteType` 和控件外观 | `name` 对应哪个业务字段，以及文字、可见性、启用状态和选中状态的实时更新 |
| 输入框、进度条、列表等控件的静态 DOM 和样式 | 输入值的初始化/持久化，进度值及上下限，列表数据与模板选择 |
| `.gfx` 中可由图片和声明参数确定的裁剪、缩放、遮罩与逐帧表现，以及可本地化的静态 `pdx_tooltip` | `effectButtonType` 的游戏 effect、按钮 hardcoded action、动态 tooltip 内容及快捷键行为 |
| 找得到静态纹理的 GFX 资源 | 游戏 shader、3D/角色 `render target`、由引擎生成或合成的画面 |

#### Outliner 数据边界

`overview-panel-generated.js` 组合 `tabs_outliner_window`、`outliner_tab_window` 和 `outliner_controller_window`；`overview-panel-binding.js` 按“根列表 → 分类标题 → 星域成员行 → 该星域殖民地”实例化星域层级，并同样绑定军用舰队、民用舰船和空间站。`PlayerInfo` 保留扁平 `planets` 以兼容旧调用，同时导出 `sectors[].planets` 和 `unassigned_planets`。当前仍只提供名称、数量、战斗力、行星类型和人口等摘要字段，因此以下信息不能从 `.gui/.gfx` 自动恢复，相关节点会被 adapter 隐藏：

- 舰队/空间站所在星系、状态、领袖、任务和建造进度；
- 舰队实际舰种与船体尺寸（当前军用舰队使用通用护卫舰帧）；
- 行星区划类型、占领/封锁/入侵状态、建造队列和真实星区层级；
- 船坞和巨构建筑深层模板中的游戏变量表达式。`outliner.gui` 对这些模板仍有 6 个未解析变量和 4 个缺失纹理诊断，基础四类成员模板不受影响。

“帝国概况”并非游戏原生 outliner 分类，当前复用民用舰船成员模板展示存档已有的军事力量、帝国规模和人口指标。

换言之，编译成功只表示控件的静态结构可以生成，并不表示它已绑定游戏状态。`mountGui()` 返回的 `find` / `findAll` 用于给节点赋值和绑定事件，`instantiate` 用于按业务数据创建列表项；这些都是页面 adapter 的显式接入点，不会猜测数据来源。无法自动推导的能力应留空、显示占位或由 adapter 实现，不应在通用编译器中按控件名硬编码业务规则。

当前会解析并保留、但不会由通用 runtime 执行的声明包括：`effectButtonType.effect`、hardcoded button action、shortcut/sound/web_link、动态 visible/enabled/selected、`click_to_front`、通用窗口 show/hide 动画、`dynamic_extra_*`、checkbox 业务选中态、grid `resizeparent`、游戏 `effectFile`/shader、普通 sprite 的 `animation = { ... }` shader layer，以及 portrait/flag/pie chart 的引擎 render target 或运行时合成。`moveable` 也由外层窗口 adapter 负责，以避免与已有拖拽系统重复。parser 对未闭合字符串或花括号仍采用宽松的部分 AST 行为；导入不可信或手写文件时，应先做额外语法校验。

`ship-window-generated.js` 已绑定 `get_ship_detail()` 当前提供的名称、设计/舰种、最大船体/装甲/护盾、速度以及核心/武器/通用组件，并按槽位选择 `GFX_ship_designer_slot` 帧。当前 `ShipDetail` 尚不提供闪避、伤害、等级、隐身、成长进度或可用于还原 3D render target 的数据，因此这些位置显示未知、隐藏或保留静态模型底图；adapter 不再填充演示值。改名按钮也因查看器只读而禁用。

`fleet-window-generated.js` 已绑定 `get_fleet_detail()` 的舰队名、类型、舰数、姿态、移动状态、舰队战斗力、平均船体/装甲/护盾、司令资料和单舰列表。单舰状态使用 `.gfx` 声明的纵向进度条，最多显示八行后滚动。当前 `FleetDetail` 不提供帝国旗帜、可靠的 62 帧舰队类别语义、真实舰容上限、隐身、单舰战斗力、命令按钮状态或可直接解析的领袖肖像资源，因此对应分支隐藏或使用明确占位；船厂 entry 仍因原文件中的跨模板局部变量引用而不接入。

因此静态接入时遵循以下约定：

- 未接入的数据保持 `.gui` 默认文字、空列表或运行时占位样式。
- 列表和网格不会自动生成条目；需要时用 `view.instantiate()` 填入少量占位模板以验证布局。
- 同一 `.gui` 可能同时声明多个互斥窗口或标签页状态。适配文件负责隐藏当前静态场景不使用的分支；`planet-window-generated.js` 中已有示例。
- 点击、悬浮、数据刷新等行为在适配文件中按 GUI `name` 手动绑定。

#### 图片和尺寸推导

编译器把 `.gfx` 中的 `GFX_xxx` 解析到对应图片，并将 `.dds` 路径映射到 `web/assets/gfx/` 下转换后的 `.png`。无显式 `size` 时使用以下规则：

- 节点有显式 `size`：直接使用节点尺寸。
- `background` 没有尺寸、但所属节点有显式尺寸：背景使用父节点的完整宽高。
- 普通 `spriteType` 的背景和父节点都没有尺寸：背景使用 PNG 的原始尺寸；有 `noOfFrames` 时，宽度按单帧宽度计算。
- 父容器没有显式尺寸时仍保持 `0 x 0` 定位锚点，不会被背景图片反向撑开。例如 `planet_top_bar` 容器为 `0 x 0`，其 `GFX_planet_title_banner` 背景按图片原始尺寸渲染。
- `corneredTileSpriteType.borderSize` 是九宫格边缘切片尺寸，不是控件宽高。九宫格背景应覆盖父节点尺寸，例如 `planet_view_bg` 的 `GFX_tile_large_bg_plain` 会覆盖 `850 x 613`，而不是采用 `borderSize * 2`。
- 找不到纹理的 `portraitType`、`pieChartType` 等资源会显示占位，不阻断其余布局生成。

#### 新类型与验证

遇到尚未支持的 GUI 节点类型时，将它加入 `web/gui-compiler.js` 的 `GUI_NODE_TYPES`，并在 `web/gui-runtime.js` 的 `TYPE_CLASSES` 或节点渲染逻辑中补充表现。新增 GFX 资源类型则加入编译器的 `RESOURCE_TYPES`。

在 `web/` 下运行：

```bash
npm test
npm run build
npm run dev
```

其中 `npm test` 会执行 GUI/GFX 编译测试；`npm run build` 同时验证虚拟模块可以被 Vite 正确打包。开发服务器启动后，可打开 `/ship-view-preview.html` 和 `/planet-view-preview.html` 对照检查静态布局。

### 静态资源与缓存

`web/assets/gfx/` 在生产构建时复制到 `dist/gfx/`。JS、CSS、WASM 和本地化数据由 Vite 生成带内容哈希的资源 URL，不再需要手工维护 `?v=N` 缓存版本号。

舰船组件图标不使用前端硬编码文件名。Vite 构建时扫描 `web/assets/common/component_templates/`，取得组件 `key → GFX icon`，再扫描 `web/assets/interface/*.gfx` 解析 `GFX name → texturefile`，生成前端可直接查询的组件图标映射。`common/` 和 `interface/` 仅作为构建输入，不复制到 `dist/`。

游戏本地化文件放在 `web/assets/localisation/`。当前构建会读取其中的 `simp_chinese/*.yml`，合并成一个可缓存的中文 JSON；原始本地化目录和其他语言不会复制到 `dist/`。名称中的 `$NAME$`、`$PREFIX$` 等变量会根据存档里的 `variables` 递归展开，例如 `PREFIX_NAME_FORMAT` 可以解析为 `UNS探险家`。

## 解析规模

示例存档（~26MB 文本）解析结果：

| 类别 | 数量 |
|------|------|
| 恒星系 | 597 |
| 超空间航道 | 853 |
| 国家 | 59 |
| 舰船 | 3,284 |
| 舰队 | 982 |
| 舰船设计 | 1,908 |
| 领袖 | 471 |
| 区划 | 192 |

WASM 体积：~326KB（opt-level="s" + LTO）。
