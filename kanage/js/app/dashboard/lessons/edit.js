import { Feed } from '../../../utils/feed.js'
import { Modal } from '../../../utils/modal.js'
import { StoreKey } from '../../../data.js'
import { IconModal, IconModalEvent } from './icon-modal.js'

export class Edit {
    constructor(parent) {
        this.parent = parent
        this.app = this.parent.app
        this.modal = {
            edit: new EditModal(this.parent.dom),
            icon: new IconModal(this.app),
        }

        this._id = undefined
    }
    create() {
        this.parent.dom.$add.disabled = true
        this.parent.dom.$remove.disabled = true

        this.modal.edit.events.select(EditModalEvent.ChooseIcon).subscribe(() => {
            this.modal.icon.events.select(IconModalEvent.Choose).subscribe(icon => {
                this.modal.edit.icon = icon

                this.modal.icon.destroy()
            })

            this.modal.icon.create()
        })

        this.modal.edit.events.select(EditModalEvent.Save).subscribe(({icon, name}) => {
            const id = this._id
            const ids = this.parent.rows.database.getCheckedIds()
            
            this.app.store.select(StoreKey.Lessons).edit(data => {
                data[id].icon = icon
                data[id].name = name
                data[id].ids = ids
                
                return data
            })

            this.app.store.select(StoreKey.Sessions).edit(data => {
                delete data[id]

                return data
            })
        })
    }
    destroy() {
        this.parent.dom.$add.disabled = false
        this.parent.dom.$remove.disabled = false

        this.parent.dom.$save.hidden = true

        this.parent.rows.lessons.isVisible = true
        this.parent.rows.database.isVisible = false

        for (const name in this.modal) {
            this.modal[name].destroy()
        }
    }
    open(id) {
        this.parent.dom.$save.hidden = false

        this.parent.rows.lessons.isVisible = false
        this.parent.rows.database.isVisible = true

        this._id = id
        
        const {icon, name, ids} = this.app.store.select(StoreKey.Lessons).get()[id]

        this.parent.rows.database.uncheckAll()
        this.parent.rows.database.check(ids)

        this.modal.edit.create({icon, name})
    }
    save() {
        this.modal.edit.save()
    }
}

const EditModalEvent = {
    ChooseIcon: Symbol(),
    Save: Symbol(),
}

class EditModal {
    constructor(dom) {
        this.dom = dom
        this.modal = new Modal('modal')
        this.events = new Feed(EditModalEvent)

        this.$iconLabel = undefined
        this.$iconValue = undefined
        this.$iconInput = undefined
    }
    set icon(value) {
        this.$iconInput.value = value
        this.$iconValue.textContent = value
    }
    create({icon, name}) {
        this.modal.destroy()
        this.modal.create(this.dom.$modals)

        this.modal.$bg.setAttribute('data-id', 'edit')

        this.modal.$content.innerHTML = `
            <div class="column column-icon">
                <label class="icon-label">
                    <span class="value">${icon}</span>
                    <input type="text" name="icon" value="${icon}" hidden/>
                </label>
            </div>
            <div class="column column-name">
                <input type="text" name="name" value="${name}"/>
            </div>
        `

        this.$iconLabel = this.modal.$content.querySelector('.icon-label')
        this.$iconValue = this.$iconLabel.querySelector('.value')
        this.$iconInput = this.$iconLabel.querySelector('input[name="icon"]')

        this.modal.listeners.add(this.$iconLabel, 'click', e => {
            if (e.which !== 1) return
            if (e.target === this.$iconInput) return

            this.events.select(EditModalEvent.ChooseIcon).publish()
        })
    }
    destroy() {
        this.events.destroy()
        this.modal.destroy()
    }
    save() {
        const $icon = this.modal.$content.querySelector('input[name="icon"]')
        const $name = this.modal.$content.querySelector('input[name="name"]')

        this.events.select(EditModalEvent.Save).publish({
            icon: $icon.value,
            name: $name.value,
        })
    }
}
