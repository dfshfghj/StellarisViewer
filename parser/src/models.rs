use jomini::JominiDeserialize;
use serde::Serialize;
use std::collections::HashMap;

// ============ Top-level Gamestate ============

#[derive(JominiDeserialize, Debug, Default)]
pub struct Gamestate {
    pub date: Option<String>,
    pub name: Option<String>,
    #[jomini(default = "default_hashmap")]
    pub galactic_object: HashMap<u32, GalacticObject>,
    pub planets: Option<PlanetsSection>,
    #[jomini(default = "default_hashmap")]
    pub country: HashMap<u32, Country>,
    #[jomini(default = "default_hashmap")]
    pub ships: HashMap<u32, Ship>,
    #[jomini(default = "default_hashmap")]
    pub fleet: HashMap<u32, Fleet>,
    #[jomini(default = "default_hashmap")]
    pub ship_design: HashMap<u32, ShipDesign>,
    #[jomini(default = "default_hashmap")]
    pub sectors: HashMap<u32, Sector>,
    #[jomini(default = "default_hashmap")]
    pub leaders: HashMap<u32, Leader>,
    #[jomini(default = "default_hashmap")]
    pub districts: HashMap<u32, District>,
    #[jomini(default = "default_hashmap")]
    pub buildings: HashMap<u32, Building>,
    #[jomini(default = "default_hashmap")]
    pub zones: HashMap<u32, Zone>,
    #[jomini(default = "default_hashmap")]
    pub deposit: HashMap<u32, Deposit>,
}

fn default_hashmap<K, V>() -> HashMap<K, V> {
    HashMap::new()
}

// ============ Planets Section ============

#[derive(JominiDeserialize, Debug, Default)]
pub struct PlanetsSection {
    #[jomini(default = "default_hashmap")]
    pub planet: HashMap<u32, Planet>,
}

// ============ Galactic Object (Star System) ============

#[derive(JominiDeserialize, Debug, Default, Clone, Serialize)]
pub struct GalacticObject {
    pub coordinate: Option<Coordinate>,
    #[jomini(alias = "type")]
    pub obj_type: Option<String>,
    pub name: Option<Name>,
    // Repeated keys format: planet=587 planet=588
    #[jomini(duplicated)]
    pub planet: Vec<u32>,
    pub star_class: Option<String>,
    pub sector: Option<u32>,
    pub inner_radius: Option<f64>,
    pub outer_radius: Option<f64>,
    // Block format: fleet_presence={ 246 }
    #[jomini(default)]
    pub fleet_presence: Vec<u32>,
    // Block format: colonies={ 341 }
    #[jomini(default)]
    pub colonies: Vec<u32>,
}

#[derive(JominiDeserialize, Debug, Default, Clone, Serialize)]
pub struct Coordinate {
    pub x: f64,
    pub y: f64,
    pub origin: Option<u32>,
}

// ============ Name ============

#[derive(JominiDeserialize, Debug, Default, Clone, Serialize)]
pub struct Name {
    pub key: Option<String>,
    #[jomini(default)]
    pub variables: Vec<NameVariable>,
}

#[derive(JominiDeserialize, Debug, Default, Clone, Serialize)]
pub struct NameVariable {
    pub key: Option<String>,
    pub value: Option<Box<Name>>,
}

#[cfg(test)]
mod name_tests {
    use super::Name;

    #[test]
    fn parses_anonymous_localization_variables() {
        let input = br#"key="PREFIX_NAME_FORMAT" variables={ { key="NAME" value={ key="HUMAN1_SHIP_Explorer" } } { key="PREFIX" value={ key="PRESCRIPTED_ship_prefix_humans1" } } }"#;
        let name: Name = jomini::text::de::from_utf8_slice(input).expect("parse localized name");

        assert_eq!(name.key.as_deref(), Some("PREFIX_NAME_FORMAT"));
        assert_eq!(name.variables.len(), 2);
        assert_eq!(name.variables[0].key.as_deref(), Some("NAME"));
        assert_eq!(name.variables[0].value.as_ref().and_then(|v| v.key.as_deref()), Some("HUMAN1_SHIP_Explorer"));
    }
}

// ============ Planet ============

#[derive(JominiDeserialize, Debug, Default, Clone, Serialize)]
pub struct Planet {
    pub name: Option<Name>,
    pub planet_class: Option<String>,
    pub coordinate: Option<Coordinate>,
    pub orbit: Option<f64>,
    pub planet_size: Option<u32>,
    pub owner: Option<u32>,
    pub controller: Option<u32>,
    pub governor: Option<u32>,
    pub stability: Option<f64>,
    pub crime: Option<f64>,
    pub bombardment_damage: Option<f64>,
    pub amenities: Option<f64>,
    pub amenities_usage: Option<f64>,
    pub free_amenities: Option<f64>,
    pub free_housing: Option<f64>,
    pub total_housing: Option<f64>,
    pub housing_usage: Option<f64>,
    pub employable_pops: Option<f64>,
    pub civilian: Option<f64>,
    pub num_sapient_pops: Option<u32>,
    pub ascension_tier: Option<u32>,
    pub colonize_date: Option<String>,
    // 星球级收支（与 Resources 结构一致的命名块）
    pub upkeep: Option<Resources>,
    pub produces: Option<Resources>,
    pub profits: Option<Resources>,
    // Block format: districts={ 0 33 34 }
    #[jomini(default)]
    pub districts: Vec<u32>,
    // Block format: moons={ 4 }
    #[jomini(default)]
    pub moons: Vec<u32>,
    // Block format: army={ 40 41 42 }
    #[jomini(default)]
    pub army: Vec<u32>,
    // Block format: deposits={ 17 }
    #[jomini(default)]
    pub deposits: Vec<u32>,
    // Block format: buildings_cache={ 0 2 3 }
    #[jomini(default)]
    pub buildings_cache: Vec<u32>,
    // Block format: pop_groups={ 29 588 ... }
    #[jomini(default)]
    pub pop_groups: Vec<u32>,
    // Block format: pop_jobs={ 421 422 ... }
    #[jomini(default)]
    pub pop_jobs: Vec<u32>,
    pub final_designation: Option<String>,
    pub entity_name: Option<String>,
    // timed_modifier={ items={ { modifier="X" days=N } ... } }（匿名对象序列，jomini 直接反序列化）
    pub timed_modifier: Option<TimedModifier>,
    // 重复键：planet_modifier="pm_X" planet_modifier="pm_Y"
    #[jomini(duplicated, default)]
    pub planet_modifier: Vec<String>,
}

#[derive(JominiDeserialize, Debug, Default, Clone, Serialize)]
pub struct TimedModifier {
    #[jomini(default)]
    pub items: Vec<ModifierItem>,
}

#[derive(JominiDeserialize, Debug, Default, Clone, Serialize)]
pub struct ModifierItem {
    pub modifier: Option<String>,
    pub days: Option<i32>,
}

// ============ Country ============

#[derive(JominiDeserialize, Debug, Default, Clone, Serialize)]
pub struct Country {
    pub name: Option<Name>,
    pub custom_name: Option<String>,
    pub government: Option<Government>,
    pub capital: Option<u32>,
    #[jomini(alias = "type")]
    pub country_type: Option<String>,
    pub military_power: Option<f64>,
    pub fleet_size: Option<u32>,
    pub used_naval_capacity: Option<f64>,
    pub empire_size: Option<u32>,
    pub num_upgraded_starbase: Option<u32>,
    pub starbase_capacity: Option<u32>,
    pub budget: Option<CountryBudget>,
    pub num_sapient_pops: Option<u32>,
    // Block format: owned_planets={ 3 209 291 }
    #[jomini(default)]
    pub owned_planets: Vec<u32>,
    // fleets_manager.owned_fleets extracted via text scan (anonymous object pattern)
    pub modules: Option<CountryModules>,
    pub relations_manager: Option<RelationsManager>,
}

#[derive(JominiDeserialize, Debug, Default, Clone, Serialize)]
pub struct RelationsManager {
    #[jomini(duplicated)]
    pub relation: Vec<CountryRelation>,
}

#[derive(JominiDeserialize, Debug, Default, Clone, Serialize)]
pub struct CountryRelation {
    pub country: Option<u32>,
    pub contact: Option<bool>,
    pub defensive_pact: Option<bool>,
    pub federation: Option<bool>,
    pub is_rival: Option<bool>,
    pub relation_current: Option<f64>,
}

#[derive(JominiDeserialize, Debug, Default, Clone, Serialize)]
pub struct Government {
    #[jomini(alias = "type")]
    pub gov_type: Option<String>,
    pub authority: Option<String>,
    pub origin: Option<String>,
}

#[derive(JominiDeserialize, Debug, Default, Clone, Serialize)]
pub struct CountryModules {
    pub standard_economy_module: Option<EconomyModule>,
}

#[derive(JominiDeserialize, Debug, Default, Clone, Serialize)]
pub struct EconomyModule {
    pub resources: Option<Resources>,
}

#[derive(JominiDeserialize, Debug, Default, Clone, Serialize)]
pub struct CountryBudget {
    pub last_month: Option<BudgetMonth>,
}

#[derive(JominiDeserialize, Debug, Default, Clone, Serialize)]
pub struct BudgetMonth {
    #[jomini(default = "default_hashmap")]
    pub balance: HashMap<String, Resources>,
    #[jomini(default = "default_hashmap")]
    pub extra_balance: HashMap<String, Resources>,
    #[jomini(default = "default_hashmap")]
    pub trade_balance: HashMap<String, Resources>,
}

#[derive(JominiDeserialize, Debug, Default, Clone, Serialize)]
pub struct Resources {
    pub energy: Option<f64>,
    pub minerals: Option<f64>,
    pub food: Option<f64>,
    pub physics_research: Option<f64>,
    pub society_research: Option<f64>,
    pub engineering_research: Option<f64>,
    pub influence: Option<f64>,
    pub unity: Option<f64>,
    pub trade: Option<f64>,
    pub consumer_goods: Option<f64>,
    pub alloys: Option<f64>,
    pub volatile_motes: Option<f64>,
    pub exotic_gases: Option<f64>,
    pub rare_crystals: Option<f64>,
    pub sr_living_metal: Option<f64>,
    pub sr_zro: Option<f64>,
    pub sr_dark_matter: Option<f64>,
    pub nanites: Option<f64>,
    pub minor_artifacts: Option<f64>,
}

// ============ Fleet ============

#[derive(JominiDeserialize, Debug, Default, Clone, Serialize)]
pub struct Fleet {
    pub name: Option<Name>,
    // Block format: ships={ 0 1 2 }
    #[jomini(default)]
    pub ships: Vec<u32>,
    pub military_power: Option<f64>,
    pub hit_points: Option<f64>,
    #[jomini(duplicated)]
    pub civilian: Vec<bool>,
    #[jomini(duplicated)]
    pub station: Vec<bool>,
    #[jomini(duplicated)]
    pub weapon: Vec<bool>,
    #[jomini(duplicated)]
    pub mobile: Vec<bool>,
    #[jomini(duplicated)]
    pub orbital_station: Vec<bool>,
    pub fleet_stance: Option<String>,
    pub movement_manager: Option<MovementManager>,
    pub aggro_range: Option<u32>,
    pub fleet_template: Option<u32>,
}

#[derive(JominiDeserialize, Debug, Default, Clone, Serialize)]
pub struct MovementManager {
    pub coordinate: Option<Coordinate>,
    pub target_coordinate: Option<Coordinate>,
    pub state: Option<String>,
    pub formation: Option<Formation>,
    pub orbit: Option<OrbitInfo>,
    pub path: Option<MovementPath>,
}

#[derive(JominiDeserialize, Debug, Default, Clone, Serialize)]
pub struct MovementPath {
    #[jomini(duplicated)]
    pub node: Vec<MovementPathNode>,
}

#[derive(JominiDeserialize, Debug, Default, Clone, Serialize)]
pub struct MovementPathNode {
    pub coordinate: Option<Coordinate>,
    pub ftl: Option<String>,
}

#[derive(JominiDeserialize, Debug, Default, Clone, Serialize)]
pub struct Formation {
    pub scale: Option<f64>,
    #[jomini(alias = "type")]
    pub formation_type: Option<String>,
}

#[derive(JominiDeserialize, Debug, Default, Clone, Serialize)]
pub struct OrbitInfo {
    pub orbitable: Option<Orbitable>,
    pub index: Option<i32>,
}

#[derive(JominiDeserialize, Debug, Default, Clone, Serialize)]
pub struct Orbitable {
    pub planet: Option<u32>,
    pub starbase: Option<u32>,
}

// ============ Ship ============

#[derive(JominiDeserialize, Debug, Default, Clone, Serialize)]
pub struct Ship {
    pub fleet: Option<u32>,
    pub name: Option<Name>,
    pub ship_design_implementation: Option<ShipDesignImpl>,
    pub graphical_culture: Option<String>,
    // Repeated keys: section={ ... } section={ ... }
    #[jomini(duplicated)]
    pub section: Vec<ShipSection>,
    pub hitpoints: Option<f64>,
    pub shield_hitpoints: Option<f64>,
    pub armor_hitpoints: Option<f64>,
    pub max_hitpoints: Option<f64>,
    pub max_shield_hitpoints: Option<f64>,
    pub max_armor_hitpoints: Option<f64>,
    pub leader: Option<u32>,
    pub coordinate: Option<Coordinate>,
    pub speed: Option<f64>,
    pub construction_date: Option<String>,
}

#[derive(JominiDeserialize, Debug, Default, Clone, Serialize)]
pub struct ShipDesignImpl {
    pub design: Option<u32>,
    pub upgrade: Option<u32>,
    pub growth_stage: Option<u32>,
}

#[derive(JominiDeserialize, Debug, Default, Clone, Serialize)]
pub struct ShipSection {
    pub design: Option<String>,
    pub slot: Option<String>,
    // Repeated keys: weapon={ ... } weapon={ ... }
    #[jomini(duplicated)]
    pub weapon: Vec<WeaponSlot>,
    // Hangar components live in repeated strike_craft={ ... } blocks, not weapon={ ... }.
    #[jomini(duplicated)]
    pub strike_craft: Vec<WeaponSlot>,
}

#[derive(JominiDeserialize, Debug, Default, Clone, Serialize)]
pub struct WeaponSlot {
    pub index: Option<u32>,
    pub template: Option<String>,
    pub component_slot: Option<String>,
}

// ============ Ship Design ============
// growth_stages uses anonymous objects { { ship_size="corvette" ... } }

#[derive(JominiDeserialize, Debug, Default, Clone, Serialize)]
pub struct ShipDesign {
    pub name: Option<Name>,
    pub graphical_culture: Option<String>,
    #[jomini(default)]
    pub growth_stages: Vec<ShipGrowthStage>,
}

#[derive(JominiDeserialize, Debug, Default, Clone, Serialize)]
pub struct ShipGrowthStage {
    pub ship_size: Option<String>,
    #[jomini(duplicated)]
    pub section: Vec<ShipDesignSection>,
    #[jomini(duplicated)]
    pub required_component: Vec<String>,
}

#[derive(JominiDeserialize, Debug, Default, Clone, Serialize)]
pub struct ShipDesignSection {
    pub template: Option<String>,
    pub slot: Option<String>,
    #[jomini(duplicated)]
    pub component: Vec<ShipDesignComponent>,
}

#[derive(JominiDeserialize, Debug, Default, Clone, Serialize)]
pub struct ShipDesignComponent {
    pub slot: Option<String>,
    pub template: Option<String>,
}

#[cfg(test)]
mod ship_design_tests {
    use super::ShipDesign;

    #[test]
    fn parses_growth_stage_components() {
        let input = br#"growth_stages={ { ship_size="corvette" section={ template="CORVETTE_MID_S3" slot="mid" component={ slot="SMALL_UTILITY_1" template="SMALL_SHIELD_1" } } required_component="CORVETTE_FISSION_REACTOR" required_component="HYPER_DRIVE_1" } }"#;
        let design: ShipDesign =
            jomini::text::de::from_utf8_slice(input).expect("parse ship design");

        assert_eq!(design.growth_stages[0].ship_size.as_deref(), Some("corvette"));
        assert_eq!(design.growth_stages[0].required_component.len(), 2);
        assert_eq!(
            design.growth_stages[0].section[0].component[0]
                .template
                .as_deref(),
            Some("SMALL_SHIELD_1")
        );
    }
}

// ============ Sector ============

#[derive(JominiDeserialize, Debug, Default, Clone, Serialize)]
pub struct Sector {
    pub name: Option<Name>,
    pub owner: Option<u32>,
    // Block format: systems={ 561 306 397 }
    #[jomini(default)]
    pub systems: Vec<u32>,
    pub local_capital: Option<u32>,
    #[jomini(alias = "type")]
    pub sector_type: Option<String>,
}

// ============ Leader ============

#[derive(JominiDeserialize, Debug, Default, Clone, Serialize)]
pub struct Leader {
    pub name: Option<LeaderName>,
    pub species: Option<u32>,
    pub portrait: Option<String>,
    pub gender: Option<String>,
    pub country: Option<u32>,
    pub class: Option<String>,
    pub experience: Option<f64>,
    pub level: Option<u32>,
    pub age: Option<u32>,
    #[jomini(duplicated)]
    pub traits: Vec<String>,
    pub planet: Option<u32>,
    pub location: Option<LeaderLocation>,
}

#[derive(JominiDeserialize, Debug, Default, Clone, Serialize)]
pub struct LeaderName {
    pub full_names: Option<Name>,
    pub key: Option<String>,
}

#[derive(JominiDeserialize, Debug, Default, Clone, Serialize)]
pub struct LeaderLocation {
    #[jomini(alias = "type")]
    pub loc_type: Option<String>,
    pub id: Option<u32>,
}

#[cfg(test)]
mod leader_tests {
    use super::Leader;

    #[test]
    fn parses_repeated_leader_traits() {
        let input = br#"class="commander" traits="leader_trait_cautious" traits="leader_trait_trickster" level=2 age=12 experience=757.125"#;
        let leader: Leader = jomini::text::de::from_utf8_slice(input).expect("parse leader");

        assert_eq!(leader.traits, ["leader_trait_cautious", "leader_trait_trickster"]);
        assert_eq!(leader.level, Some(2));
        assert_eq!(leader.age, Some(12));
    }
}

// ============ District ============

#[derive(JominiDeserialize, Debug, Default, Clone, Serialize)]
pub struct District {
    #[jomini(alias = "type")]
    pub district_type: Option<String>,
    pub level: Option<u32>,
    // Block format: zones={ 0 33 34 }
    #[jomini(default)]
    pub zones: Vec<u32>,
}

// ============ Building ============

#[derive(JominiDeserialize, Debug, Default, Clone, Serialize)]
pub struct Building {
    #[jomini(alias = "type")]
    pub building_type: Option<String>,
    pub position: Option<u32>,
}

// ============ Zone ============

#[derive(JominiDeserialize, Debug, Default, Clone, Serialize)]
pub struct Zone {
    #[jomini(alias = "type")]
    pub zone_type: Option<String>,
    // Block format: buildings={ 0 2 3 4 }
    #[jomini(default)]
    pub buildings: Vec<u32>,
}

// ============ Deposit ============

#[derive(JominiDeserialize, Debug, Default, Clone, Serialize)]
pub struct Deposit {
    #[jomini(alias = "type")]
    pub deposit_type: Option<String>,
}

// ============ Extracted Data (from text scan) ============

/// Ship design info extracted from growth_stages anonymous objects
#[derive(Debug, Clone, Default)]
pub struct DesignInfo {
    pub ship_size: String,
    pub required_components: Vec<String>,
    pub sections: Vec<DesignSectionInfo>,
}

#[derive(Debug, Clone, Default)]
pub struct DesignSectionInfo {
    pub slot: String,
    pub template: String,
    pub components: Vec<(String, String)>, // (slot, template)
}
