import { useAdmin } from '@/context/AdminContext'

export const getMetricUnity = () => {
    try {
        const cookie = document.cookie.split(';').find((c) => c.includes('fito_hectare'))
        if (cookie) {
            return cookie.split('=')[1]
        }
        return 'ha'
    } catch (e) {
        console.error(e)
        return 'ha'
    }
}

export const getFullUnity = () => {
    try {
        const cookie = document.cookie.split(';').find((c) => c.includes('fito_hectare'))
        if (cookie) {
            return cookie.split('=')[1] == 'ha' ? 'hectares' : 'alqueires'
        }
        return 'hectares'
    } catch (e) {
        console.error(e)
        return 'hectares'
    }
}

export const getCurrency = () => {
    try {
        const { admin } = useAdmin()

        if (admin) {
            if (admin.currency_id == 1) {
                return 'R$'
            } else {
                return '$'
            }
        } else {
            return 'R$'
        }
    } catch (e) {
        console.error(e)
        return 'R$'
    }
}
