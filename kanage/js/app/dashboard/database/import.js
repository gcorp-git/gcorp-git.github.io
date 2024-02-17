import { INDEX } from '../../../data.js'
import { match } from '../../../utils/utils.js'
import { Feed } from '../../../utils/feed.js'
import { Modal } from '../../../utils/modal.js'
import { Rows, RowsMode } from '../../../utils/rows.js'
import { StoreKey } from '../../../data.js'
import { DataFormat, FORMATS, UnknownFormatError } from '../../../io.js'

const ICON = {
    LOAD: '⇚',
}

export class Import {
    constructor(parent) {
        this.parent = parent
        this.app = this.parent.app
        this.modal = new ImportModal(this.parent.dom)

        this.parent.rows.import = new Rows(id => {
            const item = this._data[id]

            return `
                <div class="text">
                    <div class="translation">${item[INDEX.TRANSLATION] ?? ''}</div>
                    <div class="kana">${item[INDEX.KANA] ?? ''}</div>
                    <div class="kanji">${item[INDEX.KANJI] ?? ''}</div>
                </div>
            `
        })

        this._data = undefined
    }
    create() {
        this.parent.dom.$add.disabled = true
        this.parent.dom.$edit.disabled = true
        this.parent.dom.$remove.disabled = true
        this.parent.dom.$export.disabled = true
        
        this.parent.rows.database.isVisible = false
        
        this.parent.rows.import.create(this.parent.dom.$rows.import)

        this.parent.rows.import.mode = RowsMode.Check

        this.modal.create(FORMATS)

        this.modal.events.select(ImportModalEvent.Load).subscribe(file => {
            const format = match(() => {
                for (const {type, format} of FORMATS) {
                    if (file.type === type) return format
                }

                throw new UnknownFormatError()
            })

            const reader = new FileReader()

            reader.onload = e => this._onFileLoad(format, e.target.result)

            reader.readAsText(file)
        })
    }
    destroy() {
        this.save()

        this.parent.dom.$add.disabled = false
        this.parent.dom.$edit.disabled = false
        this.parent.dom.$remove.disabled = false
        this.parent.dom.$export.disabled = false

        this.parent.rows.database.isVisible = true
        this.parent.rows.import.isVisible = false

        this.parent.rows.import.destroy()

        this.modal.destroy()
    }
    search(value) {
        if (value) {
            const uppercased = value.toUpperCase()

            this.parent.rows.import.filter = id => {
                if (!this._data) return

                const item = this._data[id]
                const fields = [item[INDEX.TRANSLATION], item[INDEX.KANA], item[INDEX.KANJI]]

                for (const field of fields) {
                    if (field.toUpperCase().indexOf(uppercased) !== -1) return true
                }

                return false
            }
        } else {
            this.parent.rows.import.filter = undefined
        }
    }
    save() {
        if (!this._data) return

        const imported = this.parent.rows.import.getCheckedIds().map(id => this._data[id])

        this.app.store.select(StoreKey.Database).edit(data => {
            imported.forEach(value => data.items[data.uid++] = value)

            return data
        })

        this._data = undefined
    }
    _onFileLoad(format, content) {
        const dbItems = this.app.store.select(StoreKey.Database).get().items
        const exists = {}
        
        Object.keys(dbItems).forEach(id => exists[dbItems[id][INDEX.KANA]] = true)

        const data = match(() => {
            switch (format) {
                case DataFormat.CSV: return this.app.io.select(format).decode(content).data
                case DataFormat.JSON: return this.app.io.select(format).decode(content)
                default: throw new UnknownFormatError()
            }
        }).filter(row => {
            const translation = row[INDEX.TRANSLATION]
            const kana = row[INDEX.KANA]
            const kanji = row[INDEX.KANJI]

            return kana && (translation || kanji) && !exists[kana]
        })
        
        data.forEach(row => {
            row[INDEX.TRANSLATION] = row[INDEX.TRANSLATION] ?? ''
            row[INDEX.KANA] = row[INDEX.KANA] ?? ''
            row[INDEX.KANJI] = row[INDEX.KANJI] ?? ''
        })

        this._data = data

        this.parent.rows.import.ids = Object.keys(this._data)

        this.parent.rows.import.checkAll()

        this.parent.rows.import.isVisible = true
    }
}

const ImportModalEvent = {
    Load: Symbol(),
    Cancel: Symbol(),
}

class ImportModal {
    constructor(dom) {
        this.dom = dom
        this.modal = new Modal('modal')
        this.events = new Feed(ImportModalEvent)
    }
    create(formats) {
        this.modal.destroy()
        this.modal.create(this.dom.$modals)

        this.modal.$bg.setAttribute('data-id', 'import')

        const accept = formats.map(({ext}) => `.${ext}`).join(',')

        this.modal.$content.innerHTML = `
            <div class="column column-file">
                <label class="label">
                    <div class="icon">${ICON.LOAD}</div>
                    <div class="text">Choose file</div>
                    <input type="file" accept="${accept}" hidden/>
                </label>
            </div>
        `

        const $input = this.modal.$content.querySelector('input[type="file"]')

        this.modal.listeners.add($input, 'change', () => {
            if (!$input.files.length) return

            const file = $input.files[0]

            this.events.select(ImportModalEvent.Load).publish(file)
        })
    }
    destroy() {
        this.events.destroy()
        this.modal.destroy()
    }
}

