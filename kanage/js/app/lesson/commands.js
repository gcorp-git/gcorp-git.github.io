import { match } from '../../utils/utils.js'
import { DOM } from '../../utils/dom.js'
import { Feed } from '../../utils/feed.js'
import { KeyboardMode } from '../../tools/keyboard.js'

const ICON = {
    BACKSPACE: '⌫',
    HINT: '?',
    NEXT: '↷',
    KATAKANA: 'ア',
    HIRAGANA: 'あ',
}

export const CommandsEvent = {
    Backspace: Symbol(),
    Hint: Symbol(),
    Next: Symbol(),
    Mode: Symbol(),
}

export class Commands {
    constructor(app) {
        this.app = app
        this.dom = new CommandsDOM([
            {name: 'backspace', event: CommandsEvent.Backspace, render: () => ICON.BACKSPACE},
            {name: 'hint', event: CommandsEvent.Hint, render: () => ICON.HINT},
            {name: 'next', event: CommandsEvent.Next, render: () => ICON.NEXT},
            {name: 'mode', event: CommandsEvent.Mode, render: () => {
                switch (this._mode) {
                    case KeyboardMode.Hiragana: return ICON.KATAKANA
                    default: return ICON.HIRAGANA
                }
            }},
        ])
        this.events = new Feed(CommandsEvent)

        this._mode = undefined
    }
    get mode() {
        return this._mode
    }
    set mode(value) {
        if (value === this._mode) return

        this._mode = value

        this.dom.render()

        this.events.select(CommandsEvent.Mode).publish(this._mode)
    }
    create($node) {
        this.dom.create($node)
        
        this.dom.events.select(DOMEvent.Execute).subscribe(({event}) => {
            switch (event) {
                case CommandsEvent.Mode: return this.toggleMode()
                default: return this.events.select(event).publish()
            }
        })
    }
    destroy() {
        this.events.destroy()
        this.dom.destroy()
    }
    toggleMode() {
        this.mode = match(() => {
            switch (this._mode) {
                case KeyboardMode.Hiragana: return KeyboardMode.Katakana
                default: return KeyboardMode.Hiragana
            }
        })
    }
}

const DOMEvent = {
    Execute: Symbol(),
}

class CommandsDOM extends DOM {
    constructor(commands) {
        super(DOMEvent)

        this.commands = commands

        this._buttons = []
    }
    create($node) {
        super.create($node)

        this._buttons = new Array(this.commands.length)

        for (const index in this.commands) {
            const {name} = this.commands[index]

            const $button = document.createElement('button')

            $button.setAttribute('class', 'command')
            $button.setAttribute('data-index', index)
            $button.setAttribute('data-name', name)

            this.$node.appendChild($button)

            this._buttons[index] = $button
        }

        this.render()

        this._addListeners()
    }
    render() {
        for (const index in this.commands) {
            const {render} = this.commands[index]

            this._buttons[index].textContent = render() ?? ''
        }
    }
    _addListeners() {
        this.listeners.add(this.$node, 'click', e => {
            if (e.which !== 1) return
            if (e.target.classList.contains('command')) {
                const index = e.target.getAttribute('data-index')
                
                this.events.select(DOMEvent.Execute).publish(this.commands[index])
            }
        })
    }
}
