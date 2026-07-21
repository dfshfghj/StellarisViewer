# Stellaris interface 目录 GUI/GFX 文件索引

整理 `web/assets/interface/` 下的 `.gui`（布局）与 `.gfx`（sprite资源）文件，说明各自对应的组件或窗口。

约定：`.gui` 定义窗口布局与层级，`.gfx` 注册 sprite 名称→DDS路径。同名文件通常成对出现（如 `fleet_view.gui` + `fleet_view.gfx`）。每个 gui 文件可定义多个窗口，下表"主窗口"列为文件中最具代表性的顶层 `containerWindowType` 名称。

## 一、核心基础（全局复用）

| 文件 | 类型 | 对应组件/窗口 |
|------|------|--------------|
| `core.gfx` / `core.gui` | 两者 | 引擎级基础元素：光标、tooltip背景、通用按钮（GFX_button_light/dark）、滚动条、radio按钮、控制台编辑框 |
| `interface.gfx` / `interface.gui` | 两者 | 通用界面骨架：GFX_button、GFX_button_small 等基础按钮与容器 |
| `general_stuff.gfx` | gfx | 通用关闭按钮（含各enclave风格变体：artist/curator/trader/caravaneer/mercenary） |
| `fonts.gfx` | gfx | 字体注册（standard_font、large_title_font 等） |
| `keyicons.gfx` | gfx | 键盘按键图标（GFX_text_0~9 等文本内嵌键位图） |
| `texticons.gfx` | gfx | 文本内嵌小图标（船型、资源等在文字中显示的图标） |
| `animated_texts.gfx` | gfx | 地图浮动动画文字（伤害数字、能力提示、AnimatedMapText） |
| `gui_highlight.gfx` / `gui_highlight.gui` | 两者 | 高亮遮罩容器（教程/引导用） |
| `input_blocker.gui` | gui | 输入阻塞层（模态遮罩） |
| `popup.gui` | gui | 通用确认弹窗（ok_popup_window） |
| `standard_dialog.gfx` / `standard_dialog.gui` | 两者 | 标准对话框（standard_dialog） |
| `rename_dialog.gui` | gui | 重命名对话框 |
| `pop_confirmation_dialog.gui` | gui | POP迁移确认对话框 |
| `browser_dialog.gui` | gui | 内嵌浏览器对话框 |
| `gotobox.gfx` / `gotobox.gui` | 两者 | 跳转到星系输入框 |
| `common/buttons.gfx` | gfx | 通用按钮sprite集 |
| `common/dividers.gfx` | gfx | 分隔线sprite集 |
| `common/non_tiling_backgrounds.gfx` | gfx | 非平铺背景（hex背景等） |
| `common/selected_overlays.gfx` | gfx | 选中态覆盖层 |

## 二、主界面 / HUD

| 文件 | 类型 | 对应组件/窗口 |
|------|------|--------------|
| `main.gfx` / `main.gui` | 两者 | 游戏主HUD：顶栏、资源条、时间控制、暂停遮罩 |
| `main_bottom.gui` | gui | 底部栏（控制组、outliner入口） |
| `outliner.gfx` / `outliner.gui` | 两者 | 右侧边栏大纲（outliner_window：舰队/行星/空间站列表） |
| `alerts.gfx` / `alerts.gui` | 两者 | 顶栏警报图标（alerticon_window） |
| `mapicons.gfx` / `mapicons.gui` | 两者 | 银河地图上的所有图标（舰队、星系、贸易路线等）+ 地图图标布局 |
| `galaxy_view.gfx` / `galaxy_view.gui` | 两者 | 银河视图（帝国总览：殖民地/人口/意见） |
| `system_view.gfx` | gfx | 星系视图sprite（星系内按钮、焦点背景） |
| `solar_system.gfx` | gfx | 星系内船舶计数图标（GFX_ship_counter_1/2/4/8） |
| `bottombar_help_menu.gui` | gui | 底栏帮助菜单 |
| `startup_info_view.gui` | gui | 开局信息面板 |

## 三、前端 / 菜单 / 加载

| 文件 | 类型 | 对应组件/窗口 |
|------|------|--------------|
| `frontend.gfx` / `frontend.gui` | 两者 | 游戏启动前端主菜单（官网/论坛社交按钮） |
| `frontend_dlc.gui` | gui | 前端DLC展示 |
| `mainmenu_view.gfx` / `mainmenu_view.gui` | 两者 | 主菜单窗口（mainmenu_window） |
| `start_screen.gfx` / `start_screen.gui` | 两者 | 开始屏幕（start_screen_window） |
| `load_screen.gfx` / `load_screen.gui` | 两者 | 加载屏幕（进度条、游戏预览） |
| `load_screen_font.gfx` | gfx | 加载屏幕专用字体 |
| `credits.gui` | gui | 制作人员名单 |
| `endscreen.gui` | gui | 游戏结束画面（胜利/失败） |
| `victory_conditions.gfx` | gfx | 胜利条件图片 |

## 四、行星 / 区划 / 巨构

| 文件 | 类型 | 对应组件/窗口 |
|------|------|--------------|
| `planet.gfx` | gfx | 行星类型图标sprite sheet（planet_type_icons） |
| `planet_view.gfx` / `planet_view.gui` | 两者 | 行星视图主窗口（人口/岗位/建筑/区划） |
| `colonize_planet_view.gui` | gui | 殖民行星选择视图 |
| `sector_edit_view.gui` | gui | 星域编辑视图 |
| `sector_resources_transfer_view.gui` | gui | 星域资源转移视图 |
| `expansion_planner_view.gui` | gui | 扩张规划器 |
| `megastructure_view.gfx` / `megastructure_view.gui` | 两者 | 巨构建筑视图 |
| `megastructure_selection.gfx` / `megastructure_selection.gui` | 两者 | 巨构类型选择窗口 |
| `manual_resettlement_view.gfx` / `manual_resettlement_view.gui` | 两者 | 手动 resettlement 视图 |
| `destination_selection.gui` | gui | 超空间通道目的地选择 |
| `station_selection.gui` | gui | 空间站选择窗口 |
| `ambient_object_view.gui` | gui | 环境物体视图 |

## 五、舰船 / 舰队 / 战斗

| 文件 | 类型 | 对应组件/窗口 |
|------|------|--------------|
| `ship_designer.gfx` / `ship_designer.gui` | 两者 | 舰船设计器主窗口 |
| `ship_designer_role_selection.gui` | gui | 舰船角色选择 |
| `ship_browser.gfx` | gfx | 舰船浏览器sprite（3D视图、DLC覆盖） |
| `ship_design_view.gui` | gui | 舰船设计列表视图 |
| `ship_view.gui` | gui | 单舰视图（舰船详情） |
| `shipdesign_dialog.gui` | gui | 舰船设计对话框 |
| `fleet_view.gfx` / `fleet_view.gui` | 两者 | 舰队视图主窗口 |
| `fleet_manager_view.gui` | gui | 舰队管理器 |
| `fleet_action_view.gui` | gui | 舰队行动视图 |
| `combat_view.gfx` / `combat_view.gui` | 两者 | 战斗视图（combat_stats） |
| `combat_stats_view.gui` | gui | 战斗统计视图 |
| `combat_debug_view.gui` | gui | 战斗调试视图 |
| `starbase_view.gfx` / `starbase_view.gui` | 两者 | 星港视图 |
| `home_base_view.gui` | gui | 母港视图（舰队_home_base） |

## 六、帝国 / 政府 / 领袖

| 文件 | 类型 | 对应组件/窗口 |
|------|------|--------------|
| `empire_view.gfx` / `empire_view.gui` | 两者 | 帝国视图总窗口 |
| `government_view.gfx` / `government_view.gui` | 两者 | 政府视图 |
| `government_mod_window.gfx` / `government_mod_window.gui` | 两者 | 政府改革窗口 |
| `edicts_view.gui` | gui | 法令视图（edicts_and_policies_view） |
| `policies_view.gfx` / `policies_view.gui` | 两者 | 政策视图 |
| `council_view.gfx` / `council_view.gui` | 两者 | 理事会视图 |
| `council_agendas.gfx` | gfx | 理事会议程图标 |
| `ascension_perks.gfx` / `ascension_perks_view.gui` | 两者 | 飞升天赋视图 |
| `traditions.gfx` | gfx | 传统树图标 |
| `topbar_traditions_view.gui` | gui | 顶栏传统视图 |
| `topbar_factions_view.gui` | gui | 顶栏派系视图 |
| `topbar_leaders_view.gfx` / `topbar_leaders_view.gui` | 两者 | 顶栏领袖视图 |
| `topbar_species_view.gfx` / `topbar_species_view.gui` | 两者 | 顶栏物种视图 |
| `election_view.gfx` / `election_view.gui` | 两者 | 选举视图 |
| `democratic_election_view.gui` | gui | 民主选举视图 |
| `leader_view.gfx` / `leader_view.gui` | 两者 | 领袖详情视图 |
| `leader_pool_view.gui` | gui | 领袖招募池视图 |
| `leaders.gfx` | gfx | 领袖稀有度/特质相关sprite |
| `assign_leader_widget_view.gui` | gui | 领袖指派控件 |
| `select_leader_widget_view.gui` | gui | 领袖选择控件 |
| `assign_trait_view.gfx` / `assign_trait_view.gui` | 两者 | 特质分配视图 |
| `envoy_selection_view.gui` | gui | 使节选择对话框 |

## 七、外交 / 战争 / 联邦

| 文件 | 类型 | 对应组件/窗口 |
|------|------|--------------|
| `diplomacy_view.gfx` / `diplomacy_view.gui` | 两者 | 外交主视图 |
| `diplomacy_event_view.gui` | gui | 外交事件选项窗口 |
| `diplomacy_incoming_view.gui` | gui |  incoming 外交请求 |
| `diplomacy_voting_view.gfx` / `diplomacy_voting_view.gui` | 两者 | 外交投票视图 |
| `diplomacy_artist_event_view.gui` | gui | 艺术家enclave事件 |
| `diplomacy_curator_event_view.gui` | gui | 策展人enclave事件 |
| `diplomacy_trader_event_view.gui` | gui | 商人enclave事件 |
| `diplomacy_caravaneer_event_view.gui`(+`_edit`) | gui | 行商enclave事件 |
| `diplomacy_mercenary_event_view.gui` | gui | 佣兵enclave事件 |
| `diplomacy_salvager_event_view.gui` | gui | 拾荒者enclave事件 |
| `diplomacy_formless_event_view.gui` | gui | 无形态实体事件 |
| `diplo_stance.gfx` | gfx | 外交姿态图标（belligerent/cooperative等） |
| `diplomatic_favors_view.gui` | gui | 外交恩惠视图 |
| `alliance_view.gfx` / `alliance_view.gui` | 两者 | 联盟视图 |
| `federation_view.gfx` / `federation_view.gui` | 两者 | 联邦视图 |
| `federation_creation_view.gui` | gui | 联邦创建视图 |
| `federation_switch_type_view.gui` | gui | 联邦类型切换 |
| `galactic_community_view.gfx` / `galactic_community_view.gui` | 两者 | 银河共同体视图 |
| `waroverview.gfx` / `waroverview.gui` | 两者 | 战争总览 |
| `war_goals_view.gfx` / `war_goals_view.gui` | 两者 | 战争目标视图 |
| `claims_view.gui` | gui | 宣称视图 |
| `proxy_war_view.gui` | gui | 代理战争视图 |
| `first_contact_view.gfx` / `first_contact_view.gui` | 两者 | 第一次接触视图 |
| `agreement_negotiation_view.gfx` / `agreement_negotiation_view.gui` | 两者 | 协议谈判视图（附庸/研究协议等） |

## 八、事件 / 局势 / 异常

| 文件 | 类型 | 对应组件/窗口 |
|------|------|--------------|
| `eventwindow.gfx` / `eventwindow.gui` | 两者 | 事件弹窗主窗口（EventWindow） |
| `eventpictures.gfx` | gfx | 事件图片sprite（GFX_evt_*） |
| `origin_eventpictures.gfx` | gfx | 起源事件图片 |
| `wilderness_eventpictures.gfx` | gfx | 荒野事件图片 |
| `situation_log.gfx` / `situation_log.gui` | 两者 | 局势日志窗口 |
| `situation_log_timelines.gui` | gui | 局势日志时间线 |
| `timelines.gfx` | gfx | 时间线导航图标 |
| `anomaly_view.gfx` / `anomaly_view.gui` | 两者 | 异常现象视图 |
| `archaeology_view.gfx` / `archaeology_view.gui` | 两者 | 考古遗址视图 |
| `crisis.gfx` | gfx | 危机相关sprite |
| `crisis_conversation_event_window.gui` | gui | 危机对话事件窗口 |
| `the_shroud.gfx` / `the_shroud.gui` | 两者 | 虚境（Shroud）界面 |
| `leader_conversation_event_window.gui` | gui | 领袖对话事件窗口 |
| `leader_story_event_window.gui` | gui | 领袖故事事件窗口 |
| `leader_recruitment_event_window.gui` | gui | 领袖招募事件窗口 |
| `advisor_window.gfx` / `advisor_window.gui` | 两者 | 顾问语音窗口 |
| `focus_view.gfx` / `focus_view_items.gui` | 两者 | 焦点（Focus）系统视图 |
| `focus_completed.gui` / `focus_progression.gui` | gui | 焦点完成/进度窗口 |
| `cosmic_storm_visible_view.gfx` / `cosmic_storm_visible_view.gui` | 两者 | 宇宙风暴视图 |
| `astral_rift_view.gfx` / `astral_rift_view.gui` | 两者 | 星界裂隙视图 |
| `astral_actions_view.gfx` | gfx | 星界行动图标 |
| `astral_planes_resources.gfx` | gfx | 星界位面资源图标 |

## 九、物种 / 特质 / 标本

| 文件 | 类型 | 对应组件/窗口 |
|------|------|--------------|
| `customize_species.gfx` / `customize_species.gui` | 两者 | 物种自定义主窗口 |
| `customize_species_editors.gfx` / `customize_species_editors.gui` | 两者 | 物种自定义编辑器 |
| `customize_species_shipsets.gui` | gui | 舰船外观集选择 |
| `species_mod_window.gui` | gui | 物种改造窗口 |
| `species_mod_apply_window.gui` | gui | 物种改造应用窗口 |
| `species_portrait_picker_view.gui` | gui | 物种肖像选择器 |
| `select_species_portrait_dialog.gui` | gui | 物种肖像选择对话框 |
| `species_traits.gui` | gui | 物种特质视图 |
| `species_weapons_and_travel.gui` | gui | 物种武器与移动方式 |
| `traits.gui` | gui | 特质图标层 |
| `specimens.gfx` | gfx | 标本图标（GFX_specimen_*） |
| `mutations.gfx` | gfx | 突变图标（eye_beam等） |
| `slave_pool_view.gui` | gui | 奴隶池视图 |

## 十、经济 / 贸易 / 市场

| 文件 | 类型 | 对应组件/窗口 |
|------|------|--------------|
| `resources.gfx` | gfx | 资源图标sprite（GFX_resource_*、贸易价值） |
| `market_view.gfx` / `market_view.gui` | 两者 | 市场视图 |
| `trade_view.gfx` / `trade_view.gui` | 两者 | 贸易视图 |
| `trade_routes_view.gui` | gui | 贸易路线视图 |
| `monthly_trade_view.gui` | gui | 月度贸易视图 |
| `modifiers.gfx` | gfx | 修正因子图标（GFX_modifier_*） |

## 十一、科技 / 研究

| 文件 | 类型 | 对应组件/窗口 |
|------|------|--------------|
| `technology_view.gfx` / `technology_view.gui` | 两者 | 科技视图（technology_view_window） |
| `discoveries_view.gui` | gui | 发现视图 |

## 十二、谍报

| 文件 | 类型 | 对应组件/窗口 |
|------|------|--------------|
| `espionage_view.gfx` | gfx | 谍报视图sprite |
| `espionage_operation_view.gui` | gui | 谍报行动视图 |
| `espionage_asset_selection_window.gui` | gui | 谍报资产选择窗口 |

## 十三、多人游戏 / 大厅

| 文件 | 类型 | 对应组件/窗口 |
|------|------|--------------|
| `multiplayer_view.gfx` / `multiplayer_view.gui` | 两者 | 多人游戏视图 |
| `mp_gamesetup.gfx` / `mp_gamesetup.gui` | 两者 | 多人游戏设置 |
| `coop_sp_gamesetup.gui` | gui | 合作单人游戏设置 |
| `new_game_setup.gui` | gui | 新游戏设置 |
| `country_select_view.gfx` / `country_select_view.gui` | 两者 | 国家选择视图 |
| `select_empire_design.gui` | gui | 帝国设计选择 |
| `select_empire_dlc.gui` | gui | 帝国DLC选择 |
| `matchmaking.gfx` / `matchmaking.gui` | 两者 | 匹配大厅 |
| `matchmaking_chat.gui` | gui | 匹配聊天窗口 |
| `matchmaking_coop.gui` | gui | 合作匹配窗口 |
| `ingamelobby.gfx` / `ingamelobby.gui` | 两者 | 游戏内大厅 |
| `ingame_mp_lobby.gfx` / `ingame_mp_lobby.gui` | 两者 | 游戏内多人大厅 |
| `hotjoin.gfx` / `hotjoin.gui` | 两者 | 热加入请求 |
| `hotjoin_view.gfx` / `hotjoin_view.gui` | 两者 | 热加入视图 |
| `mp_country_password_view.gui` | gui | 国家密码视图 |
| `mp_country_settings_view.gui` | gui | 国家设置视图 |
| `social_view.gfx` / `social_view.gui` | 两者 | 社交好友视图 |
| `chat.gfx` / `chat.gui` | 两者 | 聊天窗口 |
| `pops_login.gui` | gui | PDX账号登录阻塞层 |

## 十四、设置 / 存档 / 系统

| 文件 | 类型 | 对应组件/窗口 |
|------|------|--------------|
| `settings_view.gfx` / `settings_view.gui` | 两者 | 设置视图 |
| `message_type_settings_view.gui` | gui | 消息类型设置 |
| `savegame_view.gui` | gui | 存档列表（SaveGameScreen） |
| `loadgame_view.gui` | gui | 读档列表（LoadGameScreen） |
| `save_and_load.gfx` | gfx | 存档相关图标（云存档、铁人、不兼容标记） |
| `musicplayer.gfx` / `musicplayer.gui` | 两者 | 音乐播放器 |
| `console.gui` | gui | 开发者控制台 |
| `editor_view.gui` | gui | 编辑器视图 |
| `debug_traits_view.gui` | gui | 特质调试视图 |
| `assets_console.gfx` | gfx | 资产控制台图标（随机/更新按钮） |
| `databank_window.gfx` / `databank_window.gui` | 两者 | 数据库窗口 |

## 十五、教程 / 引导

| 文件 | 类型 | 对应组件/窗口 |
|------|------|--------------|
| `hud_tutorial.gui` | gui | HUD教程窗口 |
| `immediate_tutorial.gui` | gui | 即时教程窗口 |
| `tutorial_mission_window.gfx` / `tutorial_mission_window.gui` | 两者 | 教程任务窗口 |
| `tutorial_mission_window_docked.gui` | gui | 教程任务窗口（停靠态） |

## 十六、DLC / 附加内容 / 特殊系统

| 文件 | 类型 | 对应组件/窗口 |
|------|------|--------------|
| `dlc_icons.gfx` | gfx | DLC图标（GFX_themachineage、GFX_biogenesis 等，含big/small变体） |
| `additional_content/additional_content.gfx`(+`.gui`) | 两者 | 附加内容视图 |
| `additional_content/additional_content_acquired_popup.gui` | gui | 获得附加内容弹窗 |
| `additional_content/whats_new.gui` | gui | "新内容"窗口 |
| `paragon_content.gfx` | gfx | Paragon DLC内容sprite（ terraformation nuclei 等） |
| `paragon_ui_types.gui` | gui | Paragon UI类型（肖像容器） |
| `specialist_subject_perks.gfx` | gfx | 专家附庸特权图标 |
| `specialist_subject_tiers.gfx` | gfx | 专家附庸等级图标 |
| `grand_archive.gfx` | gfx | 大档案馆sprite |
| `grand_archive_collection_view.gui` | gui | 大档案馆收藏视图 |
| `grand_archive_vivarium.gfx` | gfx | 大档案馆生态馆sprite |
| `synaptic_lathe_view.gfx` / `synaptic_lathe_view.gui` | 两者 | 突触车床视图 |
| `the_tempest_invocator_relic_view.gfx`(+`.gui`) | 两者 | 风暴召唤者遗物视图 |
| `relics_view.gfx` | gfx | 遗物视图sprite |
| `achievements_view.gui` | gui | 成就视图 |

## 十七、其他

| 文件 | 类型 | 对应组件/窗口 |
|------|------|--------------|
| `eu4_placeholders.gfx` | gfx | 从EU4遗留的占位sprite（前端logo、kick/ban按钮等） |
| `interface.gfx` 中的 `SandboxFloaterBackground` | gfx | 沙盒浮动背景（EU4遗留） |

## 附：查找规律总结

1. **同名成对**：绝大多数视图 `xxx_view.gui` 配 `xxx_view.gfx`，gui管布局、gfx管贴图。
2. **只有gfx**：纯图标集合（如 `eventpictures.gfx`、`resources.gfx`、`modifiers.gfx`、`specimens.gfx`）没有对应gui，被多个窗口引用。
3. **只有gui**：纯布局（如多数 `*_dialog.gui`、`topbar_*.gui`），sprite引用自 `core.gfx`/`interface.gfx` 或视图gfx。
4. **sprite命名前缀规律**：
   - `GFX_evt_*` → 事件图片
   - `GFX_resource_*` → 资源图标
   - `GFX_modifier_*` → 修正因子图标
   - `GFX_ship_part_*` → 舰船组件图标
   - `GFX_specimen_*` → 标本图标
   - `GFX_wg_*` → 战争目标图标
   - `GFX_ap_*` → 飞升天赋图标
5. **定位某窗口贴图**：先在 `xxx_view.gui` 中找 `spriteType`/`quadTextureSprite` 值，再在 `interface/*.gfx` 中搜该GFX名。
