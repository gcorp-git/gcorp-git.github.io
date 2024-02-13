export class CSVDataFormat {
    encode(data, headers) {
        return encode(data, headers)
    }
    decode(source, withHeaders=false) {
        return parse(source, withHeaders)
    }
}

function encode(data, headers) {
    let csv = ''

    if (headers) {
        csv += headers.join(',') + '\n'
    }

    for (const row of data) {
        csv += row.map(escapeValue).join(',') + '\n'
    }

    return csv
}

function parse(source, withHeaders=false) {
    const rows = source.split('\n')
    const headers = withHeaders ? parsed(rows[0]) : undefined
    const data = []

    let i = withHeaders ? 0 : -1

    while (++i < rows.length) {
        const row = rows[i]

        if (!row?.trim()) continue

        data.push(parsed(row))
    }

    return {data, headers}
}

function parsed(row) {
    let inQuotes = false
    let value = ''

    const values = []

    for (const char of row) {
        if (char === '"') {
            inQuotes = !inQuotes
            value += char
        } else if (char === ',' && !inQuotes) {
            values.push(unescapeValue(value.trim()))
            value = ''
        } else {
            value += char
        }
    }

    values.push(unescapeValue(value.trim()))

    return values
}

function escapeValue(value) {
    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return '"' + value.replace(/"/g, '""') + '"'
    }

    return value
}

function unescapeValue(value) {
    return isEscaped(value) ? value.slice(1, -1).replace(/""/g, '"') : value
}

function isEscaped(value) {
    return value.startsWith('"') && value.endsWith('"')
}
