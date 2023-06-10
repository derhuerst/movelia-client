// todo: use import assertions once they're supported by Node.js & ESLint
// https://github.com/tc39/proposal-import-assertions
import {createRequire} from 'node:module'
const require = createRequire(import.meta.url)

import createDebug from 'debug'
import {fetch} from 'cross-fetch'
const pkg = require('./package.json')

const API_BASE_URL = 'https://www.movelia.es:4443/api/'

const debugFetch = createDebug('movelia-client:fetch')

const fetchFromMoveliaApi = async (cfg) => {
	const {
		call,
		method,
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

	if (!res.ok) {
		let body = null
		try {
			body = await res.text()
		} catch (err) {
			//
		}
		const err = new Error(`${url}: ${res.status} ${res.statusText}`)
		err.url = url
		err.status = res.status
		err.statusText = res.statusText
		err.responseBody = body
		throw err
	}

	debugFetch(res.status, res.statusText, Object.fromEntries(res.headers.entries()))
	return await res.json()
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

// todo

export {
}
