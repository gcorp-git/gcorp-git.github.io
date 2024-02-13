import { INDEX } from '../../../data.js'
import { Feed } from '../../../utils/feed.js'
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
        
        this.parent.dom.$save.hidden = false

        this.modal.create()

        this.modal.events.select(AddModalEvent.Save).subscribe(({translation, kana, kanji}) => {
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

            this.modal.destroy()
        })
    }
    destroy() {
        this.parent.dom.$edit.disabled = false
        this.parent.dom.$remove.disabled = false
        this.parent.dom.$import.disabled = false
        this.parent.dom.$export.disabled = false

        this.parent.dom.$save.hidden = true

        this.modal.destroy()
    }
    save() {
        this.modal.save()
    }
}

const AddModalEvent = {
    Save: Symbol(),
}

class AddModal {
    constructor(dom) {
        this.dom = dom
        this.modal = new Modal('modal')
        this.events = new Feed(AddModalEvent)
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
        this.events.destroy()
        this.modal.destroy()
    }
    save() {
        const $translation = this.modal.$content.querySelector('input[name="translation"]')
        const $kana = this.modal.$content.querySelector('input[name="kana"]')
        const $kanji = this.modal.$content.querySelector('input[name="kanji"]')

        this.events.select(AddModalEvent.Save).publish({
            translation: $translation.value,
            kana: $kana.value,
            kanji: $kanji.value,
        })
    }
}
