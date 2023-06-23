// todo: use import assertions once they're supported by Node.js & ESLint
// https://github.com/tc39/proposal-import-assertions
import {createRequire} from 'node:module'
const require = createRequire(import.meta.url)

import createDebug from 'debug'
import {fetch} from 'cross-fetch'
import {strictEqual} from 'node:assert'
import {DateTime, IANAZone} from 'luxon'
import {parseJourney} from './lib/parse.js'
const pkg = require('./package.json')

const API_BASE_URL = 'https://www.movelia.es:4443/api/'
const DEFAULT_USER_AGENT = `${pkg.name} v${pkg.version}`

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

const debugFetch = createDebug('movelia-client:fetch')

const fetchFromMoveliaApi = async (cfg) => {
	const {
		call,
		method,
		searchParams,
		userAgent,
		token,
		headers,
		body,
	} = {
		method: 'GET',
		searchParams: null,
		token: null,
		headers: {},
		body: null,
		...cfg,
	}

	let url = new URL(call, API_BASE_URL)
	if (searchParams) {
		for (const [key, val] of Object.entries(searchParams)) {
			url.searchParams.set(key, val)
		}
	}
	url = url.href

	const req = {
		method,
		redirect: 'follow',
		headers: {
			'Accept': 'application/json',
			'User-Agent': userAgent,
			...(token ? {
				'Authorization': 'Bearer ' + token,
			} : {}),
			...headers,
		},
		body,
		compress: true,
	}
	debugFetch(url, req)
	const res = await fetch(url, req)

	let resBody = await res.text()
	if (!res.ok) {
		let msg = `${url}: ${res.status} ${res.statusText}`
		try {
			resBody = JSON.parse(resBody)
			// their error responses look like this:
			// {
			// 	"StatusCode": 400,
			// 	"InnerCode": "90145",
			// 	"Message": "La empresa que realiza el viaje no admite mas de 5 viajeros por compra.\r\n",
			// 	"Url": null,
			// 	"International": false,
			// 	"NoSchedules": false
			// }
			if ('string' === typeof resBody.Message) {
				msg = resBody.Message.trim()
			}
		} catch (err) {
			//
		}
		const err = new Error(msg)
		err.url = url
		err.status = res.status
		err.statusText = res.statusText
		err.responseBody = resBody
		throw err
	}

	debugFetch(res.status, res.statusText, Object.fromEntries(res.headers.entries()))
	debugFetch(resBody)
	return JSON.parse(resBody)
}

const ensureToken = async (cfg) => {
	const {
		userAgent,
		user,
		password,
	} = cfg

	// todo: re-use previously obtained token

	const getTokenRes = await fetchFromMoveliaApi({
		call: 'GetToken',
		method: 'POST',
		userAgent,
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			user,
			password,
			// todo: make customisble?
			language: 'es',
		}),
	})

	return getTokenRes.value
}

const defaults = {
	userAgent: DEFAULT_USER_AGENT,
	user: ANONYMOUS_USER,
	password: ANONYMOUS_PASSWORD,
}

const fetchStopsFromMoveliaApi = async (opt = {}) => {
	const {
		userAgent,
		user,
		password,
	} = {
		...defaults,
		...opt,
	}

	const token = await ensureToken({
		userAgent,
		user,
		password,
	})

	const cities = await fetchFromMoveliaApi({
		call: 'v1/GetCitiesWithBooking',
		userAgent,
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
// 		userAgent,
// 		user,
// 		password,
// 	} = {
// 		...defaults,
// 		...opt,
// 	}

// 	const token = await ensureToken({
// 		userAgent,
// 		user,
// 		password,
// 	})

// 	const its = await fetchFromMoveliaApi({
// 		call: 'v1/GetNodesByName',
// 		searchParams: {
// 			origin,
// 			destination,
// 		},
// 		userAgent,
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
		userAgent,
		user,
		password,
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
		userAgent,
		user,
		password,
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
		userAgent,
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
}
