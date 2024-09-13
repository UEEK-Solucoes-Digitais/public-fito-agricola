// import Cookies from 'js-cookie';
import { cookies } from 'next/headers'
import WriteLog from './logger'

export default async function verifyToken() {
    const token = cookies().get('fito_auth_token')

    if (!token) {
        return false
    }

    try {
        const response = await fetch('http://localhost:3000/api/user/verifyToken', {
            method: 'POST',
            body: JSON.stringify({ token: token.value }),
        })

        await response.json()

        if (response.status == 200) {
            return true
        } else {
            return true
        }
    } catch (error) {
        WriteLog(error, 'error')
        return false
    }
}
