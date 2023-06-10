import {
	fetchStops,
} from './index.js'

const stops = await fetchStops()
console.log(stops)
