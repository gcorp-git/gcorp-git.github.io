export class HistoryHelper {
    constructor(history) {
        this.history = history
    }
    save(index, isSolved, {quiz}) {
        const label = isSolved ? 'is-solved' : ''
        const items = this.history.items
        
        if (index === items.length) {
            const text = `${index + 1}`
            const info = quiz.task.question

            this.history.add({text, info, label, data: {index, quiz}})
        } else {
            items[index].label = label,
            items[index].data = {...items[index].data, quiz}
        }
    }
}
