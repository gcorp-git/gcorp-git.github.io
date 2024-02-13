import { INDEX } from '../../../data.js'
import { Feed } from '../../../utils/feed.js'
import { Modal } from '../../../utils/modal.js'
import { StoreKey } from '../../../data.js'

export class Edit {
    constructor(parent) {
        this.parent = parent
        this.app = this.parent.app
        this.modal = new EditModal(this.parent.dom)
    }
    create() {
        this.parent.dom.$add.disabled = true
        this.parent.dom.$remove.disabled = true
        this.parent.dom.$import.disabled = true
        this.parent.dom.$export.disabled = true
    }
    destroy() {
        this.parent.dom.$add.disabled = false
        this.parent.dom.$remove.disabled = false
        this.parent.dom.$import.disabled = false
        this.parent.dom.$export.disabled = false

        this.parent.dom.$save.hidden = true

        this.modal.destroy()
    }
    open(id) {
        this.modal.destroy()

        this.parent.dom.$save.hidden = false

        const database = this.app.store.select(StoreKey.Database).get()
        const item = database.items[id]

        this.modal.create({
            translation: item[INDEX.TRANSLATION],
            kana: item[INDEX.KANA],
            kanji: item[INDEX.KANJI],
        })

        this.modal.events.select(EditModalEvent.Save).subscribe(({translation, kana, kanji}) => {
            this.app.store.select(StoreKey.Database).edit(data => {
                const item = data.items[id]

                item[INDEX.TRANSLATION] = translation
                item[INDEX.KANA] = kana
                item[INDEX.KANJI] = kanji

                return data
            })

            this.modal.destroy()
        })
    }
    save() {
        this.modal.save()
    }
}

const EditModalEvent = {
    Save: Symbol(),
}

class EditModal {
    constructor(dom) {
        this.dom = dom
        this.modal = new Modal('modal')
        this.events = new Feed(EditModalEvent)
    }
    create({translation, kana, kanji}) {
        this.modal.destroy()
        this.modal.create(this.dom.$modals)

        this.modal.$bg.setAttribute('data-id', 'edit')

        this.modal.$content.innerHTML = `
            <div class="column column-translation">
                <input type="text" name="translation" value="${translation ?? ''}"/>
            </div>
            <div class="column column-kana">
                <input type="text" name="kana" value="${kana ?? ''}"/>
            </div>
            <div class="column column-kanji">
                <input type="text" name="kanji" value="${kanji ?? ''}"/>
            </div>
        `
    }
    destroy() {
        this.events.destroy()
        this.modal.destroy()
    }
    save() {
        const $translation = this.modal.$content.querySelector('input[name="translation"]')
        const $kana = this.modal.$content.querySelector('input[name="kana"]')
        const $kanji = this.modal.$content.querySelector('input[name="kanji"]')

        this.events.select(EditModalEvent.Save).publish({
            translation: $translation.value,
            kana: $kana.value,
            kanji: $kanji.value,
        })
    }
}
