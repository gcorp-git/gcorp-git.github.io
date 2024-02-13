import { deepFreeze } from './utils.js'

export function Hydra(createObjectInstance) {
    const instances = {}

    return deepFreeze({
        select: id => {
            if (!instances[id]) {
                const instance = createObjectInstance(id)

                if (instance) {
                    instances[id] = instance
                }
            }

            return instances[id]
        }
    })
}
