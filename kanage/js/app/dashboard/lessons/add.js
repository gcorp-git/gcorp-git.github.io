import { Feed } from '../../../utils/feed.js'
import { Modal } from '../../../utils/modal.js'
import { StoreKey } from '../../../data.js'
import { IconModal, IconModalEvent } from './icon-modal.js'

const PLACEHOLDER = {
    ICON: '⭐',
    NAME: 'Title',
}

export class Add {
    constructor(parent) {
        this.parent = parent
        this.app = this.parent.app
        this.modal = {
            add: new AddModal(this.parent.dom),
            icon: new IconModal(this.app),
        }
    }
    create() {
        this.parent.dom.$edit.disabled = true
        this.parent.dom.$remove.disabled = true
        
        this.parent.rows.lessons.isVisible = false
        this.parent.rows.database.isVisible = true

        this.parent.rows.database.uncheckAll()

        this.modal.add.create()

        this.modal.add.events.select(AddModalEvent.ChooseIcon).subscribe(() => {
            this.modal.icon.events.select(IconModalEvent.Choose).subscribe(icon => {
                this.modal.add.icon = icon

                this.modal.icon.destroy()
            })

            this.modal.icon.create()
        })
    }
    destroy() {
        this.save()

        this.parent.dom.$edit.disabled = false
        this.parent.dom.$remove.disabled = false

        this.parent.rows.lessons.isVisible = true
        this.parent.rows.database.isVisible = false

        for (const name in this.modal) {
            this.modal[name].destroy()
        }
    }
    save() {
        const {icon, name} = this.modal.add.data

        if (!icon || !name) return

        const ids = this.parent.rows.database.getCheckedIds()

        this.app.store.select(StoreKey.Lessons).edit(data => {
            data.push({icon, name, ids})

            return data
        })
    }
}

const AddModalEvent = {
    ChooseIcon: Symbol(),
}

class AddModal {
    constructor(dom) {
        this.dom = dom
        this.modal = new Modal('modal')
        this.events = new Feed(AddModalEvent)

        this.$iconLabel = undefined
        this.$iconValue = undefined
        this.$iconInput = undefined
    }
    get data() {
        const $icon = this.modal.$content.querySelector('input[name="icon"]')
        const $name = this.modal.$content.querySelector('input[name="name"]')

        return {
            icon: $icon.value,
            name: $name.value,
        }
    }
    set icon(value) {
        this.$iconInput.value = value
        this.$iconValue.textContent = value
    }
    create() {
        this.modal.create(this.dom.$modals)

        this.modal.$bg.setAttribute('data-id', 'add')

        this.modal.$content.innerHTML = `
            <div class="column column-icon">
                <label class="icon-label">
                    <span class="value">${PLACEHOLDER.ICON}</span>
                    <input type="text" name="icon" value="${PLACEHOLDER.ICON}" hidden/>
                </label>
            </div>
            <div class="column column-name">
                <input type="text" name="name" value="" placeholder="${PLACEHOLDER.NAME}"/>
            </div>
        `

        this.$iconLabel = this.modal.$content.querySelector('.icon-label')
        this.$iconValue = this.$iconLabel.querySelector('.value')
        this.$iconInput = this.$iconLabel.querySelector('input[name="icon"]')

        this.modal.listeners.add(this.$iconLabel, 'click', e => {
            if (e.which !== 1) return
            if (e.target === this.$iconInput) return

            this.events.select(AddModalEvent.ChooseIcon).publish()
        })
    }
    destroy() {
        this.events.destroy()
        this.modal.destroy()
    }
}
