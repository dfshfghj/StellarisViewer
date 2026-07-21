# Stellaris 组件ID到贴图/模型的映射机制

以 `SMALL_MASS_DRIVER_2`（小型线圈炮）为例，追踪存档中的组件key如何最终对应到游戏内的图标贴图和3D炮塔模型。

## 一、图标贴图映射链（UI图标）

完整链路共三层：

### 第1层：component_templates → icon名称

文件：`common/component_templates/00_weapons_projectile.txt`

```
weapon_component_template = {
    key = "SMALL_MASS_DRIVER_2"       # 存档中记录的组件key
    size = small
    icon = "GFX_ship_part_mass_driver_2"   # 指向一个GFX sprite名称
    icon_frame = 1
    component_set = "MASS_DRIVER_2"
    projectile_gfx = "coilgun_s"
    tags = { weapon_type_kinetic s_slot }
    ...
}
```

`key` 是存档中出现的字符串。`icon` 是一个GFX资源引用名，不是文件路径。

### 第2层：interface/icons.gfx → 贴图文件路径

文件：`interface/icons.gfx`

```
spriteType = {
    name = "GFX_ship_part_mass_driver_2"
    texturefile = "gfx/interface/icons/ship_parts/ship_part_mass_driver_2.dds"
}
```

这里将GFX名称映射到实际的DDS贴图文件。

### 第3层：实际贴图文件

路径：`gfx/interface/icons/ship_parts/ship_part_mass_driver_2.dds`

命名规律：GFX名称去掉 `GFX_` 前缀，加上 `.dds` 后缀，即为文件名。即 `GFX_ship_part_mass_driver_2` → `ship_part_mass_driver_2.dds`。

### icon_frame 的含义

`icon_frame = 1` 是UI框架中sprite的帧索引。对于单帧贴图（如武器图标），固定为1。多帧sprite（如 `noOfFrames = 2` 的贴图）用此字段选择显示哪一帧。

### component_set 的作用

文件：`common/component_sets/00_weapons_projectile.txt`

```
component_set = {
    key = "MASS_DRIVER_2"
    icon = "GFX_ship_part_mass_driver_2"
    icon_frame = 1
}
```

component_set 将同一武器族的不同尺寸（S/M/L）归为一组，在舰船设计器的组件列表中显示为一个条目。图标与component_template中的一致。

## 二、3D炮塔模型映射链

### 第1层：component_slot_templates → 按武器类型选entity

文件：`common/component_slot_templates/00_component_slots_turrets.txt`

```
small_turret = {
    size = small
    component = weapon
    entities = {
        weapon_type_kinetic = "small_kinetic_gun_entity"
        weapon_type_energy = "small_laser_gun_entity"
        weapon_type_explosive = "turret_missile_small_entity"
    }
}
```

section_templates 中每个武器槽引用一个 slot template（如 `template = "small_turret"`）。slot template 根据组件的 `tags` 中的武器类型（`weapon_type_kinetic`）选择对应的entity名称。

### 第2层：graphical_culture前缀 + entity定义

游戏运行时根据国家的 graphical_culture（如 `mammalian_01`）拼接前缀：

实际entity名 = `{graphical_culture}_{entity名}` → `mammalian_01_small_kinetic_gun_entity`

文件：`gfx/models/ships/mammalian_01/_mammalian_01_ships_entities.asset`

```
entity = {
    name = "mammalian_01_small_kinetic_gun_entity"
    pdxmesh = "mammalian_01_turret_projectile_small_mesh"
    state = { name = "idle" }
    state = { name = "attack" looping = no next_state = "idle" }
    scale = 1.0
}
```

### 第3层：mesh定义 → 3D模型文件

文件：`gfx/models/ships/mammalian_01/_mammalian_01_ships_meshes.gfx`

```
pdxmesh = {
    name = "mammalian_01_turret_projectile_small_mesh"
    file = "gfx/models/ships/mammalian_01/mammalian_01_turret_projectile_small.mesh"
    scale = 1.0
    meshsettings = {
        shader = "PdxMeshShip"
    }
}
```

最终指向 `.mesh` 二进制3D模型文件。

### 第4层：graphical_culture 的确定

文件：`common/graphical_culture/00_graphical_culture.txt`

```
humanoid_01 = {
    fallback = mammalian_01
    ship_color = yes
    ...
}
```

每个species_class在 `common/species_classes/` 中声明 `graphical_culture = xxx`，决定使用哪套船模。若当前culture缺少某资源，按 `fallback` 链回退。

## 三、弹道/射击特效映射链

### component_template → projectile_gfx

```
projectile_gfx = "coilgun_s"    # 在component_template中声明
```

### gfx/projectiles/ballistics.txt → 弹道entity

```
projectile_gfx_ballistic = {
    name = "coilgun_s"
    hit_entity = "coilgun_small_hit_entity"
    shield_hit_entity = "coilgun_small_shield_hit_entity"
    muzzle_flash_entity = "coilgun_small_muzzle_entity"
    entity = "coilgun_tracer_round_small_entity"
    speed = 450.0
    max_duration = 1.0
}
```

这些entity同样按graphical_culture前缀在 `gfx/models/ships/{culture}/` 下的 `.asset` 文件中定义。

## 四、银河地图恒星系图标

### 映射机制

文件：`common/star_classes/00_star_classes.txt`

```
sc_g = {
    class = g_star              # 决定银河地图图标和光照
    planet = { key = pc_g_star }  # 决定恒星3D模型和行星视图图标
    spawn_odds = 30
    num_planets = { min = 4 max = 10 }
}

sc_black_hole = {
    class = black_hole
    icon_scale = 2.0            # 银河地图上图标缩放
    planet = { key = pc_black_hole }
}

sc_binary_1 = {
    class = a_star
    icon = e_binary_star        # 覆盖默认图标（双星系统）
    planet = { ... }
}
```

银河地图恒星图标的加载是引擎约定式的：

- 默认：`class` 字段值 → `gfx/map/star_classes/{class}.dds`
- 覆盖：若有 `icon` 字段 → `gfx/map/star_classes/{icon}.dds`
- `icon_scale` 控制图标在银河地图上的显示大小

实际文件示例：`gfx/map/star_classes/g_star.dds`、`gfx/map/star_classes/black_hole.dds`、`gfx/map/star_classes/e_binary_star.dds`

### 行星视图中的恒星/行星图标

文件：`common/planet_classes/00_planet_classes.txt`

```
pc_g_star = {
    entity = "g_star_class_star_entity"     # 星系内3D模型
    picture = "pc_g_star"                    # 行星图片
    icon = GFX_planet_type_f_g_star          # 小图标（survey、殖民等UI）
    icon_large = GFX_planet_type_f_g_star_big
}
```

这些GFX名称定义在 `interface/planet.gfx` 中，引用sprite sheet：

```
spriteType = {
    name = "GFX_planet_type"
    texturefile = "gfx/interface/icons/planet_type_icons.dds"
    noOfFrames = 36
}

spriteType = {
    name = "GFX_planet_type_f_g_star"
    sprite_sheet_sprite_type = "GFX_planet_type"
    default_frame = 27
}
```

## 五、银河地图舰队/船只图标

### 舰队类型图标（缩略视图）

文件：`interface/mapicons.gfx`

```
spriteType = {
    name = "GFX_fleet_type_icons"
    texturefile = "gfx/interface/icons/fleet_type_icons.dds"
    noOfFrames = 5
}
```

5帧对应5种舰队大类：军事、科研、工程、殖民、运输。帧索引由舰船的 `class` 字段（`shipclass_military`、`shipclass_science_ship`、`shipclass_constructor`、`shipclass_colonizer`、`shipclass_transport`）决定，引擎硬编码映射。

### 舰队组成图标（详细视图）

```
spriteType = {
    name = "GFX_fleet_presence_icons"
    texturefile = "gfx/interface/icons/ship_icons_type.dds"
    noOfFrames = 16
}
```

16帧sprite sheet，每帧代表一种船型轮廓。帧索引由 `ship_class_icon_frame` 字段或引擎根据ship class自动分配。

变体：
- `GFX_fleet_presence_mixed_icons` → `ship_icons_mixed_type.dds`（混合舰队）
- `GFX_fleet_presence_cloaked_icons` → `ship_icons_cloaked_type.dds`（隐身状态）
- `GFX_fleet_presence_kaiju_icons` → `ship_icons_type_kaiju.dds`（太空生物）

### 覆盖图标（overlay）

```
spriteType = {
    name = "GFX_fleet_presence_overlay_icons"
    texturefile = "gfx/interface/icons/ship_overlay_icons.dds"
    noOfFrames = 128
}
```

128帧，用于在舰队图标上叠加显示特殊状态（如巨像、主宰、太空生物等）。`ship_class_icon_frame` 字段索引此sheet。

### 船型图标（舰船设计器/舰队管理）

文件：`common/ship_sizes/00_ship_sizes.txt`

```
corvette = {
    icon = ship_size_military_1     # 生成 GFX_ship_size_military_1
    class = shipclass_military
}
science = {
    icon = ship_size_science        # 生成 GFX_ship_size_science
    class = shipclass_science_ship
}
constructor = {
    icon = ship_size_constructor    # 生成 GFX_ship_size_constructor
    class = shipclass_constructor
}
```

`icon` 字段自动生成4个GFX引用：`GFX_<key>`、`GFX_text_<key>`、`GFX_<key>_top`、`GFX_<key>_top_damaged`。

这些GFX定义在 `interface/icons.gfx` 中，引用sprite sheet：

```
spriteType = {
    name = "GFX_ship_sizes"
    textureFile = "gfx/interface/icons/ship_parts/ship_sizes.dds"
    noOfFrames = 27
}

spriteType = {
    name = "GFX_ship_size_science"
    sprite_sheet_sprite_type = "GFX_ship_sizes"
    default_frame = 8
}
```

帧映射表（GFX_ship_sizes sprite sheet）：

| 帧 | 名称 | 对应船型 |
|----|------|----------|
| 1 | military_station | 军事空间站 |
| 2 | military_1 | 护卫舰 |
| 3 | military_2 | 驱逐舰 |
| 4 | military_4 | 巡洋舰 |
| 5 | military_8 | 战列舰 |
| 6 | military_16 | 泰坦 |
| 7 | military_32 | 巨像 |
| 8 | science | 科研船 |
| 9 | constructor | 工程船 |
| 10 | colonizer | 殖民船 |
| 11 | transport | 运输船 |
| 12 | space_monster | 太空生物 |
| 13 | military_64 | 主宰 |
| 14 | military_1_torpedo | 护卫舰(鱼雷) |

### map_icon_override

特殊船型可完全覆盖地图图标sprite sheet：

```
map_icon_override = {
    normal = GFX_fleet_presence_kaiju_icons
    mixed = GFX_fleet_presence_kaiju_icons_mixed
    cloaked = GFX_fleet_presence_kaiju_icons_cloaked
}
```

### 星基地图标

```
spriteType = {
    name = "GFX_starbase_ship_size_small"
    textureFile = "gfx/interface/icons/starbase_ship_sizes.dds"
    noOfFrames = 5
}
```

`icon_frame` 字段（2-5）决定星基地在银河地图上显示哪一帧图标。

## 六、查找未知图标位置的通用方法

当需要定位某个游戏内图标对应的DDS文件时，按以下步骤操作：

### 步骤1：确定引用类型

观察图标的上下文，判断它属于哪类引用：

- 若来自 `common/` 配置中的 `icon = "GFX_xxx"` 字段 → 标准GFX引用
- 若来自 `common/` 配置中的 `icon = xxx`（无GFX_前缀）→ 可能是约定式加载或自动生成
- 若来自 `common/star_classes` 的 `class` 字段 → 引擎约定式加载
- 若来自 `common/ship_sizes` 的 `icon` 字段 → 自动生成GFX名

### 步骤2：搜索GFX定义

在 `interface/` 目录下搜索GFX名称：

```
grep -r "GFX_xxx" interface/*.gfx
```

关键GFX定义文件：
- `interface/icons.gfx` — 组件图标、船型图标（最大的图标定义文件）
- `interface/mapicons.gfx` — 银河地图上的所有图标
- `interface/planet.gfx` — 行星类型图标
- `interface/texticons.gfx` — 文本内嵌小图标
- `interface/ship_designer.gfx` — 舰船设计器专用图标
- `gfx/models/ships/{culture}/*_meshes.gfx` — 3D模型mesh定义

### 步骤3：解析sprite sheet引用

GFX定义有两种形式：

直接引用（单文件）：
```
spriteType = {
    name = "GFX_xxx"
    texturefile = "gfx/path/to/file.dds"
}
```

Sprite sheet引用（多帧）：
```
spriteType = {
    name = "GFX_xxx"
    sprite_sheet_sprite_type = "GFX_sheet_name"   # 指向sheet定义
    default_frame = N                               # 帧索引
}
```

对于sprite sheet，需再找到sheet定义获取实际文件：
```
spriteType = {
    name = "GFX_sheet_name"
    textureFile = "gfx/path/to/sheet.dds"
    noOfFrames = M
}
```

### 步骤4：处理约定式加载（无GFX定义）

某些图标由引擎按命名约定直接加载，无GFX定义文件：

- 银河地图恒星图标：`gfx/map/star_classes/{class字段值}.dds`
- 舰船3D模型entity：`{graphical_culture}_{entity名}` 在 `gfx/models/ships/{culture}/` 下

验证方法：直接检查对应路径是否存在DDS/mesh文件。

### 步骤5：处理自动生成的GFX名

`common/ship_sizes` 中的 `icon = ship_size_xxx` 会自动生成：
- `GFX_ship_size_xxx` → 在 `interface/icons.gfx` 中查找
- `GFX_text_ship_size_xxx` → 在 `interface/texticons.gfx` 中查找
- `GFX_ship_size_xxx_top` / `GFX_ship_size_xxx_top_damaged`

### 快速定位技巧

1. 从DDS文件名反查：若已知DDS文件名（如 `ship_part_mass_driver_2.dds`），在 `interface/*.gfx` 中搜索该文件名即可找到GFX名
2. 从GFX名反查配置：在 `common/` 中搜索GFX名（去掉`GFX_`前缀），找到引用它的配置字段
3. 目录规律：
   - 组件图标 → `gfx/interface/icons/ship_parts/`
   - 行星类型图标 → `gfx/interface/icons/planet_type_icons.dds`（sprite sheet）
   - 地图图标 → `gfx/interface/icons/` 或 `gfx/interface/system/`
   - 银河地图恒星 → `gfx/map/star_classes/`
   - 3D模型 → `gfx/models/ships/{culture}/`
   - 弹道特效 → `gfx/projectiles/`

## 七、UI界面贴图（弹窗、按钮、面板）

游戏UI贴图与组件图标使用相同的GFX sprite系统，但定义分散在各个视图对应的 `.gfx` 文件中，由 `.gui` 布局文件按名称引用。

### 架构：GFX定义 + GUI布局

- `.gfx` 文件：定义sprite名称→DDS文件路径的映射（资源注册）
- `.gui` 文件：定义UI布局，通过sprite名称引用贴图（布局使用）

示例（事件弹窗）：

`interface/eventwindow.gui`（布局）：
```
containerWindowType = {
    name = "EventWindow"
    background = {
        name = "background"
        quadTextureSprite = "GFX_tile_outliner_bg"    # 引用背景sprite
    }
    iconType = {
        name = "hex_bg"
        spriteType = "GFX_hex_bg"                   # 引用标题背景
    }
    buttonType = {
        name = "close"
        quadTextureSprite = "GFX_close"             # 引用关闭按钮
    }
}
```

`interface/outliner.gfx`（资源定义）：
```
corneredTileSpriteType = {
    name = "GFX_tile_outliner_bg"
    textureFile = "gfx/interface/tiles/outliner_tile.dds"
    borderSize = { x=80 y=30 }
    effectFile = "gfx/FX/buttonstate_onlydisable.shader"
}
```

`interface/planet_view.gfx`：
```
spriteType = {
    name = "GFX_close"
    texturefile = "gfx/interface/buttons/close_button.dds"
    effectFile = "gfx/FX/buttonstate_onlydisable.shader"
    noOfFrames = 3      # 3帧：normal / hover / pressed
}
```

### Sprite类型分类

| 类型 | 用途 | 特征 |
|------|------|------|
| `spriteType` | 固定尺寸图标/按钮 | 可选noOfFrames多帧、animation动画 |
| `corneredTileSpriteType` | 可拉伸面板/背景 | 9-slice切片，borderSize定义边距 |
| `frameAnimatedSpriteType` | 帧动画 | animation_rate_fps控制播放速度 |
| `progressbartype` | 进度条 | textureFile1(满)+textureFile2(空) |
| `flagSpriteType` | 帝国旗帜 | masking_texture+flag shader |

### 按钮动画系统

按钮贴图通常有3帧（normal/hover/pressed），并可叠加流光动画：

```
spriteType = {
    name = "GFX_event_button_452"
    texturefile = "gfx/interface/buttons/button_452_animated.dds"
    effectFile = "gfx/FX/buttonstate_onlydisable.shader"
    noOfFrames = 3
    animation = {
        animationmaskfile = "gfx/interface/buttons/button_452_animated_mask.dds"
        animationtexturefile = "gfx/interface/buttons/button_452_animated_texture.dds"
        animationblendmode = "overlay"
        animationtype = "scrolling"
    }
}
```

动画由mask（控制区域）+ texture（流光纹理）+ blend mode合成。

### 9-slice面板（corneredTileSpriteType）

弹窗背景、面板等可拉伸元素使用9-slice切片：

```
corneredTileSpriteType = {
    name = "GFX_tile_large_bg"
    textureFile = "gfx/interface/tiles/tile_large_bg.dds"
    borderSize = { x=330 y=296 }    # 四角不拉伸区域
    effectFile = "gfx/FX/buttonstate_onlydisable.shader"
}
```

`borderSize` 定义四角的固定区域，中间部分随窗口大小拉伸平铺。

### UI贴图目录结构

| 目录 | 内容 |
|------|------|
| `gfx/interface/tiles/` | 可平铺面板/背景纹理（9-slice用） |
| `gfx/interface/buttons/` | 按钮贴图（含动画mask/texture） |
| `gfx/interface/main/` | 主界面（topbar、navbar、时间控制等） |
| `gfx/interface/event_window/` | 事件弹窗专用贴图 |
| `gfx/interface/non_tiling_backgrounds/` | 不可平铺的固定背景 |
| `gfx/interface/dividers/` | 分隔线 |
| `gfx/interface/sliders/` | 滚动条 |
| `gfx/interface/fleet_view/` | 舰队视图专用 |
| `gfx/interface/outliner/` | 侧边栏outliner |

### 主要GFX定义文件

| 文件 | 覆盖范围 |
|------|----------|
| `interface/core.gfx` | 基础UI元素（通用按钮、tooltip、滚动条、radio） |
| `interface/eventwindow.gfx` | 事件弹窗按钮和背景 |
| `interface/planet_view.gfx` | 行星视图（含GFX_close、GFX_hex_bg等通用元素） |
| `interface/outliner.gfx` | 侧边栏背景 |
| `interface/fleet_view.gfx` | 舰队视图 |
| `interface/diplomacy_view.gfx` | 外交界面 |
| 每个视图有对应 `.gfx` | 视图专用贴图 |

### 查找特定UI贴图的方法

1. 在 `.gui` 文件中找到元素的 `spriteType` 或 `quadTextureSprite` 值（如 `GFX_close`）
2. 在 `interface/*.gfx` 中搜索该名称，得到DDS路径
3. 注意：同一GFX名可能在多个 `.gfx` 文件中定义（后加载的覆盖先加载的），以最后出现的为准

## 八、关键文件索引

| 层级 | 文件位置 | 作用 |
|------|----------|------|
| 组件定义 | `common/component_templates/*.txt` | 定义key、icon引用、tags、projectile_gfx |
| 组件分组 | `common/component_sets/*.txt` | 将同族不同尺寸归组 |
| 船型定义 | `common/ship_sizes/*.txt` | 定义icon、class、ship_class_icon_frame |
| 恒星分类 | `common/star_classes/*.txt` | 定义class、icon、icon_scale |
| 行星分类 | `common/planet_classes/*.txt` | 定义entity、icon、picture |
| GFX→贴图 | `interface/icons.gfx` | GFX名称→DDS文件路径（组件+船型） |
| 地图图标GFX | `interface/mapicons.gfx` | 银河地图所有图标定义 |
| 行星图标GFX | `interface/planet.gfx` | 行星类型sprite sheet |
| 文本图标GFX | `interface/texticons.gfx` | 文本内嵌图标 |
| 核心UI GFX | `interface/core.gfx` | 基础按钮、tooltip、滚动条 |
| 视图GFX | `interface/{view_name}.gfx` | 各视图专用UI贴图 |
| GUI布局 | `interface/{view_name}.gui` | UI布局，引用sprite名称 |
| 槽位模板 | `common/component_slot_templates/*.txt` | 按武器类型tag选3D entity |
| 船段模板 | `common/section_templates/*.txt` | 定义每个槽位用哪个slot template |
| 图形文化 | `common/graphical_culture/*.txt` | 定义culture及fallback |
| Entity定义 | `gfx/models/ships/{culture}/*.asset` | entity→pdxmesh引用 |
| Mesh定义 | `gfx/models/ships/{culture}/*_meshes.gfx` | mesh名→.mesh文件路径 |
| 弹道特效 | `gfx/projectiles/*.txt` | projectile_gfx名→弹道entity |
| 组件图标 | `gfx/interface/icons/ship_parts/*.dds` | 实际DDS图标文件 |
| 船型sprite sheet | `gfx/interface/icons/ship_parts/ship_sizes.dds` | 27帧船型图标 |
| 地图恒星图标 | `gfx/map/star_classes/*.dds` | 银河地图恒星图标 |
| 行星类型sheet | `gfx/interface/icons/planet_type_icons.dds` | 36帧行星图标 |
| UI面板纹理 | `gfx/interface/tiles/*.dds` | 9-slice可拉伸面板 |
| 按钮贴图 | `gfx/interface/buttons/*.dds` | 按钮（含动画素材） |
| 主界面贴图 | `gfx/interface/main/*.dds` | topbar/navbar/时间控制 |

## 九、对存档查看器的意义

存档中只记录组件key（如 `SMALL_MASS_DRIVER_2`）。要在查看器中显示对应图标：

1. 解析 `common/component_templates/` 找到 `key` 对应的 `icon` 字段值
2. 解析 `interface/icons.gfx` 找到该GFX名称对应的 `texturefile` 路径
3. 加载对应的DDS文件

对于银河地图视图：
- 恒星图标：从存档的 `star_class` 字段（如 `sc_g`）→ 查 `common/star_classes` 得到 `class`（如 `g_star`）→ 加载 `gfx/map/star_classes/g_star.dds`
- 舰队图标：从存档的ship size → 查 `common/ship_sizes` 得到 `icon` 字段 → 查 `interface/icons.gfx` 得到sprite sheet帧

简化规律：对于大多数武器组件，图标文件名 = 组件key去掉尺寸前缀（`SMALL_`/`MEDIUM_`/`LARGE_`）后转小写。例如 `SMALL_MASS_DRIVER_2` → `ship_part_mass_driver_2.dds`。但这不是严格规则，存在例外（如考古武器、特殊组件），可靠做法仍是查表。
