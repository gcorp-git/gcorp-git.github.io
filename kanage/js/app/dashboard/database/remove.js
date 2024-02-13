import { StoreKey } from '../../../data.js'
import { RowsMode } from '../../../utils/rows.js'

export class Remove {
    constructor(parent) {
        this.parent = parent
        this.app = this.parent.app
    }
    create() {
        this.parent.dom.$add.disabled = true
        this.parent.dom.$edit.disabled = true
        this.parent.dom.$import.disabled = true
        this.parent.dom.$export.disabled = true

        this.parent.dom.$save.hidden = false

        this.parent.rows.database.mode = RowsMode.Check
    }
    destroy() {
        this.parent.dom.$add.disabled = false
        this.parent.dom.$edit.disabled = false
        this.parent.dom.$import.disabled = false
        this.parent.dom.$export.disabled = false
        
        this.parent.dom.$save.hidden = true

        this.parent.rows.database.mode = RowsMode.Default
    }
    save() {
        const checked = this.parent.rows.database.checked

        this.app.store.select(StoreKey.Database).edit(data => {
            for (const id in data.items) {
                if (checked[id]) delete data.items[id]
            }

            return data
        })

        this.parent.rows.database.uncheckAll()
    }
}
