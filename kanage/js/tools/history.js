import { DOM } from '../utils/dom.js'
import { Feed } from '../utils/feed.js'
import { Memento } from '../utils/memento.js'

export const HistoryEvent = {
    Restore: Symbol(),
    Request: Symbol(),
}

export class History {
    constructor() {
        this.dom = new HistoryDOM()
        this.events = new Feed(HistoryEvent)
        this.session = new Memento({
            save: () => this._session,
            restore: session => {
                this.items = []
                this._session.items = []

                session.items.forEach(args => this.add(args))

                this.selected = session.selected

                this.events.select(HistoryEvent.Restore).publish()
            },
        })
        this.items = []
        
        this._session = {}
    }
    get selected() {
        return this._session.selected
    }
    set selected(value) {
        if (this._session.selected !== undefined) {
            this.items[this._session.selected].isSelected = false
        }

        this._session.selected = value

        if (this._session.selected !== undefined) {
            this.items[this._session.selected].isSelected = true
        }
    }
    create($node) {
        this.items = []
        this._session = {
            items: [],
            selected: undefined,
        }

        this.dom.events.select(DOMEvent.Select).subscribe(index => {
            this.events.select(HistoryEvent.Request).publish(index)
        })

        this.dom.create($node)
    }
    destroy() {
        this.events.destroy()
        this.dom.destroy()
    }
    add({text, info, label, data}) {
        const index = this._session.items.length
        const item = new Item(index, this.dom, this._session)

        item.text = text
        item.info = info
        item.label = label

        this._session.items.push({text, info, label, data})
        this.items.push(item)
    }
}

function Item(index, dom, session) {
    let text = ''
    let info = ''
    let label = ''
    let isSelected = false

    dom.add()

    return {
        get index() {
            return index
        },
        get text() {
            return text
        },
        set text(value) {
            text = value ?? ''
            dom.setText(index, text)
        },
        get data() {
            return session.items[index].data
        },
        set data(value) {
            session.items[index].data = value
        },
        get info() {
            return info
        },
        set info(value) {
            info = value ?? ''
            dom.setInfo(index, info)
        },
        get label() {
            return label
        },
        set label(value) {
            label = value ?? ''
            
            if (session.items[index]) {
                session.items[index].label = label
            }

            dom.setLabel(index, label)
        },
        get isSelected() {
            return isSelected
        },
        set isSelected(value) {
            isSelected = !!value

            isSelected ? dom.select(index) : dom.unselect(index)
        },
    }
}

const DOMEvent = {
    Select: Symbol(),
}

class HistoryDOM extends DOM {
    constructor() {
        super(DOMEvent)

        this.$items = undefined
        this.items = []
    }
    create($node) {
        super.create($node)

        this.$node.innerHTML = `
            <div class="items"></div>
        `

        this.$items = this.$node.querySelector('.items')

        this.items = []

        this.listeners.add(this.$items, 'mousedown', e => {
            if (e.which !== 1) return
            if (e.target.classList.contains('item')) {
                const index = parseInt(e.target.getAttribute('data-index'))

                this.events.select(DOMEvent.Select).publish(index)
            }
        })
    }
    add() {
        const index = this.items.length
        const $item = document.createElement('div')

        $item.setAttribute('class', 'item')
        $item.setAttribute('data-index', index)

        this.items.push(this.$items.insertAdjacentElement('afterbegin', $item))
    }
    setText(index, value) {
        if (index >= this.items.length) return

        this.items[index].textContent = value
    }
    setInfo(index, value) {
        if (index >= this.items.length) return

        this.items[index].setAttribute('title', value)
    }
    setLabel(index, value) {
        if (index >= this.items.length) return

        this.items[index].setAttribute('data-label', value)
    }
    select(index) {
        this.items[index].setAttribute('data-is-selected', true)
    }
    unselect(index) {
        this.items[index].removeAttribute('data-is-selected')
    }
}
