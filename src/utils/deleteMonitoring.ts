import axios from 'axios'

const deleteMonitoring = async (id: number, type: string, adminId: number) => {
    axios.post('/api/properties/monitoring/delete-item', { id, type, adminId }).then((response) => {
        return response
    })
}

export default deleteMonitoring
