use jomini::JominiDeserialize;

#[derive(JominiDeserialize, Debug, Default)]
struct ModifierItem {
    pub modifier: Option<String>,
    pub days: Option<i32>,
}

#[derive(JominiDeserialize, Debug, Default)]
struct TimedModifier {
    #[jomini(default)]
    pub items: Vec<ModifierItem>,
}

#[derive(JominiDeserialize, Debug, Default)]
struct PlanetLike {
    pub timed_modifier: Option<TimedModifier>,
    #[jomini(duplicated, default)]
    pub planet_modifier: Vec<String>,
}

#[test]
fn parse_timed_modifier_anonymous_objects() {
    let text = r#"
        timed_modifier=
        {
            items=
            {

                {
                    modifier="prosp_uni_mod"
                    days=306
                }

                {
                    modifier="pm_second_modifier"
                    days=-1
                }

            }
        }
        planet_modifier="pm_carbon_world"
    "#;
    let p: PlanetLike = jomini::text::de::from_utf8_slice(text.as_bytes()).expect("parse ok");
    let tm = p.timed_modifier.expect("timed_modifier present");
    assert_eq!(tm.items.len(), 2, "items: {:?}", tm.items);
    assert_eq!(tm.items[0].modifier.as_deref(), Some("prosp_uni_mod"));
    assert_eq!(tm.items[0].days, Some(306));
    assert_eq!(tm.items[1].modifier.as_deref(), Some("pm_second_modifier"));
    assert_eq!(p.planet_modifier, vec!["pm_carbon_world".to_string()]);
}

#[test]
fn real_save_planet3_modifiers() {
    use stellaris_parser::models::Gamestate;
    let data = std::fs::read_to_string("../example/gamestate").expect("save file");
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
    let gs: Gamestate = jomini::text::de::from_utf8_slice(cleaned.as_bytes()).expect("parse ok");
    let planets = gs.planets.as_ref().expect("planets section");
    let p3 = planets.planet.get(&3).expect("planet 3");
    println!("planet_modifier: {:?}", p3.planet_modifier);
    println!("timed_modifier: {:?}", p3.timed_modifier);
    let tm = p3.timed_modifier.as_ref().expect("planet 3 timed_modifier");
    assert!(
        tm.items.iter().any(|i| i.modifier.as_deref() == Some("prosp_uni_mod") && i.days == Some(306)),
        "prosp_uni_mod days=306 expected, got {:?}", tm.items
    );
}
