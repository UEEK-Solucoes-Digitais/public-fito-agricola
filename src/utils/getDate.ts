export default function getDate(minutos?: number) {
    const date = new Date()

    if (minutos) {
        date.setMinutes(date.getMinutes() + minutos)
    }

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0') // Janeiro é 1!
    const day = String(date.getDate()).padStart(2, '0')

    const hours = String(date.getHours()).padStart(2, '0')
    const min = String(date.getMinutes()).padStart(2, '0')
    const sec = String(date.getSeconds()).padStart(2, '0')

    return `${year}-${month}-${day} ${hours}:${min}:${sec}`
}

export const getCurrentDate = () => {
    const meses = [
        'Janeiro',
        'Fevereiro',
        'Março',
        'Abril',
        'Maio',
        'Junho',
        'Julho',
        'Agosto',
        'Setembro',
        'Outubro',
        'Novembro',
        'Dezembro',
    ]

    const dataAtual = new Date()
    const dia = String(dataAtual.getDate()).padStart(2, '0')
    const mes = meses[dataAtual.getMonth()]
    const ano = dataAtual.getFullYear()

    return `${dia} de ${mes} de ${ano}`
}

export const getDateShort = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0') // Janeiro é 1!
    const day = String(date.getDate()).padStart(2, '0')

    return `${day}/${month}/${year}`
}
