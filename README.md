# Helldive.live Backend

## Public API Link

```sh
https://utm7j5pjvi.us-east-1.awsapprunner.com/
```

## Usage

Raw Mongo Data:
```sh
/games?faction=terminid&patch=0&difficulty=0&mission=All
```

```sh
faction
Values:
'terminid'
'automaton'
'illuminate'
```

```sh
patch
Values: 0 - 5
0 - Latest patch
```

```sh
difficulty
Values: 7-10
0 - All difficulties
```

```sh
mission
Values:
'All'
'Short'
'Long'
```

Popular loadouts:
```sh
/loadouts
Example data:
"terminid": [
    {
      "patch": "Masters Of Ceremony",
      "data": {
        "totalLoadouts": 1530,
        "strategem": {
          "\"barrage_napalm,eagle_500kg,sentry_mg,sup_quasar_cannon\"": 9,
          "\"backpack_jump,eagle_500kg,orbital_laser,sup_quasar_cannon\"": 7,
          "\"sentry_autocannon,sentry_gatling,sentry_mg,sentry_rocket\"": 5,
          "\"barrage_napalm,eagle_500kg,sentry_gatling,sup_recoilless_rifle\"": 4,
          "\"backpack_supply,barrage_napalm,sup_commando,sup_eat\"": 4,
          "\"barrage_gatling,eagle_500kg,sentry_gatling,sup_recoilless_rifle\"": 3,
          "\"barrage_120,barrage_380,barrage_napalm,exo_emancipator\"": 3,
          "\"backpack_jump,eagle_airstrike,eagle_napalm,sup_commando\"": 3,
          "\"barrage_napalm,eagle_500kg,guard_rover,sup_quasar_cannon\"": 3,
          "\"barrage_napalm,eagle_500kg,sentry_rocket,sup_recoilless_rifle\"": 3,
          "\"mines_at,mines_gas,mines_incendiary,mines_infantry\"": 3,
          "\"backpack_jump,eagle_500kg,orbital_laser,sup_grenade_launcher\"": 3,
          "\"eagle_500kg,orbital_gas,sentry_mg,sup_recoilless_rifle\"": 3,
          "\"barrage_napalm,eagle_500kg,sentry_mg,sup_recoilless_rifle\"": 3,
          "\"barrage_napalm,eagle_500kg,guard_breath,sup_quasar_cannon\"": 3,
          "\"barrage_napalm,eagle_500kg,sentry_mg,sup_mg\"": 3,
          "\"backpack_supply,eagle_cluster,orbital_railcannon,sup_mg\"": 3,
          "\"eagle_500kg,orbital_laser,sentry_gatling,sup_recoilless_rifle\"": 3,
          "\"eagle_500kg,exo_emancipator,guard_rover,sup_arc_thrower\"": 3,
          "\"backpack_shield,eagle_500kg,sentry_gatling,sup_quasar_cannon\"": 3,
          "\"mines_at,mines_incendiary,mines_infantry,sentry_ems\"": 3,
          "\"eagle_500kg,sentry_gatling,sentry_rocket,sup_recoilless_rifle\"": 2,
          "\"barrage_napalm,guard_dog,sentry_gatling,sup_quasar_cannon\"": 2,
          "\"backpack_jump,eagle_airstrike,sentry_autocannon,sup_arc_thrower\"": 2,
          "\"barrage_gatling,grenade_encampment,sentry_arc,sup_airburst_launcher\"": 2,
          "\"backpack_jump,eagle_500kg,sentry_mg,sup_quasar_cannon\"": 2,
          "\"guard_breath,sentry_mg,sentry_rocket,sup_grenade_launcher\"": 2,
          "\"eagle_500kg,sentry_gatling,sentry_mg,sup_eat\"": 2,
          "\"barrage_napalm,sentry_arc,sentry_ems,sentry_mortar\"": 2,
          "\"barrage_napalm,eagle_500kg,sentry_arc,sup_eat\"": 2,
          "\"backpack_supply,eagle_500kg,eagle_strafe,sup_grenade_launcher\"": 2,
          "\"eagle_500kg,eagle_airstrike,sentry_mg,sup_recoilless_rifle\"": 2,
          "\"barrage_napalm,sentry_autocannon,sentry_mg,sup_recoilless_rifle\"": 2,
          "\"eagle_500kg,eagle_cluster,orbital_laser,sup_recoilless_rifle\"": 2,
          "\"backpack_shield,eagle_500kg,orbital_laser,orbital_railcannon\"": 2,
          "\"eagle_strafe,guard_rover,sentry_mg,sup_eat\"": 2,
          "\"barrage_napalm,eagle_500kg,sentry_autocannon,sentry_gatling\"": 2,
          "\"eagle_strafe,orbital_precision,sentry_mg,sup_recoilless_rifle\"": 2,
          "\"backpack_supply,barrage_napalm,sentry_mg,sup_quasar_cannon\"": 2,
          "\"guard_breath,mines_gas,orbital_gas,sup_sterilizer\"": 2,
          "\"barrage_napalm,eagle_500kg,guard_dog,sup_mg\"": 2,
          "\"eagle_500kg,exo_patriot,orbital_laser,sup_railgun\"": 2,
          "\"barrage_napalm,guard_dog,sentry_mg,sup_amr\"": 2,
          "\"eagle_500kg,hover_pack,orbital_laser,sup_flamethrower\"": 2,
          "\"backpack_supply,eagle_airstrike,sentry_gatling,sup_quasar_cannon\"": 2,
          "\"barrage_napalm,eagle_500kg,eagle_cluster,sup_autocannon\"": 2,
          "\"eagle_500kg,eagle_airstrike,guard_rover,sup_quasar_cannon\"": 2,
          "\"sentry_autocannon,sentry_mg,sentry_rocket,sup_recoilless_rifle\"": 2,
          "\"eagle_500kg,guard_rover,orbital_gas,sup_stalwart\"": 2,
          "\"barrage_napalm,exo_patriot,orbital_gas,sup_recoilless_rifle\"": 2
        },
        "weapons": {
          "\"eruptor,grenade_termite,redeemer\"": 19,
          "\"breaker_inc,grenade_pistol,grenade_termite\"": 17,
          "\"cookout,grenade_gas,grenade_pistol\"": 17,
          "\"grenade_pistol,grenade_termite,liberator_pen\"": 15,
          "\"breaker,grenade_he,redeemer\"": 10,
          "\"grenade_he,liberator_pen,redeemer\"": 9,
          "\"breaker,grenade_pistol,grenade_termite\"": 9,
          "\"cookout,grenade_pistol,grenade_termite\"": 8,
          "\"breaker,grenade_impact,redeemer\"": 8,
          "\"breaker_inc,grenade_impact,senator\"": 8,
          "\"eruptor,grenade_termite,senator\"": 8,
          "\"breaker_inc,grenade_inc_impact,grenade_pistol\"": 8,
          "\"breaker_inc,grenade_gas,ultimatum\"": 8,
          "\"grenade_pistol,grenade_termite,sickle\"": 6,
          "\"grenade_impact,liberator_pen,redeemer\"": 6,
          "\"breaker,grenade_termite,redeemer\"": 6,
          "\"cookout,grenade_termite,ultimatum\"": 6,
          "\"eruptor,grenade_gas,talon\"": 6,
          "\"eruptor,grenade_pistol,grenade_termite\"": 5,
          "\"eruptor,grenade_gas,ultimatum\"": 5,
          "\"breaker_inc,grenade_pyro,ultimatum\"": 5,
          "\"grenade_pistol,grenade_termite,scorcher\"": 5,
          "\"eruptor,grenade_termite,talon\"": 5,
          "\"grenade_he,redeemer,scorcher\"": 5,
          "\"amendment,grenade_impact,sabre\"": 5,
          "\"grenade_he,punisher_plas,ultimatum\"": 5,
          "\"breaker_inc,grenade_termite,ultimatum\"": 4,
          "\"breaker_inc,grenade_termite,senator\"": 4,
          "\"diligence_cs,grenade_pistol,grenade_termite\"": 4,
          "\"eruptor,grenade_he,redeemer\"": 4,
          "\"grenade_he,punisher,redeemer\"": 4,
          "\"eruptor,grenade_termite,laser_pistol\"": 4,
          "\"grenade_gas,senator,torcher\"": 4,
          "\"blitzer,grenade_pistol,grenade_termite\"": 4,
          "\"dominator,grenade_termite,ultimatum\"": 4,
          "\"grenade_he,redeemer,spray_n_pray\"": 3,
          "\"breaker,grenade_impact,loyalist\"": 3,
          "\"grenade_pistol,grenade_termite,torcher\"": 3,
          "\"cookout,grenade_he,ultimatum\"": 3,
          "\"grenade_impact,redeemer,scythe\"": 3,
          "\"breaker,grenade_frag,redeemer\"": 3,
          "\"grenade_frag,liberator,peacemaker\"": 3,
          "\"grenade_pistol,grenade_termite,liberator\"": 3,
          "\"adjucator,grenade_termite,redeemer\"": 3,
          "\"grenade_impact,redeemer,spray_n_pray\"": 3,
          "\"breaker,grenade_gas,grenade_pistol\"": 3,
          "\"grenade_pistol,grenade_stun,punisher\"": 3,
          "\"eruptor,grenade_he,verdict\"": 3,
          "\"grenade_he,liberator,peacemaker\"": 3,
          "\"crossbow,grenade_termite,ultimatum\"": 3
        }
      }
    }
]
```

Consolidated data for all patches:
```sh
/report
```
## Installation

Clone the repository and install dependencies:

```sh
npm install
```

Run the project with:

```sh
npm run
```

## Port

Base:
```sh
http://localhost:8080/
```

### Installing Redis on Windows

1. Download Redis from the official Microsoft archive: [Redis for Windows](https://github.com/microsoftarchive/redis/releases)
2. Extract the downloaded ZIP file.
3. Navigate to the extracted folder and open a command prompt
4. Run the Redis server with:

```sh
redis-server.exe
```

To run Redis as a background service, use:

```sh
redis-server --service-install
```

## License

[MIT](LICENSE)

