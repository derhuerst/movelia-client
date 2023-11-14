import createDebug from 'debug'
import _cheerio from 'cheerio'
const {load: loadHtml} = _cheerio
import {fetchFromMoveliaApi} from './fetch.js'
import {fetchStops} from '../index.js'

const debug = createDebug('movelia-client:scrape-destinations')

const scrapeOriginsForDestination = async function* (destinationId) {
	const url = new URL(destinationId, 'https://www.movelia.es/en/node/').href

	const body = await fetchFromMoveliaApi({
		call: url,
		redirect: 'follow',
		headers: {
			'Accept': 'text/html',
		},
		compress: true,
		parseBodyAsJson: false,
	})

	const $ = loadHtml(body)
	for (const a of $('main article a[href]')) {
		const {href} = a.attribs
		const {
			hostname,
			searchParams,
		} = new URL(href, url)

		if (hostname !== 'www.movelia.es') {
			debug('link with unknown hostname', href)
			continue
		}
		if (!searchParams.get('origen')) {
			debug('link without "origen" search param', href)
			continue
		}
		if (!searchParams.get('destino')) {
			debug('link without "destino" search param', href)
			continue
		}

		yield {
			originName: searchParams.get('origen'),
			destinationName: searchParams.get('destino'),
		}
	}
}

const scrapeOriginDestinationPairs = async function* () {
	const alreadyScraped = new Set()

	for (const {id: destinationId} of await fetchStops()) {
		if (alreadyScraped.has(destinationId)) continue
		alreadyScraped.add(destinationId)

		try {
			for await (const pair of scrapeOriginsForDestination(destinationId)) {
				debug(pair.originName, '->', pair.destinationName)
				yield pair
			}
		} catch (err) {
			if (err.status === 404) {
				// todo: what to do here?
				debug('destination page not found for', destinationId)
				continue;
			}
			throw err
		}
	}
}

// // todo: fetch connections for each origin/destination pair?
// for await (const {originName, destinationName} of scrapeOriginDestinationPairs()) {
// 	console.log(originName, '->', destinationName)
// }

export {
	scrapeOriginsForDestination,
	scrapeOriginDestinationPairs,
}
