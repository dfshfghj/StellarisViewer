pub mod extract;
mod localization;
pub mod models;

use models::{DesignInfo, DesignSectionInfo, Gamestate};
use std::cell::RefCell;
use std::collections::{HashMap, HashSet};
use wasm_bindgen::prelude::*;

thread_local! {
    static STATE: RefCell<Option<Gamestate>> = const { RefCell::new(None) };
    static HYPERLANES: RefCell<Vec<[u32; 2]>> = const { RefCell::new(Vec::new()) };
    static FLEET_OWNERS: RefCell<HashMap<u32, u32>> = RefCell::new(HashMap::new());
    static DESIGN_INFO: RefCell<HashMap<u32, DesignInfo>> = RefCell::new(HashMap::new());
    static NAME_VARS: RefCell<HashMap<u32, String>> = RefCell::new(HashMap::new());
}

#[wasm_bindgen]
pub fn set_localization(value: JsValue) -> Result<(), JsValue> {
    let strings: HashMap<String, String> = serde_wasm_bindgen::from_value(value)
        .map_err(|error| JsValue::from_str(&format!("Invalid localization data: {error}")))?;
    localization::set_strings(strings);
    Ok(())
}

/// Parse the full gamestate text. Returns parse time in ms.
#[wasm_bindgen]
pub fn parse_save(data: &str) -> Result<f64, JsValue> {
    let start = js_sys::Date::now();

    web_sys::console::log_1(&format!("[parse_save] input len={}, first 100: {:?}",
        data.len(), &data[..data.len().min(100)]).into());

    // Pre-process: remove "N=none" lines that jomini can't skip properly
    let cleaned: String = data
        .lines()
        .filter(|line| {
            let t = line.trim();
            if let Some(eq_pos) = t.find('=') {
                let key = &t[..eq_pos];
                let val = t[eq_pos + 1..].trim();
                if val == "none" && key.chars().all(|c| c.is_ascii_digit()) {
                    return false;
                }
            }
            true
        })
        .collect::<Vec<&str>>()
        .join("\n");

    web_sys::console::log_1(&format!("[parse_save] cleaned len={}", cleaned.len()).into());

    let gs: Gamestate = jomini::text::de::from_utf8_slice(cleaned.as_bytes())
        .map_err(|e| {
            let msg = format!("Parse error: {} (input {} bytes, cleaned {} bytes)",
                e, data.len(), cleaned.len());
            JsValue::from_str(&msg)
        })?;

    // Extract data from anonymous-object patterns via text scan (use original text)
    let hyperlanes = extract_hyperlanes(data);
    let fleet_owners = extract_fleet_owners(data);
    let design_info = extract_design_info(data);
    let name_vars = extract_name_variables(data);

    web_sys::console::log_1(&format!("[parse_save] hyperlanes={}, fleet_owners={}, designs={}, name_vars={}",
        hyperlanes.len(), fleet_owners.len(), design_info.len(), name_vars.len()).into());

    STATE.with(|s| *s.borrow_mut() = Some(gs));
    HYPERLANES.with(|h| *h.borrow_mut() = hyperlanes);
    FLEET_OWNERS.with(|f| *f.borrow_mut() = fleet_owners);
    DESIGN_INFO.with(|d| *d.borrow_mut() = design_info);
    NAME_VARS.with(|n| *n.borrow_mut() = name_vars);

    Ok(js_sys::Date::now() - start)
}

// ============ Text Scan: Hyperlanes ============

/// Scan galactic_object section for hyperlane connections.
fn extract_hyperlanes(text: &str) -> Vec<[u32; 2]> {
    let mut result = Vec::new();
    let mut seen = HashSet::new();
    let mut in_galactic = false;
    let mut depth: i32 = 0;
    let mut current_system: Option<u32> = None;
    let mut in_hyperlane = false;
    let mut hl_depth: i32 = 0;
    let mut pending_key: Option<u32> = None;
    let mut hl_blocks: u32 = 0;
    let mut systems_seen: u32 = 0;

    for line in text.lines() {
        let t = line.trim();

        if !in_galactic {
            if t == "galactic_object=" {
                in_galactic = true;
                depth = 0;
                web_sys::console::log_1(&"[hyperlane] entered galactic_object section".into());
            }
            continue;
        }

        let opens = t.matches('{').count() as i32;
        let closes = t.matches('}').count() as i32;

        if depth == 1 && opens == 0 && closes == 0 && t.ends_with('=') {
            let key = &t[..t.len() - 1];
            if let Ok(id) = key.parse::<u32>() {
                pending_key = Some(id);
                systems_seen += 1;
            }
        }

        if opens > 0 && depth == 1 {
            if let Some(id) = pending_key.take() {
                current_system = Some(id);
            }
        }

        if t.starts_with("hyperlane=") && !in_hyperlane {
            in_hyperlane = true;
            hl_depth = 0;
            hl_blocks += 1;
            if hl_blocks <= 3 {
                web_sys::console::log_1(&format!("[hyperlane] found block #{} in system {:?}", hl_blocks, current_system).into());
            }
        }

        depth += opens - closes;

        if in_hyperlane {
            hl_depth += opens - closes;
            if t.starts_with("to=") {
                if let Ok(to) = t[3..].trim().parse::<u32>() {
                    if let Some(sys) = current_system {
                        let key = if sys < to { (sys, to) } else { (to, sys) };
                        if seen.insert(key) {
                            result.push([sys, to]);
                        }
                    }
                }
            }
            if hl_depth <= 0 && closes > 0 {
                in_hyperlane = false;
            }
        }

        if depth == 1 && closes > 0 {
            current_system = None;
        }
        if depth <= 0 {
            in_galactic = false;
        }
    }
    web_sys::console::log_1(&format!("[hyperlane] done: systems={}, hl_blocks={}, connections={}", systems_seen, hl_blocks, result.len()).into());
    result
}

// ============ Text Scan: Fleet Owners ============

/// Scan country section for owned_fleets={ { fleet=N } } patterns.
fn extract_fleet_owners(text: &str) -> HashMap<u32, u32> {
    let mut result = HashMap::new();
    let mut in_country = false;
    let mut depth: i32 = 0;
    let mut current_country: Option<u32> = None;
    let mut in_owned_fleets = false;
    let mut of_depth: i32 = 0;
    let mut pending_key: Option<u32> = None;

    for line in text.lines() {
        let t = line.trim();

        if !in_country {
            if t == "country=" {
                in_country = true;
                depth = 0;
            }
            continue;
        }

        let opens = t.matches('{').count() as i32;
        let closes = t.matches('}').count() as i32;

        if depth == 1 && opens == 0 && closes == 0 && t.ends_with('=') {
            let key = &t[..t.len() - 1];
            if let Ok(id) = key.parse::<u32>() {
                pending_key = Some(id);
            }
        }

        if opens > 0 && depth == 1 {
            if let Some(id) = pending_key.take() {
                current_country = Some(id);
            }
        }

        if t.starts_with("owned_fleets=") && !in_owned_fleets {
            in_owned_fleets = true;
            of_depth = 0;
        }

        depth += opens - closes;

        if in_owned_fleets {
            of_depth += opens - closes;
            if t.starts_with("fleet=") {
                if let Ok(fid) = t[6..].trim().parse::<u32>() {
                    if let Some(cid) = current_country {
                        result.insert(fid, cid);
                    }
                }
            }
            if of_depth <= 0 && closes > 0 {
                in_owned_fleets = false;
            }
        }

        if depth == 1 && closes > 0 {
            current_country = None;
        }
        if depth <= 0 {
            in_country = false;
        }
    }
    result
}

// ============ Text Scan: Ship Design Info ============

/// Scan ship_design section for growth_stages={ { ship_size=... } } patterns.
fn extract_design_info(text: &str) -> HashMap<u32, DesignInfo> {
    let mut result = HashMap::new();
    let mut in_ship_design = false;
    let mut depth: i32 = 0;
    let mut current_design: Option<u32> = None;
    let mut in_growth_stages = false;
    let mut gs_depth: i32 = 0;
    let mut pending_key: Option<u32> = None;
    let mut current_info: Option<DesignInfo> = None;
    let mut in_section = false;
    let mut sec_depth: i32 = 0;
    let mut current_section: Option<DesignSectionInfo> = None;

    for line in text.lines() {
        let t = line.trim();

        if !in_ship_design {
            if t == "ship_design=" {
                in_ship_design = true;
                depth = 0;
            }
            continue;
        }

        let opens = t.matches('{').count() as i32;
        let closes = t.matches('}').count() as i32;

        // Detect design ID at depth 1
        if depth == 1 && opens == 0 && closes == 0 && t.ends_with('=') {
            let key = &t[..t.len() - 1];
            if let Ok(id) = key.parse::<u32>() {
                pending_key = Some(id);
            }
        }

        if opens > 0 && depth == 1 {
            if let Some(id) = pending_key.take() {
                current_design = Some(id);
                current_info = Some(DesignInfo::default());
            }
        }

        // Detect growth_stages block
        if t.starts_with("growth_stages=") && !in_growth_stages {
            in_growth_stages = true;
            gs_depth = 0;
        }

        depth += opens - closes;

        if in_growth_stages {
            gs_depth += opens - closes;

            // Only parse first growth stage (gs_depth == 2 means inside first anonymous object)
            if gs_depth == 2 && opens > 0 && current_info.is_some() {
                // Entering first growth stage object
            }

            // Extract ship_size (only from first stage, gs_depth >= 2)
            if gs_depth >= 2 && t.starts_with("ship_size=") {
                if let Some(info) = current_info.as_mut() {
                    if info.ship_size.is_empty() {
                        let val = t["ship_size=".len()..].trim().trim_matches('"');
                        info.ship_size = val.to_string();
                    }
                }
            }

            // Extract required_component
            if gs_depth >= 2 && t.starts_with("required_component=") {
                if let Some(info) = current_info.as_mut() {
                    let val = t["required_component=".len()..].trim().trim_matches('"');
                    info.required_components.push(val.to_string());
                }
            }

            // Track section blocks within growth stage
            if gs_depth >= 2 && t.starts_with("section=") && !in_section {
                in_section = true;
                sec_depth = 0;
                current_section = Some(DesignSectionInfo::default());
            }

            if in_section {
                sec_depth += opens - closes;
                if let Some(sec) = current_section.as_mut() {
                    if t.starts_with("slot=") {
                        sec.slot = t["slot=".len()..].trim().trim_matches('"').to_string();
                    }
                    if t.starts_with("template=") {
                        sec.template = t["template=".len()..].trim().trim_matches('"').to_string();
                    }
                    if t.starts_with("component=") {
                        // component is on same line or next lines
                    }
                    // Parse component slot/template within section
                    if sec_depth >= 2 && t.starts_with("slot=") && sec.template.is_empty() {
                        // This might be a component slot
                    }
                }
                if sec_depth <= 0 {
                    if let Some(sec) = current_section.take() {
                        if let Some(info) = current_info.as_mut() {
                            info.sections.push(sec);
                        }
                    }
                    in_section = false;
                }
            }

            if gs_depth <= 0 {
                in_growth_stages = false;
            }
        }

        // End of a design entry
        if depth == 1 && closes > 0 {
            if let (Some(id), Some(info)) = (current_design.take(), current_info.take()) {
                result.insert(id, info);
            }
        }
        if depth <= 0 {
            in_ship_design = false;
        }
    }
    result
}

// ============ Text Scan: Name Variables ============

/// Scan planets section for NAME_FORMAT keys with variables (anonymous nested objects).
/// Resolves display names: ASTEROID → prefix+suffix, PLANET → system+numeral, SUBPLANET → parent+numeral.
fn extract_name_variables(text: &str) -> HashMap<u32, String> {
    let mut result = HashMap::new();
    let mut in_planets = false;
    let mut in_planet_section = false;
    let mut depth: i32 = 0;
    let mut current_planet: Option<u32> = None;
    let mut pending_key: Option<u32> = None;

    // Name parsing state
    let mut in_name = false;
    let mut name_depth: i32 = 0;
    let mut format_key: Option<String> = None;

    // Variables parsing state
    let mut in_variables = false;
    let mut var_depth: i32 = 0;
    let mut vars: Vec<(String, String)> = Vec::new();
    let mut current_var_key: Option<String> = None;
    let mut in_value = false;
    let mut value_depth: i32 = 0;

    // Nested parent (for SUBPLANET)
    let mut parent_format: Option<String> = None;
    let mut parent_vars: Vec<(String, String)> = Vec::new();
    let mut in_parent_value = false;
    let mut parent_value_depth: i32 = 0;
    let mut in_parent_variables = false;
    let mut parent_var_depth: i32 = 0;
    let mut parent_var_key: Option<String> = None;
    let mut in_parent_val = false;
    let mut parent_val_depth: i32 = 0;

    for line in text.lines() {
        let t = line.trim();

        // Find planets= section
        if !in_planets {
            if t == "planets=" {
                in_planets = true;
                depth = 0;
            }
            continue;
        }

        let opens = t.matches('{').count() as i32;
        let closes = t.matches('}').count() as i32;

        // Find planet= subsection within planets
        if !in_planet_section {
            depth += opens - closes;
            if t == "planet=" {
                in_planet_section = true;
                // depth will be incremented by the { on next line
            }
            if depth <= 0 && closes > 0 {
                in_planets = false;
            }
            continue;
        }

        // Track planet IDs at depth 2 (within planet= block)
        if depth == 2 && opens == 0 && closes == 0 && t.ends_with('=') && !t.contains('"') {
            let key = &t[..t.len() - 1];
            if let Ok(id) = key.parse::<u32>() {
                pending_key = Some(id);
            }
        }

        if opens > 0 && depth == 2 {
            if let Some(id) = pending_key.take() {
                current_planet = Some(id);
            }
        }

        // Detect name= block inside a planet entry (depth 3)
        if t == "name=" && depth == 3 && !in_name {
            in_name = true;
            name_depth = 0;
            format_key = None;
            vars.clear();
            parent_format = None;
            parent_vars.clear();
        }

        depth += opens - closes;

        if in_name {
            name_depth += opens - closes;

            // Look for format key
            if !in_variables && t.starts_with("key=") && format_key.is_none() {
                let val = t[4..].trim().trim_matches('"');
                if val.ends_with("_NAME_FORMAT") {
                    format_key = Some(val.to_string());
                }
            }

            // Detect variables= block
            if t == "variables=" && format_key.is_some() && !in_variables {
                in_variables = true;
                var_depth = 0;
            }

            if in_variables {
                var_depth += opens - closes;

                // Handle nested parent value (for SUBPLANET)
                if in_parent_value {
                    parent_value_depth += opens - closes;

                    if !in_parent_variables && t.starts_with("key=") && parent_format.is_none() {
                        let val = t[4..].trim().trim_matches('"');
                        if val.ends_with("_NAME_FORMAT") {
                            parent_format = Some(val.to_string());
                        }
                    }

                    if t == "variables=" && parent_format.is_some() && !in_parent_variables {
                        in_parent_variables = true;
                        parent_var_depth = 0;
                    }

                    if in_parent_variables {
                        parent_var_depth += opens - closes;

                        // Parse parent variable entries
                        if parent_var_depth >= 2 && t.starts_with("key=") && parent_var_key.is_none() && !in_parent_val {
                            let val = t[4..].trim().trim_matches('"');
                            parent_var_key = Some(val.to_string());
                        }
                        if parent_var_depth >= 2 && t == "value=" && parent_var_key.is_some() {
                            in_parent_val = true;
                            parent_val_depth = 0;
                        }
                        if in_parent_val {
                            parent_val_depth += opens - closes;
                            if t.starts_with("key=") {
                                let val = t[4..].trim().trim_matches('"');
                                if let Some(pk) = parent_var_key.take() {
                                    parent_vars.push((pk, val.to_string()));
                                }
                            }
                            if parent_val_depth <= 0 && closes > 0 {
                                in_parent_val = false;
                            }
                        }

                        if parent_var_depth <= 0 && closes > 0 {
                            in_parent_variables = false;
                        }
                    }

                    if parent_value_depth <= 0 && closes > 0 {
                        in_parent_value = false;
                    }
                    continue;
                }

                // Top-level variable entries
                if var_depth >= 2 && t.starts_with("key=") && current_var_key.is_none() && !in_value {
                    let val = t[4..].trim().trim_matches('"');
                    current_var_key = Some(val.to_string());
                }
                if var_depth >= 2 && t == "value=" && current_var_key.is_some() {
                    in_value = true;
                    value_depth = 0;
                }
                if in_value {
                    value_depth += opens - closes;
                    if t.starts_with("key=") {
                        let val = t[4..].trim().trim_matches('"');
                        if let Some(vk) = current_var_key.take() {
                            if vk == "PARENT" && val.ends_with("_NAME_FORMAT") {
                                // Nested parent (SUBPLANET case)
                                in_parent_value = true;
                                parent_value_depth = 0;
                                parent_format = Some(val.to_string());
                                parent_vars.clear();
                            } else {
                                vars.push((vk, val.to_string()));
                            }
                        }
                    }
                    if value_depth <= 0 && closes > 0 {
                        in_value = false;
                    }
                }

                if var_depth <= 0 && closes > 0 {
                    in_variables = false;
                }
            }

            // End of name block
            if name_depth <= 0 && closes > 0 {
                if let (Some(pid), Some(fk)) = (current_planet, &format_key) {
                    let resolved = resolve_format_name(fk, &vars, &parent_format, &parent_vars);
                    result.insert(pid, resolved);
                }
                in_name = false;
            }
        }

        // End of planet entry
        if depth == 2 && closes > 0 {
            current_planet = None;
        }
        if depth <= 0 && closes > 0 {
            in_planet_section = false;
            in_planets = false;
        }
    }
    result
}

fn resolve_format_name(
    format_key: &str,
    vars: &[(String, String)],
    parent_format: &Option<String>,
    parent_vars: &[(String, String)],
) -> String {
    match format_key {
        "ASTEROID_NAME_FORMAT" => {
            let prefix = vars.iter().find(|(k, _)| k == "prefix").map(|(_, v)| v.as_str()).unwrap_or("");
            let suffix = vars.iter().find(|(k, _)| k == "suffix").map(|(_, v)| v.as_str()).unwrap_or("");
            format!("{}{}", prefix, suffix)
        }
        "PLANET_NAME_FORMAT" => {
            let parent = vars.iter().find(|(k, _)| k == "PARENT").map(|(_, v)| v.as_str()).unwrap_or("");
            let numeral = vars.iter().find(|(k, _)| k == "NUMERAL").map(|(_, v)| v.as_str()).unwrap_or("");
            let sys_name = resolve_system_key(parent);
            if numeral.is_empty() { sys_name } else { format!("{} {}", sys_name, numeral) }
        }
        "SUBPLANET_NAME_FORMAT" => {
            let numeral = vars.iter().find(|(k, _)| k == "NUMERAL").map(|(_, v)| v.as_str()).unwrap_or("");
            // Resolve parent from nested format
            let parent_name = if let Some(pf) = parent_format {
                resolve_format_name(pf, parent_vars, &None, &[])
            } else {
                // Fallback: PARENT might be a simple key in vars
                let parent = vars.iter().find(|(k, _)| k == "PARENT").map(|(_, v)| v.as_str()).unwrap_or("");
                resolve_system_key(parent)
            };
            if numeral.is_empty() { parent_name } else { format!("{} {}", parent_name, numeral) }
        }
        _ => format_key.to_string(),
    }
}

/// Resolve a system name key like "SPEC_DAAR_system" → "Daar"
fn resolve_system_key(key: &str) -> String {
    let name = key
        .strip_prefix("SPEC_")
        .or_else(|| key.strip_prefix("NAME_"))
        .unwrap_or(key);
    let name = name.strip_suffix("_system").unwrap_or(name);
    let name = name.replace('_', " ");
    // Capitalize first letter, lowercase rest
    let mut chars = name.chars();
    match chars.next() {
        None => String::new(),
        Some(c) => c.to_uppercase().to_string() + &chars.as_str().to_lowercase(),
    }
}

// ============ WASM Exports ============

/// Get galaxy map data: systems, hyperlanes, territory, fleet positions
#[wasm_bindgen]
pub fn get_galaxy_data() -> Result<JsValue, JsValue> {
    STATE.with(|s| {
        let borrow = s.borrow();
        let gs = borrow.as_ref().ok_or_else(|| JsValue::from_str("No save loaded"))?;
        HYPERLANES.with(|h| {
            let hyperlanes = h.borrow();
            FLEET_OWNERS.with(|fo| {
                let fleet_owners = fo.borrow();
                DESIGN_INFO.with(|di| {
                    let design_info = di.borrow();
                    let data = extract::extract_galaxy_data(gs, &hyperlanes, &fleet_owners, &design_info);
                    serde_wasm_bindgen::to_value(&data)
                        .map_err(|e| JsValue::from_str(&format!("{}", e)))
                })
            })
        })
    })
}

/// Get system orbital view data
#[wasm_bindgen]
pub fn get_system_view(system_id: u32) -> Result<JsValue, JsValue> {
    STATE.with(|s| {
        let borrow = s.borrow();
        let gs = borrow.as_ref().ok_or_else(|| JsValue::from_str("No save loaded"))?;
        FLEET_OWNERS.with(|fo| {
            let fleet_owners = fo.borrow();
            NAME_VARS.with(|nv| {
                let name_vars = nv.borrow();
                let data = extract::extract_system_view(gs, system_id, &fleet_owners, &name_vars)
                    .ok_or_else(|| JsValue::from_str("System not found"))?;
                web_sys::console::log_1(&format!("[get_system_view] id={}, name={}, planets={}, fleets={}",
                    data.id, data.name, data.planets.len(), data.fleets.len()).into());
                serde_wasm_bindgen::to_value(&data)
                    .map_err(|e| JsValue::from_str(&format!("{}", e)))
            })
        })
    })
}

/// Get fleet detail with ships and commander
#[wasm_bindgen]
pub fn get_fleet_detail(fleet_id: u32) -> Result<JsValue, JsValue> {
    STATE.with(|s| {
        let borrow = s.borrow();
        let gs = borrow.as_ref().ok_or_else(|| JsValue::from_str("No save loaded"))?;
        DESIGN_INFO.with(|di| {
            let design_info = di.borrow();
            let data = extract::extract_fleet_detail(gs, fleet_id, &design_info)
                .ok_or_else(|| JsValue::from_str("Fleet not found"))?;
            serde_wasm_bindgen::to_value(&data)
                .map_err(|e| JsValue::from_str(&format!("{}", e)))
        })
    })
}

/// Get ship detail with design components
#[wasm_bindgen]
pub fn get_ship_detail(ship_id: u32) -> Result<JsValue, JsValue> {
    STATE.with(|s| {
        let borrow = s.borrow();
        let gs = borrow.as_ref().ok_or_else(|| JsValue::from_str("No save loaded"))?;
        DESIGN_INFO.with(|di| {
            let design_info = di.borrow();
            let data = extract::extract_ship_detail(gs, ship_id, &design_info)
                .ok_or_else(|| JsValue::from_str("Ship not found"))?;
            serde_wasm_bindgen::to_value(&data)
                .map_err(|e| JsValue::from_str(&format!("{}", e)))
        })
    })
}

/// Get planet full detail
#[wasm_bindgen]
pub fn get_planet_detail(planet_id: u32) -> Result<JsValue, JsValue> {
    STATE.with(|s| {
        let borrow = s.borrow();
        let gs = borrow.as_ref().ok_or_else(|| JsValue::from_str("No save loaded"))?;
        NAME_VARS.with(|nv| {
            let name_vars = nv.borrow();
            let data = extract::extract_planet_detail(gs, planet_id, &name_vars)
                .ok_or_else(|| JsValue::from_str("Planet not found"))?;
            serde_wasm_bindgen::to_value(&data).map_err(|e| JsValue::from_str(&format!("{}", e)))
        })
    })
}

/// Get player country info with resources, fleets, planets
#[wasm_bindgen]
pub fn get_player_info() -> Result<JsValue, JsValue> {
    STATE.with(|s| {
        let borrow = s.borrow();
        let gs = borrow.as_ref().ok_or_else(|| JsValue::from_str("No save loaded"))?;
        FLEET_OWNERS.with(|fo| {
            let fleet_owners = fo.borrow();
            NAME_VARS.with(|nv| {
                let name_vars = nv.borrow();
                let data = extract::extract_player_info(gs, &fleet_owners, &name_vars)
                    .ok_or_else(|| JsValue::from_str("Player country not found"))?;
                serde_wasm_bindgen::to_value(&data)
                    .map_err(|e| JsValue::from_str(&format!("{}", e)))
            })
        })
    })
}
