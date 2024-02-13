import { DOM } from '../utils/dom.js'
import { Feed } from '../utils/feed.js'

const ICON = '⇦'

export const BackEvent = {
    Default: Symbol(),
}

export class Back {
    constructor(app) {
        this.app = app
        this.dom = new BackDOM()
        this.events = new Feed(BackEvent)

        this._isVisible = false
    }
    get isVisible() {
        return this._isVisible
    }
    set isVisible(value) {
        this._isVisible = !!value
        this.dom.isVisible = this._isVisible
    }
    create($node) {
        this.dom.create($node)

        this.dom.events.select(DOMEvent.Back).subscribe(() => {
            if (this.app.states.length > 1) this.app.states.pop()
        })
    }
    destroy() {
        this.events.destroy()
        this.dom.destroy()
    }
}

const DOMEvent = {
    Back: Symbol(),
}

class BackDOM extends DOM {
    constructor() {
        super(DOMEvent)
    }
    set isVisible(value) {
        if (value) {
            this.$back.setAttribute('data-is-visible', true)
        } else {
            this.$back.removeAttribute('data-is-visible')
        }
    }
    create($node) {
        super.create($node)

        this.$node.innerHTML = `
            <button id="back">${ICON}</button>
        `

        this.$back = this.$node.querySelector('#back')

        this.listeners.add(this.$back, 'click', () => {
            this.events.select(DOMEvent.Back).publish()
        })

        this.listeners.add(document, 'keyup', e => {
            if (e.code === 'Escape') {
                this.events.select(DOMEvent.Back).publish()
            }
        })
    }
}
