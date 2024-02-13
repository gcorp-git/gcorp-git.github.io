export class QuizHelper {
    constructor(quiz) {
        this.quiz = quiz
    }
    setChar(char) {
        this.quiz.tape.caret.char = char
        this.quiz.tape.caret.position += 1
    }
    convertChar(convert) {
        const initial = this.quiz.tape.caret.position
        const hasChar = !!this.quiz.tape.caret.char
        const hasEditable = hasChar && !this.quiz.isRevealed(initial)
        const position = hasEditable ? initial : initial - 1

        if (position < 0) return

        const char = convert(this.quiz.tape.cells[position].char)

        this.quiz.tape.caret.position = position
        this.quiz.tape.caret.char = char
        this.quiz.tape.caret.position = initial
    }
    removeChar() {
        const hasChar = !!this.quiz.tape.caret.char

        if (!hasChar) this.quiz.tape.caret.position -= 1

        this.quiz.tape.caret.char = undefined

        if (hasChar) this.quiz.tape.caret.position -= 1
    }
    showHint() {
        if (!this.quiz.task) return

        this.quiz.reveal(this.quiz.tape.caret.position)
        this.quiz.tape.caret.position += 1
    }
    convertAll(convert) {
        const session = this.quiz.session.save()

        if (!session.task) return

        const position = this.quiz.tape.caret.position

        session.task.answer = Array.from(session.task.answer).map(convert).join('')
        session.tape = session.tape.map(convert)

        this.quiz.session.restore(session)

        this.quiz.tape.caret.position = position
    }
}
