import { download } from '../../../utils/utils.js'
import { Feed } from '../../../utils/feed.js'
import { Modal } from '../../../utils/modal.js'
import { StoreKey } from '../../../data.js'
import { FORMATS } from '../../../io.js'

export class Export {
    constructor(parent) {
        this.parent = parent
        this.app = this.parent.app
        this.modal = new ExportModal(this.parent.dom)
    }
    create() {
        this.parent.dom.$add.disabled = true
        this.parent.dom.$edit.disabled = true
        this.parent.dom.$remove.disabled = true
        this.parent.dom.$import.disabled = true
        
        this.parent.rows.database.isVisible = false

        this.modal.create(FORMATS)

        this.modal.events.select(ExportModalEvent.Download).subscribe(({ext, format}) => {
            const database = this.app.store.select(StoreKey.Database).get()
            const list = Object.values(database.items)
            const encoded = this.app.io.select(format).encode(list)

            download(`KanageDatabase.${ext}`, encoded)

            this.parent.setDefaultState()
        })
    }
    destroy() {
        this.parent.dom.$add.disabled = false
        this.parent.dom.$edit.disabled = false
        this.parent.dom.$remove.disabled = false
        this.parent.dom.$import.disabled = false

        this.parent.rows.database.isVisible = true

        this.modal.destroy()
    }
}

const ExportModalEvent = {
    Download: Symbol(),
}

class ExportModal {
    constructor(dom) {
        this.dom = dom
        this.modal = new Modal('modal')
        this.events = new Feed(ExportModalEvent)
    }
    create(formats) {
        this.modal.destroy()
        this.modal.create(this.dom.$modals)

        this.modal.$bg.setAttribute('data-id', 'export')

        const html = formats.map(({name}, index) => (
            `<button class="button" data-index="${index}">${name}</button>`
        ))

        this.modal.$content.innerHTML = `
            <div class="column column-buttons">${html.join('')}</div>
        `

        this.modal.listeners.add(this.modal.$content, 'click', e => {
            if (e.which !== 1) return
            if (e.target.classList.contains('button')) {
                const index = parseInt(e.target.getAttribute('data-index'))

                this.events.select(ExportModalEvent.Download).publish(formats[index])
            }
        })
    }
    destroy() {
        this.events.destroy()
        this.modal.destroy()
    }
}
