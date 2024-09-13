import axios from 'axios'

const api = axios.create({
    baseURL: process.env.SECRET_API_ENDPOINT,
    timeout: 60000,
})

export default api
