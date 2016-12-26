# redux-dynamix

Tool for dynamic manipulation with reducers and state tree in redux-based applications.
<br/>

*See [example](https://github.com/jake-daniels/redux-dynamix-example).*


## TL;DR

Can change your state from this

```js
{
	blue_module: {foo: 12, bar: 'baz'},
	green_module: {...data},
}
```

into this

```js
{
	blue_module: {foo: 12, bar: 'baz'},
	green_module: {...data},
	red_module: {...moreData},	// red module is loaded and unloaded dynamically
}
```
and vice versa. **In runtime!**


## Content
* [Motivation](#motivation)
* [Installation](#installation)
* [Usage](#usage)
* [API](#api)


## Motivation

**Redux Dynamix** is a [store enhancer](https://github.com/reactjs/redux/blob/master/docs/Glossary.md#store-enhancer)
that allows you **dynamically** add and remove reducers (and therefore slices of application state).
<br/>

> Inspired by [this post](http://stackoverflow.com/a/33044701) by [Dan Abramov](https://github.com/gaearon).
<br/>

Your application state, stored in Redux Store, is divided into **slices** and there is always one root reducer handling the state.
In this case, slices of state - `blue_module` and `green_module` - are considered **static** because they are present in
the state through the entire lifetime of application. Slice of state with key `red_module` is considered **dynamic** and (along with reducer that handles it)
can be added and removed dynamically during the runtime of application (for example: in response to user action).
<br/>

This is useful in large applications, where you may have some piece of functionality separated so much
that it deserves to have its **own slice of state** but the rest of application could easily work without the data stored in that particular slice.
Additionally, you may need to have these data stored **only for a while**. Therefore a space for these data
could be created (and released) in the runtime - when you need it - leaving the main application state cleaner and less overloaded.
<br/>

Imagine following situation: You want to open a modal window that contains form. There is a lot of functionality
bound to that modal. Some data are loaded from the server, user fills in forms, then submits it and your application sends
that data back to server. Of course, this functionality needs to have its data counterpart in application state - loaded data,
content of form input fields and so on. However, when user sends data to server and closes the modal window,
you suddenly don't need that data anymore. It remains in your state tree even if no piece of code uses it.
<br/>

This is the moment, when **Redux Dynamix** comes to help.


## Installation

```
npm install --save redux-dynamix
```


## Usage

To enable Dynamix, create store enhancer and use it in `createStore` function.

```js
import rootReducer from './reducers'
import {createDynamix} from 'redux-dynamix'

const enhancer = createDynamix()
store = createStore(rootReducer, enhancer)
```

If you use middleware like [redux-thunk](https://github.com/gaearon/redux-thunk) or [redux-logger](https://github.com/evgenyrodionov/redux-logger)
you may use `compose` function that ships with Redux to combine Dynamix with `applyMiddleware`.
> Because middleware is potentially asynchronous, place the Dynamix after `applyMiddleware` in the composition chain (from right to left).

```js
const enhancer = compose(
	createDynamix(),
	applyMiddleware(thunk, logger),
)
```

Enhanced store is now ready to accept dynamic reducer that will be attached to existing root reducer.
Shape of application state is defined by structure of your reducers. For example let's have a state like this:

```js
{
	blue_module: {foo: 12, bar: 'baz'},
	green_module: {...data},
}
```

You would probably have one reducer for *blue module* and another one for *green_module*.
Now you want to attach *red module* for a while.

```js
import {injectReducer} from 'redux-dynamix'
import reducer from './modules/red/reducer'

injectReducer('red_module', reducer)
```

`red_module` specifies a key to the slice of state and `reducer` is a main reducer of red module
(and therefore defines shape of the slice by its *initial state*).
<br/>
After injection, our state looks like this

```js
{
	blue_module: {foo: 12, bar: 'baz'},
	green_module: {...data},
	red_module: {...moreData},		// = initial state of red module reducer
}
```

When the state of red module is no longer needed, it can be removed so the main application state remains clean.

```js
import {ejectReducer} from 'redux-dynamix'

ejectReducer('red_module')
```

**Simple as that.**
<br/>

Dynamix comes with two action types that represent events.
They are fired after injection or ejection and you can listen for them in your reducers to be notified of changes.

```js
import {ActionTypes} from 'redux-dynamix'

console.log(ActionTypes.REDUCER_INJECTED)
// @@dynamix/REDUCER_INJECTED

console.log(ActionTypes.REDUCER_EJECTED)
// @@dynamix/REDUCER_EJECTED
```

When these action types are dispatched, their payload is the `key` of injected/ejected slice.


## API

### `createDynamix()`
Creates a store enhancer that replaces the root reducer, passed to the store,
by enhanced reducer function. This new reducer function is responsible for computation of
dynamic slices of state using dynamic reducers that have been injected.
Then merges the static slice of the state tree with all dynamic slices resulting in final state tree.

#### Returns
Enhanced redux store.

### `injectReducer(key, reducer)`
Adds new reducer to dynamic reducers pool.
Application state will contain new dynamic slice, specified by `key` and `reducer` initial state.
Dispatches `ActionTypes.REDUCER_INJECTED` event, which can be listened to in one of your reducers.

#### Arguments
* `key` (string): A key, referencing the slice of state handled by injected reducer.
* `reducer` (function): A reducer function.

> Don't inject reducer with the same key twice. It will produce a warning and injection will be ignored.

### `ejectReducer(key)`
Removes reducer associated with given key from dynamic reducers pool.
Application state will no longer contain dynamic slice.
Dispatches `ActionTypes.REDUCER_EJECTED` event, which can be listened to in one of your reducers.

#### Arguments
* `key` (string): The key used in injection.

> Don't eject reducer that hasn't been injected. It will produce a warning and ejection will be ignored.

### `ActionTypes`
Action types dispatched by Dynamix, prefixed by Dynamix namespace.
They are fired after injection or ejection and you can listen to them in your reducers to be notified of changes.

#### Properties
* `REDUCER_INJECTED` (string): An action type dispatched when new dynamic reducer function has been injected. Payload contains the key of injected reducer.
<br/>
* `REDUCER_EJECTED` (string): An action type dispatched when dynamic reducer function has been ejected. Payload contains the key of ejected reducer.