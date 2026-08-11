use crate::models::Name;
use std::cell::RefCell;
use std::collections::HashMap;

thread_local! {
    static STRINGS: RefCell<HashMap<String, String>> = RefCell::new(HashMap::new());
}

pub fn set_strings(strings: HashMap<String, String>) {
    STRINGS.with(|slot| *slot.borrow_mut() = strings);
}

pub fn resolve_name(name: &Name) -> String {
    STRINGS.with(|strings| resolve_name_inner(name, &strings.borrow(), 0))
}

fn resolve_name_inner(name: &Name, strings: &HashMap<String, String>, depth: usize) -> String {
    let Some(key) = name.key.as_deref() else {
        return "Unknown".to_string();
    };
    if depth >= 12 {
        return fallback_key(key);
    }

    if let Some(formatted) = resolve_special_formatter(name, strings, depth) {
        return strip_stellaris_markup(&formatted);
    }

    let mut result = strings
        .get(key)
        .cloned()
        .unwrap_or_else(|| fallback_key(key));

    for variable in &name.variables {
        let (Some(variable_key), Some(value)) =
            (variable.key.as_deref(), variable.value.as_deref())
        else {
            continue;
        };
        let placeholder = format!("${}$", variable_key);
        let resolved = resolve_name_inner(value, strings, depth + 1);
        result = result.replace(&placeholder, &resolved);
    }

    result = expand_localization_references(&result, strings, depth + 1);
    strip_stellaris_markup(&result)
}

fn resolve_special_formatter(
    name: &Name,
    strings: &HashMap<String, String>,
    depth: usize,
) -> Option<String> {
    let key = name.key.as_deref()?;
    match key {
        "%SEQ%" => {
            let format = resolve_variable(name, "fmt", strings, depth)?;
            let number = resolve_variable(name, "num", strings, depth)?;
            let ordinal = format_ordinal(&number, strings);
            Some(
                format
                    .replace("$ORD0$", &ordinal)
                    .replace("$ORD$", &ordinal)
                    .replace("$CARD$", &number)
                    .replace("$C$", &number),
            )
        }
        "%LEADER_1%" | "%LEADER_2%" => {
            let mut parts: Vec<_> = name
                .variables
                .iter()
                .filter_map(|variable| {
                    let position = variable.key.as_deref()?.parse::<u32>().ok()?;
                    let value = variable.value.as_deref()?;
                    Some((position, resolve_name_inner(value, strings, depth + 1)))
                })
                .collect();
            parts.sort_by_key(|(position, _)| *position);
            Some(
                parts
                    .into_iter()
                    .map(|(_, value)| value)
                    .filter(|value| !value.is_empty())
                    .collect::<Vec<_>>()
                    .join(" "),
            )
        }
        "%ADJECTIVE%" => resolve_variable(name, "adjective", strings, depth),
        "%ADJ%" => resolve_variable(name, "1", strings, depth),
        "%ACRONYM%" => resolve_variable(name, "base", strings, depth),
        _ => None,
    }
}

fn format_ordinal(number: &str, strings: &HashMap<String, String>) -> String {
    if strings
        .get("ORD")
        .or_else(|| strings.get("ORD0"))
        .is_some_and(|rule| rule.contains('第'))
    {
        return format!("第{number}");
    }

    let Ok(value) = number.parse::<i64>() else {
        return number.to_string();
    };
    let suffix = if (11..=13).contains(&(value.abs() % 100)) {
        "th"
    } else {
        match value.abs() % 10 {
            1 => "st",
            2 => "nd",
            3 => "rd",
            _ => "th",
        }
    };
    format!("{number}{suffix}")
}

fn resolve_variable(
    name: &Name,
    key: &str,
    strings: &HashMap<String, String>,
    depth: usize,
) -> Option<String> {
    let value = name
        .variables
        .iter()
        .find(|variable| variable.key.as_deref() == Some(key))?
        .value
        .as_deref()?;
    if let Some(key) = value.key.as_deref() {
        if key.chars().all(|character| character.is_ascii_digit()) {
            return Some(key.to_string());
        }
    }
    Some(resolve_name_inner(value, strings, depth + 1))
}

fn expand_localization_references(
    value: &str,
    strings: &HashMap<String, String>,
    depth: usize,
) -> String {
    if depth >= 12 {
        return value.to_string();
    }

    let mut output = String::with_capacity(value.len());
    let mut rest = value;
    while let Some(start) = rest.find('$') {
        output.push_str(&rest[..start]);
        let after_start = &rest[start + 1..];
        let Some(end) = after_start.find('$') else {
            output.push_str(&rest[start..]);
            return output;
        };

        let token = &after_start[..end];
        let key = token.split('|').next().unwrap_or(token);
        // ORD/ORD0 are engine number-rule definitions, not display strings.
        // %SEQ% must consume these tokens together with its `num` variable.
        if matches!(key, "ORD" | "ORD0" | "CARD" | "C" | "R") {
            output.push('$');
            output.push_str(token);
            output.push('$');
        } else if let Some(localized) = strings.get(key) {
            output.push_str(&expand_localization_references(
                localized,
                strings,
                depth + 1,
            ));
        } else {
            output.push('$');
            output.push_str(token);
            output.push('$');
        }
        rest = &after_start[end + 1..];
    }
    output.push_str(rest);
    output
}

fn strip_stellaris_markup(value: &str) -> String {
    let mut output = String::with_capacity(value.len());
    let mut chars = value.chars();
    while let Some(ch) = chars.next() {
        if ch == '§' {
            chars.next();
        } else {
            output.push(ch);
        }
    }
    output
}

fn fallback_key(key: &str) -> String {
    key.strip_prefix("NAME_")
        .or_else(|| key.strip_prefix("EMPIRE_DESIGN_"))
        .or_else(|| key.strip_prefix("HUMAN1_SHIP_"))
        .or_else(|| key.strip_prefix("HUMAN1_FLEET_"))
        .or_else(|| key.strip_prefix("PRESCRIPTED_species_name_"))
        .unwrap_or(key)
        .to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::NameVariable;

    fn keyed(key: &str) -> Name {
        Name {
            key: Some(key.to_string()),
            variables: Vec::new(),
        }
    }

    #[test]
    fn resolves_recursive_name_format() {
        let strings = HashMap::from([
            (
                "PREFIX_NAME_FORMAT".to_string(),
                "$PREFIX$$NAME$".to_string(),
            ),
            ("HUMAN1_SHIP_Explorer".to_string(), "探险家".to_string()),
            (
                "PRESCRIPTED_ship_prefix_humans1".to_string(),
                "UNS".to_string(),
            ),
        ]);
        let name = Name {
            key: Some("PREFIX_NAME_FORMAT".to_string()),
            variables: vec![
                NameVariable {
                    key: Some("NAME".to_string()),
                    value: Some(Box::new(keyed("HUMAN1_SHIP_Explorer"))),
                },
                NameVariable {
                    key: Some("PREFIX".to_string()),
                    value: Some(Box::new(keyed("PRESCRIPTED_ship_prefix_humans1"))),
                },
            ],
        };

        assert_eq!(resolve_name_inner(&name, &strings, 0), "UNS探险家");
    }

    #[test]
    fn resolves_sequence_formatter() {
        let strings = HashMap::from([
            (
                "MACHINE3_ULTRAACTIVECARETAKERSQUAD".to_string(),
                "$ORD0$超前摄看护小队".to_string(),
            ),
            ("ORD0".to_string(), "-1, n10+1:第$C$, def:第$C$".to_string()),
        ]);
        let name = Name {
            key: Some("%SEQ%".to_string()),
            variables: vec![
                NameVariable {
                    key: Some("fmt".to_string()),
                    value: Some(Box::new(keyed("MACHINE3_ULTRAACTIVECARETAKERSQUAD"))),
                },
                NameVariable {
                    key: Some("num".to_string()),
                    value: Some(Box::new(keyed("1"))),
                },
            ],
        };

        assert_eq!(resolve_name_inner(&name, &strings, 0), "第1超前摄看护小队");
    }

    #[test]
    fn resolves_cardinal_sequence_placeholder_without_expanding_number_rules() {
        let strings = HashMap::from([
            ("HUMAN1_PLANETARYGUARD".to_string(), "$C$行星护卫".to_string()),
            ("C".to_string(), "(100?:(0 1 2 3)):1".to_string()),
        ]);
        let name = Name {
            key: Some("%SEQ%".to_string()),
            variables: vec![
                NameVariable { key: Some("fmt".to_string()), value: Some(Box::new(keyed("HUMAN1_PLANETARYGUARD"))) },
                NameVariable { key: Some("num".to_string()), value: Some(Box::new(keyed("1"))) },
            ],
        };
        assert_eq!(resolve_name_inner(&name, &strings, 0), "1行星护卫");
    }

    #[test]
    fn formats_english_ordinals() {
        let strings = HashMap::from([("ORD".to_string(), "$C$st/$C$nd/$C$rd/$C$th".to_string())]);
        for (number, expected) in [
            ("1", "1st"),
            ("2", "2nd"),
            ("3", "3rd"),
            ("11", "11th"),
            ("12", "12th"),
            ("13", "13th"),
            ("21", "21st"),
        ] {
            assert_eq!(format_ordinal(number, &strings), expected);
        }
    }

    #[test]
    fn resolves_two_part_leader_formatter() {
        let strings = HashMap::from([
            ("TOX2_CHA_Rancy".to_string(), "烂西".to_string()),
            ("TOX2_CHA_Maggotbrain".to_string(), "蛆脑".to_string()),
        ]);
        let name = Name {
            key: Some("%LEADER_2%".to_string()),
            variables: vec![
                NameVariable {
                    key: Some("1".to_string()),
                    value: Some(Box::new(keyed("TOX2_CHA_Rancy"))),
                },
                NameVariable {
                    key: Some("2".to_string()),
                    value: Some(Box::new(keyed("TOX2_CHA_Maggotbrain"))),
                },
            ],
        };

        assert_eq!(resolve_name_inner(&name, &strings, 0), "烂西 蛆脑");
    }
}
