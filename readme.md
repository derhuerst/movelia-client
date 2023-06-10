# movelia-client

**Fetch stops & routes from the [movelia.es bus search engine](https://movelia.es/).**

[![npm version](https://img.shields.io/npm/v/movelia-client.svg)](https://www.npmjs.com/package/movelia-client)
![ISC-licensed](https://img.shields.io/github/license/derhuerst/movelia-client.svg)
![minimum Node.js version](https://img.shields.io/node/v/movelia-client.svg)
[![support me via GitHub Sponsors](https://img.shields.io/badge/support%20me-donate-fa7664.svg)](https://github.com/sponsors/derhuerst)
[![chat with me on Twitter](https://img.shields.io/badge/chat%20with%20me-on%20Twitter-1da1f2.svg)](https://twitter.com/derhuerst)


## Installation

```shell
npm install movelia-client
```


## Usage

### `fetchStops(opt)`

```js
import {fetchStops} from 'movelia-client'

console.log(await fetchStops())
```

```js
[
	{
		id: '125',
		name: 'A CORUÑA/LA CORUÑA E.A.',
		countryCode: '34',
		bookingId: '-386792',
	},
	{
		id: '125',
		name: 'A CORUÑA/LA CORUÑA E.A.',
		countryCode: '34',
		bookingId: '900056174',
	},
	// …
	{
		id: '6077',
		name: 'BARCELONA',
		countryCode: '34',
		bookingId: '-372490',
	},
	// …
	{
		id: '212',
		name: 'ZARAGOZA',
		countryCode: '34',
		bookingId: '-409149',
	},
	// …
]
```


## Contributing

If you have a question or need support using `movelia-client`, please double-check your code and setup first. If you think you have found a bug or want to propose a feature, use [the issues page](https://github.com/derhuerst/movelia-client/issues).
