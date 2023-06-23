// todo: use import assertions once they're supported by Node.js & ESLint
// https://github.com/tc39/proposal-import-assertions
import {createRequire} from 'node:module'
const require = createRequire(import.meta.url)

import {DateTime} from 'luxon'
import test from 'node:test'
import {strictEqual, deepStrictEqual, ok} from 'node:assert'

import {
	parseJourney,
} from '../lib/parse.js'
import {
	fetchStops,
	fetchItineraries,
} from '../index.js'

const schedulesFromText1 = require('./SchedulesFromText-response-1.json')

const when = DateTime
.now({
	zone: 'Europe/Madrid',
	locale: 'en-ES',
})
.startOf('month').plus({months: 2, hours: 10})
.toMillis()

test('parseJourney() works with SchedulesFromText-response-1.json', (t) => {
	const {travel} = schedulesFromText1.schedules.responseData
	const combination = travel.outbound.section[0].combination[0]
	const journey = parseJourney(combination)

	deepStrictEqual(journey, {
		origin: {
			id: '615',
			name: 'CARTAGENA',
		},
		destination: {
			id: '186',
			name: 'OVIEDO / UVIEU',
		},

		departure: '2023-06-23T07:15',
		plannedDeparture: '2023-06-23T07:15',
		arrival: '2023-06-23T19:30',
		plannedArrival: '2023-06-23T19:30',

		legs: [{
			origin: {
				id: '615',
				name: 'CARTAGENA',
			},
			destination: {
				id: '155',
				name: 'MADRID ESTACION SUR',
			},
			plannedDeparture: null,
			departure: null,
			plannedArrival: '2023-06-23T12:35',
			arrival: '2023-06-23T12:35',
			// duration: 'PT0S',
			availableSeats: 24,
			serviceName: 'Supra Economy',
		}, {
			origin: {
				id: '155',
				name: 'MADRID ESTACION SUR',
			},
			destination: {
				id: '186',
				name: 'OVIEDO / UVIEU',
			},
			plannedDeparture: null,
			departure: null,
			plannedArrival: '2023-06-23T19:30',
			arrival: '2023-06-23T19:30',
			// duration: 'PT1H25M',
			availableSeats: 0,
			serviceName: 'Normal',
		}],

		price: {
			code: 'BASE',
			kind: 'Puedes anular y cambiar',
			name: 'Puedes anular y cambiar',
			amount: 109.56
		},
		provider: {
			id: '19',
			name: 'GRUPO ENATCAR S.A.',
			logo: 'https://www.movelia.es/Recursos/img/g_alsa.png',
		},
	})
})

test('fetchStops() works', async () => {
	const stops = await fetchStops()
	ok(Array.isArray(stops))
	ok(stops.length > 1)
})

test('fetchItineraries() works', async () => {
	const {
		outbound,
		previousDayLink,
		nextDayLink,
	} = await fetchItineraries('MADRID', 'IRUN', {when})

	ok(Array.isArray(outbound))
	ok(outbound.length > 1)

	if (previousDayLink !== null) {
		ok(previousDayLink, 'res.previousDayLink')
		strictEqual(typeof previousDayLink.sessionId, 'string', 'res.previousDayLink.sessionId')
	}
	if (nextDayLink !== null) {
		ok(nextDayLink, 'res.nextDayLink')
		strictEqual(typeof nextDayLink.sessionId, 'string', 'res.nextDayLink.sessionId')
	}

	// todo
})
