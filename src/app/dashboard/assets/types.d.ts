export interface FormDataCustom {
    id: number | undefined
    admin_id: number | undefined
    name: string
    type: string
    value: string
    observations: string
    property_id: string | number
    image: any
    year: string
    lifespan: string
    buy_date: string
    properties: string[]
}

export interface AssetData {
    id: number
    name: string
    type: string
    value: string
    observations: string
    created_at: string
    property_id: number
}
