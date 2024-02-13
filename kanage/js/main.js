import { Store } from './utils/store.js'
import { App } from './app.js'
import { StoreKey, KEY, DEFAULT } from './data.js'

main()

function main() {
    const store = new Store(StoreKey, load())
    
    store.subscribe((key, data) => save(key, data))

    const app = new App(store)

    app.create(document.querySelector('#app'))
}

function load() {
    const data = {}

    Object.values(StoreKey).forEach(key => {
        data[key] = DEFAULT[key]

        const json = localStorage.getItem(KEY[key])

        if (json) {
            try {
                data[key] = JSON.parse(json)
            } catch (_) {
                // todo: localStorage - JSON parse error
                data[key] = DEFAULT[key]
            }
        }
    })

    return data
}

function save(key, data) {
    let json = undefined
    
    try {
        json = JSON.stringify(data)
    } catch (_) {
        // todo: localStorage - JSON stringify error
    }

    if (json === undefined) return

    localStorage.setItem(KEY[key], json)
}
