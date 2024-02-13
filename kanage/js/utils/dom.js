import { Feed } from './feed.js'

export class DOM {
    constructor(EnumEvents) {
        this.$node = undefined
        this.events = new Feed(EnumEvents ?? {})
        this.listeners = new DOMListeners()
    }
    create($node) {
        this.$node = $node
    }
    destroy() {
        this.events.destroy()
        this.listeners.destroy()

        if (this.$node) this.$node.innerHTML = ''
    }
}

export class DOMListeners {
    constructor() {
        this._list = []
    }
    add($node, ...args) {
        this._list.push([$node, args])

        $node.addEventListener(...args)
    }
    destroy() {
        for (const [$node, args] of this._list) {
            $node.removeEventListener(...args)
        }

        this._list = []
    }
}
