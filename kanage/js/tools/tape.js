import { repeat, deepCopy } from '../utils/utils.js'
import { DOM } from '../utils/dom.js'
import { Feed } from '../utils/feed.js'

export const TapeEvent = {
    Reset: Symbol(),
    Input: Symbol(),
}

export class Tape {
    constructor() {
        this.dom = new TapeDOM()
        this.events = new Feed(TapeEvent)
        this.caret = new Caret(this)
        this.cells = []
        this.isEnabled = true

        this._chars = []
    }
    get chars() {
        return deepCopy(this._chars)
    }
    get length() {
        return this._chars.length
    }
    create($node) {
        this.dom.create($node)

        this.dom.events.select(DOMEvent.Select).subscribe(index => {
            this.caret.position = index
        })

        this.isEnabled = true
    }
    destroy() {
        this.events.destroy()
        this.dom.destroy()
    }
    reset(chars) {
        this.cells = []
        this._chars = Array.from(chars)

        this.dom.reset(this._chars.length)

        for (const index in this._chars) {
            this.cells[index] = new Cell(this, this._chars, index)
        }

        this.caret.position = 0

        this.events.select(TapeEvent.Reset).publish()
    }
}

function Caret(tape) {
    let position = 0
    let isVisible = true

    return {
        get position() {
            return position
        },
        set position(value) {
            if (value < 0) value = 0
            if (value > tape.length) value = tape.length

            tape.dom.unselect(position)

            position = value

            if (isVisible) tape.dom.select(position)
        },
        get char() {
            return tape.cells[position]?.char
        },
        set char(value) {
            const cell = tape.cells[position]

            if (!cell) return

            cell.char = value
        },
        get isVisible() {
            return isVisible
        },
        set isVisible(value) {
            isVisible = !!value

            if (isVisible) {
                tape.dom.select(position)
            } else {
                tape.dom.unselect(position)
            }
        },
    }
}

function Cell(tape, chars, index) {
    let isBlocked = false

    tape.dom.setCellChar(index, chars[index])

    return {
        get isBlocked() {
            return isBlocked
        },
        set isBlocked(value) {
            isBlocked = !!value
            
            tape.dom.setCellIsBlocked(index, isBlocked)
        },
        get char() {
            return chars[index]
        },
        set char(value) {
            if (isBlocked) return
            if (!tape.isEnabled) return

            chars[index] = value

            tape.dom.setCellChar(index, value)
            
            tape.events.select(TapeEvent.Input).publish()
        },
    }
}

const DOMEvent = {
    Select: Symbol(),
}

class TapeDOM extends DOM {
    constructor() {
        super(DOMEvent)

        this.cells = []
    }
    create($node) {
        super.create($node)

        this.listeners.add(this.$node, 'mousedown', e => {
            if (e.which !== 1) return
            if (e.target.classList.contains('cell')) {
                const index = parseInt(e.target.getAttribute('data-index'))

                this.events.select(DOMEvent.Select).publish(index)
            }
        })
    }
    reset(size) {
        const html = []

        repeat(size, index => html.push(`<span class="cell" data-index="${index}"></span>`))

        this.$node.innerHTML = html.join('')

        this.cells = Array.from(this.$node.querySelectorAll('.cell'))
    }
    select(index) {
        this.cells[index]?.setAttribute('data-is-selected', true)
    }
    unselect(index) {
        this.cells[index]?.removeAttribute('data-is-selected')
    }
    setCellChar(index, char) {
        if (!this.cells[index]) return

        this.cells[index].textContent = char ?? ''
    }
    setCellIsBlocked(index, isBlocked) {
        if (!this.cells[index]) return

        if (isBlocked) {
            this.cells[index].setAttribute('data-is-blocked', true)
        } else {
            this.cells[index].removeAttribute('data-is-blocked')
        }
    }
}
