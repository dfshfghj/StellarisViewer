use stellaris_parser::models::Gamestate;
use std::fs;

fn preprocess(data: &str) -> String {
    data.lines()
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
        .join("\n")
}

/// Extract a top-level section from the save file (section header at start of line)
fn extract_section(data: &str, name: &str) -> Option<String> {
    // Find the section header at the start of a line
    let pattern = format!("\n{}=", name);
    let mut search_start = 0;
    let start = loop {
        let pos = data[search_start..].find(&pattern)?;
        let abs_pos = search_start + pos + 1; // +1 to skip the \n
        // Verify it's at the start of a line (no indentation before it)
        // Check that the character before is \n or it's at position 0
        if abs_pos == 0 || data.as_bytes().get(abs_pos - 1) == Some(&b'\n') {
            break abs_pos;
        }
        search_start = abs_pos;
    };

    let key_and_rest = &data[start..];
    let pattern2 = format!("{}=", name);
    let after_key = &key_and_rest[pattern2.len()..];
    let brace_start = after_key.find('{')?;
    let content_start = start + pattern2.len() + brace_start;

    // Track brace depth to find the end
    let mut depth = 0;
    let mut end = content_start;
    for (i, ch) in data[content_start..].char_indices() {
        match ch {
            '{' => depth += 1,
            '}' => {
                depth -= 1;
                if depth == 0 {
                    end = content_start + i + 1;
                    break;
                }
            }
            _ => {}
        }
    }

    Some(format!("{}={}", name, &data[content_start..end]))
}

fn main() {
    let path = "D:/dfshfghj/stellaris/example/gamestate";
    println!("Loading: {}", path);
    let data = fs::read_to_string(path).expect("read file");
    let cleaned = preprocess(&data);
    println!("Preprocessed: {} -> {} bytes", data.len(), cleaned.len());

    // Test 1: Parse only the fleet section
    println!("\n=== Test: fleet section only ===");
    if let Some(fleet_section) = extract_section(&cleaned, "fleet") {
        println!("Fleet section: {} bytes", fleet_section.len());
        #[derive(jomini::JominiDeserialize, Debug, Default)]
        struct T {
            #[jomini(default = "dh")]
            fleet: std::collections::HashMap<u32, stellaris_parser::models::Fleet>,
        }
        fn dh<K, V>() -> std::collections::HashMap<K, V> { std::collections::HashMap::new() }
        match jomini::text::de::from_utf8_slice::<T>(fleet_section.as_bytes()) {
            Ok(t) => println!("  OK: {} fleets", t.fleet.len()),
            Err(e) => println!("  FAILED: {}", e),
        }
    }

    // Test 2: Parse only the ships section
    println!("\n=== Test: ships section only ===");
    if let Some(ships_section) = extract_section(&cleaned, "ships") {
        println!("Ships section: {} bytes", ships_section.len());
        #[derive(jomini::JominiDeserialize, Debug, Default)]
        struct T {
            #[jomini(default = "dh")]
            ships: std::collections::HashMap<u32, stellaris_parser::models::Ship>,
        }
        fn dh<K, V>() -> std::collections::HashMap<K, V> { std::collections::HashMap::new() }
        match jomini::text::de::from_utf8_slice::<T>(ships_section.as_bytes()) {
            Ok(t) => println!("  OK: {} ships", t.ships.len()),
            Err(e) => println!("  FAILED: {}", e),
        }
    }

    // Test 3: Parse only the country section
    println!("\n=== Test: country section only ===");
    if let Some(country_section) = extract_section(&cleaned, "country") {
        println!("Country section: {} bytes", country_section.len());
        #[derive(jomini::JominiDeserialize, Debug, Default)]
        struct T {
            #[jomini(default = "dh")]
            country: std::collections::HashMap<u32, stellaris_parser::models::Country>,
        }
        fn dh<K, V>() -> std::collections::HashMap<K, V> { std::collections::HashMap::new() }
        match jomini::text::de::from_utf8_slice::<T>(country_section.as_bytes()) {
            Ok(t) => println!("  OK: {} countries", t.country.len()),
            Err(e) => println!("  FAILED: {}", e),
        }
    }

    // Test 4: Parse only the ship_design section
    println!("\n=== Test: ship_design section only ===");
    if let Some(sd_section) = extract_section(&cleaned, "ship_design") {
        println!("Ship_design section: {} bytes", sd_section.len());
        #[derive(jomini::JominiDeserialize, Debug, Default)]
        struct T {
            #[jomini(default = "dh")]
            ship_design: std::collections::HashMap<u32, stellaris_parser::models::ShipDesign>,
        }
        fn dh<K, V>() -> std::collections::HashMap<K, V> { std::collections::HashMap::new() }
        match jomini::text::de::from_utf8_slice::<T>(sd_section.as_bytes()) {
            Ok(t) => println!("  OK: {} designs", t.ship_design.len()),
            Err(e) => println!("  FAILED: {}", e),
        }
    }

    // Test 5: Parse only the leaders section
    println!("\n=== Test: leaders section only ===");
    if let Some(leaders_section) = extract_section(&cleaned, "leaders") {
        println!("Leaders section: {} bytes", leaders_section.len());
        #[derive(jomini::JominiDeserialize, Debug, Default)]
        struct T {
            #[jomini(default = "dh")]
            leaders: std::collections::HashMap<u32, stellaris_parser::models::Leader>,
        }
        fn dh<K, V>() -> std::collections::HashMap<K, V> { std::collections::HashMap::new() }
        match jomini::text::de::from_utf8_slice::<T>(leaders_section.as_bytes()) {
            Ok(t) => println!("  OK: {} leaders", t.leaders.len()),
            Err(e) => println!("  FAILED: {}", e),
        }
    }

    // Test 6: Parse only the districts section
    println!("\n=== Test: districts section only ===");
    if let Some(districts_section) = extract_section(&cleaned, "districts") {
        println!("Districts section: {} bytes", districts_section.len());
        #[derive(jomini::JominiDeserialize, Debug, Default)]
        struct T {
            #[jomini(default = "dh")]
            districts: std::collections::HashMap<u32, stellaris_parser::models::District>,
        }
        fn dh<K, V>() -> std::collections::HashMap<K, V> { std::collections::HashMap::new() }
        match jomini::text::de::from_utf8_slice::<T>(districts_section.as_bytes()) {
            Ok(t) => println!("  OK: {} districts", t.districts.len()),
            Err(e) => println!("  FAILED: {}", e),
        }
    }

    // Test 7: Full parse with preprocessed data
    println!("\n=== Test: Full Gamestate (preprocessed) ===");
    match jomini::text::de::from_utf8_slice::<Gamestate>(cleaned.as_bytes()) {
        Ok(gs) => println!("  OK: {} systems, {} countries, {} ships, {} fleets, {} designs, {} leaders, {} districts",
            gs.galactic_object.len(), gs.country.len(), gs.ships.len(),
            gs.fleet.len(), gs.ship_design.len(), gs.leaders.len(), gs.districts.len()),
        Err(e) => println!("  FAILED: {}", e),
    }

    // Test 8: Hyperlane text scan (on ORIGINAL data)
    println!("\n=== Test: Hyperlane text scan ===");
    let hl = test_extract_hyperlanes(&data);
    println!("  hyperlanes found: {}", hl.len());
    if hl.len() > 0 {
        println!("  first 5: {:?}", &hl[..hl.len().min(5)]);
    }

    // Test 9: Name variables extraction
    println!("\n=== Test: Name variables extraction ===");
    let nv = test_extract_name_variables(&data);
    println!("  name_vars found: {}", nv.len());
    let samples: Vec<_> = nv.iter().take(10).collect();
    for (pid, name) in samples {
        println!("  planet {} => {:?}", pid, name);
    }
}

fn test_extract_hyperlanes(text: &str) -> Vec<[u32; 2]> {
    use std::collections::HashSet;
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
                println!("  [debug] entered galactic_object section");
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
                println!("  [debug] hyperlane block #{} in system {:?}", hl_blocks, current_system);
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
            // Only exit after braces were opened and closed (not on the hyperlane= line itself)
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
    println!("  [debug] systems={}, hl_blocks={}, connections={}", systems_seen, hl_blocks, result.len());
    result
}

fn test_extract_name_variables(text: &str) -> std::collections::HashMap<u32, String> {
    let mut result = std::collections::HashMap::new();
    let mut in_planets = false;
    let mut in_planet_section = false;
    let mut depth: i32 = 0;
    let mut current_planet: Option<u32> = None;
    let mut pending_key: Option<u32> = None;

    let mut in_name = false;
    let mut name_depth: i32 = 0;
    let mut format_key: Option<String> = None;

    let mut in_variables = false;
    let mut var_depth: i32 = 0;
    let mut vars: Vec<(String, String)> = Vec::new();
    let mut current_var_key: Option<String> = None;
    let mut in_value = false;
    let mut value_depth: i32 = 0;

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

        if !in_planets {
            if t == "planets=" {
                in_planets = true;
                depth = 0;
            }
            continue;
        }

        let opens = t.matches('{').count() as i32;
        let closes = t.matches('}').count() as i32;

        if !in_planet_section {
            depth += opens - closes;
            if t == "planet=" {
                in_planet_section = true;
            }
            if depth <= 0 && closes > 0 {
                in_planets = false;
            }
            continue;
        }

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

            if !in_variables && t.starts_with("key=") && format_key.is_none() {
                let val = t[4..].trim().trim_matches('"');
                if val.ends_with("_NAME_FORMAT") {
                    format_key = Some(val.to_string());
                }
            }

            if t == "variables=" && format_key.is_some() && !in_variables {
                in_variables = true;
                var_depth = 0;
            }

            if in_variables {
                var_depth += opens - closes;

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

            if name_depth <= 0 && closes > 0 {
                if let (Some(pid), Some(fk)) = (current_planet, &format_key) {
                    let resolved = test_resolve_format_name(fk, &vars, &parent_format, &parent_vars);
                    result.insert(pid, resolved);
                }
                in_name = false;
            }
        }

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

fn test_resolve_format_name(
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
            let sys_name = test_resolve_system_key(parent);
            if numeral.is_empty() { sys_name } else { format!("{} {}", sys_name, numeral) }
        }
        "SUBPLANET_NAME_FORMAT" => {
            let numeral = vars.iter().find(|(k, _)| k == "NUMERAL").map(|(_, v)| v.as_str()).unwrap_or("");
            let parent_name = if let Some(pf) = parent_format {
                test_resolve_format_name(pf, parent_vars, &None, &[])
            } else {
                let parent = vars.iter().find(|(k, _)| k == "PARENT").map(|(_, v)| v.as_str()).unwrap_or("");
                test_resolve_system_key(parent)
            };
            if numeral.is_empty() { parent_name } else { format!("{} {}", parent_name, numeral) }
        }
        _ => format_key.to_string(),
    }
}

fn test_resolve_system_key(key: &str) -> String {
    let name = key
        .strip_prefix("SPEC_")
        .or_else(|| key.strip_prefix("NAME_"))
        .unwrap_or(key);
    let name = name.strip_suffix("_system").unwrap_or(name);
    let name = name.replace('_', " ");
    let mut chars = name.chars();
    match chars.next() {
        None => String::new(),
        Some(c) => c.to_uppercase().to_string() + &chars.as_str().to_lowercase(),
    }
}
