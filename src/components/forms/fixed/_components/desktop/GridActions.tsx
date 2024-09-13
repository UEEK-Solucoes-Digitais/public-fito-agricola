import { CropJoin } from '@/app/dashboard/properties/types'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import ElementSkeleton from '@/components/loading/ElementSkeleton'
import { useNotification } from '@/context/ToastContext'
import useOutsideClick from '@/hooks/useOutsideClick'
import { formatNumberToBR } from '@/utils/formats'
import { getMetricUnity } from '@/utils/getMetricUnity'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import styles from '../../styles.module.scss'
import CropListSidebar from '../CropListSidebar'

const CardData = dynamic(() => import('@/components/cards/geral-data/Card'), {
    ssr: false,
    loading: () => <ElementSkeleton />,
})

interface IProps {
    admins: any
    totalArea: any
    totalCrop: any
    properties: any
    harvests: any
    data: any
    crops: CropJoin[]
    searchOptions: any
    setSearchOptions: any
}

const GridActions = ({
    admins,
    totalArea,
    totalCrop,
    properties,
    harvests,
    data,
    crops,
    searchOptions,
    setSearchOptions,
}: IProps) => {
    const [openStatistics, setOpenStatistics] = useState(false)
    const [openCropList, setOpenCropList] = useState(false)
    const { setToast } = useNotification()

    const statistics = useOutsideClick(() => {
        setOpenStatistics(false)
    }, 'exceptionOutside')

    const cropList = useOutsideClick(() => {
        setOpenCropList(false)
    }, 'exceptionOutside')

    return (
        <div className={styles.gridActions}>
            <div className={styles.buttonAction}>
                <button
                    ref={statistics}
                    className={`${styles.button} ${styles.buttonWhite}`}
                    onClick={() => {
                        setOpenStatistics(!openStatistics)
                    }}>
                    <IconifyIcon icon='ph:chart-bar' className={styles.icon} />
                </button>
                <div className={`${styles.actionDropdown} ${styles.transparent} ${openStatistics ? styles.open : ''}`}>
                    <div className={styles.flex}>
                        <CardData type='big-data' title='Propriedades' value={properties.length} />
                        <CardData type='big-data' title='Lavouras' value={totalCrop} />
                        <CardData type='big-data' title='Anos Agrícolas' value={harvests.length} />
                        <CardData type='big-data' title='Usuários' value={admins.length} />
                        <CardData
                            type='big-data'
                            title={`Área (${getMetricUnity()})`}
                            value={formatNumberToBR(totalArea)}
                        />

                        {/* <CardData type='collection' title='Safras atuais' data={dataCollection} /> */}
                    </div>
                </div>
            </div>
            <div className={styles.buttonAction}>
                <button
                    ref={cropList}
                    className={`${styles.button} ${styles.buttonWhite}`}
                    onClick={() => {
                        setOpenCropList(!openCropList)
                    }}>
                    <IconifyIcon icon='ph:list-bullets' className={styles.icon} />
                </button>

                <CropListSidebar
                    crops={crops}
                    data={data}
                    searchOptions={searchOptions}
                    setSearchOptions={setSearchOptions}
                    setToast={setToast}
                    setOpenCropList={setOpenCropList}
                    openCropList={openCropList}
                />
            </div>
        </div>
    )
}

export default GridActions
