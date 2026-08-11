use std::collections::HashMap;

use stellaris_parser::{extract::extract_planet_detail, models::Gamestate};

fn load_example() -> Gamestate {
    let data = std::fs::read_to_string("../example/gamestate").expect("example gamestate");
    let cleaned = data
        .lines()
        .filter(|line| {
            let text = line.trim();
            let Some((key, value)) = text.split_once('=') else { return true };
            value.trim() != "none" || !key.chars().all(|value| value.is_ascii_digit())
        })
        .collect::<Vec<_>>()
        .join("\n");
    jomini::text::de::from_utf8_slice(cleaned.as_bytes()).expect("parse example gamestate")
}

#[test]
fn earth_management_economy_and_armies_match_save() {
    let gs = load_example();
    let detail = extract_planet_detail(&gs, 3, &HashMap::new()).expect("Earth detail");

    assert_eq!(detail.features.len(), 10);
    assert_eq!(detail.blocked_districts, 1);
    assert_eq!(detail.resource_deposits.generator, 8);
    assert_eq!(detail.resource_deposits.mining, 7);
    assert_eq!(detail.resource_deposits.farming, 8);
    assert_eq!(detail.species.len(), 2);
    assert_eq!(detail.pop_groups.len(), 13);
    assert_eq!(detail.jobs.len(), 15);
    assert_eq!(detail.jobs.iter().map(|job| job.workforce).sum::<f64>(), 5685.0);
    assert_eq!(detail.jobs.iter().filter(|job| job.category == "ruler").map(|job| job.workforce).sum::<f64>(), 200.0);
    assert_eq!(detail.jobs.iter().filter(|job| job.category == "specialist").map(|job| job.workforce).sum::<f64>(), 2420.0);
    assert_eq!(detail.jobs.iter().filter(|job| job.category == "worker").map(|job| job.workforce).sum::<f64>(), 2000.0);
    assert_eq!(detail.monthly_population.net, -6.0);
    assert_eq!(detail.monthly_population.growth, 6.0);
    assert_eq!(detail.monthly_population.migration, -12.0);

    assert_eq!(detail.army_units.len(), 6);
    assert!(detail.army_units.iter().all(|army| army.army_type == "defense_army"));
    assert!(detail.army_units.iter().all(|army| army.health == army.max_health));
    assert_eq!(detail.army_power.round(), 209.0);
    assert_eq!(detail.recruitable_armies.len(), 1);
    assert_eq!(detail.recruitable_armies[0].army_type, "assault_army");
    assert_eq!(detail.recruitable_armies[0].build_time, 90);
    assert_eq!(detail.recruitable_armies[0].mineral_cost, 100.0);
}
