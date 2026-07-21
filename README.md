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
│   ├── fleet-window.js      # 舰队详情弹窗
│   ├── ship-window.js       # 舰船详情弹窗
│   ├── planet-window.js     # 行星详情全屏窗口
│   ├── ui-components.js     # 资源栏、概览面板、状态栏
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
