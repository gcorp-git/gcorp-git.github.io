import { INDEX } from '../../../data.js'
import { Modal } from '../../../utils/modal.js'
import { StoreKey } from '../../../data.js'

const PLACEHOLDER = {
    translation: 'Japan',
    kana: 'にほん',
    kanji: '日本',
}

export class Add {
    constructor(parent) {
        this.parent = parent
        this.app = this.parent.app
        this.modal = new AddModal(this.parent.dom)
    }
    create() {
        this.parent.dom.$edit.disabled = true
        this.parent.dom.$remove.disabled = true
        this.parent.dom.$import.disabled = true
        this.parent.dom.$export.disabled = true
        
        this.modal.create()
    }
    destroy() {
        this.save()

        this.parent.dom.$edit.disabled = false
        this.parent.dom.$remove.disabled = false
        this.parent.dom.$import.disabled = false
        this.parent.dom.$export.disabled = false

        this.modal.destroy()
    }
    save() {
        const {translation, kana, kanji} = this.modal.data

        if (!kana || (!translation && !kanji)) return
        
        this.app.store.select(StoreKey.Database).edit(data => {
            const id = data.uid++
            const item = []

            item[INDEX.TRANSLATION] = translation
            item[INDEX.KANA] = kana
            item[INDEX.KANJI] = kanji

            data.items[id] = item

            return data
        })
    }
}

class AddModal {
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
    create() {
        this.modal.destroy()
        this.modal.create(this.dom.$modals)

        this.modal.$bg.setAttribute('data-id', 'add')

        this.modal.$content.innerHTML = `
            <div class="column column-translation">
                <input type="text" name="translation" placeholder="${PLACEHOLDER.translation}"/>
            </div>
            <div class="column column-kana">
                <input type="text" name="kana" placeholder="${PLACEHOLDER.kana}"/>
            </div>
            <div class="column column-kanji">
                <input type="text" name="kanji" placeholder="${PLACEHOLDER.kanji}"/>
            </div>
        `
    }
    destroy() {
        this.modal.destroy()
    }
}
