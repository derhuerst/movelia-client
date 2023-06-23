/* eslint-disable no-unused-vars */

import {inspect} from 'node:util'
import {
	fetchStops,
	fetchItineraries,
} from './index.js'

// const stops = await fetchStops()
// console.log(stops)

const itineraries = await fetchItineraries('CADIZ', 'IRUN', {
	when: '2023-06-29T00:00+02:00',
})
console.log(inspect(itineraries, {depth: null, colors: true}))
