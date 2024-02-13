import { match } from './utils/utils.js'
import { DOM } from './utils/dom.js'
import { Feed } from './utils/feed.js'
import { Hydra } from './utils/hydra.js'
import { States, StatesEvent } from './utils/states.js'
import { Back } from './tools/back.js'
import { DataFormat } from './io.js'
import { CSVDataFormat } from './utils/io/csv-data-format.js'
import { JSONDataFormat } from './utils/io/json-data-format.js'
import { Dashboard } from './app/dashboard.js'
import { Lesson } from './app/lesson.js'
import { StoreKey } from './data.js'

export const AppEvent = {
    Load: Symbol(),
}

export const AppState = {
    Dashboard: Symbol(),
    Lesson: Symbol(),
}

export class App {
    constructor(store) {
        this.store = store
        this.dom = new AppDOM()
        this.events = new Feed(AppEvent)
        this.states = new States(id => {
            const State = match(() => {
                switch (id) {
                    case AppState.Dashboard: return Dashboard
                    case AppState.Lesson: return Lesson
                }
            })

            return new State(this)
        })
        this.io = new Hydra(id => {
            const Format = match(() => {
                switch (id) {
                    case DataFormat.CSV: return CSVDataFormat
                    case DataFormat.JSON: return JSONDataFormat
                }
            })

            return new Format()
        })
        this.back = new Back(this)

        this._isCreated = false
    }
    create($node) {
        if (this._isCreated) return

        this.dom.create($node)

        this.back.create(this.dom.$back)

        this.store.select(StoreKey.Settings).subscribe(data => {
            this.dom.theme = data.app.theme
            this.dom.direction = data.app.direction
        })

        const settings = this.store.select(StoreKey.Settings).get()

        this.dom.theme = settings.app.theme
        this.dom.direction = settings.app.direction

        this.states.events.select(StatesEvent.Change).subscribe(id => {
            this.dom.state = match(() => {
                switch (id) {
                    case AppState.Dashboard: return 'dashboard'
                    case AppState.Lesson: return 'lesson'
                }
            })
        })

        this.states.push(AppState.Dashboard)
    }
    destroy() {
        if (!this._isCreated) return

        this.states.destroy()
        this.events.destroy()
        this.dom.destroy()
    }
}

class AppDOM extends DOM {
    constructor() {
        super()
        
        this.$back = undefined
        this.$body = undefined
    }
    set state(value) {
        if (value) {
            this.$node.setAttribute('data-state', value)
        } else {
            this.$node.removeAttribute('data-state')
        }
    }
    set theme(value) {
        this.$node.setAttribute('data-theme', value)
    }
    set direction(value) {
        this.$node.setAttribute('data-direction', value)
    }
    create($node) {
        super.create($node)

        this.$node.innerHTML = `
            <div class="app-column" data-category="back"></div>
            <div class="app-column" data-category="body"></div>
        `

        this.$back = this.$node.querySelector('.app-column[data-category="back"]')
        this.$body = this.$node.querySelector('.app-column[data-category="body"]')
    }
}
