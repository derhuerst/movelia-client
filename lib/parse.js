import {ok} from 'node:assert'
import {Duration} from 'luxon'
import sortBy from 'lodash/sortBy.js'

const LOCALE = 'es-ES'

const parseDateTime = (date, time) => {
	if (!date || !time) return null
	// I have checked with itineraries operated by different companies (Alsa, BlaBlaCar Bus, Avanza, Gipsyy), and it seems like
	// - the arrival/departure times are always in the local time zone
	// - the calculated duration is therefore wrong
	// todo: somehow find & use the time zone (offset)

	// return DateTime
	// .fromFormat(
	// 	date + ' ' + time,
	// 	'dd/LL/yyyy HH:mm',
	// 	{zone: EuropeMadrid},
	// )
	// .toISO({
	// 	suppressMilliseconds: true,
	// })

	date = date.split('/')
	time = time.split(':')
	// ISO 8601 without timezone offset
	return `${date[2]}-${date[1]}-${date[0]}T${time[0]}:${time[1]}`
}

const parseDuration = (hoursStr, minutesStr) => {
	if (!hoursStr || !minutesStr) return null
	const hours = parseInt(hoursStr)
	if (!Number.isInteger(hours)) {
		throw new Error(`failed to parse duration: invalid hours ("${hours}")`)
	}
	const minutes = parseInt(minutesStr)
	if (!Number.isInteger(minutes)) {
		throw new Error(`failed to parse duration: invalid minutes ("${minutes}")`)
	}
	return Duration
	.fromObject({hours, minutes}, {locale: LOCALE})
	.toISO()
}

const parsePrice = (priceStr) => {
	if (!priceStr) return null
	// todo: what about prices >1000€?
	return parseFloat(priceStr.replace(',', '.'))
}

const parseSeats = (seatsStr) => {
	if (!seatsStr) return null
	const seats = parseInt(seatsStr)
	if (!Number.isInteger(seats)) {
		return null // todo: debug-log this case
	}
	return seats
}

const parseLeg = (itSegment) => {
	// {
	// 	hours: '0',
	// 	minutes: '0',
	// 	originName: 'CARTAGENA',
	// 	originCode: '615',
	// 	destinationName: 'MADRID ESTACION SUR',
	// 	destinationCode: '155',
	// 	arrivalDate: '23/06/2023',
	// 	arrivalTime: '12:35',
	// 	freeSeats: '24',
	// 	typeService: 'Supra Economy',
	// }

	const departure = parseDateTime(itSegment.departureDate, itSegment.departureTime)
	const arrival = parseDateTime(itSegment.arrivalDate, itSegment.arrivalTime)

	return {
		origin: {
			// todo: did they remove originCode, or does it keep appearing under some condition?
			// id: itSegment.originCode || null,
			id: itSegment.origin || null,
			name: itSegment.originName || null,
		},
		destination: {
			id: itSegment.destination || null,
			name: itSegment.destinationName || null,
		},

		plannedDeparture: departure, departure,
		plannedArrival: arrival, arrival,
		// movelia computes from durations with legs across time zones
		// duration: parseDuration(itSegment.hours, itSegment.minutes),

		availableSeats: parseSeats(itSegment.freeSeats),
		serviceName: itSegment.typeService || null,
	}
}

const parseJourney = (combination) => {
	// {
	// 	section: [
	// 		{
	// 			num: '1',
	// 			count: '1',
	// 			combination: [
	// 				{
	// 					connectType: '',
	// 					num: '1',
	// 					count: '1',
	// 					date: '23/06/2023',
	// 					allowGetOpenPrice: '0',
	// 					combinationId: '1',
	// 					busOrBoat: '1',
	// 					systemId: '21',
	// 					salable: '1',
	// 					pmrSeats: '0',
	// 					petSeats: '0',
	// 					sportequipmentSeats: '0',
	// 					babysitterSeats: '0',
	// 					origin: '036',
	// 					originName: 'CADIZ',
	// 					companyLine: '02',
	// 					serviceNumber: '',
	// 					line: '',
	// 					companyId: '397',
	// 					serverId: '72',
	// 					code: '02',
	// 					companyName: 'SECORBUS',
	// 					showTime: '1',
	// 					logo: 'https://www.movelia.es/Recursos/img/secorbus.png',
	// 					typeService: 'BASE',
	// 					departureDate: '23/06/2023',
	// 					departureTime: '18:10',
	// 					reinforcement: '0',
	// 					freeSeats: '44',
	// 					observationSegment: '',
	// 					allowQueryBooking: '2',
	// 					generalObservations: '',
	// 					destination: '041',
	// 					destinationName: 'IRUN',
	// 					arrivalDate: '24/06/2023',
	// 					arrivalTime: '11:30',
	// 					basicPrice: '66,17',
	// 					direct: '1',
	// 					promos: null,
	// 					popupMessages: null,
	// 					itinerary: null,
	// 					rates: {
	// 						rate: [
	// 							{
	// 								num: '1',
	// 								rateCode: 'BASE',
	// 								rateName: 'BASE',
	// 								rateTotalPrice: '66,17',
	// 								rateTotalBasePrice: '',
	// 								passengers: {
	// 									passenger: [
	// 										{
	// 											count: '1',
	// 											passengerTypeCode: '',
	// 											passengerTypeName: '',
	// 											clearPrice: '66,17',
	// 											clearPriceOR: '',
	// 											promoCode: '',
	// 											offer: '',
	// 											promoName: '',
	// 											busAndBoatSalePromo: '0',
	// 											mandatoryOutboundReturn: '0',
	// 											ruleId: ''
	// 										}
	// 									]
	// 								}
	// 							}
	// 						]
	// 					}
	// 				}
	// 			],
	// 			nextDay: {
	// 				type: 'n',
	// 				direction: '0',
	// 				section: '0',
	// 				sessionId: '4db9801db3d0413b53a8e99c0e5d157d7e884ab1'
	// 			},
	// 			previousDay: {
	// 				type: 'p',
	// 				direction: '0',
	// 				section: '0',
	// 				sessionId: '4db9801db3d0413b53a8e99c0e5d157d7e884ab1'
	// 			}
	// 		}
	// 	]
	// }

	const departure = parseDateTime(combination.departureDate, combination.departureTime)
	const plannedDeparture = departure
	const arrival = parseDateTime(combination.arrivalDate, combination.arrivalTime)
	const plannedArrival = arrival

	let legs = []
	// direct (with only 1 leg) journeys don't have `combination.itineraty`
	if (combination.direct === '1') {
		legs = [
			parseLeg(combination),
		]
	} else {
		legs = combination.itinerary.itSegment.map(parseLeg)
	}

	ok(combination.rates.rate.length > 0)
	let prices = combination.rates.rate.map((rate) => {
		// {
		//     num: '1',
		//     selected: '0',
		//     rateCode: 'FARE-4',
		//     newTicketInChange: '0',
		//     rateName: 'Infinita Flexible',
		//     rateType: '',
		//     rateTotalPrice: '34',
		//     rateTotalBasePrice: '34',
		//     rateFeatures: '-Viaje en asiento Gran Confort XL de gran comodidad, reclinable, con reposabrazos individuales, toma de corriente y USB.\r\n\r\n-*Cambios de hora en el día del viaje gratuitos.\r\n\r\n-Cambios de fecha, abonando la diferencia de tarifa. Límite de 24 horas antes de la salida para realizar cambios de fecha.\r\n\r\n-Cancelación del billete: Antes de 7 días, devolución del 95% del importe. Menos de 7 días, devolución del 90% del importe.\r\n\r\n-Pérdida de tren: En caso de no poder viajar en tu tren, recolocación en el siguiente tren disponible por 10€ con un límite de 2 horas tras la salida del tren para obtener el nuevo billete.\r\n\r\n-Cambio de titular: Gratuito.\r\n\r\n-Acceso a Salas Only YOU Hotel Atocha Nobu y Hotel Barcelona.\r\n\r\n* Los cambios/reembolsos se podrán realizar a través del Servicio de Atención al Cliente: 910 150 000. Cambios permitidos hasta 30 minutos antes del embarque.\r\n  \r\nCombinado Cercanías gratuito y el mejor contenido a bordo \r\n\r\nDisfruta de nuestra plataforma de entretenimiento a bordo, WIFI gratuito',
		//     passengers:
		//     {
		//         passenger: […],
		//     }
		// }
		return {
			code: rate.rateCode || null,
			kind: rate.rateType || null,
			name: rate.rateName || null,
			amount: rate.rateTotalPrice
				? parsePrice(rate.rateTotalPrice)
				: null,
			// todo: rate.rateTotalBasePrice?
			description: rate.rateFeatures || null,
			// todo: rate.passengers[]?
			// todo: rate.newTicketInChange
		}
	})
	prices = sortBy(prices, 'code')

	return {
		// todo: parse more fields
		// connectType: 'C',
		// count: '2',
		// date: '23/06/2023',
		// allowGetOpenPrice: '0',
		// combinationId: '1',
		// busOrBoat: '1',
		// systemId: '1',
		// salable: '1',
		// typeServiceCode: 'C',
		// pmrSeats: '0',
		// petSeats: '1',
		// sportequipmentSeats: '4',
		// babysitterSeats: '0',
		// origin: '615',
		// originName: 'CARTAGENA',
		// companyLine: '560',
		// serviceNumber: '104',
		// line: '8910',
		// serverId: '1',
		// code: '560',
		// showTime: '1',
		// typeService: 'Supra Economy',
		// departureDate: '23/06/2023',
		// departureTime: '07:15',
		// reinforcement: '-1',
		// freeSeats: '24',
		// observationSegment: ',
		// allowQueryBooking: '2',
		// generalObservations: ',
		// destination: '186',
		// destinationName: 'OVIEDO / UVIEU',
		// arrivalDate: '23/06/2023',
		// arrivalTime: '19:30',
		// basicPrice: '109,56',
		// direct: '0',
		// rates: {…},
		// popupMessages: null,

		origin: legs[0].origin,
		destination: legs[legs.length - 1].destination,

		departure: legs[0].departure || departure,
		plannedDeparture: legs[0].plannedDeparture || plannedDeparture,
		arrival: legs[legs.length - 1].arrival || arrival,
		plannedArrival: legs[legs.length - 1].plannedArrival || plannedArrival,

		legs,

		prices,

		provider: {
			id: combination.companyId || null,
			name: combination.companyName || null,
			logo: combination.logo || null,
		},
	}
}

export {
	parseDateTime,
	parseDuration,
	parsePrice,
	parseLeg,
	parseJourney,
}
