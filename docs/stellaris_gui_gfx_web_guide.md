# Stellaris gui/gfx → Web 页面实现指南

本文档总结从 Clausewitz 引擎的 `.gui` / `.gfx` 文件还原 Web 页面（以 `web/ship-window-v2.js` 为参考实现）时的约定、换算规则与踩过的坑。后续实现 fleet_window、planet_view 等其它窗口时按此执行。

## 一、gui / gfx / 引擎代码 三者的分工

| 来源 | 提供什么 | 不提供什么 |
|---|---|---|
| `.gui` | 布局树：容器/元素类型、size、position、orientation/origo、sprite 引用、字体、静态文本、静态 frame | 运行时数值、动态帧选择、交互行为 |
| `.gfx` | sprite 注册：名称 → 贴图路径、`noOfFrames`、`borderSize`、按钮动画 mask | 贴图内容本身、帧的语义 |
| 引擎代码 | 运行时帧选择（如槽位图标按尺寸选帧）、`§颜色码§` 调色板、rendertarget（3D 模型）内容 | —— |
| `common/` 配置 | 槽位名 → 尺寸（`component_slot_templates`）、组件图标（`icon`/`icon_frame`） | 槽位尺寸 → 贴图帧号（**没有**，见第五节） |

结论：**gui/gfx 确定了静态 UI 的绝大部分，但"哪一帧、什么颜色、什么数值、如何交互"要靠引擎行为反推或 Web 侧自决**。实现前先按这张表判断每个元素属于哪一类。

## 二、定位约定（最核心，也最容易错）

### 2.1 orientation ≠ origo

Clausewitz 的定位模型是"双锚点"：

- `orientation`：**父容器**上的锚点（upper_left / upper_right / upper_center / center / lower_right …），缺省 = `upper_left`。
- `origo`：**元素自身**上的哪个点对齐到该锚点，缺省 = `upper_left`。**gui 里经常省略不写，必须按缺省值理解**。
- `position = { x y }`：从父锚点出发的偏移，x 恒定向右为正、y 恒定向下为正（与 orientation 方向无关）。

换算成 CSS（父容器 `position: relative`，元素 `position: absolute`）：

| gui 写法 | CSS | 实例（ship_view.gui） |
|---|---|---|
| 缺省（upper_left） | `left: x; top: y` | `name` 文本 @(19,5) → `left:19px; top:5px` |
| `orientation = upper_right`（origo 缺省 upper_left） | `right: -x - width; top: y` | close 按钮 `x=-40`、宽 38 → `right: 40-38 = 2px` |
| `orientation = upper_right` + `origo = upper_right` | `right: -x; top: y` | stats 面板 `x=-15` → `right: 15px` |
| `orientation = center`（origo 缺省） | `left: calc(50% + x); top: calc(50% + y)` | 核心部件 bg 64×64 @(-32,-32)，父 58×78 → `left:-3px; top:7px` |
| `orientation = upper_center` | 水平锚点 = 父中线 | 见 2.2 |

**同一个 `x=-N`，origo 不同结果完全不同**：close 按钮（无 origo）是"左边距右边 40px"，stats 面板（origo=upper_right）是"右边距右边 15px"。看到负坐标先找 origo，再用游戏内截图核对。

### 2.2 不写 size 的 containerWindowType = 0×0 锚点组

```
containerWindowType = {
    name = "buttons"
    position = { x = 0 y = 588 }      # 没有 size！
    buttonType = { name = "open_designer" position = { x = 48 y = 0 } orientation = UPPER_CENTER ... }
    buttonType = { name = "open_fleet_manager" position = { x = 338 y = 0 } orientation = UPPER_CENTER ... }
}
```

实测（游戏内核对）：无 size 容器按 0×0 处理，子元素的 `UPPER_CENTER` 锚点即该点本身，因此 `x=48/338` 直接等于 `left:48px / left:338px`。这只是个分组节点，不要给它父容器宽度。

### 2.3 CSS 侧补充约定

- 每个 gui 容器 = 一个 `position:absolute` 的 div；根容器 `position:relative` + 固定宽高（`@view_w`/`@view_h` 变量在 gui 文件头部，如 `@view_w = 650`）。
- **嵌套元素必须显式写 `position:absolute`**。如果只用 `.root > * { position:absolute }` 这类直接子代选择器，孙辈元素会漏掉（v1 实现就栽在这里）。
- gui 的 `clipping = yes` → `overflow: hidden`。
- `listBoxType` / `smoothListBoxType` 的动态实例按列表方向参与顺序布局；模板本身没有 `position` 时，不要在 adapter 中再按前一项高度手写 `top`，否则会在列表流偏移之外产生第二次位移。

### 2.4 文本与按钮的缺省对齐不同

- `instantTextBoxType` / `textBoxType` 未写 `format` 时按 `left` 处理。
- `buttonType` 及其它按钮控件未写 `format` 时，按钮文字按游戏实际行为居中；显式 `format` 仍优先。
- `orientation = UPPER_CENTER` 描述的是控件相对父容器的锚点，不是按钮内部文字对齐。

Wiki 属性表把 `format` 缺省值概括为 `left`，不能直接推广到按钮控件。`ship_view.gui` 的 `open_designer` 与 `open_fleet_manager` 均未写 `format`，但游戏内文字居中，因此 Web runtime 按控件类型选择缺省值。

## 三、九宫格（corneredTileSpriteType）

```
corneredTileSpriteType = {
    name = "GFX_tile_outliner_bg"
    textureFile = "gfx/interface/tiles/outliner_tile.dds"
    borderSize = { x=80 y=30 }        # x = 左右边框宽，y = 上下边框高
}
```

对应 CSS（`web/ship-window-v2.js` `.sv2-bg`）：

```css
.sv2-bg {
    position: absolute; inset: 0;
    box-sizing: border-box;
    border-style: solid;
    border-width: 30px 80px;                          /* 上下=y，左右=x */
    border-color: transparent;
    border-image: url('/gfx/interface/tiles/outliner_tile.png') 30 80 fill;  /* slice 同序 */
}
```

**坑（已踩）：`border: 30px 80px solid transparent;` 是非法 CSS** —— `border` 简写只接受单一宽度值，写两个宽度整条声明会被浏览器丢弃，九宫格直接失效。必须拆成 `border-style` / `border-width` / `border-color` 三条（等宽九宫格如 `borderSize={x=8 y=8}` 可以安全地写 `border: 8px solid transparent`）。

其它要点：

- `border-image-slice` 必须加 `fill`，否则中心区域透明。
- 元素尺寸用 gui 的 size；九宫格底图一般 `inset:0` 铺满父容器。
- 本项目实例：`outliner_tile.png` 30/80、`dark_area_cut_8.png` 8、`planet_view_glow_tile.png`（GFX_tiles_frame_light）12。

## 四、帧贴图（spriteType / quadTextureSprite + noOfFrames）

贴图是**水平**帧条，帧宽 = 总宽 / noOfFrames。CSS 通用写法：

```css
background: url('...png') <pos> 0 / <N*100>% 100% no-repeat;
/* 第 frame 帧（0 起）：pos = frame/(N-1)*100% */
```

- **按钮三态**（`noOfFrames = 3`，如 `GFX_close_square`、`GFX_standard_button_240_34_button`）：正常/悬停/按下 → `background-position: 0% / 50% / 100%`，用 `:hover` / `:active` 切换。
- **`.gui` 里的 `frame = N` 是 1-based**（如 ship_designer.gui 的 `pd_icon frame = 1` 指第 1 帧），CSS 帧索引是 0-based，换算时 ±1。

## 五、运行时帧选择：配置里没有，必须自维护（重要）

典型案例：`GFX_ship_designer_slot`（ship_designer.gfx 只声明 `noOfFrames = 16`），舰船窗口里每个组件槽的底图帧**由引擎代码按槽位尺寸在运行时选择**，`.gui`/`.gfx`/`common/` 里都找不到"尺寸→帧号"映射。全资产检索确认过，唯一接近的官方信息是：

1. `ship_designer.gui` 里**另一张贴图** `component_slot_icons.dds`（12 帧）的静态 frame 映射（pd=1、small=2、medium=3、large=4、torpedo=5、extra_large=6、titanic=7、planet_killer=8、engulf=9、aux=10、strike_craft=12，1-based）——可用来交叉验证尺寸语义，但帧号不适用于 slot 条图。
2. `common/component_slot_templates/*.txt` 的槽位尺寸定义：`small_turret{size=small}`、`invisible_missile_turret{size=torpedo}`、`invisible_titanic_fixed{size=titanic}`、`invisible_planet_killer_fixed{size=planet_killer}`、`large_strike_craft{size=large component=strike_craft}` 等。

因此帧映射表要自己写，流程：**逐帧读贴图认字母/颜色 → 游戏内截图核对 → 用 component_slot_templates 推导槽位名语义 → 注释里写明依据**。`ship_designer_slot.png` 已核定的 16 帧表（0-based）：

| 帧 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11–12 | 13–14 | 15 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 含义 | 通用S | 通用M | 通用L | P 点防 | 武器S | 武器M | 武器L | G 鱼雷 | X | T 泰坦 | W 歼星 | A 辅助 | H 机库 | 空 |
| 颜色 | 绿 | 绿 | 绿 | 红 | 米黄 | 米黄 | 橙 | 蓝 | 紫 | 棕 | 棕 | 绿 | 金 | — |

**武器的 S/M/L（帧 4–6）与通用组件的 S/M/L（帧 0–2）是不同图标，严禁混用**——按"武器区/通用区"分别查表。

存档槽位名 → 尺寸的推导规则（前缀匹配，来自 section_templates 实测）：

| 存档槽位名前缀 | 尺寸 | 帧 |
|---|---|---|
| `SMALL_GUN` / `MEDIUM_GUN` / `LARGE_GUN` | small / medium / large | 4 / 5 / 6 |
| `PD`、`POINT_DEFENCE`、`TERTIARY_GUN` | point_defence | 3 |
| `TORPEDO` | torpedo | 7 |
| `EXTRA_LARGE`、`PRIMARY_GUN` | extra_large | 8 |
| `TITANIC` | titanic | 9 |
| `PLANET_KILLER` | planet_killer | 10 |
| `STRIKE_CRAFT`、`HANGAR` | strike_craft | 13 |
| `SECONDARY_GUN` | medium | 5 |
| `SMALL_UTILITY` / `MEDIUM_UTILITY` / `LARGE_UTILITY` | 通用 s/m/l | 0 / 1 / 2 |
| `AUX_UTILITY` / `AUX` | aux | 11 |

注意：机库组件（H 槽）在存档里不在 `weapon={}` 块，而在 section 的 **`strike_craft={}`** 块里，parser 需按 `#[jomini(duplicated)]` 重复键解析（见 `parser/src/models.rs`）。

## 六、文字与字体

- gui 里的字体名（`cg_16b`、`malgun_goth_24`）→ 查 `fonts.gfx` 的 simp_chinese 覆盖段：`cg_16b → Chinese_normal 14px`、`malgun_goth_24 → Chinese_header 20px`。Web 侧用对应字号的无衬线字体近似。
- `fixedSize = yes` 固定的是文本控件的 `maxWidth` / `maxHeight` 布局范围，不等于把 `maxHeight` 当作 CSS `line-height`。例如 fleet 的 `fleet_name` 声明高 15、简中字体实际为 20px，游戏允许字形超出文本布局框；Web 若直接设置 `height:15px; overflow:hidden` 会裁字。
- `text_color_code = "E"` 等颜色码是**引擎内置调色板**，配置里没有定义，需对照游戏截图取色（E ≈ 浅蓝 `#a8d4e6`）。
- 文本键值在 `localisation/simp_chinese/*.yml`；渲染前要展开 `$VAR$` 变量引用与 `£icon£` 文本图标（图标映射到 `/gfx/interface/icons/...`）。本项目经 Vite 虚拟模块 `virtual:stellaris-localization` 提供。

## 七、贴图与组件图标

- `.dds` 浏览器不能解码，统一转 `.png`，保持 `gfx/` 相对路径不变（构建时由 copyImagesPlugin 拷贝 assets/gfx → dist/gfx）。
- 组件图标链：`common/component_templates` 的 `icon = "GFX_ship_part_xxx"` + `icon_frame` → `.gfx` 查 texturefile（dds→png）。本项目经 `virtual:stellaris-component-icons` 提供 template→png 映射。
- `rendertarget`（舰船 3D 模型预览）Web 无法还原，用占位底图（`ship_design_entry_bg.png`）+ 说明。

## 八、自动编译与页面 adapter 的边界

判断原则：只依赖 `.gui/.gfx` 声明、无需知道游戏状态的表现可以自动编译；需要解释控件 `name`、读取存档或执行引擎逻辑的行为必须由页面 adapter 提供。

| 能力 | 自动化范围 | 仍需 adapter / 引擎信息 |
|---|---|---|
| 普通节点、输入框、进度条、列表 | 生成布局、静态 DOM、默认文字和外观 | 输入初值与持久化、进度值/上限、列表数据和增删更新 |
| 可见性与交互 | 可表现声明中确定的静态状态、按钮帧和可本地化的静态 `pdx_tooltip` | 动态 visible/enabled/selected、点击 action、动态 tooltip 内容、快捷键 |
| `effectButtonType` | 保留节点、名称与静态按钮表现 | `effect` 的目标、条件和执行结果；这些是游戏 hardcoded/script 行为 |
| GFX effect、mask、animation | 自动处理静态 mask、双纹理进度裁剪和 `frameAnimatedSpriteType` sprite sheet | 游戏 shader 的真实渲染语义、普通 sprite 的 `animation = { ... }` layer、运行时材质参数 |
| `portraitType` 等 render target | 保留尺寸和占位位置 | 3D 舰船、角色肖像等引擎 render target 内容 |

`progressbarType.horizontal = no` 不只是把进度值改为竖向裁剪，还会交换贴图 UV 方向。原版 fleet 状态条使用 `40×10` 横向贴图，却声明为 `7×40` 输出；Web runtime 因而需要旋转满槽和空槽两层，再从下向上裁剪。`flipdirection = yes` 则反转增长方向。

`smoothListboxType.size` 也不是 CSS `overflow:auto` 边框盒的完全等价物。原版 fleet 的 500px list 合法承载 510px entry，且未启用 clipping；Web 接入时不能因此生成横向滚动条。当前 fleet adapter 将两级列表的 Web 可视宽度规范为 510px，保留原始纵向列表行为。

页面 adapter 使用 `mountGui()` 返回的 API 接入动态部分：用 `find` / `findAll` 按 GUI `name` 找节点并赋值、切换状态或绑定事件；用 `instantiate` 按业务数组创建列表/网格项；用 `setProgress` 设置进度值，用 `setDropdownExpanded` 控制下拉窗口，用 `setControlValue` 设置 spinner/scrollbar 的声明式数值。输入框会生成 `input` / `textarea`，但初值读取与持久化仍由 adapter 通过 `find(name).value` 处理。`.gui` 通常不声明 `planet_name` 应读取哪个存档字段，因此通用编译器不得按名字猜测绑定关系。

当前明确保留给 adapter、引擎占位或后续专用 renderer 的项目：

- `effectButtonType.effect`、hardcoded button action、shortcut、sound、web_link，以及动态 visible/enabled/selected 和 checkbox 业务状态。
- 通用窗口 show/hide animation、`click_to_front`、`dynamic_extra_*`；`moveable` 由外层 Web 窗口拖拽系统处理。
- 列表数据与模板选择、progress 业务值、输入持久化；scrollbar/spinner 只自动维护声明式范围、按钮和滑块位置，不推导它控制哪个业务集合。
- grid `resizeparent`、游戏 `effectFile`/shader、普通 sprite 的 `animation = { ... }` shader layer，以及 portrait/flag/pie chart 的 render target 或运行时合成。
- parser 对未闭合字符串/花括号仍是宽松解析并可能返回部分 AST；外部 GUI mod 在进入 compiler 前需要独立语法校验。

- **拖动**：gui 只有 `moveable = yes`。Web 侧需提供拖拽层并接入既有拖拽系统（本项目 `main.js` 的 `enablePopupDragging` 只认 `.popup-header`）：在标题区盖一个 650×65 的透明 `.popup-header`，z 序高于背景、不遮挡关闭按钮。
- **滚动数据**：`smoothListboxType` 可以提供尺寸和静态滚动外观，但条目来源及更新策略由 adapter 决定。本项目约定：**武器/通用各自分区内部滚动，窗口整体不滚动**。
- **按钮三态**：`:hover`/`:active` 对应帧 2/3（见第四节）；按钮触发什么操作仍需 adapter 绑定。

## 九、验证流程

1. **冒烟测试**：`vite ssrLoadModule` + 最小 DOM stub 跑 `renderShipWindow`，断言结构与关键 CSS（见 `smoke-v2.mjs`，35 项检查）。改映射表后先过这一关。
2. **dev server + 真实存档浏览器核对**：上传不同时期的 gamestate（槽位名随版本变化，如 `PD_01` vs `POINT_DEFENCE_01`、海盗船 `PRIMARY/SECONDARY/TERTIARY_GUN`），逐元素对照。
3. **游戏内截图为最终标准**：凡是吃不准的约定（负坐标、origo、帧语义），以游戏实际画面为准，核定后把结论写回本文档与代码注释。

## 十、踩坑清单（速查）

1. `border: 30px 80px solid transparent` 非法 → 拆成 style/width/color 三条。
2. 负坐标换算要看 origo：origo=upper_left 时 `right = |x| - width`（close：40−38=2px）；origo=upper_right 时 `right = |x|`（stats：15px）。
3. orientation 是父锚点、origo 是自身锚点，gui 常省略 origo（=upper_left）。
4. `.gui` 的 `frame=` 是 1-based；CSS 帧索引 0-based。
5. dds 必须转 png。
6. 运行时帧选择无配置可依 → 自维护映射表，注释写明依据（贴图认读 + 游戏核对 + component_slot_templates）。
7. 武器 S/M/L（帧 4–6）≠ 通用 S/M/L（帧 0–2），分区查表。
8. 无 size 的 containerWindowType 是 0×0 锚点组，别当布局容器。
9. 嵌套绝对定位元素要显式 `position:absolute`，直接子代选择器覆盖不到孙辈。
10. 机库组件在存档 `strike_craft={}` 块而非 `weapon={}`，漏解析会导致 H 槽整排消失。
11. shader 的 `ColorTexture`（galaxycolor/nebulacolor）是颜色查找表，直接当 quad 铺会露出暗背景的正方形边界；要当作"按位置采样的调色板"，用形状纹理的 alpha 裁出来。
12. PDX shader `SourceBlend=ONE/DestBlend=ONE`（纯加色）**忽略 alpha 通道**，淡出靠 RGB 趋黑；canvas `'lighter'` 会预乘源 alpha → 需先拍平 alpha=255 再画，否则双重压暗。

## 十一、行星视图（planet_view）专项映射

**区划已建/上限方块**（district_box_grid）：

- gui：`slotsize 22x10`、`max_slots_horizontal=10`、`max_slots_vertical=3`、`add_horizontal=yes` → 每行 10 块、最多 3 行 30 块；超过 30 改用数字框 `district_any_big.png`（47×28）。
- 方块贴图是**每类型独立**的条图：`icons/districts/grid_box/<type>_rectangle.png`（60×8 = 3 帧 20×8，用第 0 帧），CSS 块 20×8。
- 布局：城市类（`district_city`/arcology_housing/hab_housing/rw_city）单独上排宽卡（561px），其余资源类下排窄卡（279px）×3——对应 gui `main_districts_grid_box` 1×1 + `districts_grid_box` 3×1。
- 卡右上角"建造"按钮：`GFX_button_animated_75_24` = `buttons/button_75_24_animated.png`（297×48 = 3 帧 75×24），gui x=-93 orientation=UPPER_RIGHT → `right:18px`。

**总督**（governor_window @(0,70) 250×125）：

- widget `paragon_portrait_container_sector_governor`（185×142，paragon_ui_types.gui）：肖像区 145×142 + skill_icon @(65,124) centerPosition + name @(80,108) 黄色（text_color_code=Y ≈ #ffd866）+ title @(80,123) `SECTOR_GOVERNOR_TITLE`=星域总督。
- 肖像 `GFX_portrait_character_hologram` 是 3D rendertarget（core.gfx，type=character，无静态贴图）→ Web 用 `fleet_view/unknown_leader.png` 占位。
- `GFX_leader_skill` = `icons/leaders/leader_skill.png`（209×22 = 11 帧 19×22），**frame = 领袖等级**。

**行星修正图标链**（modifiers @(420,152)，overlappingElementsBox format=right 重叠右对齐）：

- 存档有两种来源：`planet_modifier="pm_X"`（永久，重复键）与 `timed_modifier={ items={ { modifier="Y" days=N } } }`（限时）。
- 图标解析两级跳转：`pm_X` 先查 `common/planet_modifiers/*.txt` 的 `modifier = "Y"`，再查 `common/static_modifiers/*.txt` 的 `Y.icon`（dds→png，相对 `icons/`）与 `icon_frame`；`timed_modifier` 的 key 直接查 static_modifiers。本项目把整表生成为 `web/modifier-icons.js`（key → { icon, frame, name }，name 为本地化键：pm_X 用其 static key，如 pm_carbon_world → carbon_world=碳化世界）。
- 边框 `GFX_modifier_frames` = `planet_modifiers/modifier_frames.png`（180×60 = 3 帧 60×60），**icon_frame 1-based：1=绿(正面)/2=黄/3=红(负面)**；无 icon 收录回退 `GFX_modifier_pm_unknown`（pm_unknown.png）+ frame 1。
- 图标/边框贴图均 60×60，Web 缩到 34×34，逐项 `margin-left:-10px` 重叠。

**jomini 匿名对象序列可反序列化（修正此前结论）**：`items={ { modifier="X" days=306 } }` 这类"块内匿名对象列表"jomini 0.35 能直接解析为 `Vec<Struct>`（见 `parser/tests/timed_modifier.rs`）。此前 hyperlane 的问题另有所因；遇到同形态先写单测验证，不必直接上文本扫描。

## 十二、银河地图背景贴图（gfx/map/）

`gfx/map/` 下贴图**全部由引擎按固定路径加载**，游戏脚本中零引用（唯一例外：`sky_*.dds` 经 `gfx/worldgfx/*.txt` 的 `galaxy_background` 引用）。Web 接入依据是消费它们的 shader：

**关键认知：只有 center 是真正"画一整块"的贴图，galaxycolor/nebulacolor 是颜色查找表，绝不能直接当 quad 绘制**（其暗色背景会以正方形边界暴露）。尘埃/星云的真实管线是：引擎沿生成的旋臂散布大量软边四边形实例，每个 quad 用形状纹理的 **alpha 通道**做形状，按混合模式 `SRC_ALPHA / INV_SRC_ALPHA`（= canvas `source-over`）alpha 混合，颜色来自 ColorTexture 采样。

- `center.dds`（1024×1024）→ `galaxy_center.shader` `CenterTexture`（Effect `GalaxyCenter`）：银河中心对齐屏幕的四边形，**加色混合（ONE/ONE）且亮度 ×0.5**。**坑：ONE/ONE 混合忽略 alpha 通道，淡出全靠 RGB 趋黑**，而 canvas `'lighter'` 会预乘源 alpha——若直接画（alpha 是径向渐变、均值仅 38）会双重压暗。Web：`buildCenterFlat()` 先把 alpha 拍平为 255，再 `'lighter'` 加色；大小/强度是文件顶部命名常量 `CORE_GLOW_SPAN=0.6`（直径，×galaxyRadius）与 `CORE_GLOW_ALPHA=0.8`——引擎内 quad 尺寸（entity scale）不可考，按观感调。
- `galaxycolor.dds`（2048×2048，不透明）→ `galaxy_dust.shader` `ColorTexture`，按 **尘埃 quad 的世界坐标**采样（`vUVColor = (vPos.xz + DustCloudUV.xy) / DustCloudUV.zw`），即地图空间颜色查找。
- `dust.dds`（1024×1024）→ `DustTexture`：形状在 **alpha 通道**（0..121，均值≈24），RGB 只是灰色。
- `nebula.dds` / `nebulacolor.dds` → `galaxy_nebula.shader`：形状 alpha 更低（均值≈9.5），shader 里 `saturate(a × 6)` 增强；颜色按 **quad 自身 UV 拉伸**采样（非地图空间）。

**Web 实现**（`galaxy-map.js`，纹理 onload 后一次性构建离屏场，逐帧只 drawImage）：

- `buildDustField()`：存档不存旋臂参数，但恒星系就生成在旋臂上——以每个恒星系为种子散 3 个尘埃块（jitter 0.05R、尺寸 0.06–0.13R、alpha 0.5–0.9），再沿每条超空间航道补 1 块；用 LCG 保证确定性。**每块按像素着色器逐 quad 合成**（128² 临时画布）：①按 quad 世界范围从 galaxycolor 地图空间采样（srcRect 越界时裁剪≈Clamp 寻址）；②`'multiply'` 乘 dust.png 的 RGB——注意必须先把 dust 的 alpha 拍平（canvas multiply 会按源 alpha 插值），灰度均值≈0.45，**漏掉这步尘埃会亮约一倍（看着像过亮的星云）**；③`destination-in` 上 dust 真实 alpha；④带旋转 `source-over` 盖入场（旋转只转尘埃纹理，颜色采样保持地图空间——与 shader 一致：quad UV 旋转而 vUVColor 不转）。
- `buildNebulaField()`：先把 nebula.png 的 alpha ×6（getImageData 一次性处理），再对 7 个随机恒星系位置（globalAlpha 0.4 保持外围克制）：nebulacolor 拉伸到临时画布 → `destination-in` 形状 → 带旋转盖到 field 上（尺寸 0.15–0.35R）。
- 场覆盖范围 `GALAXY_TEX_HALF = 1.15`（×galaxyRadius 的半边长，1024² 分辨率），逐帧按 `worldToScreen(0,0)` ± half×zoom 绘制，星云层在尘埃层之下（游戏里 nebula y=-9 位于尘埃平面下方）。
- `galaxyRadius` = 所有恒星系距原点最大距离（构造时算一次）。
- 绘制次序：背景填充 → 程序化星点 → **星云场 → 尘埃场 → 核心辉光** → 领土 → 超空间航道 → 恒星 → 舰队。
- 调参入口：块数/alpha/尺寸在 `buildDustField` 内，`GALAXY_TEX_HALF` 与核心辉光跨度在 `drawGalaxyBackdrop`。同目录 `hexgrid.png`/`edge.png`/`trail.png` 已转换待用，接入方式同理（查对应 shader 的混合参数）。
