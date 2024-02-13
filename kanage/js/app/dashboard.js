import { match } from '../utils/utils.js'
import { DOM } from '../utils/dom.js'
import { States } from '../utils/states.js'
import { Tabs, TabsEvent } from '../utils/tabs.js'
import { Lessons } from './dashboard/lessons.js'
import { Database } from './dashboard/database.js'
import { Settings } from './dashboard/settings.js'

const DashboardState = {
    Lessons: Symbol(),
    Database: Symbol(),
    Settings: Symbol(),
}

const TABS = [
    {name: 'lessons', text: '☆', state: DashboardState.Lessons},
    {name: 'database', text: '❐', state: DashboardState.Database},
    {name: 'settings', text: '⚒', state: DashboardState.Settings},
]

export class Dashboard {
    constructor(app) {
        this.app = app
        this.dom = new DashboardDOM()
        this.tabs = new Tabs(TABS)
        this.states = new States(id => {
            const State = match(() => {
                switch (id) {
                    case DashboardState.Lessons: return Lessons
                    case DashboardState.Database: return Database
                    case DashboardState.Settings: return Settings
                }
            })

            return new State(this)
        })
    }
    create() {
        this.app.back.isVisible = false

        this.dom.create(this.app.dom.$body)

        this.tabs.create(this.dom.$tabs)

        this.tabs.events.select(TabsEvent.Open).subscribe(tab => {
            this.states.set(tab.state)
        })

        this.tabs.open(0)
    }
    destroy() {
        this.tabs.destroy()
        this.states.destroy()
        this.dom.destroy()
    }
}

const DOMEvent = {
    Open: Symbol(),
}

class DashboardDOM extends DOM {
    constructor() {
        super(DOMEvent)

        this.$tabs = undefined
        this.$content = undefined
    }
    create($node) {
        super.create($node)

        this._innerHTML()

        this.$tabs = this.$node.querySelector('#dashboard-tabs')
        this.$content = this.$node.querySelector('#dashboard-content')
    }
    _innerHTML() {
        this.$node.innerHTML = `
            <div id="dashboard">
                <div id="dashboard-tabs" class="column"></div>
                <div id="dashboard-content" class="column"></div>
            </div>
        `
    }
}
