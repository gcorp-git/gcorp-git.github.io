import { INDEX } from '../../../data.js'
import { Modal } from '../../../utils/modal.js'
import { StoreKey } from '../../../data.js'

export class Edit {
    constructor(parent) {
        this.parent = parent
        this.app = this.parent.app
        this.modal = new EditModal(this.parent.dom)

        this._id = undefined
    }
    create() {
        this.parent.dom.$add.disabled = true
        this.parent.dom.$remove.disabled = true
        this.parent.dom.$import.disabled = true
        this.parent.dom.$export.disabled = true

        this._id = undefined
    }
    destroy() {
        this.save()

        this.parent.dom.$add.disabled = false
        this.parent.dom.$remove.disabled = false
        this.parent.dom.$import.disabled = false
        this.parent.dom.$export.disabled = false

        this.modal.destroy()
    }
    open(id) {
        this.save()

        this.modal.destroy()

        this._id = id

        const database = this.app.store.select(StoreKey.Database).get()
        const item = database.items[id]

        this.modal.create({
            translation: item[INDEX.TRANSLATION],
            kana: item[INDEX.KANA],
            kanji: item[INDEX.KANJI],
        })
    }
    save() {
        if (this._id === undefined) return

        const id = this._id

        const {translation, kana, kanji} = this.modal.data

        if (!kana || (!translation && !kanji)) return

        this.app.store.select(StoreKey.Database).edit(data => {
            const item = data.items[id]

            item[INDEX.TRANSLATION] = translation
            item[INDEX.KANA] = kana
            item[INDEX.KANJI] = kanji

            return data
        })
    }
}

class EditModal {
    constructor(dom) {
        this.dom = dom
        this.modal = new Modal('modal')
    }
    get data() {
        const $translation = this.modal.$content.querySelector('input[name="translation"]')
        const $kana = this.modal.$content.querySelector('input[name="kana"]')
        const $kanji = this.modal.$content.querySelector('input[name="kanji"]')

        return {
            translation: $translation.value,
            kana: $kana.value,
            kanji: $kanji.value,
        }
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
        this.modal.destroy()
    }
}
