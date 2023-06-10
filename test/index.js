import test from 'node:test'
import {ok} from 'node:assert'

import {
	fetchStops,
} from '../index.js'

test('fetchStops() works', async () => {
	const stops = await fetchStops()
	ok(Array.isArray(stops))
	ok(stops.length > 1)
})
