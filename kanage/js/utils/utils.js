export function repeat(n, f) {
    let i = 0

    while (i < n) f(i++)
}

export function ring(min, value, max) {
    if (min > max) throw TypeError('Incorrect ring arguments')

    const size = max - min + 1

    value = value - min

    while (value < 0) value += size

    return min + (value % size)
}

export function clamp(min, value, max) {
    if (min > max) throw TypeError('Incorrect clamp arguments')

    return value < min ? min : value > max ? max : value
}

export function timeout(seconds, f) {
    setTimeout(f, 1000 * seconds)
}

export function interval(seconds, f) {
    setInterval(f, 1000 * seconds)
}

export function match(f) {
    return f()
}

export function shuffle(array) {
    let currentIndex = array.length, randomIndex

    while (currentIndex > 0) {
        randomIndex = Math.floor(Math.random() * currentIndex)
        
        currentIndex--

        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]]
    }

    return array
}

export function download(filename, content) {
    const $a = document.createElement('a')
    
    $a.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content))
    $a.setAttribute('download', filename)

    $a.style.display = 'none'

    document.body.appendChild($a)

    $a.click()

    document.body.removeChild($a)
}

export function deepFreeze(o) {
  Object.freeze(o)

  if (!(o instanceof Object)) return o

  for (const prop of Object.getOwnPropertyNames(o)) {
    const v = o[prop]

    if (v instanceof Object && !Object.isFrozen(v)) deepFreeze(v)
  }

  return o
}

export function deepCopy(o) {
    return JSON.parse(JSON.stringify(o))
}

export function postponed(f) {
    let isAlreadyPostponed = false

    return (...args) => {
        if (isAlreadyPostponed) return

        isAlreadyPostponed = true

        queueMicrotask(() => {
            f(...args)

            isAlreadyPostponed = false
        })
    }
}
