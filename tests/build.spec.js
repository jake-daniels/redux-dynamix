import Ava from 'ava'
import Dynamix, {createDynamix, injectReducer, ejectReducer, ActionTypes} from '../dist/build'


Ava(
    'Test 1: Exports >> all exports are valid',
    (t) => {
        t.is(typeof createDynamix, 'function')
        t.is(typeof injectReducer, 'function')
        t.is(typeof ejectReducer, 'function')
        t.is(typeof ActionTypes, 'object')

        t.is(typeof Dynamix, 'object')
        t.is(typeof Dynamix.createDynamix, 'function')
        t.is(typeof Dynamix.injectReducer, 'function')
        t.is(typeof Dynamix.ejectReducer, 'function')
        t.is(typeof Dynamix.ActionTypes, 'object')
    }
)

Ava(
    'Test 2: Exports >> all items are exported',
    (t) => {
        t.not(createDynamix, undefined)
        t.not(injectReducer, undefined)
        t.not(ejectReducer, undefined)
        t.not(ActionTypes, undefined)
        t.not(Dynamix, undefined)
        t.not(Dynamix.createDynamix, undefined)
        t.not(Dynamix.injectReducer, undefined)
        t.not(Dynamix.ejectReducer, undefined)
        t.not(Dynamix.ActionTypes, undefined)
    }
)