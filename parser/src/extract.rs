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
    pub amenities: f64,
    pub amenities_usage: f64,
    pub free_housing: f64,
    pub total_housing: f64,
    pub num_pops: u32,
    pub colonize_date: String,
    pub designation: String,
    pub districts: Vec<DistrictInfo>,
    pub armies: u32,
    pub deposits_count: u32,
}

#[derive(Serialize)]
pub struct DistrictInfo {
    pub id: u32,
    pub district_type: String,
    pub level: u32,
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

pub fn extract_planet_detail(gs: &Gamestate, planet_id: u32, name_vars: &HashMap<u32, String>) -> Option<PlanetDetail> {
    let planets_data = gs.planets.as_ref()?;
    let planet = planets_data.planet.get(&planet_id)?;

    let governor = planet.governor.and_then(|gid| {
        gs.leaders.get(&gid).map(|l| LeaderBrief {
            name: resolve_leader_name(&l.name),
            class: l.class.clone().unwrap_or_default(),
            level: l.level.unwrap_or(1),
            portrait: l.portrait.clone().unwrap_or_default(),
        })
    });

    let owner_name = planet.owner.and_then(|oid| {
        gs.country
            .get(&oid)
            .map(|c| resolve_name(&c.name))
    }).unwrap_or_default();

    let mut districts = Vec::new();
    for &did in &planet.districts {
        if let Some(d) = gs.districts.get(&did) {
            districts.push(DistrictInfo {
                id: did,
                district_type: d.district_type.clone().unwrap_or_default(),
                level: d.level.unwrap_or(1),
            });
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
        amenities: planet.amenities.unwrap_or(0.0),
        amenities_usage: planet.amenities_usage.unwrap_or(0.0),
        free_housing: planet.free_housing.unwrap_or(0.0),
        total_housing: planet.total_housing.unwrap_or(0.0),
        num_pops: planet.num_sapient_pops.unwrap_or(0),
        colonize_date: planet.colonize_date.clone().unwrap_or_default(),
        designation: planet.final_designation.clone().unwrap_or_default(),
        districts,
        armies: planet.army.len() as u32,
        deposits_count: planet.deposits.len() as u32,
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
