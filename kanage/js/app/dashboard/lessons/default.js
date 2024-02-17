import { AppState } from '../../../app.js'
import { RowsMode } from '../../../utils/rows.js'

export class Default {
    constructor(parent) {
        this.parent = parent
        this.app = this.parent.app
    }
    create() {
        this.parent.rows.lessons.isVisible = true
        this.parent.rows.database.isVisible = false

        this.parent.rows.lessons.mode = RowsMode.Default

        this.parent.dom.$scrollContainer.scrollTop = 0
    }
    destroy() {
        //
    }
    open(id) {
        this.app.states.push(AppState.Lesson, id)
    }
}
