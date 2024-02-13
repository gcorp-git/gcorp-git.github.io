import { DOM } from './dom.js'

export const ModalEvent = {
    Create: Symbol(),
    Destroy: Symbol(),
}

export class Modal extends DOM {
    constructor(cls) {
        super(ModalEvent)

        this.cls = cls
        this.$parent = undefined
        this.$bg = undefined
        this.$win = undefined
        this.$close = undefined
        this.$content = undefined
    }
    create($parent) {
        this.$parent = $parent
        this.$bg = createBG(this.$parent, this.cls)

        super.create(this.$bg)

        this.$win = createWin(this.$bg)
        this.$close = createClose(this.$win)
        this.$content = createContent(this.$win)

        this.listeners.add(this.$bg, 'mousedown', e => {
            if (e.which !== 1) return
            if (e.target === this.$bg) {
                this.destroy()
            }
        })

        this.listeners.add(this.$close, 'mousedown', e => {
            if (e.which !== 1) return
            this.destroy()
        })

        this.events.select(ModalEvent.Create).publish()
    }
    destroy() {
        this.events.select(ModalEvent.Destroy).publish()

        super.destroy()

        if (this.$bg?.parentNode) {
            this.$bg.parentNode.removeChild(this.$bg)
        }
    }
}

function createBG($parent, cls) {
    const $bg = document.createElement('div')

    $bg.setAttribute('class', `${cls}`)

    $parent.appendChild($bg)
    
    return $bg
}

function createWin($bg) {
    const $win = document.createElement('div')

    $win.setAttribute('class', `win`)

    $bg.appendChild($win)
    
    return $win
}

function createClose($win) {
    const $close = document.createElement('button')

    $close.setAttribute('class', `close`)

    $win.appendChild($close)
    
    return $close
}

function createContent($win) {
    const $content = document.createElement('div')

    $content.setAttribute('class', `content`)

    $win.appendChild($content)
    
    return $content
}
