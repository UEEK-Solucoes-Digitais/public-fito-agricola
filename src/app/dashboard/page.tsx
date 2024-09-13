'use client'

import PageHeader from '@/components/header/PageHeader'
import { useAdmin } from '@/context/AdminContext'
import getFetch from '@/utils/getFetch'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import useSWR from 'swr'
import Loading from './loading'
import styles from './styles_dashboard.module.scss'

const MapCrop = dynamic(() => import('@/app/dashboard/properties/crop/[property_crop_join_id]/map_crop'), {
    ssr: false,
    loading: () => <Loading />,
})

export default function Dashboard() {
    const { admin } = useAdmin()
    const { data, isLoading } = useSWR(`/api/dashboard/get-crops/${admin.id}`, getFetch, {
        suspense: true,
    })

    if (isLoading) {
        return <Loading />
    }

    return (
        <Suspense fallback={<Loading />}>
            <div className={styles.dashboardPadding}>
                <PageHeader placeholder='Pesquisar' disabledFunctions />
            </div>

            <div className={styles.dashboardWrapper}>
                {data && <MapCrop crop={undefined} crops={data.crops} fullScreen />}
            </div>
        </Suspense>
    )
}
