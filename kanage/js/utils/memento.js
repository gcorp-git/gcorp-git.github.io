import { deepFreeze, deepCopy } from './utils.js'

export function Memento({save, restore}) {
    return deepFreeze({
        save: () => deepCopy(save()),
        restore: session => restore(session),
    })
}
