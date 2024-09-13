'use client'

import IconifyIcon from '@/components/iconify/IconifyIcon'
import GeralInput from '@/components/inputs/GeralInput'
import TableHeader from '@/components/tables/TableHeader'
import TablePagination from '@/components/tables/TablePagination'
import { useAdmin } from '@/context/AdminContext'
import getFetch from '@/utils/getFetch'
import { DateTime } from 'luxon'
import { ChangeEvent, Suspense, useEffect, useState } from 'react'
import useSWR from 'swr'
import Loading from '../loading'
import { TimelineList } from './TimelineList'
import styles from './styles.module.scss'

export default function Page() {
    // *Filter states
    const [propertyId, setPropertyId] = useState(0)
    const [harvestId, setHarvestId] = useState(0)
    const [userId, setUserId] = useState(0)
    const [cropId, setCropId] = useState(0)
    const [dateFilter, setDateFilter] = useState('')

    // *Pagination states
    const [pageNumbers, setPageNumbers] = useState(0)
    const [activePage, setActivePage] = useState(1)

    const { admin } = useAdmin()

    //* Data fetching
    const { data, isLoading } = useSWR(
        `/api/get-timeline/${admin.id}?page=${activePage}&property=${propertyId}&harvest=${harvestId}&date=${dateFilter}&user=${userId}&crop=${cropId}`,
        getFetch,
    )

    const { data: propertiesData, isLoading: propertiesLoading } = useSWR(`/api/properties/list/${admin.id}`, getFetch)
    const { data: harvestsData, isLoading: harvestsLoading } = useSWR(`/api/harvests/list`, getFetch)
    const { data: cropsData, isLoading: cropsLoading } = useSWR(`/api/crops/list/${admin.id}`, getFetch)
    const { data: usersData, isLoading: usersLoading } = useSWR(`/api/user/list/${admin.id}`, getFetch)

    const handlePageChange = (index: number) => {
        const timeout = setTimeout(() => {
            setActivePage(index)
            clearTimeout(timeout)
        }, 100)
    }

    useEffect(() => {
        if (data) {
            const total = data.total

            setPageNumbers(Math.ceil(total / 50))
        }
    }, [data])

    return (
        <Suspense fallback={<Loading />}>
            <TableHeader
                title='Linha do tempo'
                description='Confira abaixo a lista completa de ações realizadas na plataforma.'
                titleIcon='ph:git-commit-bold'
                filter
                noButton>
                {propertiesLoading ? (
                    <div className={styles.loadginWrapper}>
                        <IconifyIcon icon='line-md:loading-loop' />
                    </div>
                ) : (
                    <GeralInput
                        defaultValue={propertyId}
                        label='Propriedade'
                        name='property_id'
                        type='select'
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                            setPropertyId(Number(e.target.value))
                        }}
                        required>
                        <option value={0}>Todos</option>

                        {propertiesData?.properties?.map((property: any) => (
                            <option key={property.id} value={property.id}>
                                {property.name}
                            </option>
                        ))}
                    </GeralInput>
                )}

                {harvestsLoading ? (
                    <div className={styles.loadginWrapper}>
                        <IconifyIcon icon='line-md:loading-loop' />
                    </div>
                ) : (
                    <GeralInput
                        defaultValue={harvestId}
                        label='Ano agrícola'
                        name='harvest_id'
                        type='select'
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                            setHarvestId(Number(e.target.value))
                        }}
                        required>
                        <option value={0}>Todos</option>

                        {harvestsData?.harvests?.map((harvest: any) => (
                            <option key={harvest.id} value={harvest.id}>
                                {harvest.name}
                            </option>
                        ))}
                    </GeralInput>
                )}
                {cropsLoading ? (
                    <div className={styles.loadginWrapper}>
                        <IconifyIcon icon='line-md:loading-loop' />
                    </div>
                ) : (
                    <GeralInput
                        defaultValue={cropId}
                        label='Lavoura'
                        name='crop_id'
                        type='select'
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                            setCropId(Number(e.target.value))
                        }}
                        required>
                        <option value={0}>Todos</option>

                        {cropsData?.crops?.map((crop: any) => (
                            <option key={crop.id} value={crop.id}>
                                {crop.name}
                            </option>
                        ))}
                    </GeralInput>
                )}
                {usersLoading ? (
                    <div className={styles.loadginWrapper}>
                        <IconifyIcon icon='line-md:loading-loop' />
                    </div>
                ) : (
                    <GeralInput
                        defaultValue={userId}
                        label='Usuário'
                        name='user_id'
                        type='select'
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                            setUserId(Number(e.target.value))
                        }}
                        required>
                        <option value={0}>Todos</option>

                        {usersData?.admins?.map((user: any) => (
                            <option key={user.id} value={user.id}>
                                {user.name}
                            </option>
                        ))}
                    </GeralInput>
                )}

                <GeralInput
                    label='Data'
                    name='date'
                    type='date'
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        const inputDate = e.target.value
                        const formattedDate = inputDate ? DateTime.fromISO(inputDate).toFormat('yyyy-MM-dd') : ''

                        setDateFilter(formattedDate)
                    }}
                />
            </TableHeader>

            {isLoading ? (
                <Loading />
            ) : (
                <>
                    {Object.values(data.timeline).length ? (
                        <TimelineList data={data.timeline} />
                    ) : (
                        <span>Nenhum item encontrado com o filtro atual.</span>
                    )}
                </>
            )}

            {!!pageNumbers && (
                <TablePagination pages={pageNumbers} onPageChange={handlePageChange} active={activePage} />
            )}
        </Suspense>
    )
}
