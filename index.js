
/**
 * Private object holding references to global variables of the Dynamix namespace.
 */
const Dynamix = {
	dispatch: () => {},
	staticKeys: [],
	reducers: [],
}

/**
 * Enhances the root reducer (static, in this context) by dynamic reducers.
 * @param {function} staticReducer - the root reducer
 * @returns {function} The final reducer used by store.
 */
const dynamize = (staticReducer) => (state = {}, action) => {

	// compute next state for each dynamic slice of the state tree
	const nextDynamicState = {}
	Dynamix.reducers.forEach((x) => {
		nextDynamicState[x.key] = x.reducer(state[x.key], action)
	})

	// delete dynamic slices of the state tree - root reducers doesn't have to care about them
	const dynamicKeys = Object.keys(state).filter((x) => !Dynamix.staticKeys.includes(x))
	dynamicKeys.forEach((key) => delete state[key])

	// compute the next state for static slice of the state tree
	const nextStaticState = staticReducer(state, action)

	// merge them together
	// return {...nextStaticState, ...nextDynamicState}
	return Object.assign({}, nextStaticState, nextDynamicState)
}

/**
 * Action types dispatched by Dynamix, prefixed by Dynamix namespace.
 * They are fired after injection or ejection and you can listen for them
 * in your reducers to be notified of changes.
 *
 * @property {string} REDUCER_INJECTED - An action type dispatched
 * when new dynamic reducer function has been injected.
 * Payload of action contains the key of the reducer.
 *
 * @property {string} REDUCER_EJECTED - An action type dispatched
 * when dynamic reducer function has been ejected.
 * Payload of action contains the key of the reducer.
 */
export const ActionTypes = {
	REDUCER_INJECTED: '@@dynamix/REDUCER_INJECTED',
	REDUCER_EJECTED: '@@dynamix/REDUCER_EJECTED',
}

/**
 * Creates a store enhancer that replaces the root reducer, passed to the store,
 * by enhanced reducer function. This new reducer function is responsible for computation of
 * dynamic slices of the state using dynamic reducers which has been injected to the pool.
 * Then merges the static slice of the state tree with all dynamic slices resulting in final state tree.
 *
 * @returns {object} A Redux store.
 *
 * @example
 * You can use 'compose' function that ships with Redux to combine Dynamix enhancer with middleware.
 * Because middleware is potentially asynchronous,
 * place the Dynamix enhancer after middleware in the composition chain (from right to left)
 *
 * ----------------------------------------------------------------------------
 * const enhancer = compose(createDynamix(), applyMiddleware(...middlewares))
 * const store = createStore(rootReducer, enhancer)
 * ----------------------------------------------------------------------------
 */
export const createDynamix = () => (createStore) => (reducer, preloadedState, enhancer) => {

	// create store by function provided by previous enhancer
	const store = createStore(reducer, preloadedState, enhancer)

	// save a reference to dispatch function
	Dynamix.dispatch = store.dispatch

	// save keys of static slice of the state
	Dynamix.staticKeys = Object.keys(store.getState())

	// enhance the root reducer by handling of dynamic keys
	const dynamizedReducer = dynamize(reducer)

	// replace old reducer
	store.replaceReducer(dynamizedReducer)

	return store
}

/**
 * Adds new reducer to dynamic reducers pool.
 * @param {string} key - A key, referencing the slice of the state computed by the reducer.
 * @param {function} reducer - A reducer function.
 * @event Dispatches an action where 'type' is set to ActionTypes.REDUCER_INJECTED and 'payload' is the key provided.
 */
export const injectReducer = (key, reducer) => {

	// check whether dynamic reducer pool contains given key
	const isInjected = Dynamix.reducers.map((x) => x.key).includes(key)
	if (isInjected) {
		console.warn(`Reducer with key [${key}] has already been injected. Injection was ignored.`)
		return
	}

	// insert new reducer into pool
	Dynamix.reducers.push({
		key: key,
		reducer: reducer,
	})

	// dispatch an event
	Dynamix.dispatch({
		type: ActionTypes.REDUCER_INJECTED,
		payload: key,
	})
}

/**
 * Removes reducer associated with given key from dynamic reducers pool.
 * @param {string} key - A key, referencing the slice of the state computed by the reducer.
 * @event Dispatches an action where 'type' is set to ActionTypes.REDUCER_EJECTED and 'payload' is the key provided.
 */
export const ejectReducer = (key) => {

	// check whether dynamic reducer pool contains given key
	const isInjected = Dynamix.reducers.map((x) => x.key).includes(key)
	if (!isInjected) {
		console.warn(`You attempted to eject reducer with key [${key}] but no such reducer has been injected. Ejection was ignored.`)
		return
	}

	// remove reducer from pool
	const index = Dynamix.reducers.findIndex((x) => x.key === key)
	Dynamix.reducers.splice(index, 1)

	// dispatch an event
	Dynamix.dispatch({
		type: ActionTypes.REDUCER_EJECTED,
		payload: key,
	})
}


