export const DataFormat = {
    CSV: Symbol(),
    JSON: Symbol(),
}

export const FORMATS = [
    {name: 'CSV', ext: 'csv', type: 'text/csv', format: DataFormat.CSV},
    {name: 'JSON', ext: 'json', type: 'application/json', format: DataFormat.JSON},
]

export class UnknownFormatError extends Error {
    constructor(message) {
        super(message)

        this.name = 'UnknownFormatError'
    }
}
