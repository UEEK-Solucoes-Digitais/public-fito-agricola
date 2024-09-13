import GeralModal from '@/components/modal/GeralModal'
import { CropFile } from '../(modules)/types'
import { KeyedMutator } from 'swr'
import Property from '@/@types/Property'
import { Crop } from '../../properties/types'
import { ToastProps } from '@/components/notifications/types'
import updateStatus from '@/utils/updateStatus'

// interface de propriedades
interface IProps {
    cropFileId: number
    deleteName: string
    showModal: boolean
    adminId: number
    setShowModal: (value: boolean) => void
    setToast: (data: ToastProps) => void
    mutate: KeyedMutator<{
        crops_files: CropFile[]
        properties: Property[]
        crops: Crop[]
        total: number
    }>
}

export default function CropDeleteModal({
    cropFileId,
    deleteName,
    showModal,
    setShowModal,
    mutate,
    setToast,
    adminId,
}: IProps) {
    // função para deletar laudo
    const deleteCropFile = async () => {
        try {
            // exibindo toast
            setToast({ text: `Excluindo laudo ${deleteName}`, state: 'loading' })

            // função genérica de remoção de itens do sistema
            await updateStatus('/api/crops-ground/delete', adminId, cropFileId, 0).then(() => {
                setShowModal(false)

                setToast({ text: `Laudo ${deleteName} excluído`, state: 'success' })
                mutate()
            })
        } catch (error: any) {
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }

    return (
        <GeralModal
            small
            isDelete
            deleteName={deleteName}
            deleteFunction={deleteCropFile}
            show={showModal}
            setShow={setShowModal}
            title='Excluir laudo'
        />
    )
}
