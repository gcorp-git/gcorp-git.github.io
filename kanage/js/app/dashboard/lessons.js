import { INDEX } from '../../data.js'
import { match, deepCopy } from '../../utils/utils.js'
import { DOM } from '../../utils/dom.js'
import { States } from '../../utils/states.js'
import { Rows, RowsEvent, RowsMode } from '../../utils/rows.js'
import { StoreKey } from '../../data.js'
import { Default } from './lessons/default.js'
import { Add } from './lessons/add.js'
import { Edit } from './lessons/edit.js'
import { Remove } from './lessons/remove.js'

const ICON = {
    ADD: '+',
    REMOVE: '🗑',
    SAVE: '💾',
    EDIT: '✎',
    SEARCH: '🔎︎',
}

export const LessonsState = {
    Default: Symbol(),
    Add: Symbol(),
    Edit: Symbol(),
    Remove: Symbol(),
}

export class Lessons {
    constructor(parent) {
        this.parent = parent
        this.app = this.parent.app
        this.dom = new LessonsDOM()
        this.rows = {
            lessons: new Rows(id => {
                const item = this._store.lessons[id]

                return `
                    <div class="icon picture">${item.icon}</div>
                    <div class="text">
                        <div class="name">${item.name}</div>
                    </div>
                `
            }),
            database: new Rows(id => {
                const item = this._store.database.items[id]

                return `
                    <div class="text">
                        <div class="translation">${item[INDEX.TRANSLATION] ?? ''}</div>
                        <div class="kana">${item[INDEX.KANA] ?? ''}</div>
                        <div class="kanji">${item[INDEX.KANJI] ?? ''}</div>
                    </div>
                `
            }),
        }
        this.states = new States(id => {
            const State = match(() => {
                switch (id) {
                    case LessonsState.Default: return Default
                    case LessonsState.Add: return Add
                    case LessonsState.Edit: return Edit
                    case LessonsState.Remove: return Remove
                }
            })

            return new State(this)
        })

        this._store = {
            lessons: undefined,
            database: undefined,
        }
    }
    create() {
        this.dom.create(this.parent.dom.$content)
        
        this.rows.lessons.create(this.dom.$rows.lessons)
        this.rows.database.create(this.dom.$rows.database)

        this.rows.database.mode = RowsMode.Check

        this.app.store.select(StoreKey.Lessons).subscribe(data => {
            this._store.lessons = deepCopy(data)
            this.rows.lessons.ids = this._store.lessons.map((_, id) => id).reverse()
        })

        this._store.lessons = this.app.store.select(StoreKey.Lessons).get()
        this.rows.lessons.ids = this._store.lessons.map((_, id) => id).reverse()

        this.app.store.select(StoreKey.Database).subscribe(data => {
            this._store.database = deepCopy(data)
            this.rows.database.ids = Object.keys(this._store.database.items)
        })

        this._store.database = this.app.store.select(StoreKey.Database).get()
        this.rows.database.ids = Object.keys(this._store.database.items)

        this.dom.events.select(DOMEvent.Mode).subscribe(mode => {
            this.states.set(match(() => {
                switch (mode) {
                    case DOMMode.Default: return LessonsState.Default
                    case DOMMode.Add: return LessonsState.Add
                    case DOMMode.Edit: return LessonsState.Edit
                    case DOMMode.Remove: return LessonsState.Remove
                }
            }))
        })
        
        this.dom.events.select(DOMEvent.Save).subscribe(() => {
            this.states.current.save()
            
            this.dom.mode = DOMMode.Default
        })

        this.rows.lessons.events.select(RowsEvent.Open).subscribe(id => {
            this.states.current.open(id)
        })

        this.dom.events.select(DOMEvent.Search).subscribe(value => {
            if (value) {
                const uppercased = value.toUpperCase()

                this.rows.lessons.filter = id => {
                    const lesson = this._store.lessons[id]
                    const fields = [lesson.name]

                    for (const field of fields) {
                        if (field.toUpperCase().indexOf(uppercased) !== -1) return true
                    }

                    return false
                }

                this.rows.database.filter = id => {
                    const item = this._store.database.items[id]
                    const fields = [item[INDEX.TRANSLATION], item[INDEX.KANA], item[INDEX.KANJI]]

                    for (const field of fields) {
                        if (field.toUpperCase().indexOf(uppercased) !== -1) return true
                    }

                    return false
                }
            } else {
                this.rows.lessons.filter = undefined
                this.rows.database.filter = undefined
            }
        })
    }
    destroy() {
        this.states.destroy()

        for (const name in this.rows) {
            this.rows[name].destroy()
        }

        this.dom.destroy()
    }
}

const DOMEvent = {
    Mode: Symbol(),
    Save: Symbol(),
    Search: Symbol(),
}

const DOMMode = {
    Default: Symbol(),
    Add: Symbol(),
    Edit: Symbol(),
    Remove: Symbol(),
}

class LessonsDOM extends DOM {
    constructor() {
        super(DOMEvent)
        
        this.$body = undefined
        this.$controls = undefined
        this.$modals = undefined
        this.$scrollContainer = undefined
        this.$rows = {
            lessons: undefined,
            database: undefined,
        }
        this.$add = undefined
        this.$edit = undefined
        this.$remove = undefined
        this.$save = undefined
        this.$search = undefined

        this._mode = undefined
    }
    get mode() {
        return this._mode
    }
    set mode(value) {
        if (value === this._mode) return
        
        this._mode = value

        this.$body.setAttribute('data-mode', match(() => {
            switch (value) {
                case DOMMode.Default: return 'default'
                case DOMMode.Add: return 'add'
                case DOMMode.Edit: return 'edit'
                case DOMMode.Remove: return 'remove'
            }
        }))

        this.events.select(DOMEvent.Mode).publish(this._mode)
    }
    create($node) {
        super.create($node)

        this._mode = undefined
        
        this._innerHTML()

        this.$body = this.$node.querySelector('#dashboard-lessons')
        this.$controls = this.$node.querySelector('.controls')
        this.$modals = this.$node.querySelector('.modals')
        this.$scrollContainer = this.$node.querySelector('.scroll-container')
        this.$rows.lessons = this.$node.querySelector('.rows.lessons')
        this.$rows.database = this.$node.querySelector('.rows.database')
        this.$add = this.$node.querySelector('button[data-action="add"]')
        this.$edit = this.$node.querySelector('button[data-action="edit"]')
        this.$remove = this.$node.querySelector('button[data-action="remove"]')
        this.$save = this.$node.querySelector('button[data-action="save"]')
        this.$search = this.$node.querySelector('input[name="search"]')

        this.mode = DOMMode.Default
        
        this._addListeners()
    }
    _innerHTML() {
        this.$node.innerHTML = `
            <div id="dashboard-lessons" class="scroll-container-parent">
                <div class="header">
                    <div class="controls">
                        <button class="button" data-action="add">${ICON.ADD}</button>
                        <button class="button" data-action="edit">${ICON.EDIT}</button>
                        <button class="button" data-action="remove">${ICON.REMOVE}</button>
                        <button class="button" data-action="save">${ICON.SAVE}</button>
                        <div class="filler"></div>
                        <input type="search" name="search" autocomplete="off" placeholder="${ICON.SEARCH}"/>
                    </div>
                    <div class="modals"></div>
                </div>
                <div class="scroll-container">
                    <div class="rows lessons"></div>
                    <div class="rows database"></div>
                </div>
            </div>
        `
    }
    _addListeners() {
        this.listeners.add(this.$add, 'click', e => {
            if (e.which !== 1) return
            this.mode = match(() => {
                switch (this._mode) {
                    case DOMMode.Add: return DOMMode.Default
                    default: return DOMMode.Add
                }
            })
        })

        this.listeners.add(this.$edit, 'click', e => {
            if (e.which !== 1) return
            this.mode = match(() => {
                switch (this._mode) {
                    case DOMMode.Edit: return DOMMode.Default
                    default: return DOMMode.Edit
                }
            })
        })

        this.listeners.add(this.$remove, 'click', e => {
            if (e.which !== 1) return
            this.mode = match(() => {
                switch (this._mode) {
                    case DOMMode.Remove: return DOMMode.Default
                    default: return DOMMode.Remove
                }
            })
        })

        this.listeners.add(this.$save, 'click', e => {
            if (e.which !== 1) return
            this.events.select(DOMEvent.Save).publish()
        })

        this.listeners.add(this.$search, 'input', () => {
            this.events.select(DOMEvent.Search).publish(this.$search.value)
        })
    }
}
