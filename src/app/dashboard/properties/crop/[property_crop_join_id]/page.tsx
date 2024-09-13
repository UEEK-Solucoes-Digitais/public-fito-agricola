'use client'

import Loading from '@/app/dashboard/loading'
import GeralBox from '@/components/box/GeralBox'
import GeralButton from '@/components/buttons/GeralButton'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import ElementSkeleton from '@/components/loading/ElementSkeleton'
import GeralModal from '@/components/modal/GeralModal'
import { useAdmin } from '@/context/AdminContext'
import { useTab } from '@/context/TabContext'
import { useNotification } from '@/context/ToastContext'
import { formatNumberToBR } from '@/utils/formats'
import getFetch from '@/utils/getFetch'
import { getMetricUnity } from '@/utils/getMetricUnity'
import WriteLog from '@/utils/logger'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { usePathname, useSearchParams } from 'next/navigation'
import { useRouter } from 'nextjs-toploader/app'
import { useEffect, useState } from 'react'
import useSWR from 'swr'
import styles from '../../styles.module.scss'
import { Crop, Property } from '../../types'

// Lazy Components
const MapCrop = dynamic(() => import('./map_crop'), {
    ssr: false,
    loading: () => <ElementSkeleton />,
})

const ManagementData = dynamic(() => import('./management_data'), {
    ssr: false,
    loading: () => <ElementSkeleton />,
})

const Monitoring = dynamic(() => import('./monitoring'), {
    ssr: false,
    loading: () => <ElementSkeleton />,
})

const HarvestInfo = dynamic(() => import('./harvest_info'), {
    ssr: false,
    loading: () => <ElementSkeleton />,
})

export default function PropertyCropJoin() {
    const { setToast } = useNotification()
    const pathname = usePathname()
    const { admin } = useAdmin()
    const router = useRouter()
    const splitPathname = pathname?.split('/')
    const cropId = parseInt(splitPathname[splitPathname.length - 1])

    const { data, isLoading, error } = useSWR(
        `/api/properties/read-property-harvest/${cropId}?with_draw_area=false&admin_id=${admin.id}`,
        getFetch,
    )

    const [property, setProperty] = useState<Property>()
    const [crop, setCrop] = useState<Crop>()
    const { selectedTab, setSelectedTab } = useTab()
    const searchParams = useSearchParams()
    const searchTab = searchParams.get('tab')
    const [showGeralInformationModal, setShowGeralInformationModal] = useState(false)

    useEffect(() => {
        if (data) {
            if (data.not_allowed) {
                setToast({ text: `Você não tem permissão para acessar essa página`, state: 'danger' })
                setTimeout(() => {
                    router.push('/dashboard/propriedades')
                }, 1500)
            }

            let crop_details: any = null

            data.property?.crops.map((crop_item: any) => {
                if (crop_item.crop_id == data.crop.id) {
                    crop_details = crop_item
                }
            })

            setProperty({
                id: data.property?.id,
                name: data.property?.name,
                crop_details,
            })

            setCrop({
                id: data.crop.id,
                name: data.crop.name,
                area: data.crop.area,
                city: data.crop.city,
                draw_area: data.crop.draw_area,
                kml_file: data.crop.kml_file,
                color: data.crop.color,
                used_area: data.crop.used_area,
            })
        }
    }, [data])

    useEffect(() => {
        if (typeof error != 'undefined') {
            WriteLog(error, 'error')

            if (process.env.NEXT_PUBLIC_SHOW_TOAST_FETCH_ERROR == 'true') {
                setToast({ text: `Falha ao obter dados`, state: 'danger' })
            }
        }
    }, [error])

    useEffect(() => {
        window.history.pushState({ filter: true }, selectedTab, `${pathname}?tab=${selectedTab}`)
    }, [selectedTab])

    useEffect(() => {
        if (searchTab) {
            setSelectedTab(`${searchTab}`)
        } else {
            if (
                !selectedTab ||
                (selectedTab &&
                    !['mapa-lavoura', 'informacoes-safra', 'dados-manejo', 'monitoramento'].includes(selectedTab))
            ) {
                setSelectedTab(`mapa-lavoura`)
                window.history.pushState({ filter: true }, selectedTab, `${pathname}?tab=mapa-lavoura`)
            }
        }
    }, [])

    if (isLoading) {
        return <Loading />
    }

    return (
        <div className={styles.cropContainer}>
            {selectedTab == 'mapa-lavoura' ? (
                <MapCrop crop={crop} crops={data && data.property?.crops ? data.property?.crops : []} fullScreen />
            ) : (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ease: 'easeIn' }}>
                        <GeralBox variant='property'>
                            <div className={`${styles.boxHeader} ${styles.noBorder}`}>
                                <h1 className={styles.cropName}>{crop?.name}</h1>

                                <div className={styles.boxHeaderButtons}>
                                    <GeralButton
                                        variant='gray'
                                        smaller
                                        customClasses={[styles.infoButton]}
                                        onClick={() => setShowGeralInformationModal(!showGeralInformationModal)}>
                                        <IconifyIcon icon='lucide:info' />

                                        <span>Informações gerais</span>
                                    </GeralButton>
                                </div>
                            </div>

                            <div className={styles.contentBoxWrapper}>
                                {selectedTab == 'informacoes-safra' && <HarvestInfo propertyCropJoinId={cropId} />}
                                {selectedTab == 'dados-manejo' && (
                                    <ManagementData
                                        crop={crop}
                                        setCrop={setCrop}
                                        propertyCropJoinId={parseInt(splitPathname[splitPathname.length - 1])}
                                    />
                                )}

                                {selectedTab == 'monitoramento' && (
                                    <Monitoring crop={cropId} crops={data?.property?.crops} />
                                )}
                            </div>
                        </GeralBox>
                    </motion.div>

                    <GeralModal
                        show={showGeralInformationModal}
                        setShow={setShowGeralInformationModal}
                        title='Informações gerais'>
                        <div className={styles.infoModalWrapper}>
                            <div className={styles.infoGrid}>
                                <div className={styles.gridItem}>
                                    <h4>Cultura</h4>
                                    <span>{property?.crop_details?.culture_table ?? '--'}</span>
                                </div>

                                <div className={styles.gridItem}>
                                    <h4>Emergência</h4>
                                    <span>{property?.crop_details?.emergency_table ?? '--'}</span>
                                </div>

                                <div className={styles.gridItem}>
                                    <h4>Plantio</h4>
                                    <span>{property?.crop_details?.plant_table ?? '--'}</span>
                                </div>

                                <div className={styles.gridItem}>
                                    <h4>Previsão de colheita</h4>
                                    <span>--</span>
                                </div>

                                <div className={styles.gridItem}>
                                    <h4>Produtividade</h4>
                                    <span>
                                        {property?.crop_details?.productivity != '--'
                                            ? formatNumberToBR(property?.crop_details?.productivity)
                                            : '--'}
                                    </span>
                                </div>

                                <div className={styles.gridItem}>
                                    <h4>Área ({getMetricUnity()})</h4>
                                    <span>{crop ? `${formatNumberToBR(crop.area)}` : '--'}</span>
                                </div>

                                <div className={styles.gridItem}>
                                    <h4>Última aplicação</h4>
                                    <span>{property?.crop_details?.application_table ?? '--'}</span>
                                </div>

                                <div className={styles.gridItem}>
                                    <h4>Produção</h4>
                                    <span>
                                        {property?.crop_details?.total_production != '--'
                                            ? formatNumberToBR(property?.crop_details?.total_production)
                                            : '--'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </GeralModal>
                </>
            )}
        </div>
    )
}
