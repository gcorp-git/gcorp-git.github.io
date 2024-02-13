import { match } from '../../../utils/utils.js'
import { Feed } from '../../../utils/feed.js'
import { Modal } from '../../../utils/modal.js'
import { StoreKey } from '../../../data.js'

const ICON = {
    ADD: '+',
    REMOVE: '🗑',
}

export const IconModalEvent = {
    Mode: Symbol(),
    Choose: Symbol(),
}

export const IconModalMode = {
    Default: Symbol(),
    Remove: Symbol(),
}

export class IconModal {
    constructor(app) {
        this.app = app
        this.modal = new Modal('modal')
        this.events = new Feed(IconModalEvent)

        this.$input = undefined
        this.$remove = undefined
        this.$tape = undefined
        this.icons = []

        this._mode = undefined
        this._removeIndices = []
        this._store = {
            icons: undefined,
        }
        this._onStoreUpdate = icons => {
            this._store.icons = icons
            this._removeIndices = new Array(this._store.icons.length).fill(false)

            this._renderIcons()
        }
    }
    get mode() {
        return this._mode
    }
    set mode(value) {
        if (value === this._mode) return
        
        this._mode = value

        this.modal.$bg.setAttribute('data-mode', match(() => {
            switch (value) {
                case IconModalMode.Default: return 'default'
                case IconModalMode.Remove: return 'remove'
            }
        }))

        this.events.select(IconModalEvent.Mode).publish(this._mode)
    }
    create() {
        this.modal.create(this.app.dom.$node)

        this.modal.$bg.setAttribute('data-id', 'icon')

        this.app.store.select(StoreKey.Icons).subscribe(this._onStoreUpdate)

        this._store.icons = this.app.store.select(StoreKey.Icons).get()
        this._removeIndices = new Array(this._store.icons.length).fill(false)
        
        this.mode = IconModalMode.Default

        this._innerHTML()

        this.$tape = this.modal.$content.querySelector('.tape')
        this.$input = this.modal.$content.querySelector('input[name="icon"]')
        this.$remove = this.modal.$content.querySelector('button[data-action="remove"]')

        this._renderIcons()
        this._addListeners()
    }
    destroy() {
        this.app.store.select(StoreKey.Icons).unsubscribe(this._onStoreUpdate)

        this.events.destroy()
        this.modal.destroy()
    }
    _innerHTML() {
        this.modal.$content.innerHTML = `
            <div class="controls">
                <input name="icon" value="" placeholder="${ICON.ADD}"/>
                <button class="button" data-action="remove">${ICON.REMOVE}</button>
            </div>
            <div class="tape"></div>
        `
    }
    _renderIcons() {
        const html = this._store.icons.map((icon, index) => (
            `<button class="button" data-action="choose" data-index="${index}">${icon}</button>`
        ))

        this.$tape.innerHTML = html.join('')
        
        this.icons = Array.from(this.$tape.querySelectorAll('.button'))
    }
    _addListeners() {
        this.modal.listeners.add(this.$input, 'input', () => {
            const icon = this.$input.value

            if (!icon) return

            this.$input.value = ''
            this.$input.blur()

            const index = this._store.icons.indexOf(icon)

            this.app.store.select(StoreKey.Icons).edit(icons => {
                if (index >= 0) icons.splice(index, 1)

                icons.unshift(icon)

                return icons
            })
        })

        this.modal.listeners.add(this.modal.$content, 'click', e => {
            if (e.which !== 1) return

            const $button = e.target.closest('.button')

            if (!$button) return

            const action = $button.getAttribute('data-action')

            switch (action) {
                case 'remove': {
                    switch (this._mode) {
                        case IconModalMode.Default: {
                            this.$input.disabled = true
                            this.mode = IconModalMode.Remove
                        } break
                        case IconModalMode.Remove: {
                            this.$input.disabled = false

                            const icons = []

                            this._removeIndices.forEach((isRemoved, index) => {
                                if (!isRemoved) icons.push(this._store.icons[index])
                            })

                            this.app.store.select(StoreKey.Icons).edit(_ => icons)

                            this.mode = IconModalMode.Default
                        } break
                    }
                } break
                case 'choose': {
                    const index = parseInt($button.getAttribute('data-index'))

                    switch (this._mode) {
                        case IconModalMode.Default: {
                            const index = $button.getAttribute('data-index')
                            const icon = this._store.icons[index]

                            this.events.select(IconModalEvent.Choose).publish(icon)
                        } break
                        case IconModalMode.Remove: {
                            if (this._removeIndices[index]) {
                                this._removeIndices[index] = false
                                this.icons[index].removeAttribute('data-remove')
                            } else {
                                this._removeIndices[index] = true
                                this.icons[index].setAttribute('data-remove', true)
                            }
                        } break
                    }
                } break
            }
        })
    }
}
