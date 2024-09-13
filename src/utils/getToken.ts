import api from './api'

export const getToken = async () => {
    const email = process.env.API_EMAIL
    const password = process.env.API_PASSWORD

    const body = new FormData()
    body.append('email', email!)
    body.append('password', password!)

    const config = {
        headers: {
            'Content-Type': 'application/json',
        },
    }

    const response = await api.post('/api/login', body, config)

    const data = response.data

    return data.access_token
}
