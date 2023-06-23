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

**Note:** Because the Movelia API *does not* return timezone information for each arrival & departure date+time, this library returns [ISO 8601 strings *without* an offset ("local time")](https://en.wikipedia.org/wiki/ISO_8601#Local_time_(unqualified)). This means that you *cannot* convert them to UNIX timestamps or do any calculations (e.g. the duration of the itinerary) on them. Unfortunately, with input lacking an offset, most date+time libraries will silently add the system's local offset, leading to hard-to-find bugs with significant effects.

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

### `fetchItineraries(from, to, opt)`

```js
import {fetchItineraries} from 'movelia-client'

console.log(await fetchItineraries('BARCELONA', 'ZARAGOZA', {
	when: '2023-06-29T00:00+02:00',
}))
```

```js
{
	outbound: [
		{
			origin: {id: null, name: 'BARCELONA SANTS'},
			departure: '2023-06-29T05:45',
			plannedDeparture: '2023-06-29T05:45',

			destination: {id: null, name: 'ZARAGOZA DELICIAS ESTACION TREN'},
			arrival: '2023-06-29T07:08',
			plannedArrival: '2023-06-29T07:08',

			legs: [{
				origin: {id: null, name: 'BARCELONA SANTS'},
				plannedDeparture: '2023-06-29T05:45',
				departure: '2023-06-29T05:45',

				destination: {id: null, name: 'ZARAGOZA DELICIAS ESTACION TREN'},
				plannedArrival: '2023-06-29T07:08',
				arrival: '2023-06-29T07:08',

				duration: null,
				availableSeats: null,
				serviceName: 'Normal',
			}],

			price: {
				code: 'FARE-4',
				kind: null,
				name: 'Infinita Flexible',
				amount: 34
			},
			provider: {
				id: '1252',
				name: 'IRYO',
				logo: 'https://www.movelia.es/Recursos/img/g_iryo.png',
			},
		},
		// …
		{
			origin: {id: null, name: 'BARCELONA (NORD)'},
			departure: '2023-06-29T23:59',
			plannedDeparture: '2023-06-29T23:59',

			destination: {id: null, name: 'ZARAGOZA'},
			arrival: '2023-06-30T03:44',
			plannedArrival: '2023-06-30T03:44',

			legs: [
				{
					origin: {id: null, name: 'BARCELONA (NORD)'},
					plannedDeparture: '2023-06-29T23:59',
					departure: '2023-06-29T23:59',

					destination: {id: null, name: 'ZARAGOZA'},
					plannedArrival: '2023-06-30T03:44',
					arrival: '2023-06-30T03:44',

					duration: null,
					availableSeats: 50,
					serviceName: 'Normal',
				},
			],
			price: {
				code: 'BASE',
				kind: 'Puedes anular y cambiar',
				name: 'Puedes anular y cambiar',
				amount: 18.06
			},
			provider: {
				id: '8',
				name: 'ARATESA',
				logo: 'https://www.movelia.es/Recursos/img/g_alsa.png',
			},
		},
	],
}
```


## Contributing

If you have a question or need support using `movelia-client`, please double-check your code and setup first. If you think you have found a bug or want to propose a feature, use [the issues page](https://github.com/derhuerst/movelia-client/issues).
