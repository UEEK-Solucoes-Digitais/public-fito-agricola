import { getCurrency } from './getMetricUnity'

export const formatNumberToBR = (
    decimalNumber: number | string,
    maximumFractionDigits: number = 3,
    minimumFractionDigits: number = 2,
) => {
    const numberToFormat = typeof decimalNumber == 'string' ? parseFloat(decimalNumber) : decimalNumber

    return new Intl.NumberFormat('pt-BR', {
        style: 'decimal',
        minimumFractionDigits,
        maximumFractionDigits,
    }).format(numberToFormat)
}

export const formatNumberToReal = (value: string | number) => {
    const numberValue = typeof value == 'string' ? parseFloat(value) : value

    if (isNaN(numberValue)) {
        return 'Valor inválido'
    }

    return numberValue.toLocaleString(getCurrency() == 'R$' ? 'pt-BR' : 'en-US', {
        style: 'currency',
        currency: getCurrency() == 'R$' ? 'BRL' : 'USD',
    })
}

export const formatDateToDDMMYY = (dateString: string, separator: string = '/'): string => {
    const parts = dateString.split('-')

    if (parts.length == 3) {
        const day = parts[0]
        const month = parts[1]
        const year = parts[2]

        const date = new Date(`${year}-${month}-${day}`)

        if (!isNaN(date.getTime())) {
            const formattedDay = day.padStart(2, '0')
            const formattedMonth = month.padStart(2, '0')
            const formattedYear = year.substr(-2)

            return `${formattedDay}${separator}${formattedMonth}${separator}${formattedYear}`
        }
    }

    return 'Data inválida'
}

export const formatDateToYYMMDD = (
    dateString: string,
    separator: string = '/',
    splitSeparator: string = '-',
): string => {
    const parts = dateString.split(splitSeparator)

    if (parts.length == 3) {
        const day = parts[0]
        const month = parts[1]
        const year = parts[2]

        const date = new Date(`${year}-${month}-${day}`)

        if (!isNaN(date.getTime())) {
            const formattedDay = day.padStart(2, '0')
            const formattedMonth = month.padStart(2, '0')
            const formattedYear = year

            return `${formattedYear}${separator}${formattedMonth}${separator}${formattedDay}`
        }
    }

    return 'Data inválida'
}

export const formatDateToYYYYMMDD = (
    dateString: string,
    separator: string = '-',
    splitSeparator: string = '/',
): string => {
    const parts = dateString.split(splitSeparator)

    if (parts.length == 3) {
        const day = parts[0]
        const month = parts[1]
        const year = parts[2]

        const date = new Date(`${year}-${month}-${day}`)

        if (!isNaN(date.getTime())) {
            const formattedDay = day
            const formattedMonth = month
            const formattedYear = year

            return `${formattedYear}${separator}${formattedMonth}${separator}${formattedDay}`
        }
    }

    return 'Data inválida'
}

export const formatMinDateToDDMMYY = (dateString: string): string => {
    const date = new Date(dateString)
    const day = date.getDate() == 31 ? '01' : (date.getDate() + 1).toString().padStart(2, '0')
    const month =
        date.getDate() == 31 && date.getMonth() == 11 ? '01' : (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear().toString()

    return `${day}/${month}/${year}`
}

export const formatDateToDDMMYYYY = (dateString: string): string => {
    const date = new Date(dateString)
    const day = date.getDate() == 31 ? '01' : (date.getDate() + 1).toString().padStart(2, '0')
    const month =
        date.getDate() == 31 && date.getMonth() == 11 ? '01' : (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear().toString()

    return `${day}/${month}/${year}`
}

export const getStageName = (stage: any) => {
    if (stage.vegetative_age_value == 0 && stage.reprodutive_age_value == 0) {
        return 'V0'
    } else {
        return `
        ${
            stage.vegetative_age_value && stage.vegetative_age_value !== 0
                ? `V${stage.vegetative_age_value.replace('.0', '')}`
                : ''
        }
        ${
            stage.vegetative_age_value &&
            stage.vegetative_age_value !== 0 &&
            stage.reprodutive_age_value &&
            stage.reprodutive_age_value !== 0
                ? ' - '
                : ''
        }
        ${
            stage.reprodutive_age_value && stage.reprodutive_age_value !== 0
                ? `R${stage.reprodutive_age_value.replace('.0', '')}`
                : ''
        }
        `
    }
}

export const getNumber = (number: number, activePage: number) => {
    return (activePage - 1) * 20 + (number + 1)
}

export const getActualDate = () => {
    const date = new Date()
    date.setTime(date.getTime() - 3)

    return formatDateToYYMMDD(date.toLocaleDateString(), '-', '/')
}

export const getActualDateWithHour = () => {
    const date = new Date()
    date.setTime(date.getTime() - 3)

    return date.toLocaleDateString() + ' ' + date.toTimeString().split(' ')[0].substring(0, 5)
}

export const getAlternativeType = (type: number) => {
    switch (type) {
        case 1:
            return 'Imposto'
        case 2:
            return 'Manutenção'
        case 3:
            return 'Seguro'
        case 4:
            return 'Combustível'
        case 5:
            return 'Colaborador'
        case 6:
            return 'Item'
    }

    return ''
}

export const convertToSeconds = (time: string) => {
    if (time == undefined) return 0

    const [hours, minutes, seconds] = time.split(':').map(Number)
    return hours * 3600 + minutes * 60 + seconds
}

export const getProductType = (type: number | undefined) => {
    switch (type) {
        case 1:
            return 'Adjuvante'
        case 2:
            return 'Biológico'
        case 3:
            return 'Fertilizante foliar'
        case 4:
            return 'Fungicida'
        case 5:
            return 'Herbicida'
        case 6:
            return 'Inseticida'
        default:
            return 'Adjuvante'
    }
}
