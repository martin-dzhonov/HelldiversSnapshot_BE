# Helldive.live Backend

## Public API Link

```sh
https://utm7j5pjvi.us-east-1.awsapprunner.com/
```

## Installation

Clone the repository and install dependencies:

```sh
npm install
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

## Usage

Run the project with:

```sh
npm run
```

## Endpoints

Base:
```sh
http://localhost:8080/
```

Raw Mongo Data:
```sh
/games?faction=terminid&patch=0&difficulty=0&mission=All
```

```sh
faction
'terminid'
'automaton'
'illuminate'
```

```sh
patch
0 - latest
```

```sh
difficulty
7-10
0 - All difficulties
```

```sh
mission
All
Short
Long
```

Consolidated data for all patches:
```sh
http://localhost:8080/report
```

## License

[MIT](LICENSE)

