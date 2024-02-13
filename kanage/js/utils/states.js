import { Feed } from './feed.js'

export const StatesEvent = {
    Change: Symbol(),
}

export class States {
    constructor(createStateInstance) {
        this.events = new Feed(StatesEvent)

        this._createStateInstance = createStateInstance
        this._stack = []
        this._states = {}
    }
    get length() {
        return this._stack.length
    }
    get current() {
        return this._stack[this._stack.length - 1]?.state
    }
    get(index) {
        if (index === undefined) index = -1

        const size = this._stack.length

        while (index < 0) index += size

        return this._stack[index % size]?.state
    }
    set(id, ...args) {
        if (!this._stack.length) return this.push(id, ...args)

        this._stack[this._stack.length - 1]?.state.destroy()

        const state = this._getState(id)

        state.id = id

        this._stack[this._stack.length - 1] = {id, state, args}

        this.events.select(StatesEvent.Change).publish(id)

        state.create(...args)
    }
    push(id, ...args) {
        this._stack[this._stack.length - 1]?.state.destroy()

        const state = this._getState(id)

        state.id = id

        this._stack.push({id, state, args})

        this.events.select(StatesEvent.Change).publish(id)

        state.create(...args)
    }
    pop() {
        if (!this._stack.length) return

        this._stack[this._stack.length - 1].state.destroy()

        this._stack.length -= 1

        if (!this._stack.length) return
        
        const {id, state, args} = this._stack[this._stack.length - 1]

        this.events.select(StatesEvent.Change).publish(id)

        state.create(...args)
    }
    destroy() {
        if (!this._stack.length) return

        this._stack[this._stack.length - 1].state.destroy()

        this._stack.length = 0
    }
    _getState(id) {
        if (!this._states[id]) {
            this._states[id] = this._createStateInstance(id)
        }

        return this._states[id]
    }
}
