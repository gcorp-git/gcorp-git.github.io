import { match, postponed } from '../../utils/utils.js'
import { DOM } from '../../utils/dom.js'
import { StoreKey } from '../../data.js'

const SECTION = {
    QUIZ_QUESTION: {
        NAME: 'quizQuestion',
        VALUE: {
            KANJI: 'kanji',
            TRANSLATION: 'translation',
        },
    },
    APP_DIRECTION: {
        NAME: 'appDirection',
        VALUE: {
            LTR: 'ltr',
            RTL: 'rtl',
        },
    },
    APP_THEME: {
        NAME: 'appTheme',
        VALUE: {
            DARK: 'dark',
            LIGHT: 'light',
        },
    },
}

export class Settings {
    constructor(parent) {
        this.parent = parent
        this.app = this.parent.app
        this.dom = new SettingsDOM()
    }
    create() {
        this.dom.create(this.parent.dom.$content)
        
        this.dom.sections = [
            {name: SECTION.QUIZ_QUESTION.NAME, text: 'Lesson Question:', options: [
                {text: 'Kanji', value: SECTION.QUIZ_QUESTION.VALUE.KANJI},
                {text: 'Translation', value: SECTION.QUIZ_QUESTION.VALUE.TRANSLATION},
            ]},
            {name: SECTION.APP_DIRECTION.NAME, text: 'Text Direction:', options: [
                {text: 'Left to Right', value: SECTION.APP_DIRECTION.VALUE.LTR},
                {text: 'Right to Left', value: SECTION.APP_DIRECTION.VALUE.RTL},
            ]},
            {name: SECTION.APP_THEME.NAME, text: 'Theme:', options: [
                {text: 'Dark', value: SECTION.APP_THEME.VALUE.DARK},
                {text: 'Light', value: SECTION.APP_THEME.VALUE.LIGHT},
            ]},
        ]

        const settings = this.app.store.select(StoreKey.Settings).get()

        this.dom.set(SECTION.QUIZ_QUESTION.NAME, settings.quiz.question)
        this.dom.set(SECTION.APP_DIRECTION.NAME, settings.app.direction)
        this.dom.set(SECTION.APP_THEME.NAME, settings.app.theme)

        this.dom.events.select(DOMEvent.Change).subscribe(({section, value}) => {
            const edit = match(() => {
                switch (section.name) {
                    case SECTION.QUIZ_QUESTION.NAME: return (data, value) => data.quiz.question = value
                    case SECTION.APP_DIRECTION.NAME: return (data, value) => data.app.direction = value
                    case SECTION.APP_THEME.NAME: return (data, value) => data.app.theme = value
                }
            })

            this.app.store.select(StoreKey.Settings).edit(data => (edit(data, value), data))
        })
    }
    destroy() {
        this.dom.destroy()
    }
}

const DOMEvent = {
    Change: Symbol(),
}

class SettingsDOM extends DOM {
    constructor() {
        super(DOMEvent)
        
        this.$body = undefined
        this.$form = undefined
        this.postpone = {
            render: postponed(this._render.bind(this)),
        }

        this._sections = []
        this._values = {}
    }
    set sections(value) {
        this._sections = value
        this._values = {}

        this.postpone.render()
    }
    create($node) {
        super.create($node)

        this.$node.innerHTML = `
            <div id="dashboard-settings">
                <form name="settings"></form>
            </div>
        `

        this.$body = this.$node.querySelector('#dashboard-settings')
        this.$form = this.$node.querySelector('form[name="settings"]')

        this.listeners.add(this.$form, 'change', e => {
            const $section = e.target.closest('section')

            if (!$section) return

            const index = parseInt($section.getAttribute('data-index'))
            const section = this._sections[index]
            const value = this.$form.elements[section.name].value

            this.events.select(DOMEvent.Change).publish({section, value})
        })
    }
    set(name, value) {
        this._values[name] = value

        this.postpone.render
    }
    render() {
        this.postpone.render()
    }
    _render() {
        const html = []

        for (const index in this._sections) {
            const {name, text, options} = this._sections[index]

            const optionsHTML = options.map(({text, value}) => (
                `<option value="${value}">${text}</option>`
            ))

            html.push(`
                <section data-index="${index}">
                    <div class="row">
                        <div class="column">
                            <span class="text">${text}</span>
                        </div>
                        <div class="column">
                            <select name="${name}">${optionsHTML.join('')}</select>
                        </div>
                    </div>
                </section>
            `)
        }

        this.$form.innerHTML = html.join('')
        
        for (const name in this._values) {
            this.$form.elements[name].value = this._values[name]
        }
    }
}
