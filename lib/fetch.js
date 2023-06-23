// todo: use import assertions once they're supported by Node.js & ESLint
// https://github.com/tc39/proposal-import-assertions
import {createRequire} from 'node:module'
const require = createRequire(import.meta.url)

import createDebug from 'debug'
import {fetch} from 'cross-fetch'
const pkg = require('../package.json')

const API_BASE_URL = 'https://www.movelia.es:4443/api/'
const DEFAULT_USER_AGENT = `${pkg.name} v${pkg.version}`

const debug = createDebug('movelia-client:fetch')

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
		userAgent: DEFAULT_USER_AGENT,
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
	debug(url, req)
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

	debug(res.status, res.statusText, Object.fromEntries(res.headers.entries()))
	debug(resBody)
	return JSON.parse(resBody)
}

export {
	fetchFromMoveliaApi,
	DEFAULT_USER_AGENT,
}
