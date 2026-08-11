use crate::models::*;
use serde::Serialize;
use std::collections::HashMap;

// ============ View Data Structures (serialized to JS) ============

#[derive(Serialize)]
pub struct GalaxyData {
    pub systems: Vec<SystemNode>,
    pub hyperlanes: Vec<[u32; 2]>,
    pub territory: Vec<TerritoryInfo>,
    pub fleets: Vec<FleetIcon>,
    pub countries: Vec<CountryBrief>,
    pub player_country_id: u32,
}

#[derive(Serialize)]
pub struct SystemNode {
    pub id: u32,
    pub x: f64,
    pub y: f64,
    pub name: String,
    pub star_class: String,
    pub owner: Option<u32>,
    pub has_colony: bool,
}

#[derive(Serialize)]
pub struct TerritoryInfo {
    pub country_id: u32,
    pub systems: Vec<u32>,
}

#[derive(Serialize)]
pub struct FleetIcon {
    pub id: u32,
    pub x: f64,
    pub y: f64,
    pub system_id: u32,
    pub civilian: bool,
    pub station: bool,
    pub military_power: f64,
    pub owner: Option<u32>,
    pub fleet_type: String,
    pub ship_size: String,
    pub ship_sizes: Vec<String>,
    pub relation: String,
    pub moving: bool,
}

#[derive(Serialize)]
pub struct CountryBrief {
    pub id: u32,
    pub name: String,
    pub color: String,
}

#[derive(Serialize)]
pub struct SystemViewData {
    pub id: u32,
    pub name: String,
    pub star_class: String,
    pub planets: Vec<PlanetOrbital>,
    pub fleets: Vec<FleetIcon>,
}

#[derive(Serialize)]
pub struct PlanetOrbital {
    pub id: u32,
    pub name: String,
    pub planet_class: String,
    pub size: u32,
    pub orbit: f64,
    pub colonized: bool,
    pub owner: Option<u32>,
}

#[derive(Serialize)]
pub struct FleetDetail {
    pub id: u32,
    pub name: String,
    pub military_power: f64,
    pub hit_points: f64,
    pub civilian: bool,
    pub station: bool,
    pub stance: String,
    pub ships: Vec<ShipBrief>,
    pub commander: Option<LeaderBrief>,
    pub movement_state: String,
    pub destination: String,
}

#[derive(Serialize)]
pub struct ShipBrief {
    pub id: u32,
    pub name: String,
    pub ship_size: String,
    pub hp_pct: f64,
    pub shield_pct: f64,
    pub armor_pct: f64,
}

#[derive(Serialize)]
pub struct LeaderBrief {
    pub name: String,
    pub class: String,
    pub level: u32,
    pub portrait: String,
    pub age: u32,
    pub experience: f64,
    pub traits: Vec<String>,
}

#[derive(Serialize)]
pub struct ShipDetail {
    pub id: u32,
    pub name: String,
    pub ship_size: String,
    pub design_name: String,
    pub hitpoints: f64,
    pub max_hitpoints: f64,
    pub shield: f64,
    pub max_shield: f64,
    pub armor: f64,
    pub max_armor: f64,
    pub speed: f64,
    pub weapons: Vec<ComponentSlot>,
    pub utilities: Vec<ComponentSlot>,
    pub core_components: Vec<String>,
    pub sections: Vec<SectionInfo>,
}

#[derive(Serialize)]
pub struct ComponentSlot {
    pub slot: String,
    pub template: String,
}

#[derive(Serialize)]
pub struct SectionInfo {
    pub slot: String,
    pub template: String,
}

#[derive(Serialize)]
pub struct PlanetDetail {
    pub id: u32,
    pub name: String,
    pub planet_class: String,
    pub size: u32,
    pub owner: Option<u32>,
    pub owner_name: String,
    pub governor: Option<LeaderBrief>,
    pub stability: f64,
    pub crime: f64,
    pub devastation: f64,
    pub amenities: f64,
    pub amenities_usage: f64,
    pub free_amenities: f64,
    pub free_housing: f64,
    pub total_housing: f64,
    pub housing_usage: f64,
    pub employable_pops: f64,
    pub civilian: f64,
    pub num_pops: u32,
    pub ascension_tier: u32,
    pub colonize_date: String,
    pub designation: String,
    pub produces: ResourceInfo,
    pub upkeep: ResourceInfo,
    pub districts: Vec<DistrictInfo>,
    pub buildings: Vec<BuildingInfo>,
    pub armies: u32,
    pub army_power: f64,
    pub army_units: Vec<PlanetArmyInfo>,
    pub recruitable_armies: Vec<RecruitableArmyInfo>,
    pub deposits_count: u32,
    pub features: Vec<PlanetFeatureInfo>,
    pub species: Vec<PlanetSpeciesInfo>,
    pub pop_groups: Vec<PlanetPopGroupInfo>,
    pub jobs: Vec<PlanetJobInfo>,
    pub monthly_population: MonthlyPopulationInfo,
    /// Per-resource-category deposit counts, used to derive resource district caps.
    pub resource_deposits: ResourceDepositCounts,
    /// Uncleared blocker deposits, rendered as blocked district markers.
    pub blocked_districts: u32,
    /// 行星修正：planet_modifier（永久）+ timed_modifier（限时）
    pub modifiers: Vec<PlanetModifierInfo>,
}

#[derive(Serialize)]
pub struct PlanetFeatureInfo {
    pub id: u32,
    pub feature_type: String,
    pub icon_key: String,
}

#[derive(Serialize)]
pub struct PlanetSpeciesInfo {
    pub id: u32,
    pub name: String,
    pub class: String,
    pub portrait: String,
    pub pops: f64,
}

#[derive(Serialize)]
pub struct PlanetPopGroupInfo {
    pub id: u32,
    pub species_id: u32,
    pub species_name: String,
    pub category: String,
    pub size: f64,
    pub happiness: f64,
    pub habitability: f64,
}

#[derive(Serialize)]
pub struct PlanetJobInfo {
    pub id: u32,
    pub job_type: String,
    pub category: String,
    pub workforce: f64,
    pub max_workforce: f64,
    pub bonus_workforce: f64,
}

#[derive(Serialize, Default)]
pub struct MonthlyPopulationInfo {
    pub growth: f64,
    pub migration: f64,
    pub assembly: f64,
    pub net: f64,
}

#[derive(Serialize)]
pub struct PlanetArmyInfo {
    pub id: u32,
    pub name: String,
    pub army_type: String,
    pub species_id: u32,
    pub species_name: String,
    pub health: f64,
    pub max_health: f64,
    pub morale: f64,
    pub power: f64,
}

#[derive(Serialize)]
pub struct RecruitableArmyInfo {
    pub army_type: String,
    pub species_id: u32,
    pub species_name: String,
    pub build_time: u32,
    pub mineral_cost: f64,
}

#[derive(Serialize, Clone)]
pub struct PlanetModifierInfo {
    pub key: String,
    /// 剩余天数；-1 = 永久
    pub days: i32,
}

#[derive(Serialize, Default, Clone, Copy)]
pub struct ResourceDepositCounts {
    pub generator: i32,
    pub mining: i32,
    pub farming: i32,
}

#[derive(Serialize)]
pub struct DistrictInfo {
    pub id: u32,
    pub district_type: String,
    pub level: u32,
    pub zones: Vec<ZoneInfo>,
}

#[derive(Serialize)]
pub struct ZoneInfo {
    pub id: u32,
    /// Empty when the slot is locked (zone id == u32::MAX).
    pub zone_type: String,
    pub locked: bool,
    /// Building-slot capacity of the zone (0 while locked).
    pub slots: u32,
    pub buildings: Vec<BuildingInfo>,
}

#[derive(Serialize)]
pub struct BuildingInfo {
    pub id: u32,
    pub building_type: String,
    pub position: u32,
}

#[derive(Serialize)]
pub struct PlayerInfo {
    pub country_id: u32,
    pub name: String,
    pub date: String,
    pub government_type: String,
    pub resources: ResourceInfo,
    pub monthly_resources: ResourceInfo,
    pub fleets: Vec<FleetBrief>,
    pub planets: Vec<PlanetBrief>,
    pub military_power: f64,
    pub empire_size: u32,
    pub num_pops: u32,
    pub envoys: Option<u32>,
    pub num_upgraded_starbase: u32,
    pub starbase_capacity: u32,
    pub used_naval_capacity: f64,
}

#[derive(Default, Serialize)]
pub struct ResourceInfo {
    pub energy: f64,
    pub minerals: f64,
    pub food: f64,
    pub physics_research: f64,
    pub society_research: f64,
    pub engineering_research: f64,
    pub influence: f64,
    pub unity: f64,
    pub trade: f64,
    pub consumer_goods: f64,
    pub alloys: f64,
    pub volatile_motes: f64,
    pub exotic_gases: f64,
    pub rare_crystals: f64,
    pub living_metal: f64,
    pub zro: f64,
    pub dark_matter: f64,
    pub nanites: f64,
    pub minor_artifacts: f64,
}

impl ResourceInfo {
    fn add(&mut self, resources: &Resources) {
        self.energy += resources.energy.unwrap_or(0.0);
        self.minerals += resources.minerals.unwrap_or(0.0);
        self.food += resources.food.unwrap_or(0.0);
        self.physics_research += resources.physics_research.unwrap_or(0.0);
        self.society_research += resources.society_research.unwrap_or(0.0);
        self.engineering_research += resources.engineering_research.unwrap_or(0.0);
        self.influence += resources.influence.unwrap_or(0.0);
        self.unity += resources.unity.unwrap_or(0.0);
        self.trade += resources.trade.unwrap_or(0.0);
        self.consumer_goods += resources.consumer_goods.unwrap_or(0.0);
        self.alloys += resources.alloys.unwrap_or(0.0);
        self.volatile_motes += resources.volatile_motes.unwrap_or(0.0);
        self.exotic_gases += resources.exotic_gases.unwrap_or(0.0);
        self.rare_crystals += resources.rare_crystals.unwrap_or(0.0);
        self.living_metal += resources.sr_living_metal.unwrap_or(0.0);
        self.zro += resources.sr_zro.unwrap_or(0.0);
        self.dark_matter += resources.sr_dark_matter.unwrap_or(0.0);
        self.nanites += resources.nanites.unwrap_or(0.0);
        self.minor_artifacts += resources.minor_artifacts.unwrap_or(0.0);
    }
}

#[derive(Serialize)]
pub struct FleetBrief {
    pub id: u32,
    pub name: String,
    pub military_power: f64,
    pub ship_count: u32,
    pub civilian: bool,
    pub station: bool,
}

#[derive(Serialize)]
pub struct PlanetBrief {
    pub id: u32,
    pub name: String,
    pub planet_class: String,
    pub size: u32,
    pub num_pops: u32,
}

// ============ Extraction Functions ============

const COUNTRY_COLORS: &[&str] = &[
    "#4488ff", "#44cc66", "#ff6644", "#ffcc22", "#cc44ff",
    "#44cccc", "#ff8844", "#88cc44", "#ff44aa", "#8888ff",
    "#ccaa44", "#44ff88", "#ff4444", "#44aaff", "#aaff44",
];

pub fn resolve_name(name: &Option<Name>) -> String {
    match name {
        Some(n) => crate::localization::resolve_name(n),
        None => "Unknown".to_string(),
    }
}

pub fn resolve_leader_name(name: &Option<LeaderName>) -> String {
    match name {
        Some(ln) => {
            if let Some(full) = &ln.full_names {
                resolve_name(&Some(full.clone()))
            } else if let Some(key) = &ln.key {
                key.clone()
            } else {
                "Unknown".to_string()
            }
        }
        None => "Unknown".to_string(),
    }
}

/// Resolve planet name using pre-extracted name variables for FORMAT placeholders.
pub fn resolve_planet_name(name: &Option<Name>, _planet_id: u32, _name_vars: &HashMap<u32, String>) -> String {
    resolve_name(name)
}

pub fn get_country_color(country_id: u32) -> String {
    COUNTRY_COLORS[(country_id as usize) % COUNTRY_COLORS.len()].to_string()
}

pub fn extract_galaxy_data(
    gs: &Gamestate,
    hyperlanes: &[[u32; 2]],
    fleet_owners: &HashMap<u32, u32>,
    design_info: &HashMap<u32, DesignInfo>,
) -> GalaxyData {
    let player_country_id = 0u32;
    let player_relations = gs
        .country
        .get(&player_country_id)
        .and_then(|country| country.relations_manager.as_ref());
    let mut systems = Vec::new();

    // Build system-to-owner map from sectors
    let mut system_owner: HashMap<u32, u32> = HashMap::new();
    for (_sid, sector) in &gs.sectors {
        if let Some(owner) = sector.owner {
            for &sys_id in &sector.systems {
                system_owner.insert(sys_id, owner);
            }
        }
    }

    for (&id, obj) in &gs.galactic_object {
        let coord = obj.coordinate.as_ref();
        let (x, y) = coord.map(|c| (-c.x, c.y)).unwrap_or((0.0, 0.0));

        systems.push(SystemNode {
            id,
            x,
            y,
            name: resolve_name(&obj.name),
            star_class: obj.star_class.clone().unwrap_or_default(),
            owner: system_owner.get(&id).copied(),
            has_colony: !obj.colonies.is_empty(),
        });
    }

    // Hyperlanes from text extraction
    let hyperlanes_vec: Vec<[u32; 2]> = hyperlanes.to_vec();

    // Territory
    let mut territory = Vec::new();
    for (_sid, sector) in &gs.sectors {
        if let Some(owner) = sector.owner {
            territory.push(TerritoryInfo {
                country_id: owner,
                systems: sector.systems.clone(),
            });
        }
    }

    // Fleet icons
    let mut fleets = Vec::new();
    for (&id, fleet) in &gs.fleet {
        if let Some(mm) = &fleet.movement_manager {
            if let Some(coord) = &mm.coordinate {
                let system_id = coord.origin.unwrap_or(0);
                let owner = fleet_owners.get(&id).copied();
                let ship_sizes = fleet
                    .ships
                    .iter()
                    .filter_map(|ship_id| gs.ships.get(ship_id))
                    .map(|ship| get_ship_size(gs, ship, design_info))
                    .filter(|size| size != "unknown")
                    .fold(Vec::new(), |mut sizes, size| {
                        if !sizes.contains(&size) { sizes.push(size); }
                        sizes
                    });
                let ship_size = ship_sizes
                    .first()
                    .cloned()
                    .unwrap_or_else(|| "unknown".to_string());
                let fleet_type = fleet_type_from_ship_size(&ship_size, fleet.civilian.last().copied().unwrap_or(false));
                let relation = fleet_relation(owner, player_country_id, player_relations);
                let moving = fleet_is_moving_between_systems(mm);
                fleets.push(FleetIcon {
                    id,
                    x: coord.x,
                    y: coord.y,
                    system_id,
                    civilian: fleet.civilian.last().copied().unwrap_or(false),
                    station: fleet.station.last().copied().unwrap_or(false),
                    military_power: fleet.military_power.unwrap_or(0.0),
                    owner,
                    fleet_type,
                    ship_size,
                    ship_sizes,
                    relation,
                    moving,
                });
            }
        }
    }

    // Countries
    let mut countries = Vec::new();
    for (&id, country) in &gs.country {
        countries.push(CountryBrief {
            id,
            name: resolve_name(&country.name),
            color: get_country_color(id),
        });
    }

    GalaxyData {
        systems,
        hyperlanes: hyperlanes_vec,
        territory,
        fleets,
        countries,
        player_country_id,
    }
}

fn fleet_type_from_ship_size(ship_size: &str, civilian: bool) -> String {
    let size = ship_size.to_ascii_lowercase();
    if size.contains("science") { "science" }
    else if size.contains("constructor") || size.contains("construction") { "constructor" }
    else if size.contains("colonizer") || size.contains("colony") { "colonizer" }
    else if size.contains("transport") || size.contains("army") { "transport" }
    else if civilian { "civilian" }
    else { "military" }
    .to_string()
}

fn fleet_relation(
    owner: Option<u32>,
    player_country_id: u32,
    relations: Option<&RelationsManager>,
) -> String {
    let Some(owner) = owner else { return "neutral".to_string(); };
    if owner == player_country_id { return "friendly".to_string(); }

    let relation = relations.and_then(|manager| {
        manager.relation.iter().find(|relation| relation.country == Some(owner))
    });
    match relation {
        Some(relation) if relation.is_rival == Some(true)
            || relation.relation_current.unwrap_or(0.0) <= -100.0 => "hostile",
        Some(relation) if relation.defensive_pact == Some(true)
            || relation.federation == Some(true)
            || relation.relation_current.unwrap_or(0.0) >= 100.0 => "friendly",
        _ => "neutral",
    }
    .to_string()
}

fn fleet_is_moving_between_systems(manager: &MovementManager) -> bool {
    if matches!(manager.state.as_deref(), Some("move_wind_up" | "move_wind_down" | "move_mia")) {
        return true;
    }
    if manager.state.as_deref() != Some("move_system") {
        return false;
    }
    let origin = manager.coordinate.as_ref().and_then(|coordinate| coordinate.origin);
    let target_origin = manager.target_coordinate.as_ref().and_then(|coordinate| coordinate.origin);
    if origin.is_some() && target_origin.is_some() && origin != target_origin {
        return true;
    }
    manager.path.as_ref().is_some_and(|path| {
        path.node.iter().any(|node| node.ftl.as_deref().is_some_and(|ftl| !ftl.is_empty()))
    })
}

pub fn extract_system_view(
    gs: &Gamestate,
    system_id: u32,
    fleet_owners: &HashMap<u32, u32>,
    name_vars: &HashMap<u32, String>,
) -> Option<SystemViewData> {
    let obj = gs.galactic_object.get(&system_id)?;
    let planets_data = gs.planets.as_ref();

    let mut planets = Vec::new();
    if let Some(ps) = planets_data {
        for &pid in &obj.planet {
            if let Some(p) = ps.planet.get(&pid) {
                planets.push(PlanetOrbital {
                    id: pid,
                    name: resolve_planet_name(&p.name, pid, name_vars),
                    planet_class: p.planet_class.clone().unwrap_or_default(),
                    size: p.planet_size.unwrap_or(10),
                    orbit: p.orbit.unwrap_or(0.0),
                    colonized: p.owner.is_some(),
                    owner: p.owner,
                });
            }
        }
    }

    // Fleets in this system
    let mut fleets = Vec::new();
    for (&fid, fleet) in &gs.fleet {
        if let Some(mm) = &fleet.movement_manager {
            if let Some(coord) = &mm.coordinate {
                if coord.origin == Some(system_id) {
                    let owner = fleet_owners.get(&fid).copied();
                    let civilian = fleet.civilian.last().copied().unwrap_or(false);
                    let player_relations = gs.country.get(&0).and_then(|country| country.relations_manager.as_ref());
                    fleets.push(FleetIcon {
                        id: fid,
                        x: coord.x,
                        y: coord.y,
                        system_id,
                        civilian,
                        station: fleet.station.last().copied().unwrap_or(false),
                        military_power: fleet.military_power.unwrap_or(0.0),
                        owner,
                        fleet_type: if civilian { "civilian" } else { "military" }.to_string(),
                        ship_size: "unknown".to_string(),
                        ship_sizes: Vec::new(),
                        relation: fleet_relation(owner, 0, player_relations),
                        moving: fleet_is_moving_between_systems(mm),
                    });
                }
            }
        }
    }

    Some(SystemViewData {
        id: system_id,
        name: resolve_name(&obj.name),
        star_class: obj.star_class.clone().unwrap_or_default(),
        planets,
        fleets,
    })
}

pub fn extract_fleet_detail(
    gs: &Gamestate,
    fleet_id: u32,
    design_info: &HashMap<u32, DesignInfo>,
) -> Option<FleetDetail> {
    let fleet = gs.fleet.get(&fleet_id)?;

    let mut ships = Vec::new();
    let mut commander: Option<LeaderBrief> = None;

    for &ship_id in &fleet.ships {
        if let Some(ship) = gs.ships.get(&ship_id) {
            let ship_size = get_ship_size(gs, ship, design_info);
            let max_hp = ship.max_hitpoints.unwrap_or(1.0);
            let max_sh = ship.max_shield_hitpoints.unwrap_or(1.0);
            let max_ar = ship.max_armor_hitpoints.unwrap_or(1.0);

            ships.push(ShipBrief {
                id: ship_id,
                name: resolve_name(&ship.name),
                ship_size,
                hp_pct: ship.hitpoints.unwrap_or(0.0) / max_hp.max(1.0) * 100.0,
                shield_pct: ship.shield_hitpoints.unwrap_or(0.0) / max_sh.max(1.0) * 100.0,
                armor_pct: ship.armor_hitpoints.unwrap_or(0.0) / max_ar.max(1.0) * 100.0,
            });

            // Get commander from first ship with a leader
            if commander.is_none() {
                if let Some(leader_id) = ship.leader {
                    if let Some(leader) = gs.leaders.get(&leader_id) {
                        commander = Some(LeaderBrief {
                            name: resolve_leader_name(&leader.name),
                            class: leader.class.clone().unwrap_or_default(),
                            level: leader.level.unwrap_or(1),
                            portrait: leader.portrait.clone().unwrap_or_default(),
                            age: leader.age.unwrap_or(0),
                            experience: leader.experience.unwrap_or(0.0),
                            traits: leader.traits.clone(),
                        });
                    }
                }
            }
        }
    }

    let movement_state = fleet
        .movement_manager
        .as_ref()
        .and_then(|mm| mm.state.clone())
        .unwrap_or_else(|| "idle".to_string());

    let destination = fleet
        .movement_manager
        .as_ref()
        .and_then(|mm| mm.orbit.as_ref())
        .and_then(|o| o.orbitable.as_ref())
        .and_then(|ob| {
            ob.planet
                .and_then(|pid| {
                    gs.planets
                        .as_ref()
                        .and_then(|ps| ps.planet.get(&pid))
                        .map(|p| resolve_name(&p.name))
                })
        })
        .unwrap_or_default();

    Some(FleetDetail {
        id: fleet_id,
        name: resolve_name(&fleet.name),
        military_power: fleet.military_power.unwrap_or(0.0),
        hit_points: fleet.hit_points.unwrap_or(0.0),
        civilian: fleet.civilian.last().copied().unwrap_or(false),
        station: fleet.station.last().copied().unwrap_or(false),
        stance: fleet.fleet_stance.clone().unwrap_or_default(),
        ships,
        commander,
        movement_state,
        destination,
    })
}

fn get_ship_size(gs: &Gamestate, ship: &Ship, design_info: &HashMap<u32, DesignInfo>) -> String {
    if let Some(impl_) = &ship.ship_design_implementation {
        if let Some(design_id) = impl_.design {
            if let Some(info) = design_info.get(&design_id) {
                if !info.ship_size.is_empty() {
                    return info.ship_size.clone();
                }
            }
            if let Some(design) = gs.ship_design.get(&design_id) {
                let stage_index = impl_.growth_stage.unwrap_or(0) as usize;
                if let Some(size) = design
                    .growth_stages
                    .get(stage_index)
                    .or_else(|| design.growth_stages.first())
                    .and_then(|stage| stage.ship_size.as_ref())
                {
                    if !size.is_empty() {
                        return size.clone();
                    }
                }
            }
        }
    }

    // Older/partially parsed saves can still reveal civilian purpose through
    // their section template even when the design table cannot be joined.
    let sections = ship.section.iter()
        .filter_map(|section| section.design.as_deref())
        .collect::<Vec<_>>()
        .join("_")
        .to_ascii_lowercase();
    if sections.contains("science") { return "science".to_string(); }
    if sections.contains("constructor") || sections.contains("construction") { return "constructor".to_string(); }
    if sections.contains("colon") { return "colonizer".to_string(); }
    if sections.contains("transport") || sections.contains("army") { return "transport".to_string(); }
    "unknown".to_string()
}

pub fn extract_ship_detail(
    gs: &Gamestate,
    ship_id: u32,
    design_info: &HashMap<u32, DesignInfo>,
) -> Option<ShipDetail> {
    let ship = gs.ships.get(&ship_id)?;

    let mut ship_size = "unknown".to_string();
    let mut design_name = String::new();
    let mut core_components: Vec<String> = Vec::new();
    let mut design_utilities: Vec<ComponentSlot> = Vec::new();

    if let Some(impl_) = &ship.ship_design_implementation {
        if let Some(design_id) = impl_.design {
            if let Some(design) = gs.ship_design.get(&design_id) {
                design_name = resolve_name(&design.name);
                let stage_index = impl_.growth_stage.unwrap_or(0) as usize;
                if let Some(stage) = design
                    .growth_stages
                    .get(stage_index)
                    .or_else(|| design.growth_stages.first())
                {
                    ship_size = stage.ship_size.clone().unwrap_or_default();
                    core_components = stage.required_component.clone();
                    for section in &stage.section {
                        for component in &section.component {
                            let slot = component.slot.clone().unwrap_or_default();
                            if slot.contains("UTILITY") || slot.contains("AUX") {
                                design_utilities.push(ComponentSlot {
                                    slot,
                                    template: component.template.clone().unwrap_or_default(),
                                });
                            }
                        }
                    }
                }
            }
            // Fallback for saves whose design shape could not be deserialized.
            if let Some(info) = design_info.get(&design_id) {
                if ship_size.is_empty() {
                    ship_size = info.ship_size.clone();
                }
                if core_components.is_empty() {
                    core_components = info.required_components.clone();
                }
                if design_utilities.is_empty() {
                    for sec in &info.sections {
                        for (slot, template) in &sec.components {
                            if slot.contains("UTILITY") || slot.contains("AUX") {
                                design_utilities.push(ComponentSlot {
                                    slot: slot.clone(),
                                    template: template.clone(),
                                });
                            }
                        }
                    }
                }
            }
        }
    }

    // Weapons from actual ship sections (repeated keys, parsed by jomini)
    let mut weapons = Vec::new();
    let mut sections = Vec::new();
    for sec in &ship.section {
        sections.push(SectionInfo {
            slot: sec.slot.clone().unwrap_or_default(),
            template: sec.design.clone().unwrap_or_default(),
        });
        for w in &sec.weapon {
            weapons.push(ComponentSlot {
                slot: w.component_slot.clone().unwrap_or_default(),
                template: w.template.clone().unwrap_or_default(),
            });
        }
        for sc in &sec.strike_craft {
            weapons.push(ComponentSlot {
                slot: sc.component_slot.clone().unwrap_or_default(),
                template: sc.template.clone().unwrap_or_default(),
            });
        }
    }

    Some(ShipDetail {
        id: ship_id,
        name: resolve_name(&ship.name),
        ship_size,
        design_name,
        hitpoints: ship.hitpoints.unwrap_or(0.0),
        max_hitpoints: ship.max_hitpoints.unwrap_or(0.0),
        shield: ship.shield_hitpoints.unwrap_or(0.0),
        max_shield: ship.max_shield_hitpoints.unwrap_or(0.0),
        armor: ship.armor_hitpoints.unwrap_or(0.0),
        max_armor: ship.max_armor_hitpoints.unwrap_or(0.0),
        speed: ship.speed.unwrap_or(0.0),
        weapons,
        utilities: design_utilities,
        core_components,
        sections,
    })
}

/// District-slot contribution (generator, mining, farming) of a deposit type.
/// Generated from `district_<type>_max_add` in common/deposits/*.txt (Stellaris 4.4).
/// A deposit may contribute to several categories, and some contributions are negative.
fn deposit_district_add(deposit_type: &str) -> (i32, i32, i32) {
    match deposit_type {
        "d_abandoned_mining_tunnels" => (0, 6, 0),
        "d_abandoned_primitive_homesteads" => (0, 0, 2),
        "d_ancient_facilities" => (3, 0, 0),
        "d_ancient_mining_site" => (0, 5, 0),
        "d_ancient_reactor_pits" => (6, 0, 0),
        "d_arid_highlands" => (1, 0, 0),
        "d_aura_blocker" => (0, 0, 1),
        "d_betharian_deposit" => (0, 4, 0),
        "d_black_soil" => (0, 0, 3),
        "d_boggy_fens" => (0, 0, 1),
        "d_bogplants" => (0, 0, 1),
        "d_boswash_metropolitan_axis" => (3, 0, 0),
        "d_bountiful_plains" => (0, 0, 1),
        "d_bubbling_swamp" => (0, 0, 3),
        "d_buzzing_plains" => (1, 0, 0),
        "d_crater_bluelotus" => (0, 1, 0),
        "d_crystal_forest" => (0, 3, 0),
        "d_crystal_kraken_body" => (0, 3, 0),
        "d_crystal_kraken_body_bombed" => (0, 3, 0),
        "d_crystal_reef" => (0, 3, 0),
        "d_crystaline_growths" => (0, 1, 0),
        "d_crystalline_caverns" => (0, 3, 0),
        "d_dayside_farm" => (6, 0, 0),
        "d_delhi_sprawl" => (2, 0, 0),
        "d_dust_caverns" => (3, 0, 0),
        "d_dust_desert" => (3, 0, 0),
        "d_electrified_oceans" => (1, 0, 0),
        "d_empty_quarry" => (0, -2, 0),
        "d_explosive_atmosphere" => (1, 0, 0),
        "d_fallen_orbital_shipyard" => (3, 3, 0),
        "d_fertile_lands" => (0, 0, 2),
        "d_forceful_winds" => (5, 0, 0),
        "d_forgiving_tundra" => (0, 0, 1),
        "d_frozen_gas_lake" => (2, 0, 0),
        "d_fuming_bog" => (0, 0, 3),
        "d_fungal_caves" => (0, 0, 2),
        "d_fungal_forest" => (0, 0, 3),
        "d_geothermal_hotspot" => (2, 0, 0),
        "d_geothermal_vent" => (3, 0, 0),
        "d_great_albertan_crater" => (0, 3, 0),
        "d_great_river" => (0, 0, 2),
        "d_green_hills" => (0, 0, 1),
        "d_harvester_fields" => (0, 0, 6),
        "d_hostile_fauna" => (0, 0, 1),
        "d_hostile_flora" => (0, 0, 1),
        "d_hot_springs" => (1, 0, 0),
        "d_hyperfertile_valley" => (0, 0, 5),
        "d_immense_solar_array" => (3, 0, 0),
        "d_impact_crater" => (0, 3, 0),
        "d_industrial_sector" => (0, 0, 6),
        "d_irradiated_valley" => (3, 0, 0),
        "d_junk_canals" => (0, 0, 3),
        "d_junk_hollows" => (3, 0, 0),
        "d_junk_wastes" => (0, 3, 0),
        "d_lava_tubes" => (0, 3, 0),
        "d_lichen_fields" => (0, 0, 1),
        "d_lithoid_crater" => (0, 6, -6),
        "d_lush_jungle" => (0, 0, 2),
        "d_magnetic_storm_1_minerals" => (0, 3, 0),
        "d_magnetic_storm_3_mix" => (0, 1, 0),
        "d_marvelous_oasis" => (0, 0, 3),
        "d_mauritanian_security_zone" => (0, 1, 0),
        "d_mesopotamian_urban_corridor" => (0, 3, 0),
        "d_metal_boneyard" => (0, 4, 0),
        "d_metallic_puddles" => (0, 0, 3),
        "d_migrating_forests" => (-1, -1, -1),
        "d_mineral_fields" => (0, 1, 0),
        "d_mineral_striations" => (0, 1, 0),
        "d_nano_corpses" => (0, 3, 0),
        "d_nanosands" => (0, 2, 0),
        "d_natural_farmland" => (0, 0, 1),
        "d_numas_breath" => (3, 0, 0),
        "d_nutritious_mudland" => (0, 0, 1),
        "d_ore_rich_caverns" => (0, 1, 0),
        "d_organic_landfill" => (4, 0, 0),
        "d_pacific_algae_tracts" => (0, 0, 3),
        "d_pearl_river_agglomerate" => (3, 0, 0),
        "d_planet_stripmine" => (0, 10, 0),
        "d_polaris_city" => (0, 3, 0),
        "d_project_cornucopia" => (0, 4, 0),
        "d_prospectorium_strip_mine" => (0, 2, 0),
        "d_prosperous_mesa" => (0, 2, 0),
        "d_red_desert" => (0, 2, 0),
        "d_relic_metal_boneyard" => (0, 3, 0),
        "d_rich_mountain" => (0, 3, 0),
        "d_rockworm_hive" => (0, 5, 0),
        "d_rockworm_hive_volcanic" => (0, 5, 0),
        "d_rugged_woods" => (0, 0, 1),
        "d_rushing_waterfalls" => (2, 0, 0),
        "d_saharan_irrigation_project" => (0, 0, 4),
        "d_scandinavian_reclamation_sector" => (0, 0, 1),
        "d_searing_desert" => (2, 0, 0),
        "d_shroud_storm_2_zro" => (0, 0, -1),
        "d_shroudstone" => (0, 1, 0),
        "d_sky_mountain" => (0, 2, 0),
        "d_solar_storm_2_districts" => (3, 0, 0),
        "d_submerged_ore_veins" => (0, 3, 0),
        "d_teeming_reef" => (0, 0, 3),
        "d_tempestous_mountain" => (3, 0, 0),
        "d_tree_of_life_colony" => (0, 0, 2),
        "d_tree_of_life_home" => (0, 0, 4),
        "d_tropical_island" => (0, 0, 3),
        "d_turtle_corpse" => (0, 3, 3),
        "d_underground_contact_zone" => (2, 0, 0),
        "d_underground_farm" => (0, 0, 3),
        "d_underground_generator" => (3, 0, 0),
        "d_underground_mine" => (0, 3, 0),
        "d_underground_vault_2" => (0, 2, 0),
        "d_underwater_vent" => (3, 0, 0),
        "d_veiny_cliffs" => (0, 1, 0),
        "d_volcanic_active_planet" => (0, 3, 0),
        "d_volcanic_fumarole" => (0, 3, 0),
        "d_volcanic_lava_river" => (0, 3, 0),
        "d_volcanic_mineral_fields" => (0, 2, 0),
        "d_volcanic_mineral_hills" => (0, 1, 0),
        "d_volcanic_mineral_layers" => (0, 2, 0),
        "d_volcanic_ore_caverns" => (0, 2, 0),
        "d_volcanic_ore_veins" => (0, 1, 0),
        "d_volcanic_rich_mountain" => (0, 2, 0),
        "d_volcanic_stifling_atmosphere" => (0, 3, 0),
        "d_volcanic_sulfur_lava" => (0, 2, 0),
        "d_volcanic_weak_crust" => (0, 2, 0),
        "d_wilderness_farming" => (0, 0, -1),
        "d_wilderness_farming_2" => (0, 0, -2),
        "d_wilderness_generator" => (-1, 0, 0),
        "d_wilderness_generator_2" => (-2, 0, 0),
        "d_wilderness_mining" => (0, -1, 0),
        "d_wilderness_mining_2" => (0, -2, 0),
        "d_worm_farm" => (0, 0, 4),
        "d_worm_mine" => (0, 4, 0),
        _ => (0, 0, 0),
    }
}

fn deposit_blocked_districts(deposit_type: &str) -> u32 {
    match deposit_type {
        "d_abandoned_cities" |
        "d_active_volcano" |
        "d_archaeological_site" |
        "d_assimilators_ruins" |
        "d_aura_blocker" |
        "d_big_nature_preserve_blocker" |
        "d_biological_enclaves" |
        "d_bioship_remains" |
        "d_blue_lava" |
        "d_bomb_crater" |
        "d_city_ruins" |
        "d_coagulated_landscape" |
        "d_collapsed_burrows" |
        "d_collapsed_spire" |
        "d_crater" |
        "d_crumbling_mining_tunnels" |
        "d_dangerous_wildlife_blocker" |
        "d_decrepit_dwellings" |
        "d_decrepit_tunnels_1" |
        "d_decrepit_tunnels_2" |
        "d_decrepit_tunnels_3" |
        "d_deep_sinkhole" |
        "d_dense_jungle" |
        "d_devastated_cities" |
        "d_devoured_continent" |
        "d_eater_deposit" |
        "d_egg_cracking" |
        "d_exploited_deposit_blocker" |
        "d_exterminators_ruins" |
        "d_failing_infrastructure" |
        "d_failing_infrastructure_earth" |
        "d_flooded_reactor_pits" |
        "d_floodplains" |
        "d_forgotten_civilization" |
        "d_former_battlefield" |
        "d_fungoid_extermination" |
        "d_genesis_preserve" |
        "d_georadiation_displacement" |
        "d_ghostly_canyon" |
        "d_gravity_storm_3_engineering" |
        "d_great_pacific_garbage_patch" |
        "d_invasion_site" |
        "d_kaiju_lair" |
        "d_landgrab_blocker" |
        "d_lethal_ecosphere_blocker" |
        "d_lithoid_devastation" |
        "d_living_snow_reserve" |
        "d_machine_empire_ruins" |
        "d_machine_ongoing_construction" |
        "d_machine_prototype_pc_machine" |
        "d_malfunctioning_reactor" |
        "d_mass_graves" |
        "d_massive_crevice" |
        "d_massive_glacier" |
        "d_mothballed_facilities" |
        "d_mountain_range" |
        "d_mountains_of_steel" |
        "d_nanotech_devastation" |
        "d_nature_preserve_blocker" |
        "d_noxious_swamp" |
        "d_old_towns" |
        "d_particle_storm_1_society" |
        "d_particle_storm_2_unity" |
        "d_poisonous_algae" |
        "d_quicksand_basin" |
        "d_radioactive_ruins" |
        "d_radioactive_wasteland" |
        "d_raging_lavafalls" |
        "d_resource_consolidation_1" |
        "d_rotten_soil" |
        "d_rugged_landscape" |
        "d_ruined_arcology" |
        "d_ruined_building_blocker" |
        "d_ruined_district" |
        "d_ruined_hatchery" |
        "d_ruined_sanctum_of_the_lost" |
        "d_scorched_plains" |
        "d_seed_bombing_fungoid_blocker" |
        "d_seed_bombing_plantoid_blocker" |
        "d_segment_rubble_1" |
        "d_segment_rubble_1_small" |
        "d_segment_rubble_2" |
        "d_segment_rubble_3" |
        "d_segment_rubble_4" |
        "d_sentinels" |
        "d_shattered_solar_array" |
        "d_shimmering_structure" |
        "d_ship_debris_broken_shackles_blocker" |
        "d_ship_debris_payback_blocker" |
        "d_shroud_flora_deposit" |
        "d_shroudfall" |
        "d_shroudgate" |
        "d_shroudstone" |
        "d_sinkhole_subterraneans" |
        "d_space_ship_graveyard" |
        "d_spawning_complex_blocker" |
        "d_sprawling_landfill_blocker" |
        "d_sr_diurnal_regulator" |
        "d_sr_power_grid" |
        "d_sr_ring_gyros" |
        "d_sr_vacuum_fields" |
        "d_star_mall_blocker" |
        "d_star_mall_promenade_blocker" |
        "d_strip_mine" |
        "d_tainted_snowcaps" |
        "d_technocracy_molten_waste_blocker" |
        "d_technocracy_toxic_waste_blocker" |
        "d_terraforming_blocker" |
        "d_titanic_life_blocker" |
        "d_tomb_world_ruins" |
        "d_tomb_world_wasteland" |
        "d_toxic_god_blight_upon_the_land" |
        "d_toxic_god_deitys_swarms" |
        "d_toxic_god_envenomed_seas" |
        "d_toxic_god_pestilential_wasteland" |
        "d_toxic_god_pools_most_venemous" |
        "d_toxic_kelp" |
        "d_unplugged_assimilator_hulk" |
        "d_unsupervised_settlement" |
        "d_venomous_insects" |
        "d_wandering_forests" |
        "d_wilderness_city" |
        "d_wilderness_city_2" |
        "d_wilderness_farming" |
        "d_wilderness_farming_2" |
        "d_wilderness_generator" |
        "d_wilderness_generator_2" |
        "d_wilderness_glade_blocker" |
        "d_wilderness_industrial" |
        "d_wilderness_industrial_2" |
        "d_wilderness_mining" |
        "d_wilderness_mining_2" => 1,
        _ => 0,
    }
}

fn deposit_icon_key(deposit_type: &str) -> &str {
    match deposit_type {
        "d_mesopotamian_urban_corridor" => "d_marvelous_oasis",
        "d_boswash_metropolitan_axis" | "d_delhi_sprawl" => "d_city",
        "d_pearl_river_agglomerate" => "d_building_complex",
        "d_mauritanian_security_zone" | "d_genesis_preserve" => "d_quarantine_zone",
        "d_great_albertan_crater" => "d_crater",
        "d_scandinavian_reclamation_sector" => "d_radioactive_wasteland",
        "d_saharan_irrigation_project" => "d_green_hills",
        "d_pacific_algae_tracts" => "d_toxic_kelp",
        _ => deposit_type,
    }
}

fn job_category(job_type: &str) -> &str {
    match job_type {
        "politician" => "ruler",
        "physicist" | "biologist" | "engineer" | "bureaucrat" | "enforcer"
        | "entertainer" | "trader" | "foundry" | "artisan" => "specialist",
        "technician" | "miner" | "farmer" => "worker",
        "civilian" => "civilian",
        "xeno_zoo_animal" => "pre_sapients",
        _ => "other",
    }
}

fn species_name(gs: &Gamestate, species_id: u32) -> String {
    gs.species_db
        .get(&species_id)
        .map(|species| resolve_name(&species.name))
        .unwrap_or_else(|| format!("Species {species_id}"))
}

pub fn extract_planet_detail(gs: &Gamestate, planet_id: u32, name_vars: &HashMap<u32, String>) -> Option<PlanetDetail> {
    let planets_data = gs.planets.as_ref()?;
    let planet = planets_data.planet.get(&planet_id)?;

    let governor = planet.governor.and_then(|gid| {
        gs.leaders.get(&gid).map(|l| LeaderBrief {
            name: resolve_leader_name(&l.name),
            class: l.class.clone().unwrap_or_default(),
            level: l.level.unwrap_or(1),
            portrait: l.portrait.clone().unwrap_or_default(),
            age: l.age.unwrap_or(0),
            experience: l.experience.unwrap_or(0.0),
            traits: l.traits.clone(),
        })
    });

    let owner_name = planet.owner.and_then(|oid| {
        gs.country
            .get(&oid)
            .map(|c| resolve_name(&c.name))
    }).unwrap_or_default();

    let mut modifiers: Vec<PlanetModifierInfo> = planet
        .planet_modifier
        .iter()
        .map(|pm| PlanetModifierInfo { key: pm.clone(), days: -1 })
        .collect();
    if let Some(tm) = &planet.timed_modifier {
        for item in &tm.items {
            if let Some(key) = &item.modifier {
                modifiers.push(PlanetModifierInfo {
                    key: key.clone(),
                    days: item.days.unwrap_or(-1),
                });
            }
        }
    }

    let mut districts = Vec::new();
    for &did in &planet.districts {
        if let Some(d) = gs.districts.get(&did) {
            let mut zones = Vec::new();
            for &zid in &d.zones {
                if zid == u32::MAX {
                    // Locked specialization slot.
                    zones.push(ZoneInfo {
                        id: zid,
                        zone_type: String::new(),
                        locked: true,
                        slots: 0,
                        buildings: Vec::new(),
                    });
                } else if let Some(z) = gs.zones.get(&zid) {
                    let zone_type = z.zone_type.clone().unwrap_or_default();
                    let slots = if zone_type == "zone_default" { 6 } else { 3 };
                    let mut zbuildings = Vec::new();
                    for &bid in &z.buildings {
                        if let Some(b) = gs.buildings.get(&bid) {
                            zbuildings.push(BuildingInfo {
                                id: bid,
                                building_type: b.building_type.clone().unwrap_or_default(),
                                position: b.position.unwrap_or(0),
                            });
                        }
                    }
                    zones.push(ZoneInfo {
                        id: zid,
                        zone_type,
                        locked: false,
                        slots,
                        buildings: zbuildings,
                    });
                }
            }
            districts.push(DistrictInfo {
                id: did,
                district_type: d.district_type.clone().unwrap_or_default(),
                level: d.level.unwrap_or(1),
                zones,
            });
        }
    }

    let mut buildings = Vec::new();
    for &bid in &planet.buildings_cache {
        if let Some(b) = gs.buildings.get(&bid) {
            buildings.push(BuildingInfo {
                id: bid,
                building_type: b.building_type.clone().unwrap_or_default(),
                position: b.position.unwrap_or(0),
            });
        }
    }

    let mut produces = ResourceInfo::default();
    if let Some(p) = &planet.produces {
        produces.add(p);
    }
    let mut upkeep = ResourceInfo::default();
    if let Some(u) = &planet.upkeep {
        upkeep.add(u);
    }

    // Resolve deposit IDs to types and sum their district-slot contributions.
    // The cap for a resource district type is the sum of district_<type>_max_add
    // across the planet's deposits (see common/deposits/*.txt), not the deposit count.
    let mut resource_deposits = ResourceDepositCounts::default();
    let mut blocked_districts = 0;
    let mut features = Vec::new();
    for &dep_id in &planet.deposits {
        if let Some(dep) = gs.deposit.get(&dep_id) {
            if let Some(t) = dep.deposit_type.as_deref() {
                blocked_districts += deposit_blocked_districts(t);
                let (g, m, f) = deposit_district_add(t);
                resource_deposits.generator += g;
                resource_deposits.mining += m;
                resource_deposits.farming += f;
                features.push(PlanetFeatureInfo {
                    id: dep_id,
                    feature_type: t.to_string(),
                    icon_key: deposit_icon_key(t).to_string(),
                });
            }
        }
    }

    let mut pop_groups = Vec::new();
    let mut species_totals: HashMap<u32, f64> = HashMap::new();
    for &group_id in &planet.pop_groups {
        let Some(group) = gs.pop_groups.get(&group_id) else { continue };
        let Some(key) = group.key.as_ref() else { continue };
        let species_id = key.species.unwrap_or(0);
        let size = group.size.unwrap_or(0.0);
        *species_totals.entry(species_id).or_default() += size;
        pop_groups.push(PlanetPopGroupInfo {
            id: group_id,
            species_id,
            species_name: species_name(gs, species_id),
            category: key.category.clone().unwrap_or_default(),
            size,
            happiness: group.happiness.unwrap_or(0.0),
            habitability: group.habitability.unwrap_or(0.0),
        });
    }
    let mut species: Vec<_> = species_totals
        .into_iter()
        .map(|(id, pops)| {
            let model = gs.species_db.get(&id);
            PlanetSpeciesInfo {
                id,
                name: species_name(gs, id),
                class: model.and_then(|item| item.class.clone()).unwrap_or_default(),
                portrait: model.and_then(|item| item.portrait.clone()).unwrap_or_default(),
                pops,
            }
        })
        .collect();
    species.sort_by(|a, b| b.pops.total_cmp(&a.pops));

    let mut jobs = Vec::new();
    for &job_id in &planet.pop_jobs {
        let Some(job) = gs.pop_jobs.get(&job_id) else { continue };
        let workforce = job.workforce.unwrap_or(0.0);
        if workforce <= 0.0 { continue; }
        let job_type = job.job_type.clone().unwrap_or_default();
        jobs.push(PlanetJobInfo {
            id: job_id,
            category: job_category(&job_type).to_string(),
            job_type,
            workforce,
            max_workforce: job.max_workforce.unwrap_or(-1.0),
            bonus_workforce: job.bonus_workforce.unwrap_or(0.0),
        });
    }

    let mut army_units = Vec::new();
    for &army_id in &planet.army {
        let Some(army) = gs.army.get(&army_id) else { continue };
        let species_id = army.species.unwrap_or(0);
        let max_health = army.max_health.unwrap_or(0.0);
        let morale = army.morale.unwrap_or(0.0);
        let has_exoskeletons = army.owner
            .and_then(|owner| gs.country.get(&owner))
            .and_then(|country| country.tech_status.as_ref())
            .is_some_and(|status| status.technology.iter().any(|tech| tech == "tech_powered_exoskeletons"));
        let template_damage = if army.army_type.as_deref() == Some("defense_army") { 1.5 } else { 1.0 };
        let damage_modifier = if has_exoskeletons { 1.05 } else { 1.0 };
        let damage = 2.25 * template_damage * damage_modifier;
        let effective_damage = damage * 1.5;
        let effective_health = max_health + morale * 0.5;
        let power = (effective_health * effective_damage).powf(0.65) * 0.25;
        army_units.push(PlanetArmyInfo {
            id: army_id,
            name: resolve_name(&army.name),
            army_type: army.army_type.clone().unwrap_or_default(),
            species_id,
            species_name: species_name(gs, species_id),
            health: army.health.unwrap_or(0.0),
            max_health,
            morale,
            power,
        });
    }
    let army_power = army_units.iter().map(|army| army.power).sum();
    let has_assault_armies = planet.owner
        .and_then(|owner| gs.country.get(&owner))
        .and_then(|country| country.tech_status.as_ref())
        .is_some_and(|status| status.technology.iter().any(|tech| tech == "tech_assault_armies"));
    let recruitable_armies = if has_assault_armies {
        species.first().map(|item| vec![RecruitableArmyInfo {
            army_type: "assault_army".to_string(),
            species_id: item.id,
            species_name: item.name.clone(),
            build_time: 90,
            mineral_cost: 100.0,
        }]).unwrap_or_default()
    } else {
        Vec::new()
    };

    let mut monthly_population = MonthlyPopulationInfo::default();
    if let Some(growth) = &planet.last_month_growth_data {
        monthly_population.net = growth.growth_and_size.as_ref().and_then(|item| item.growth).unwrap_or(0.0);
        if let Some(details) = &growth.current_month_growth_details {
            for (key, value) in details.key.iter().zip(&details.value) {
                match key.as_str() {
                    "GROWTH_CAT_GROWTH" => monthly_population.growth = *value,
                    "GROWTH_CAT_EMIGRATION" => monthly_population.migration = -*value,
                    "GROWTH_CAT_ASSEMBLY" => monthly_population.assembly = *value,
                    _ => {}
                }
            }
        }
    }

    Some(PlanetDetail {
        id: planet_id,
        name: resolve_planet_name(&planet.name, planet_id, name_vars),
        planet_class: planet.planet_class.clone().unwrap_or_default(),
        size: planet.planet_size.unwrap_or(0),
        owner: planet.owner,
        owner_name,
        governor,
        stability: planet.stability.unwrap_or(0.0),
        crime: planet.crime.unwrap_or(0.0),
        devastation: planet.bombardment_damage.unwrap_or(0.0),
        amenities: planet.amenities.unwrap_or(0.0),
        amenities_usage: planet.amenities_usage.unwrap_or(0.0),
        free_amenities: planet.free_amenities.unwrap_or(0.0),
        free_housing: planet.free_housing.unwrap_or(0.0),
        total_housing: planet.total_housing.unwrap_or(0.0),
        housing_usage: planet.housing_usage.unwrap_or(0.0),
        employable_pops: planet.employable_pops.unwrap_or(0.0),
        civilian: planet.civilian.unwrap_or(0.0),
        num_pops: planet.num_sapient_pops.unwrap_or(0),
        ascension_tier: planet.ascension_tier.unwrap_or(0),
        colonize_date: planet.colonize_date.clone().unwrap_or_default(),
        designation: planet.final_designation.clone().unwrap_or_default(),
        produces,
        upkeep,
        districts,
        buildings,
        armies: army_units.len() as u32,
        army_power,
        army_units,
        recruitable_armies,
        deposits_count: planet.deposits.len() as u32,
        features,
        species,
        pop_groups,
        jobs,
        monthly_population,
        resource_deposits,
        blocked_districts,
        modifiers,
    })
}

pub fn extract_player_info(
    gs: &Gamestate,
    fleet_owners: &HashMap<u32, u32>,
    name_vars: &HashMap<u32, String>,
) -> Option<PlayerInfo> {
    let player_id = 0u32;
    let country = gs.country.get(&player_id)?;

    let resources = country
        .modules
        .as_ref()
        .and_then(|m| m.standard_economy_module.as_ref())
        .and_then(|e| e.resources.as_ref());

    let res = ResourceInfo {
        energy: resources.and_then(|r| r.energy).unwrap_or(0.0),
        minerals: resources.and_then(|r| r.minerals).unwrap_or(0.0),
        food: resources.and_then(|r| r.food).unwrap_or(0.0),
        physics_research: resources.and_then(|r| r.physics_research).unwrap_or(0.0),
        society_research: resources.and_then(|r| r.society_research).unwrap_or(0.0),
        engineering_research: resources.and_then(|r| r.engineering_research).unwrap_or(0.0),
        influence: resources.and_then(|r| r.influence).unwrap_or(0.0),
        unity: resources.and_then(|r| r.unity).unwrap_or(0.0),
        trade: resources.and_then(|r| r.trade).unwrap_or(0.0),
        consumer_goods: resources.and_then(|r| r.consumer_goods).unwrap_or(0.0),
        alloys: resources.and_then(|r| r.alloys).unwrap_or(0.0),
        volatile_motes: resources.and_then(|r| r.volatile_motes).unwrap_or(0.0),
        exotic_gases: resources.and_then(|r| r.exotic_gases).unwrap_or(0.0),
        rare_crystals: resources.and_then(|r| r.rare_crystals).unwrap_or(0.0),
        living_metal: resources.and_then(|r| r.sr_living_metal).unwrap_or(0.0),
        zro: resources.and_then(|r| r.sr_zro).unwrap_or(0.0),
        dark_matter: resources.and_then(|r| r.sr_dark_matter).unwrap_or(0.0),
        nanites: resources.and_then(|r| r.nanites).unwrap_or(0.0),
        minor_artifacts: resources.and_then(|r| r.minor_artifacts).unwrap_or(0.0),
    };

    let mut monthly_resources = ResourceInfo::default();
    if let Some(last_month) = country
        .budget
        .as_ref()
        .and_then(|budget| budget.last_month.as_ref())
    {
        for balance in last_month
            .balance
            .values()
            .chain(last_month.extra_balance.values())
            .chain(last_month.trade_balance.values())
        {
            monthly_resources.add(balance);
        }
    }

    // Get fleets owned by player from text-scanned fleet_owners
    let mut fleets = Vec::new();
    for (&fid, &cid) in fleet_owners {
        if cid == player_id {
            if let Some(fleet) = gs.fleet.get(&fid) {
                fleets.push(FleetBrief {
                    id: fid,
                    name: resolve_name(&fleet.name),
                    military_power: fleet.military_power.unwrap_or(0.0),
                    ship_count: fleet.ships.len() as u32,
                    civilian: fleet.civilian.last().copied().unwrap_or(false),
                    station: fleet.station.last().copied().unwrap_or(false),
                });
            }
        }
    }

    let mut planets = Vec::new();
    if let Some(ps) = gs.planets.as_ref() {
        for &pid in &country.owned_planets {
            if let Some(p) = ps.planet.get(&pid) {
                planets.push(PlanetBrief {
                    id: pid,
                    name: resolve_planet_name(&p.name, pid, name_vars),
                    planet_class: p.planet_class.clone().unwrap_or_default(),
                    size: p.planet_size.unwrap_or(0),
                    num_pops: p.num_sapient_pops.unwrap_or(0),
                });
            }
        }
    }

    let gov_type = country
        .government
        .as_ref()
        .and_then(|g| g.gov_type.clone())
        .unwrap_or_default();

    Some(PlayerInfo {
        country_id: player_id,
        name: resolve_name(&country.name),
        date: gs.date.clone().unwrap_or_default(),
        government_type: gov_type,
        resources: res,
        monthly_resources,
        fleets,
        planets,
        military_power: country.military_power.unwrap_or(0.0),
        empire_size: country.empire_size.unwrap_or(0),
        num_pops: country.num_sapient_pops.unwrap_or(0),
        envoys: None,
        num_upgraded_starbase: country.num_upgraded_starbase.unwrap_or(0),
        starbase_capacity: country.starbase_capacity.unwrap_or(0),
        used_naval_capacity: country.used_naval_capacity.unwrap_or(0.0),
    })
}
