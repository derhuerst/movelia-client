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
const schedulesFromText2 = require('./SchedulesFromText-response-2.json')

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

		prices: [{
			code: 'BASE',
			kind: 'Puedes anular y cambiar',
			name: 'Puedes anular y cambiar',
			description: null,
			amount: 109.56
		}],
		provider: {
			id: '19',
			name: 'GRUPO ENATCAR S.A.',
			logo: 'https://www.movelia.es/Recursos/img/g_alsa.png',
		},
	})
})

test('parseJourney() works with SchedulesFromText-response-2.json', (t) => {
	const {travel} = schedulesFromText2.schedules.responseData
	const combination = travel.outbound.section[0].combination[0]
	const journey = parseJourney(combination)

	// console.error(inspect(journey, {depth: 5}))
	deepStrictEqual(journey, {
		origin: {
			id: null,
			name: 'BARCELONA SANTS',
		},
		destination: {
			id: null,
			name: 'ZARAGOZA DELICIAS ESTACION TREN',
		},

		departure: '2023-06-29T05:45',
		plannedDeparture: '2023-06-29T05:45',
		arrival: '2023-06-29T07:08',
		plannedArrival: '2023-06-29T07:08',

		legs: [{
			origin: {
				id: null,
				name: 'BARCELONA SANTS',
			},
			destination: {
				id: null,
				name: 'ZARAGOZA DELICIAS ESTACION TREN',
			},
			plannedDeparture: '2023-06-29T05:45',
			departure: '2023-06-29T05:45',
			plannedArrival: '2023-06-29T07:08',
			arrival: '2023-06-29T07:08',
			availableSeats: null,
			serviceName: 'Normal',
		}],

		prices: [{
			code: 'FARE-1',
			kind: null,
			name: 'Inicial Flexible',
			amount: 26.02,
			description: [
				'-Viaje en asiento Confort de gran comodidad, reclinable, con reposabrazos individuales, toma de corriente y USB.\r\n',
				'-*Cambios de hora en el día del viaje permitidos abonando la diferencia de tarifa.\r\n',
				'-Cambios de fecha, abono del 15% del importe del billete más la diferencia de tarifa. Límite de 24 horas antes de la salida para realizar cambios de fecha.\r\n',
				'-Cancelación del billete: Antes de 7 días, devolución del 80% del importe. Menos de 7 días, devolución del 70% del importe.\r\n',
				'-Pérdida de tren: No incluida\r\n',
				'-Cambio de titular del billete permitido abonando 40€. \r\n',
				'* Los cambios/reembolsos se podrán realizar a través del Servicio de Atención al Cliente: 910 150 000. Cambios permitidos hasta 30 minutos antes del embarque.  \r\n',
				'Combinado Cercanías gratuito y el mejor contenido a bordo.\r\n',
				'Disfruta de nuestra plataforma de entretenimiento a bordo, WIFI gratuito y conexión 5G. Además, tu billete iryo incluye Combinado Cercanías gratuito para tu viaje de ida y vuelta sin límite de zonas.',
			].join('\r\n'),
		}, {
			code: 'FARE-3',
			kind: null,
			name: 'Singular Flexible',
			amount: 38.02,
			description: [
				'-Viaje en asiento Confort de gran comodidad, reclinable, con reposabrazos individuales, toma de corriente y USB.\r\n',
				'-*Cambios de hora en el día del viaje, gratuitos\r\n',
				'-Cambios de fecha, abonando la diferencia de tarifa. Límite de 24 horas antes de la salida para realizar cambios de fecha.\r\n',
				'-Cancelación del billete: Antes de 7 días, devolución del 85% del importe. Menos de 7 días, devolución del 75% del importe.\r\n',
				'-Pérdida de tren: En caso de no poder viajar en tu tren, recolocación en el siguiente tren disponible por 30€ con un límite de 2 horas tras la salida del tren para obtener el nuevo billete.\r\n',
				'-Cambio de titular del billete permitido abonando 20€.\r\n',
				'* Los cambios/reembolsos se podrán realizar a través del Servicio de Atención al Cliente: 910 150 000. Cambios permitidos hasta 30 minutos antes del embarque.  \r\n',
				'Combinado Cercanías gratuito y el mejor contenido a bordo \r\n',
				'Disfruta de nuestra plataforma de entretenimiento a bordo, WIFI gratuito y conexión 5G. Además, tu billete iryo incluye Combinado Cercanías gratuito para tu viaje de ida y vuelta sin límite de zonas.',
			].join('\r\n'),
		}, {
			code: 'FARE-4',
			kind: null,
			name: 'Infinita Flexible',
			amount: 34,
			description: [
				'-Viaje en asiento Gran Confort XL de gran comodidad, reclinable, con reposabrazos individuales, toma de corriente y USB.\r\n',
				'-*Cambios de hora en el día del viaje gratuitos.\r\n',
				'-Cambios de fecha, abonando la diferencia de tarifa. Límite de 24 horas antes de la salida para realizar cambios de fecha.\r\n',
				'-Cancelación del billete: Antes de 7 días, devolución del 95% del importe. Menos de 7 días, devolución del 90% del importe.\r\n',
				'-Pérdida de tren: En caso de no poder viajar en tu tren, recolocación en el siguiente tren disponible por 10€ con un límite de 2 horas tras la salida del tren para obtener el nuevo billete.\r\n',
				'-Cambio de titular: Gratuito.\r\n',
				'-Acceso a Salas Only YOU Hotel Atocha Nobu y Hotel Barcelona.\r\n',
				'* Los cambios/reembolsos se podrán realizar a través del Servicio de Atención al Cliente: 910 150 000. Cambios permitidos hasta 30 minutos antes del embarque.\r\n' +
				'  \r\n' +
				'Combinado Cercanías gratuito y el mejor contenido a bordo \r\n',
				'Disfruta de nuestra plataforma de entretenimiento a bordo, WIFI gratuito',
			].join('\r\n'),
		}, {
			code: 'FARE-5',
			kind: null,
			name: 'Infinita Abierta',
			amount: 64,
			description: [
				'-Viaje en asiento Gran Confort XL de gran comodidad, reclinable, con reposabrazos individuales, toma de corriente y USB.\r\n',
				'-*Cambios de hora en el día del viaje gratuitos.\r\n',
				'-Cambios de fecha, gratuito.\r\n',
				'-Cancelación del billete: Antes de 7 días, devolución del 100% del importe. Menos de 7 días, devolución del 95% del importe.\r\n',
				'-Pérdida de tren: Gratuito.\r\n',
				'-Cambio de titular: Gratuito.\r\n',
				'-Acceso a Salas Only YOU Hotel Atocha Nobu y Hotel Barcelona.\r\n',
				'* Los cambios/reembolsos se podrán realizar a través del Servicio de Atención al Cliente: 910 150 000. Cambios permitidos hasta 30 minutos antes del embarque.  \r\n',
				'Combinado Cercanías gratuito y el mejor contenido a bordo \r\n',
				'Disfruta de nuestra plataforma de entretenimiento a bordo, WIFI gratuito y conexión 5G. Además, tu billete iryo incluye Combinado Cercanías gratuito para tu viaje de ida y vuelta sin límite de zonas.',
			].join('\r\n'),
		}, {
			code: 'FARE-6',
			kind: null,
			name: 'Singular Only You',
			amount: 39.02,
			description: [
				'-Viaje en asiento Gran Confort XL de gran comodidad, reclinable, con reposabrazos individuales, toma de corriente y USB.\r\n',
				'-*Cambios de hora en el día del viaje gratuitos.\r\n',
				'-Cambios de fecha, abonando la diferencia de tarifa. Límite de 24 horas antes de la salida para realizar cambios de fecha.\r\n',
				'-Cancelación del billete: Antes de 7 días, devolución del 85% del importe. Menos de 7 días, devolución del 75% del importe.\r\n',
				'-Pérdida de tren: En caso de no poder viajar en tu tren, recolocación en el siguiente tren disponible por 30€ con un límite de 2 horas tras la salida del tren para obtener el nuevo billete.\r\n',
				'-Cambio de titular del billete permitido abonando 20€.\r\n',
				'-Acceso a Salas Only YOU Hotel Atocha Nobu y Hotel Barcelona.\r\n',
				'* Los cambios/reembolsos se podrán realizar a través del Servicio de Atención al Cliente: 910 150 000. Cambios permitidos hasta 30 minutos antes del embarque.  \r\n',
				'Combinado Cercanías gratuito y el mejor contenido a bordo \r\n',
				'Disfruta de nuestra plataforma de entretenimiento a bordo, WIFI gratuito y conexión 5G. Además, tu billete iryo incluye Combinado Cercanías gratuito para tu viaje de ida y vuelta sin límite de zonas.',
			].join('\r\n'),
		}],

		provider: {
			id: '1252',
			name: 'IRYO',
			logo: 'https://www.movelia.es/Recursos/img/g_iryo.png',
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
