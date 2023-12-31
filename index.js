import {strictEqual} from 'node:assert'
import {DateTime, IANAZone} from 'luxon'
import {fetchFromMoveliaApi} from './lib/fetch.js'
import {tokenStore as defaultTokenStore} from './lib/token-store.js'
import {ensureToken} from './lib/ensure-token.js'
import {parseJourney} from './lib/parse.js'
import {scrapeOriginDestinationPairs} from './lib/scrape-connections.js'

const EuropeMadrid = new IANAZone('Europe/Madrid')

// as used by their webapp
const ANONYMOUS_USER = 'usuNoReg'
const ANONYMOUS_PASSWORD = 'usuNoReg'

const NINO = 2 // 0-13
const JOVEN = 6 // 14-25
const ADULTO = 1 // 26-59
const SENIOR = 5 // 60+
const PASSENGER_AGE_GROUPS = {
	NINO,
	JOVEN,
	ADULTO,
	SENIOR,
}

const defaults = {
	user: ANONYMOUS_USER,
	password: ANONYMOUS_PASSWORD,
	tokenStore: defaultTokenStore,
}

const fetchStopsFromMoveliaApi = async (opt = {}) => {
	const {
		user,
		password,
		tokenStore,
	} = {
		...defaults,
		...opt,
	}

	const token = await ensureToken({
		user,
		password,
		tokenStore,
	})

	const cities = await fetchFromMoveliaApi({
		call: 'v1/GetCitiesWithBooking',
		token,
	})

	const stops = cities.map((city) => {
		return {
			id: city.code || null,
			name: city.name || null,
			countryCode: city.countrY_CODE || null, // wat
			bookingId: city.iD_BOOKING || null, // wat
		}
	})
	return stops
}

// const fetchItinerariesFromMoveliaApi = async (origin, destination, opt = {}) => {
// 	const {
// 		user,
// 		password,
// 		tokenStore,
// 	} = {
// 		...defaults,
// 		...opt,
// 	}

// 	const token = await ensureToken({
// 		user,
// 		password,
// 		tokenStore,
// 	})

// 	const its = await fetchFromMoveliaApi({
// 		call: 'v1/GetNodesByName',
// 		searchParams: {
// 			origin,
// 			destination,
// 		},
// 		token,
// 	})

// 	const itineraries = its.map((it) => {
// 		return {
// 			origin: {
// 				id: it.origincode || null,
// 				provinceId: it.originprovince || null,
// 				communidadId: it.comunidaD_ORI || null,
// 			},
// 			destination: {
// 				id: it.destinationcode || null,
// 				provinceId: it.destinationprovince || null,
// 				communidadId: it.comunidaD_DES || null,
// 			},
// 		}
// 	})
// 	return itineraries
// }

const formatPassengers = (passengers) => {
	return passengers.map((p, i) => {
		const n = `passengers[${i}]`
		if (!Object.prototype.hasOwnProperty.call(p, 'ageGroup')) {
			throw new Error(`${n}.ageGroup is invalid`)
		}
		if ([NINO, SENIOR].includes(p.ageGroup) && !Number.isInteger(p.age)) {
			throw new TypeError(`${n}.age must be an integer`)
		}
		if ('boolean' !== typeof p.wheelchair) {
			throw new TypeError(`${n}.wheelchair must be a boolean`)
		}
		return {
			order: i + 1,
			type: p.ageGroup,
			age: String(p.age === null ? 0 : p.age),
			pmr: p.wheelchair ? 1 : 0,
		}
	})
}

const fetchItinerariesFromMoveliaApi = async (origin, destination, opt = {}) => {
	const {
		user,
		password,
		tokenStore,
		when,
		passengers,
	} = {
		...defaults,
		when: Date.now(),
		passengers: [{
			ageGroup: ADULTO,
			wheelchair: false,
			age: null,
		}],
		...opt,
	}

	const token = await ensureToken({
		user,
		password,
		tokenStore,
	})

	const departureDate = DateTime
	.fromMillis(+new Date(when), {
		zone: EuropeMadrid,
	})
	.toFormat('dd/MM/yyyy')

	const {
		schedules: {
			responseData: res,
		},
	} = await fetchFromMoveliaApi({
		method: 'POST',
		call: 'v1/SchedulesFromText',
		token,
		headers: {
			'Content-Type': 'application/json',
		},
		// {
		// 	"isOpen": 0,
		// 	"returnDate": "",
		// 	"origin": "CADIZ",
		// 	"destination": "IRUN",
		// 	"departureDate": "23/06/2023",
		// 	"busplusCardNumber": "",
		// 	"busplusDocumentIdentifier": "",
		// 	"promotionalCode": "",
		// 	"changeTicketData": "",
		// 	"clientIP": "",
		// 	"routeID": "",
		// 	"chosenPassengers": [{
		// 		"order": "1",
		// 		"type": "1",
		// 		"age": "0",
		// 		"pmr": "0"
		// 	}]
		// }
		body: JSON.stringify({
			isOpen: 0, // todo: what is this?
			origin, // todo: do stop IDs/codes work too? or just names?
			destination, // todo: do stop IDs/codes work too? or just names?
			departureDate,
			returnDate: "", // todo
			routeID: "", // todo: what is this?
			busplusCardNumber: "", // todo: what is this?
			busplusDocumentIdentifier: "", // todo: what is this?
			promotionalCode: "", // todo: what is this?
			changeTicketData: "", // todo: what is this?
			chosenPassengers: formatPassengers(passengers),

			// todo: are these needed?
			clientIP: "",
		}),
	})

	// {
	// 	errors: { error: [ { number: '0', messageError: '' } ] },
	// 	generalData: {
	// 		section: [
	// 			{
	// 				num: '1',
	// 				passengersNumber: '1',
	// 				isOpen: '0',
	// 				returnLikeForward: '0',
	// 				internationalTravel: '0',
	// 				noDirectSchedules: '0',
	// 				dataChange: null,
	// 				supplements: {
	// 					passenger: [
	// 						{
	// 							num: '1',
	// 							typeCode: '1',
	// 							typeName: 'Adulto',
	// 							supplement: [
	// 								{ selected: '0', code: '1', name: 'Mascota' },
	// 								{
	// 									selected: '0',
	// 									code: '2',
	// 									name: 'Material Deportivo'
	// 								},
	// 								{ selected: '0', code: '3', name: 'Plaza PMR' }
	// 							]
	// 						}
	// 					]
	// 				}
	// 			}
	// 		],
	// 		informativeMessages: null
	// 	},
	// 	travel: {
	// 		international: '0',
	// 		outbound: {
	// 			section: [
	// 				{
	// 					num: '1',
	// 					count: '1',
	// 					combination: [
	// 						{…}
	// 					],
	// 					nextDay: {
	// 						type: 'n',
	// 						direction: '0',
	// 						section: '0',
	// 						sessionId: '4db9801db3d0413b53a8e99c0e5d157d7e884ab1'
	// 					},
	// 					previousDay: {
	// 						type: 'p',
	// 						direction: '0',
	// 						section: '0',
	// 						sessionId: '4db9801db3d0413b53a8e99c0e5d157d7e884ab1'
	// 					}
	// 				}
	// 			]
	// 		}
	// 	}
	// }

	strictEqual(res.travel.outbound.section.length, 1)
	const outbound = res.travel.outbound.section[0]

	const _previousDay = res.travel.outbound.section[0].previousDay
	const previousDayLink = _previousDay ? {
		sessionId: _previousDay.sessionId,
	} : null
	const _nextDay = res.travel.outbound.section[0].nextDay
	const nextDayLink = _nextDay ? {
		sessionId: _nextDay.sessionId,
	} : null

	return {
		outbound: outbound.combination
		.map(combination => parseJourney(combination))
		.filter(journey => journey !== null),
		// todo: returning (res.travel.todo.section ?)
		previousDayLink,
		nextDayLink,
	}
}

export {
	fetchStopsFromMoveliaApi as fetchStops,
	fetchItinerariesFromMoveliaApi as fetchItineraries,
	PASSENGER_AGE_GROUPS,
	scrapeOriginDestinationPairs,
}
