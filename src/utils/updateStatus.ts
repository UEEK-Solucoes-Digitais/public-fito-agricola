import axios from 'axios'

const updateStatus = async (
    route: string,
    adminId: number,
    itemId: string | number,
    value: string | number,
    columName: string = 'status',
    extraColumn: string = '',
    extraColumnValue: string | number = '',
) => {
    const object = {
        id: itemId,
        [columName]: value,
        admin_id: adminId,
    }

    if (extraColumn !== '' && extraColumnValue !== '') {
        object[extraColumn] = extraColumnValue
    }

    await axios.post(route, object).then((response) => {
        return response
    })
}

export default updateStatus
