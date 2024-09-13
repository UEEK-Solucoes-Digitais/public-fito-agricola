import GeralButton from '@/components/buttons/GeralButton'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import GeralModal from '@/components/modal/GeralModal'
import { formatNumberToBR } from '@/utils/formats'
import { useState } from 'react'
import styles from './styles.module.scss'

interface CropFile {
    name: string
    path: File | null | string
    clay: number
    base_saturation: number
    organic_material: number
    unit_ca: number
    unit_al: number
    unit_k: number
    unit_mg: number
    unit_p: number
}

export function FileItem({
    deleteFunction,
    editMode = false,
    item,
}: {
    deleteFunction: () => void
    editMode: boolean
    item: CropFile
}) {
    const [showModal, setShowModal] = useState(false)

    return (
        <>
            <div className={styles.fileItem}>
                {item.name}

                {item && item.path && typeof item.path == 'string' && (
                    <button onClick={() => setShowModal(true)} className={styles.view}>
                        <IconifyIcon icon='ph:eye' />
                    </button>
                )}

                {editMode && (
                    <button onClick={deleteFunction} className={styles.delete}>
                        <IconifyIcon icon='ph:trash' />
                    </button>
                )}
                {/* href={`${process.env.NEXT_PUBLIC_IMAGE_URL}/crops/${item.path}`} target="_blank" */}
            </div>

            {showModal && (
                <GeralModal show={showModal} setShow={() => setShowModal(false)} title={`Laudo: ${item.name}`}>
                    <div className={styles.infoItem}>
                        <p>
                            <b>Teor de argila:</b> {formatNumberToBR(item.clay, 0, 0)}
                        </p>
                        <p>
                            <b>Saturação de bases:</b> {formatNumberToBR(item.base_saturation, 1, 1)}
                        </p>
                        <p>
                            <b>Matéria orgânica:</b> {formatNumberToBR(item.organic_material, 1, 1)}
                        </p>
                        <p>
                            <b>Ca (cmol/dm³):</b> {formatNumberToBR(item.unit_ca, 1, 1)}
                        </p>
                        <p>
                            <b>Al (cmol/dm³):</b> {formatNumberToBR(item.unit_al, 2, 2)}
                        </p>
                        <p>
                            <b>K (cmol/dm³):</b> {formatNumberToBR(item.unit_k, 1, 1)}
                        </p>
                        <p>
                            <b>Mg (cmol/dm³):</b> {formatNumberToBR(item.unit_mg, 1, 1)}
                        </p>
                        <p>
                            <b>P (cmol/dm³):</b> {formatNumberToBR(item.unit_p, 1, 1)}
                        </p>
                    </div>
                    <GeralButton
                        href={`${process.env.NEXT_PUBLIC_IMAGE_URL}/crops/${item.path}`}
                        external
                        value='Visualizar arquivo'
                        smaller
                        variant='tertiary'
                    />
                </GeralModal>
            )}
        </>
    )
}
