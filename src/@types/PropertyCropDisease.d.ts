import Admin from './Admin'
import { Coordinates } from './Coordinates'
import InterferenceFactorItemProps from './InterferenceFactorItem'
import ImageApiProps from './ImageApiProps'

export default interface PropertyCropDisease {
    id: number
    interference_factors_item_id: number
    incidency: number
    risk: 1 | 2 | 3 // * 1 => Sem risco // 2 => Exige atenção // 3 => Requer urgência
    coordinates?: Coordinates // TODO: Tipagem específica
    kml_file?: File | string
    properties_crops_id: number
    admin_id: number
    admin?: Admin
    disease?: InterferenceFactorItemProps
    images?: ImageApiProps[]
    open_date?: string
    latitude?: number
    longitude?: number
}
