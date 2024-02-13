import { match } from '../utils/utils.js'
import { DOM } from '../utils/dom.js'
import { Feed } from '../utils/feed.js'

export const KeyboardEvent = {
    Char: Symbol(),
    Sokuon: Symbol(),
    Dakuten: Symbol(),
    Handakuten: Symbol(),
    Mode: Symbol(),
}

export const KeyboardMode = {
    Hiragana: Symbol(),
    Katakana: Symbol(),
}

const GRID = [
    [ 'a','ka','sa'],
    ['ta','na','ha'],
    ['ma','ya','ra'],
    ['wa', 'n', '-'],
    ['s*','d*','h*'],
]

const TRAIT = {
     'a': {items: {middle:  'a', left:  'i', top:  'u', right:  'e', bottom:  'o'}},
    'ka': {items: {middle: 'ka', left: 'ki', top: 'ku', right: 'ke', bottom: 'ko'}},
    'sa': {items: {middle: 'sa', left: 'si', top: 'su', right: 'se', bottom: 'so'}},
    'ta': {items: {middle: 'ta', left: 'ti', top: 'tu', right: 'te', bottom: 'to'}},
    'na': {items: {middle: 'na', left: 'ni', top: 'nu', right: 'ne', bottom: 'no'}},
    'ha': {items: {middle: 'ha', left: 'hi', top: 'hu', right: 'he', bottom: 'ho'}},
    'ma': {items: {middle: 'ma', left: 'mi', top: 'mu', right: 'me', bottom: 'mo'}},
    'ya': {items: {middle: 'ya',             top: 'yu',              bottom: 'yo'}},
    'ra': {items: {middle: 'ra', left: 'ri', top: 'ru', right: 're', bottom: 'ro'}},
    'wa': {},
     'n': {},
     '-': {},
    's*': {modifier: 'sokuon'},
    'd*': {modifier: 'dakuten'},
    'h*': {modifier: 'haddakuten'},
}

const TRANSFORM = {
    [KeyboardMode.Hiragana]: {
         'a': 'あ',  'i': 'い',  'u': 'う',  'e': 'え',  'o': 'お',
        'ka': 'か', 'ki': 'き', 'ku': 'く', 'ke': 'け', 'ko': 'こ',
        'sa': 'さ', 'si': 'し', 'su': 'す', 'se': 'せ', 'so': 'そ',
        'ta': 'た', 'ti': 'ち', 'tu': 'つ', 'te': 'て', 'to': 'と',
        'na': 'な', 'ni': 'に', 'nu': 'ぬ', 'ne': 'ね', 'no': 'の',
        'ha': 'は', 'hi': 'ひ', 'hu': 'ふ', 'he': 'へ', 'ho': 'ほ',
        'ma': 'ま', 'mi': 'み', 'mu': 'む', 'me': 'め', 'mo': 'も',
        'ya': 'や',             'yu': 'ゆ',             'yo': 'よ',
        'ra': 'ら', 'ri': 'り', 'ru': 'る', 're': 'れ', 'ro': 'ろ',
        'wa': 'わ',              'n': 'ん',              '-': 'ー',
        's*': 'っ',             'd*': '゛',             'h*': '゜',
    },
    [KeyboardMode.Katakana]: {
         'a': 'ア',  'i': 'イ',  'u': 'ウ',  'e': 'エ',  'o': 'オ',
        'ka': 'カ', 'ki': 'キ', 'ku': 'ク', 'ke': 'ケ', 'ko': 'コ',
        'sa': 'サ', 'si': 'シ', 'su': 'ス', 'se': 'セ', 'so': 'ソ',
        'ta': 'タ', 'ti': 'チ', 'tu': 'ツ', 'te': 'テ', 'to': 'ト',
        'na': 'ナ', 'ni': 'ニ', 'nu': 'ヌ', 'ne': 'ネ', 'no': 'ノ',
        'ha': 'ハ', 'hi': 'ヒ', 'hu': 'フ', 'he': 'ヘ', 'ho': 'ホ',
        'ma': 'マ', 'mi': 'ミ', 'mu': 'ム', 'me': 'メ', 'mo': 'モ',
        'ya': 'ヤ',             'yu': 'ユ',             'yo': 'ヨ',
        'ra': 'ラ', 'ri': 'リ', 'ru': 'ル', 're': 'レ', 'ro': 'ロ',
        'wa': 'ワ',              'n': 'ン',              '-': 'ー',
        's*': 'ッ',             'd*': '゛',             'h*': '゜',
    },
}

export class Keyboard {
    constructor() {
        this.dom = new KeyboardDOM(id => TRANSFORM[this._mode]?.[id] ?? id)
        this.events = new Feed(KeyboardEvent)

        this._mode = undefined
    }
    get mode() {
        return this._mode
    }
    set mode(value) {
        if (value === this._mode) return

        this._mode = value

        this.dom.render()

        this.events.select(KeyboardEvent.Mode).publish(this._mode)
    }
    create($node) {
        this.dom.create($node)

        this.dom.events.select(DOMEvent.Char).subscribe(id => {
            this.events.select(KeyboardEvent.Char).publish(TRANSFORM[this._mode]?.[id] ?? id)
        })

        this.dom.events.select(DOMEvent.Modifier).subscribe(id => {
            const event = match(() => {
                switch (id) {
                    case 's*': return KeyboardEvent.Sokuon
                    case 'd*': return KeyboardEvent.Dakuten
                    case 'h*': return KeyboardEvent.Handakuten
                }
            })

            this.events.select(event).publish()
        })
    }
    destroy() {
        this.events.destroy()
        this.dom.destroy()
    }
}

const DOMEvent = {
    Char: Symbol(),
    Modifier: Symbol(),
}

class KeyboardDOM extends DOM {
    constructor(transform) {
        super(DOMEvent)
        
        this._nodes = []
        this._cells = []
        this._current = undefined

        for (const y in GRID) {
            for (const x in GRID[y]) {
                const id = GRID[y][x]
                const trait = TRAIT[id]

                this._cells.push(new CellDOM(this, id, trait, transform))
            }
        }
    }
    create($node) {
        super.create($node)

        this._createCellNodes()

        this.render()
        
        this._addListeners()
    }
    destroy() {
        this._cells.forEach(cell => cell.destroy())

        super.destroy()
    }
    render() {
        for (const index in this._cells) {
            this._cells[index].destroy()
            this._cells[index].create(this._nodes[index])
        }
    }
    _createCellNodes() {
        this._nodes = new Array(this._cells.length)

        for (const index in this._cells) {
            const $cell = document.createElement('button')

            $cell.setAttribute('class', 'cell')
            $cell.setAttribute('data-index', index)

            this.$node.appendChild($cell)

            this._nodes[index] = $cell
        }
    }
    _addListeners() {
        this.listeners.add(this.$node, 'mousedown', e => {
            if (e.which !== 1) return
            if (!this._current && e.target.classList.contains('cell')) {
                const index = parseInt(e.target.getAttribute('data-index'))

                this._current = this._cells[index]

                this._current.begin()
            }
        })

        this.listeners.add(this.$node, 'touchstart', e => {
            if (!this._current && e.target.classList.contains('cell')) {
                e.preventDefault()

                const index = parseInt(e.target.getAttribute('data-index'))

                this._current = this._cells[index]

                this._current.begin()
            }
        })

        this.listeners.add(document, 'mouseup', e => {
            if (e.which !== 1) return
            if (this._current) {
                this._current.end(e.pageX, e.pageY)

                this._current = undefined
            }
        })
        
        this.listeners.add(document, 'touchend', e => {
            if (this._current) {
                const lastTouch = e.changedTouches[e.changedTouches.length - 1]
                
                this._current.end(lastTouch.pageX, lastTouch.pageY)

                this._current = undefined
            }
        })
    }
}

class CellDOM extends DOM {
    constructor(dom, id, trait, transform) {
        super()

        this.dom = dom
        this.id = id
        this.trait = trait
        this.transform = transform
        this.items = {}
    }
    create($node) {
        super.create($node)
        
        const content = match(() => {
            switch (true) {
                case !!this.trait.items: return this.trait.items.middle
                default: return this.id
            }
        })

        this.$node.setAttribute('data-content', this.transform(content))

        this.items = {}

        if (this.trait.items) {
            for (const position in this.trait.items) {
                const content = this.trait.items[position]

                const $item = document.createElement('button')

                $item.setAttribute('class', 'item')
                $item.setAttribute('data-position', position)
                $item.setAttribute('data-content', this.transform(content))
            
                this.$node.appendChild($item)

                this.items[position] = $item
            }
        }
    }
    abort() {
        this.$node.removeAttribute('data-is-selected')
    }
    begin() {
        this.$node.setAttribute('data-is-selected', true)
    }
    end(x, y) {
        switch (true) {
            case !!this.trait.items: {
                for (const position in this.trait.items) {
                    const $item = this.items[position]
                    const rect = $item.getBoundingClientRect()

                    if (isInRect(x, y, rect)) {
                        const id = this.trait.items[position]

                        this.dom.events.select(DOMEvent.Char).publish(id)

                        break
                    }
                }
            } break
            case !!this.trait.modifier: {
                const rect = this.$node.getBoundingClientRect()

                if (isInRect(x, y, rect)) {
                    this.dom.events.select(DOMEvent.Modifier).publish(this.id)
                }
            } break
            default: {
                const rect = this.$node.getBoundingClientRect()

                if (isInRect(x, y, rect)) {
                    this.dom.events.select(DOMEvent.Char).publish(this.id)
                }
            } break
        }

        this.$node.removeAttribute('data-is-selected')
    }
}

function isInRect(px, py, {x, y, width, height}) {
    return px >= x && px < x + width && py >= y && py < y + height
}
