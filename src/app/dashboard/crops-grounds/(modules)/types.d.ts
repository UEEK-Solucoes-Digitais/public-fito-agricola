import { Crop } from '../../properties/types'

export interface CropFile {
    id: number
    crop_id: number
    name: string
    path: string
    unit_p: number
    unit_k: number
    unit_al: number
    unit_mg: number
    unit_ca: number
    base_saturation: number
    organic_material: number
    clay: number
    crop: Crop
}
