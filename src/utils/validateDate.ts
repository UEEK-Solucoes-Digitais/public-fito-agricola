const validateDate = (date: string): boolean => {
    const dateArray = date.split('-')

    if (dateArray.length !== 3) {
        return false
    }

    const year = parseInt(dateArray[0], 10)
    const month = parseInt(dateArray[1], 10)
    const day = parseInt(dateArray[2], 10)

    if (isNaN(year) || isNaN(month) || isNaN(day)) {
        return false
    }

    // Cria uma data com base nos valores fornecidos
    const testDate = new Date(year, month - 1, day)

    // Verifica se os componentes da data correspondem à data original
    if (testDate.getFullYear() !== year || testDate.getMonth() + 1 !== month || testDate.getDate() !== day) {
        return false
    }

    // Limita o ano entre 1900 e 2100
    if (year < 1900 || year > 2100) {
        return false
    }
    // check if the date is in the future
    if (testDate > new Date()) {
        return false
    }

    return true
}

export default validateDate
