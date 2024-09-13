'use client'

import styles from './styles.module.scss'
import GeralInput from '@/components/inputs/GeralInput'

interface CropsSelectorProps {
    added: any[]
    available: any[]
    changeEvent?: (event: any) => void
    multiple?: string
}

const CropsSelector: React.FC<CropsSelectorProps> = ({ multiple, added, available, changeEvent }) => {
    return (
        <>
            <div className={styles.cropsWrapper}>
                <h3>Lavouras</h3>

                <div className={styles.cropsInfo}>
                    <span>LAVOURAS ADICIONADAS ({added.length})</span>
                </div>

                <div className={styles.cropsList}>
                    {added &&
                        added.map((crop: any) => (
                            <GeralInput
                                key={crop.id}
                                checked
                                value={crop.id}
                                variant='button'
                                name={`crop-${crop.id}${multiple ? '-' + multiple : ''} `}
                                type='checkbox'
                                on={1}
                                label={`${crop.name} ${crop.subharvest_name ?? ''}`}
                                onChange={changeEvent}
                            />
                        ))}
                </div>
            </div>

            <div className={styles.cropsWrapper}>
                <div className={styles.cropsInfo}>
                    <span>LAVOURAS DISPONIVEIS ({available.length})</span>
                </div>

                <div className={styles.cropsList}>
                    {available &&
                        available.map((crop: any) => (
                            <GeralInput
                                key={crop.id}
                                value={crop.id}
                                variant='button'
                                name={`crop-${crop.id}${multiple ? '-' + multiple : ''}`}
                                type='checkbox'
                                on={1}
                                label={`${crop.name} ${crop.subharvest_name ?? ''}`}
                                onChange={changeEvent}
                            />
                        ))}
                </div>
            </div>
        </>
    )
}

export default CropsSelector
