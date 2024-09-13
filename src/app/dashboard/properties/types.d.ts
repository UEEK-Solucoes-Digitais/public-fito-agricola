export interface FormDataCustom {
    id: number | undefined
    name: string
    admin_id: number | string
    state_subscription: string
    cep: string
    street: string
    uf: string
    city: string
    neighborhood: string
    number: number
    complement: string
    latitude: string
    longitude: string
    cnpj: string
}

export interface PropertyData {
    id: number
    name: string
    cep: string
    uf: string
    city: string
    state_subscription: string
    number: number
    street: string
    neighborhood: string
    complement: string
    latitude: string
    longitude: string
    cnpj: string
}

export interface HavestHistory {
    id: number
    name: string
    crops_join: CropJoin[]
}

export interface CropJoin {
    id: number
    property_id: number
    harvest_id: number
    is_subharvest?: number
    subharvest_name?: string
    crop_id: number
    crop: Crop
    harvest: Harvest
    is_harvested?: number
}

export interface CropJoinMinimum {
    id: number
    is_subharvest: number
    crop_id: number
}

export interface Crop {
    id: number
    name: string
    area: string
    city: string
    draw_area: string
    kml_file: string
    property_id?: number
    color?: string
    used_area?: number
}

export interface Property {
    id: number
    name: string
    crop_details?: any
}

export interface Harvest {
    id?: number
    name: string
    isLastHarvert?: boolean
}

export interface DataSeed {
    id: number
    stock_incoming: StockIncoming
    spacing: number
    seed_per_linear_meter: number
    product_variant?: string
    area?: number
}

export interface StockIncoming {
    id: number
    stock: Stock
    value: number
}

export interface Stock {
    id: number
    product: Product
    seed?: Seed
    fertilizer?: Fertilizer
    defensive?: Defensive
}

export interface Product {
    id: number
    name: string
    seed?: Seed
    fertilizer?: Fertilizer
    defensive?: Defensive
    extra_column?: string
    object_type?: number
    color?: string
}

export interface Seed {
    id: number
    name: string
    code: string
}

export interface Fertilizer {
    id: number
    name: string
}

export interface Defensive {
    id: number
    name: string
}
