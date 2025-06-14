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

