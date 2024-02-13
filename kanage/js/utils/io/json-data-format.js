export class JSONDataFormat {
    encode(data) {
        return JSON.stringify(data)
    }
    decode(source) {
        return JSON.parse(source)
    }
}
