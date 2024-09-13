import GeralButton from '@/components/buttons/GeralButton'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import GeralModal from '@/components/modal/GeralModal'
import { formatNumberToBR } from '@/utils/formats'
import getFetch from '@/utils/getFetch'
import useSWR from 'swr'
import { CropFile } from '../(modules)/types'
import styles from './styles.module.scss'

interface IProps {
    showModal: boolean
    setShowModal: (value: boolean) => void
    cropFileId: number
}

export default function CropFileVisualization({ showModal, setShowModal, cropFileId }: IProps) {
    // consulta
    const { data, isLoading } = useSWR<{
        crop_file: CropFile
    }>(`/api/crops-ground/read/${cropFileId}`, getFetch)

    return (
        <GeralModal
            show={showModal}
            setShow={() => setShowModal(false)}
            title={`${data?.crop_file ? `Laudo: ${data?.crop_file.name}` : 'Carregando'}`}>
            {!isLoading ? (
                <>
                    <div className={styles.infoItem}>
                        <table className={styles.table}>
                            <tbody>
                                <tr>
                                    <td>
                                        <b>Teor de argila</b>
                                    </td>
                                    <td>{formatNumberToBR(data?.crop_file.clay!, 0, 0)}%</td>
                                </tr>
                                <tr>
                                    <td>
                                        <b>Saturação de bases</b>
                                    </td>
                                    <td>{formatNumberToBR(data?.crop_file.base_saturation!, 1, 1)}%</td>
                                </tr>
                                <tr>
                                    <td>
                                        <b>Matéria orgânica</b>
                                    </td>
                                    <td>{formatNumberToBR(data?.crop_file.organic_material!, 1, 1)}%</td>
                                </tr>
                                <tr>
                                    <td>
                                        <b>Ca</b>
                                    </td>
                                    <td>{formatNumberToBR(data?.crop_file.unit_ca!, 1, 1)} cmol/dm³</td>
                                </tr>
                                <tr>
                                    <td>
                                        <b>Al</b>
                                    </td>
                                    <td>{formatNumberToBR(data?.crop_file.unit_al!, 2, 2)} cmol/dm³</td>
                                </tr>
                                <tr>
                                    <td>
                                        <b>K</b>
                                    </td>
                                    <td>{formatNumberToBR(data?.crop_file.unit_k!, 1, 1)} cmol/dm³</td>
                                </tr>
                                <tr>
                                    <td>
                                        <b>Mg</b>
                                    </td>
                                    <td>{formatNumberToBR(data?.crop_file.unit_mg!, 1, 1)} cmol/dm³</td>
                                </tr>
                                <tr>
                                    <td>
                                        <b>P</b>
                                    </td>
                                    <td>{formatNumberToBR(data?.crop_file.unit_p!, 1, 1)} cmol/dm³</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <GeralButton
                        href={`${process.env.NEXT_PUBLIC_IMAGE_URL}/crops/${data?.crop_file.path}`}
                        external
                        value='Visualizar arquivo'
                        smaller
                        variant='tertiary'
                    />
                </>
            ) : (
                <div>
                    <IconifyIcon icon='line-md:loading-loop' />
                </div>
            )}
        </GeralModal>
    )
}
