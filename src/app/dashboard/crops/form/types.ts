export interface FormDataCustom {
    id: number
    admin_id: number
    area: string
    name: string
    city: string
    kml_file?: File | string
    property_id?: number | null
    draw_area: string[]
}

export interface LatLng {
    lat: number
    lng: number
}

export interface CropData {
    crop: {
        id: number
        name: string
        area: string
        city: string
        draw_area: string
        kml_file: string

        clay?: number
        organic_material?: number
        base_saturation?: number
        unit_ca?: number
        unit_mg?: number
        unit_al?: number
        unit_k?: number
        unit_p?: number
    }
}
