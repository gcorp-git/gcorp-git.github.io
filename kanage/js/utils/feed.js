export class Feed {
    constructor(ids) {
        this._ids = ids ?? {}
        this._channels = []
        this._readers = new Set()

        Object.values(this._ids).forEach(id => {
            this._channels[id] = new Channel(id, (id, ...args) => {
                queueMicrotask(() => this._readers.forEach(f => f(id, ...args)))
            })
        })
    }
    select(id) {
        return this._channels[id]
    }
    subscribe(f) {
        this._readers.add(f)
    }
    unsubscribe(f) {
        this._readers.delete(f)
    }
    destroy() {
        this._readers.clear()

        Object.values(this._ids).forEach(id => this._channels[id].destroy())
    }
}

export class Channel {
    constructor(id, onPublish) {
        this._id = id
        this._onPublish = onPublish
        this._readers = new Set()
    }
    subscribe(f) {
        this._readers.add(f)
    }
    unsubscribe(f) {
        this._readers.delete(f)
    }
    publish(...args) {
        if (this._onPublish) this._onPublish(this._id, ...args)

        queueMicrotask(() => this._readers.forEach(f => f(...args)))
    }
    destroy() {
        this._readers.clear()
    }
}
