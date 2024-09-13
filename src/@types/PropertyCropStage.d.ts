import Admin from './Admin'
import { Coordinates } from './Coordinates'

export default interface PropertyCropStageProps {
    id: number
    vegetative_age_value: number
    // vegetative_age_period: 1 | 2 | 3 | 4; // * 1 => dia // 2 => semanas // 3 => meses // 4 => anos
    vegetative_age_text?: string
    reprodutive_age_value: number
    // reprodutive_age_period: 1 | 2 | 3 | 4; // * 1 => dia // 2 => semanas // 3 => meses // 4 => anos
    reprodutive_age_text?: string
    risk: 1 | 2 | 3 // * 1 => Sem risco // 2 => Exige atenção // 3 => Requer urgência
    coordinates?: Coordinates // TODO: Tipagem específica
    kml_file?: File | string
    properties_crops_id: number
    admin_id: number
    admin?: Admin
    images?: ImageApiProps[]
    open_date?: string
    latitude?: number
    longitude?: number
}
