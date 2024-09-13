import { Crop, CropJoin } from '@/app/dashboard/properties/types'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import { formatNumberToBR } from '@/utils/formats'
import { getFullUnity } from '@/utils/getMetricUnity'
import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'nextjs-toploader/app'
import styles from '../styles.module.scss'

interface IProps {
    crops: CropJoin[]
    data: any
    searchOptions: any
    setSearchOptions: any
    setToast: any
    setOpenCropList: any
    openCropList: any
    text?: string
    zIndex?: string
}

const CropListSidebar = ({
    crops,
    data,
    searchOptions,
    setSearchOptions,
    setToast,
    setOpenCropList,
    openCropList,
    text = 'Lavouras em lista',
    zIndex = '1001',
}: IProps) => {
    const router = useRouter()

    return (
        <div
            className={`${styles.actionDropdown} ${styles.areaList} ${styles.transparent} ${
                openCropList ? styles.open : ''
            }`}
            style={{ zIndex }}>
            <div className={styles.titleFlex}>
                <h2>
                    <IconifyIcon icon='ph:list-bullets' className={styles.icon} />
                    {text}
                </h2>

                <button
                    className={`${styles.buttonClose}`}
                    onClick={() => {
                        setOpenCropList(!openCropList)
                    }}>
                    <IconifyIcon icon='ph:x' className={styles.icon} />
                </button>
            </div>

            <div className={styles.cropListMenu}>
                {searchOptions.property_id != 0 && crops && crops.length > 0 ? (
                    crops.map((crop) => (
                        <Link
                            key={`crop-menu-${crop.id}`}
                            href={`/dashboard/propriedades/lavoura/${crop.id}`}
                            className={`${styles.cropLink} exceptionOutside`}
                            onClick={() => {
                                setSearchOptions({
                                    ...searchOptions,
                                    crop_id: crop.id,
                                })
                                setOpenCropList(false)
                            }}>
                            <p className='exceptionOutside'>{crop.crop.name}</p>
                            <span className='exceptionOutside'>
                                {formatNumberToBR(crop.crop.area)} {getFullUnity()}
                            </span>
                        </Link>
                    ))
                ) : data && data.crops.length > 0 ? (
                    data.crops.map((crop: Crop) => (
                        <Link
                            key={`crop-menu-${crop.id}`}
                            href={`#`}
                            className={`${styles.cropLink} exceptionOutside`}
                            onClick={() => {
                                setOpenCropList(false)

                                setToast({ text: `Buscando informações`, state: 'loading' })
                                axios
                                    .get(`/api/properties/read-property-crop-join?crop_id=${crop.id}`)
                                    .then((response) => {
                                        if (response.data.property_crop_join) {
                                            setToast({
                                                text: `Lavoura encontrada no último ano agrícola`,
                                                state: 'success',
                                            })

                                            setSearchOptions({
                                                ...searchOptions,
                                                crop_id: response.data.property_crop_join.id,
                                            })

                                            router.push(
                                                `/dashboard/propriedades/lavoura/${response.data.property_crop_join.id}`,
                                            )
                                        } else if (!response.data.property_crop_join) {
                                            setToast({
                                                text: `Nenhuma informação encontrada`,
                                                state: 'warning',
                                            })
                                        } else {
                                            setToast({
                                                text: `Nenhuma informação encontrada`,
                                                state: 'warning',
                                            })
                                        }
                                    })
                            }}>
                            <p className='exceptionOutside'>{crop.name}</p>
                            <span className='exceptionOutside'>
                                {formatNumberToBR(crop.area)} {getFullUnity()}
                            </span>
                        </Link>
                    ))
                ) : (
                    <p>Nenhuma lavoura encontrada</p>
                )}
            </div>
        </div>
    )
}

export default CropListSidebar
