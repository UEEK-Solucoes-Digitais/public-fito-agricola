import { LatLng } from 'use-places-autocomplete'

type FormStateProps = 0 | 1 | 2 | 3 | 4 // * 0 - Normal | 1 - Pendente | 2 - Processando | 3 - Erro | 4 - Sucesso

export interface IProps {
    cropId: number
    selectedCrops: string[]
    active: boolean
    updateStatus: Dispatch<SetStateAction<FormStateProps[]>>
    dataEdit?: any
    reset?: boolean
    dateTime?: string
    diseases?: any[]
    pests?: any[]
    pathMap?: LatLng[]
}

export interface FormProps {
    type: number
}
