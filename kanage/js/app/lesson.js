import { INDEX } from '../data.js'
import { match, ring, shuffle, postponed } from '../utils/utils.js'
import { DOM } from '../utils/dom.js'
import { Memento } from '../utils/memento.js'
import { StoreKey } from '../data.js'
import { Quiz, QuizEvent } from '../tools/quiz.js'
import { History, HistoryEvent } from '../tools/history.js'
import { Keyboard, KeyboardEvent, KeyboardMode } from '../tools/keyboard.js'
import { WordProcessor } from '../tools/wp.js'
import { Commands, CommandsEvent } from './lesson/commands.js'
import { QuizHelper } from './lesson/quiz-helper.js'
import { HistoryHelper } from './lesson/history-helper.js'

export class Lesson {
    constructor(app) {
        this.app = app
        this.dom = new LessonDOM()
        this.quiz = new Quiz()
        this.quizHelper = new QuizHelper(this.quiz)
        this.history = new History()
        this.historyHelper = new HistoryHelper(this.history)
        this.keyboard = new Keyboard()
        this.commands = new Commands(this.app)
        this.wp = new WordProcessor()
        this.session = new Memento({
            save: () => ({
                ...this._session,
                quiz: this.quiz.session.save(),
                history: this.history.session.save(),
            }),
            restore: session => {
                for (const key in this._session) {
                    this._session[key] = session[key]
                }

                this.quiz.session.restore(session.quiz)
                this.history.session.restore(session.history)
            },
        })
        this.postpone = {
            save: postponed(this._save.bind(this))
        }
        
        this._id = undefined
        this._mode = KeyboardMode.Hiragana
        this._session = {}
    }
    create(id) {
        this._id = id
        this._session = {
            tasks: [],
            solved: 0,
            solvedMap: [],
            next: 0,
            current: undefined,
        }

        this.app.back.isVisible = true
        
        this.dom.create(this.app.dom.$body)

        this.quiz.create(this.dom.$quiz)
        this.keyboard.create(this.dom.$keyboard)
        this.commands.create(this.dom.$commands)
        this.history.create(this.dom.$history)

        this._subscribe()

        this.commands.mode = this._mode

        const lessons = this.app.store.select(StoreKey.Lessons).get()
        const sessions = this.app.store.select(StoreKey.Sessions).get()
        
        if (sessions[id]) return this.session.restore(sessions[id])
        
        const database = this.app.store.select(StoreKey.Database).get()
        const tasks = lessons[id].ids.map(id => database.items[id]).filter(task => !!task)
        
        this._session.tasks = shuffle([...tasks])
        this._session.solved = 0
        this._session.solvedMap = new Array(this._session.tasks.length)
        this._session.next = 0

        this.next()
    }
    destroy() {
        this.postpone.save()

        this.quiz.destroy()
        this.keyboard.destroy()
        this.commands.destroy()
        this.history.destroy()

        this.dom.destroy()
    }
    next(index) {
        if (index === undefined) index = this._session.current + 1

        this._saveCurrentInHistory()

        const historyHasIndex = !!this.history.items[index]
        const noMoreLessonsLeft = this._session.next >= this._session.tasks.length
        
        if (historyHasIndex || noMoreLessonsLeft) {
            if (this.history.items[index]) {
                index = ring(0, index, Math.max(0, this.history.items.length - 1))

                const session = this.history.items[index].data

                this._session.current = session.index

                this.history.selected = index

                this.quiz.session.restore(session.quiz)

                this.postpone.save()
            }
        } else {
            this._session.current = this._session.next++

            this.quiz.task = this._getTaskData(this._session.current)
            
            this._saveCurrentInHistory()
            
            this.history.selected = this._session.current

            this.postpone.save()
        }
    }
    save() {
        this.postpone.save()
    }
    _save() {
        const id = this._id
        const session = this.session.save()

        this.app.store.select(StoreKey.Sessions).edit(data => {
            if (session.solved < session.tasks.length) {
                data[id] = session
            } else {
                delete data[id]
            }

            return data
        })
    }
    _saveCurrentInHistory() {
        if (this._session.current === undefined) return

        const index = this._session.current
        const isSolved = this._session.solvedMap[index]

        this.historyHelper.save(index, isSolved, {
            quiz: this.quiz.session.save(),
        })

        this._session.history = this.history.session.save()

        this.postpone.save()
    }
    _onLessonComplete() {
        this._saveCurrentInHistory()

        this.dom.isCompleted = true
    }
    _getTaskData(index) {
        const data = this._session.tasks[index]
        const settings = this.app.store.select(StoreKey.Settings).get()
        const [question, description] = match(() => {
            const kanji = data[INDEX.KANJI] || data[INDEX.TRANSLATION]
            const translation = data[INDEX.TRANSLATION] || data[INDEX.KANJI]
            
            switch (settings.quiz.question) {
                case 'kanji': return [kanji, translation]
                case 'translation': return [translation, kanji]
            }
        })
        const convert = match(() => {
            switch (this.keyboard.mode) {
                case KeyboardMode.Hiragana: return this.wp.toHiragana
                case KeyboardMode.Katakana: return this.wp.toKatakana
            }
        })
        const answer = convert ? convert(data[INDEX.KANA]) : data[INDEX.KANA]

        return {question, description, answer}
    }
    _subscribe() {
        this.history.events.select(HistoryEvent.Request).subscribe(index => {
            this.next(index)
        })

        this.quiz.events.select(QuizEvent.Start).subscribe(() => {
            const isTapeEnabled = !this._session.solvedMap[this._session.current]

            this.quiz.tape.isEnabled = isTapeEnabled
            this.quiz.tape.caret.isVisible = isTapeEnabled
        })

        this.quiz.events.select(QuizEvent.Check).subscribe(input => {
            if (!this._session.solvedMap[this._session.current]) {
                const normalized = {
                    input: this.wp.toKatakana(input),
                    answer: this.wp.toKatakana(this.quiz.task.answer),
                }

                this.quiz.isSolved = false

                if (normalized.input !== normalized.answer) return
                
                this.quiz.isSolved = true
                this.quiz.tape.isEnabled = false
                this.quiz.tape.caret.isVisible = false

                this._session.solved += 1
                this._session.solvedMap[this._session.current] = true

                this.postpone.save()

                if (this._session.solved >= this._session.tasks.length) {
                    return this._onLessonComplete()
                }
            }

            this.next()
        })

        this.commands.events.select(CommandsEvent.Backspace).subscribe(() => {
            this.quizHelper.removeChar()
        })
        
        this.commands.events.select(CommandsEvent.Hint).subscribe(() => {
            this.quizHelper.showHint()
        })
        
        this.commands.events.select(CommandsEvent.Next).subscribe(() => {
            this.next()
        })
        
        this.commands.events.select(CommandsEvent.Mode).subscribe(mode => {
            this._mode = mode
            this.keyboard.mode = mode

            this.quizHelper.convertAll(match(() => {
                switch (mode) {
                    case KeyboardMode.Hiragana: return this.wp.toHiragana
                    case KeyboardMode.Katakana: return this.wp.toKatakana
                }
            }))
        })
        
        this.keyboard.events.select(KeyboardEvent.Char).subscribe(char => {
            this.quizHelper.setChar(char)
        })

        this.keyboard.events.select(KeyboardEvent.Sokuon).subscribe(() => {
            this.quizHelper.convertChar(this.wp.toggleSokuon)
        })

        this.keyboard.events.select(KeyboardEvent.Dakuten).subscribe(() => {
            this.quizHelper.convertChar(this.wp.toggleDakuten)
        })

        this.keyboard.events.select(KeyboardEvent.Handakuten).subscribe(() => {
            this.quizHelper.convertChar(this.wp.toggleHandakuten)
        })

        this.dom.events.subscribe(event => {
            switch (event) {
                case DOMEvent.Backspace: {
                    this.quizHelper.removeChar()
                } break
                case DOMEvent.ArrowUp: {
                    this.next(this._session.current + 1)
                } break
                case DOMEvent.ArrowDown: {
                    this.next(Math.max(0, this._session.current - 1))
                } break
                case DOMEvent.ArrowRight: {
                    const tapeLength = this.quiz.tape.length
                    const caretPosition = this.quiz.tape.caret.position

                    if (caretPosition < tapeLength - 1) {
                        this.quiz.tape.caret.position += 1
                    }
                } break
                case DOMEvent.ArrowLeft: {
                    this.quiz.tape.caret.position -= 1
                } break
            }
        })
    }
}

const DOMEvent = {
    Backspace: Symbol(),
    ArrowUp: Symbol(),
    ArrowRight: Symbol(),
    ArrowDown: Symbol(),
    ArrowLeft: Symbol(),
}

class LessonDOM extends DOM {
    constructor() {
        super(DOMEvent)

        this.$body = undefined
        this.$quiz = undefined
        this.$keyboard = undefined
        this.$commands = undefined
        this.$history = undefined
    }
    set isCompleted(value) {
        if (value) {
            this.$body.setAttribute('data-is-completed', true)
        } else {
            this.$body.removeAttribute('data-is-completed')
        }
    }
    create($node) {
        super.create($node)

        this.$node.innerHTML = `
            <div id="lesson">
                <div class="column" data-category="quiz">
                    <div id="lesson-quiz"></div>
                </div>
                <div class="column" data-category="controls">
                    <div id="lesson-keyboard"></div>
                    <div id="lesson-commands"></div>
                </div>
                <div class="column" data-category="history">
                    <div id="lesson-history"></div>
                </div>
            </div>
        `

        this.$body = this.$node.querySelector('#lesson')
        this.$quiz = this.$node.querySelector('#lesson-quiz')
        this.$keyboard = this.$node.querySelector('#lesson-keyboard')
        this.$commands = this.$node.querySelector('#lesson-commands')
        this.$history = this.$node.querySelector('#lesson-history')

        this.listeners.add(document, 'keyup', e => {
            const event = match(() => {
                switch (e.code) {
                    case 'Backspace': return DOMEvent.Backspace
                    case 'ArrowUp': return DOMEvent.ArrowUp
                    case 'ArrowRight': return DOMEvent.ArrowRight
                    case 'ArrowDown': return DOMEvent.ArrowDown
                    case 'ArrowLeft': return DOMEvent.ArrowLeft
                }
            })

            if (event) {
                this.events.select(event).publish()
            }
        })
    }
}
