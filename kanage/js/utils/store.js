import { deepFreeze, deepCopy } from '../utils/utils.js'
import { Channel } from '../utils/feed.js'

export class Store {
    constructor(keys, data) {
        const channel = new Channel()
        const dps = []

        Object.values(keys).forEach(key => {
            dps[key] = new DataProcessor(data, key, data => {
                channel.publish(key, data)
            })
        })

        return deepFreeze({
            select: key => dps[key],
            subscribe: f => channel.subscribe(f),
            unsubscribe: f => channel.unsubscribe(f),
        })
    }
}

function DataProcessor(data, key, onSet) {
    const channel = new Channel()
    const set = value => {
        const copy = deepCopy(value)
        const frozen = deepFreeze(copy)

        data[key] = copy

        channel.publish(frozen)

        onSet(frozen)
    }

    return deepFreeze({
        get: () => deepCopy(data[key]),
        edit: f => set(f(deepCopy(data[key]))),
        set,
        subscribe: f => channel.subscribe(f),
        unsubscribe: f => channel.unsubscribe(f),
    })
}
