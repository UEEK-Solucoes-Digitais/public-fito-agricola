export const convertToBase64 = (file: File | null): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (file) {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = (error) => reject(error)
        } else {
            return ''
        }
    })
}

export function formatDate(createdAt: string) {
    const date = new Date(createdAt)
    const now = new Date()
    const diffInMilliseconds = now.getTime() - date.getTime()
    const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60))
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInDays > 0) {
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()
        return `${day}/${month}/${year}`
    } else if (diffInHours > 0) {
        return `Há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`
    } else if (diffInMinutes > 0) {
        return `Há ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`
    } else {
        return 'Agora mesmo'
    }
}

export function formatDateFully(createdAt: string): string {
    const date = new Date(createdAt)

    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
}
