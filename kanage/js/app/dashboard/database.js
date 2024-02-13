import { INDEX } from '../../data.js'
import { match, deepCopy } from '../../utils/utils.js'
import { DOM } from '../../utils/dom.js'
import { Rows, RowsEvent } from '../../utils/rows.js'
import { States } from '../../utils/states.js'
import { StoreKey } from '../../data.js'
import { Default } from './database/default.js'
import { Add } from './database/add.js'
import { Edit } from './database/edit.js'
import { Remove } from './database/remove.js'
import { Import } from './database/import.js'
import { Export } from './database/export.js'

const ICON = {
    ADD: '+',
    EDIT: '✎',
    REMOVE: '🗑',
    SAVE: '💾',
    IMPORT: '⇚',
    EXPORT: '⇛',
    SEARCH: '🔎︎',
}

export const DatabaseState = {
    Default: Symbol(),
    Add: Symbol(),
    Edit: Symbol(),
    Remove: Symbol(),
    Import: Symbol(),
    Export: Symbol(),
}

export class Database {
    constructor(parent) {
        this.parent = parent
        this.app = this.parent.app
        this.dom = new DatabaseDOM()
        this.rows = {
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
            import: undefined,
        }
        this.states = new States(id => {
            const State = match(() => {
                switch (id) {
                    case DatabaseState.Default: return Default
                    case DatabaseState.Add: return Add
                    case DatabaseState.Edit: return Edit
                    case DatabaseState.Remove: return Remove
                    case DatabaseState.Import: return Import
                    case DatabaseState.Export: return Export
                }
            })

            return new State(this)
        })

        this._store = {
            database: undefined,
        }

        this._id = undefined
    }
    create() {
        this.dom.create(this.parent.dom.$content)

        this.rows.database.create(this.dom.$rows.database)

        this.app.store.select(StoreKey.Database).subscribe(data => {
            this._store.database = deepCopy(data)
            this.rows.database.ids = Object.keys(this._store.database.items)
        })

        this._store.database = this.app.store.select(StoreKey.Database).get()
        this.rows.database.ids = Object.keys(this._store.database.items)

        this.dom.events.select(DOMEvent.Mode).subscribe(mode => {
            this.states.set(match(() => {
                switch (mode) {
                    case DOMMode.Default: return DatabaseState.Default
                    case DOMMode.Add: return DatabaseState.Add
                    case DOMMode.Edit: return DatabaseState.Edit
                    case DOMMode.Remove: return DatabaseState.Remove
                    case DOMMode.Import: return DatabaseState.Import
                    case DOMMode.Export: return DatabaseState.Export
                }
            }))

            switch (this.states.current.id) {
                case DatabaseState.Edit: {
                    if (this._id !== undefined) {
                        const id = this._id

                        this._id = undefined

                        this.states.current.open(id)
                    }
                } break
            }
        })
        
        this.dom.events.select(DOMEvent.Save).subscribe(() => {
            this.save()
        })

        this.rows.database.events.select(RowsEvent.Open).subscribe(id => {
            switch (this.states.current.id) {
                case DatabaseState.Default: {
                    this._id = id
                    this.dom.mode = DOMMode.Edit
                } break
                case DatabaseState.Edit: {
                    this.states.current.open(id)
                } break
            }
        })

        this.dom.events.select(DOMEvent.Search).subscribe(value => {
            if (this.states.current.search) {
                this.states.current.search(value)
            }

            if (value) {
                const uppercased = value.toUpperCase()

                this.rows.database.filter = id => {
                    const item = this._store.database.items[id]
                    const fields = [item[INDEX.TRANSLATION], item[INDEX.KANA], item[INDEX.KANJI]]

                    for (const field of fields) {
                        if (field.toUpperCase().indexOf(uppercased) !== -1) return true
                    }

                    return false
                }
            } else {
                this.rows.database.filter = undefined
            }
        })
    }
    destroy() {
        this.states.destroy()

        for (const name in this.rows) {
            if (this.rows[name]) this.rows[name].destroy()
        }

        this.dom.destroy()
    }
    save() {
        this.states.current.save()

        if (this.states.current.id !== DatabaseState.Edit) {
            this.dom.mode = DOMMode.Default
        }
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
    Import: Symbol(),
    Export: Symbol(),
}

class DatabaseDOM extends DOM {
    constructor() {
        super(DOMEvent)

        this.$body = undefined
        this.$controls = undefined
        this.$modals = undefined
        this.$scrollContainer = undefined
        this.$rows = {
            database: undefined,
            import: undefined,
        }
        this.$add = undefined
        this.$edit = undefined
        this.$remove = undefined
        this.$save = undefined
        this.$search = undefined
        this.$import = undefined
        this.$export = undefined

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
                case DOMMode.Import: return 'import'
                case DOMMode.Export: return 'export'
            }
        }))

        this.events.select(DOMEvent.Mode).publish(this._mode)
    }
    create($node) {
        super.create($node)

        this._mode = undefined
        
        this._innerHTML()

        this.$body = this.$node.querySelector('#dashboard-database')
        this.$controls = this.$node.querySelector('.controls')
        this.$modals = this.$node.querySelector('.modals')
        this.$scrollContainer = this.$node.querySelector('.scroll-container')
        this.$rows.database = this.$node.querySelector('.rows.database')
        this.$rows.import = this.$node.querySelector('.rows.import')
        this.$add = this.$node.querySelector('button[data-action="add"]')
        this.$edit = this.$node.querySelector('button[data-action="edit"]')
        this.$remove = this.$node.querySelector('button[data-action="remove"]')
        this.$save = this.$node.querySelector('button[data-action="save"]')
        this.$search = this.$node.querySelector('input[name="search"]')
        this.$import = this.$node.querySelector('button[data-action="import"]')
        this.$export = this.$node.querySelector('button[data-action="export"]')

        this.mode = DOMMode.Default
        
        this._addListeners()
    }
    _innerHTML() {
        this.$node.innerHTML = `
            <div id="dashboard-database" class="scroll-container-parent">
                <div class="header">
                    <div class="controls">
                        <button class="button" data-action="add">${ICON.ADD}</button>
                        <button class="button" data-action="edit">${ICON.EDIT}</button>
                        <button class="button" data-action="remove">${ICON.REMOVE}</button>
                        <button class="button" data-action="save">${ICON.SAVE}</button>
                        <div class="filler"></div>
                        <button class="button" data-action="import">${ICON.IMPORT}</button>
                        <button class="button" data-action="export">${ICON.EXPORT}</button>
                        <input type="search" name="search" autocomplete="off" placeholder="${ICON.SEARCH}"/>
                    </div>
                    <div class="modals"></div>
                </div>
                <div class="scroll-container">
                    <div class="rows database"></div>
                    <div class="rows import"></div>
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

        this.listeners.add(this.$import, 'click', e => {
            if (e.which !== 1) return
            this.mode = match(() => {
                switch (this._mode) {
                    case DOMMode.Import: return DOMMode.Default
                    default: return DOMMode.Import
                }
            })
        })

        this.listeners.add(this.$export, 'click', e => {
            if (e.which !== 1) return
            this.mode = match(() => {
                switch (this._mode) {
                    case DOMMode.Export: return DOMMode.Default
                    default: return DOMMode.Export
                }
            })
        })

        this.listeners.add(this.$search, 'input', () => {
            this.events.select(DOMEvent.Search).publish(this.$search.value)
        })
    }
}
