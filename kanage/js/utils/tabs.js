import { DOM } from './dom.js'

export const TabsEvent = {
    Open: Symbol(),
}

export class Tabs extends DOM {
    constructor(tabs) {
        super(TabsEvent)

        this.tabs = tabs
        this.buttons = []
    }
    create($node) {
        super.create($node)

        const html = this.tabs.map(({name, text}, id) => (
            `<button class="tab" data-name="${name}" data-id="${id}">${text}</button>`
        ))

        this.$node.innerHTML = html.join('')

        this.buttons = Array.from(this.$node.querySelectorAll('.tab'))

        this.listeners.add(this.$node, 'click', e => {
            if (e.which !== 1) return
            if (e.target.classList.contains('tab')) {
                this.open(parseInt(e.target.getAttribute('data-id')))
            }
        })
    }
    open(id) {
        this.buttons.forEach($button => $button.removeAttribute('data-is-opened'))
        this.buttons[id].setAttribute('data-is-opened', true)
        this.events.select(TabsEvent.Open).publish(this.tabs[id])
    }
}
