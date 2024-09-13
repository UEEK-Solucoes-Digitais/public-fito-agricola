import Admin from './Admin'
import { Coordinates } from './Coordinates'
import ImageApiProps from './ImageApiProps'

export default interface PropertyCropObservationProps {
    id: number
    risk: 1 | 2 | 3 // * 1 => Sem risco // 2 => Exige atenção // 3 => Requer urgência
    observations: string
    kml_file?: File | string
    properties_crops_id: number
    admin_id: number
    admin?: Admin
    coordinates?: Coordinates // TODO: Tipagem específica
    images?: ImageApiProps[]
    open_date?: string
    latitude?: number
    longitude?: number
}
