import createDebug from 'debug'
import {createLocalStorage} from 'localstorage-ponyfill'

const STORE_KEY = 'movelia-client:token'

const debug = createDebug('movelia-client:token-store')

let storage = null // initalized on demand
const init = () => {
	if (storage !== null) return;
	debug('initalizing localStorage')
	storage = createLocalStorage()
}

// todo: this might be out of sync with the store if another process writes to it
let _cachedToken = null
const readToken = () => {
	if (_cachedToken !== null) return _cachedToken
	return storage.getItem(STORE_KEY)
}
const writeToken = (token) => {
	storage.setItem(STORE_KEY, token)
	_cachedToken = token
}
const forgetToken = () => {
	storage.removeItem(STORE_KEY)
	_cachedToken = null
}

const tokenStore = {
	init,
	readToken,
	writeToken,
	forgetToken,
}

export {
	tokenStore,
}
