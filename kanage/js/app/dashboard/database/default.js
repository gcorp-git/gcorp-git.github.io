import { RowsMode } from '../../../utils/rows.js'

export class Default {
    constructor(parent) {
        this.parent = parent
        this.app = this.parent.app
    }
    create() {
        this.parent.rows.database.mode = RowsMode.Default

        this.parent.dom.$scrollContainer.scrollTop = 0
    }
    destroy() {
        //
    }
}
