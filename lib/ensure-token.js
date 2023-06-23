import createDebug from 'debug'
import decodeJwt from 'jwt-decode'
import {fetchFromMoveliaApi} from './fetch.js'

const debug = createDebug('movelia-client:ensure-token')

const isTokenExpired = (token) => {
	const {exp} = decodeJwt(token)
	return exp * 1000 <= Date.now()
}

let pRenew = null
const ensureToken = async (cfg) => {
	const {
		user,
		password,
		tokenStore,
	} = cfg
	
	tokenStore.init()

	const fetchNewToken = async () => {
		debug('fetching new token')

		const {value: token} = await fetchFromMoveliaApi({
			call: 'GetToken',
			method: 'POST',
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

		tokenStore.writeToken(token)
		return token
	}

	let token = tokenStore.readToken()
	if (token === null || isTokenExpired(token)) {
		debug('no token yet or expired')
		// ensure only one renewal happens
		if (pRenew === null) {
			pRenew = fetchNewToken()
		}
		token = await pRenew
		pRenew = null
	}
	return token
}

export {
	ensureToken,
}
