# Helldive.live Backend

## Public API Link

```sh
https://utm7j5pjvi.us-east-1.awsapprunner.com/
```

## Usage

Chart Data:
```sh
Example query

/items_stats?faction=terminid&patch_id=12&difficulty=0&mission=All&modifier=ALL&type=strategem
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

Values: 0 - 12
12 - Latest patch
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

```sh
type

Values:
'strategem'
'weapons'
'armor'
```

```sh
type

Values:
'strategem'
'weapons'
'armor'
```

```sh
modifier

Values:
terminid: [
        "ALL",
        "RUPTURE STRAIN",
        "PREDATOR STRAIN",
        "SPORE BURST STRAIN",
        "DRAGONROACHES",
        "HIVE LORDS",
        "NONE",
    ],
    automaton: [
        "ALL",
        "THE INCENERATION CORPS",
        "JET BRIGADE FACTORIES",
        "CYBORGS",
        "HEAVY ARMOR SURGE",
        "HULK SURGE",
        "NONE",
    ],
    illuminate: [
        "ALL",
        "MINDLESS MASSES",
        "APPROPRIATORS"
    ]
```

Raw Games Data:
```sh
/games?faction=terminid&patch=0&difficulty=0&mission=All
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

