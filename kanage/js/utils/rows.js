import { postponed } from './utils.js'
import { DOM } from './dom.js'

export const RowsEvent = {
    Mode: Symbol(),
    Open: Symbol(),
    Save: Symbol(),
}

export const RowsMode = {
    Default: Symbol(),
    Check: Symbol(),
}

export class Rows extends DOM {
    constructor(renderRow) {
        super(RowsEvent)

        this.postpone = {
            render: postponed(this._render.bind(this))
        }
        
        this._renderRow = renderRow
        this._mode = undefined
        this._ids = []
        this._rows = []
        this._checked = []
        this._offset = undefined
        this._size = undefined
        this._isVisible = true
        this._filter = undefined
    }
    get isVisible() {
        return this._isVisible
    }
    set isVisible(value) {
        if (!!value === this._isVisible) return

        this._isVisible = !!value

        this.postpone.render()
    }
    get offset() {
        return this._offset
    }
    set offset(value) {
        this._offset = value
        this.postpone.render()
    }
    get mode() {
        return this._mode
    }
    set mode(value) {
        if (value === this._mode) return

        const previous = this._mode

        if (previous === RowsMode.Check) this.save()

        this._mode = value

        this.postpone.render()

        this.events.select(RowsEvent.Mode).publish(this._mode, previous)
    }
    get checked() {
        return [...this._checked]
    }
    set checked(value) {
        this._checked = new Array(this._ids.length).map((_, id) => !!value[id])
    }
    get ids() {
        return Array.from(this._ids)
    }
    set ids(value) {
        this._ids = value.map(id => parseInt(id))
        this._checked = new Array(this._ids.length).fill(false)

        this.postpone.render()
    }
    set filter(value) {
        if (value === this._filter) return

        this._filter = value
        this.postpone.render()
    }
    create($node) {
        super.create($node)

        this._ids = []
        this._rows = []
        this._checked = []
        this._offset = undefined
        this._size = undefined
        this._isVisible = true
        this._filter = undefined

        this._mode = RowsMode.Default

        this._addListeners()
    }
    toggle(id) {
        this._checked[id] ? this.uncheck(id) : this.check(id)
    }
    check(id) {
        if (id instanceof Array) {
            id.forEach(id_ => {
                if (id_ >= 0 && id_ < this._ids.length) {
                    this._checked[id_] = true
                }
            })

            this.postpone.render()
        } else {
            this._checked[id] = true

            if (this._rows[id]) this._rows[id].setAttribute('data-is-checked', true)
        }
    }
    uncheck(id) {
        if (id instanceof Array) {
            id.forEach(id_ => {
                if (id_ >= 0 && id_ < this._ids.length) {
                    this._checked[id_] = false
                }
            })

            this.postpone.render()
        } else {
            this._checked[id] = false

            if (this._rows[id]) this._rows[id].setAttribute('data-is-checked', false)
        }
    }
    checkAll() {
        this._checked.fill(true)
        this.postpone.render()
    }
    uncheckAll() {
        this._checked.fill(false)
        this.postpone.render()
    }
    getCheckedIds() {
        const ids = []

        this._checked.forEach((isChecked, id) => isChecked && ids.push(id))

        return ids
    }
    getUncheckedIds() {
        const ids = []

        this._checked.forEach((isChecked, id) => isChecked || ids.push(id))

        return ids
    }
    save() {
        this.events.select(RowsEvent.Save).publish()
    }
    render() {
        this.postpone.render()
    }
    _addListeners() {
        this.listeners.add(this.$node, 'click', e => {
            if (e.which !== 1) return

            const $row = e.target.closest('.row')

            if (!$row) return

            const id = $row.getAttribute('data-id')

            switch (this._mode) {
                case RowsMode.Default: {
                    this.events.select(RowsEvent.Open).publish(parseInt(id))
                } break
                case RowsMode.Check: {
                    this.toggle(id)
                } break
            }
        })
    }
    _render() {
        this.$node.innerHTML = ''

        if (!this._isVisible) return

        const offset = this._offset ?? 0
        const size = this._size ?? this._ids.length
        const isModeCheck = this._mode === RowsMode.Check

        this._rows = []

        let i = -1

        while (++i < size) {
            const index = offset + i
            const id = this._ids[index]

            if (this._filter && !this._filter(id)) continue

            const $row = document.createElement('div')

            $row.setAttribute('class', 'row')
            $row.setAttribute('data-id', id)

            if (isModeCheck) $row.setAttribute('data-is-checked', this._checked[id])

            this.$node.appendChild($row)

            this._rows[id] = $row
            this._rows[id].innerHTML = this._renderRow(id)
        }
    }
}
