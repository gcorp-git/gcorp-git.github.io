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

        this.parent.rows.lessons.mode = RowsMode.Check
    }
    destroy() {
        this.save()

        this.parent.dom.$add.disabled = false
        this.parent.dom.$edit.disabled = false
        
        this.parent.rows.lessons.mode = RowsMode.Default
    }
    save() {
        const checked = this.parent.rows.lessons.checked

        this.app.store.select(StoreKey.Lessons).edit(data => {
            return data.filter((_, id) => !checked[id])
        })

        this.parent.rows.lessons.uncheckAll()
    }
}
