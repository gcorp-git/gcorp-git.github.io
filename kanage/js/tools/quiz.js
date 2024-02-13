import { deepCopy } from '../utils/utils.js'
import { DOM } from '../utils/dom.js'
import { Feed } from '../utils/feed.js'
import { Memento } from '../utils/memento.js'
import { TapeEvent, Tape } from './tape.js'

export const QuizEvent = {
    Start: Symbol(),
    Check: Symbol(),
    Restore: Symbol(),
}

export class Quiz {
    constructor() {
        this.dom = new QuizDOM()
        this.tape = new Tape()
        this.events = new Feed(QuizEvent)
        this.session = new Memento({
            save: () => this._session,
            restore: session => {
                this.task = session.task
                this.isSolved = session.isSolved

                this.tape.reset(Array.from(session.tape))
                
                this._session.tape = this.tape.chars

                session.revealed.forEach((was, index) => was && this.reveal(index))

                this.events.select(QuizEvent.Restore).publish()
            },
        })

        this._session = {}
    }
    get task() {
        return this._session.task ? deepCopy(this._session.task) : undefined
    }
    set task(value) {
        const {question, description, answer} = value

        this._session.task = value
        this._session.isSolved = false
        this._session.tape = new Array(answer.length)
        this._session.revealed = new Array(answer.length)

        this.dom.question = question
        this.dom.description = description
        this.dom.isSolved = false

        this.tape.reset(this._session.tape)
        this.events.select(QuizEvent.Start).publish()
    }
    get isSolved() {
        return this._session.isSolved
    }
    set isSolved(value) {
        this._session.isSolved = !!value
        this.dom.isSolved = this._session.isSolved
    }
    create($node) {
        this._session = {
            task: undefined,
            isSolved: false,
            tape: [],
            revealed: [],
        }

        this.dom.create($node)
        this.tape.create(this.dom.$tape)

        this._subscribe()
    }
    destroy() {
        this.events.destroy()
        this.tape.destroy()
        this.dom.destroy()
    }
    reveal(index) {
        if (index < 0 || index >= this._session.task.answer.length) return

        const char = this._session.task.answer.charAt(index)
        const cell = this.tape.cells[index]

        if (cell.char !== char) cell.char = char

        cell.isBlocked = true
        
        this._session.revealed[index] = true
    }
    isRevealed(index) {
        return this._session.revealed[index]
    }
    _subscribe() {
        this.tape.events.select(TapeEvent.Input).subscribe(() => {
            const chars = this.tape.chars
            this._session.tape = chars
            this.events.select(QuizEvent.Check).publish(chars.join(''))
        })
    }
}

class QuizDOM extends DOM {
    constructor() {
        super()

        this.$question = undefined
        this.$tape = undefined

        this._question = ''
        this._description = ''
    }
    set question(value) {
        this._question = value ?? ''
        this.$question.textContent = this._question
    }
    set description(value) {
        this._description = value ?? ''

        if (value) {
            this.$question.setAttribute('title', this._description)
        } else {
            this.$question.removeAttribute('title')
        }
    }
    set isSolved(value) {
        if (value) {
            this.$node.setAttribute('data-is-solved', true)
        } else {
            this.$node.removeAttribute('data-is-solved')
        }
    }
    create($node) {
        super.create($node)

        this.$node.innerHTML = `
            <div class="question"></div>
            <div class="tape"></div>
        `

        this.$question = this.$node.querySelector('.question')
        this.$tape = this.$node.querySelector('.tape')

        this.listeners.add(this.$question, 'click', e => {
            if (e.which !== 1) return

            this.swap()
        })
    }
    swap() {
        if (!this._description) return

        const question = this._question
        const description = this._description

        this.question = description
        this.description = question
    }
}
