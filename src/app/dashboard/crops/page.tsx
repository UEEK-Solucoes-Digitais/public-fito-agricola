'use client'

import GeralInput from '@/components/inputs/GeralInput'
import TableSkeleton from '@/components/loading/TableSkeleton'
import TableHeader from '@/components/tables/TableHeader'
import { useAdmin } from '@/context/AdminContext'
import { useNotification } from '@/context/ToastContext'
import useSetupAddButton from '@/hooks/addButtonHook'
import useDebounce from '@/utils/debounce'
import getFetch from '@/utils/getFetch'
import WriteLog from '@/utils/logger'
import axios from 'axios'
import { useRouter } from 'nextjs-toploader/app'
import { ChangeEvent, Suspense, useCallback, useState } from 'react'
import useSWR from 'swr'
import { CropsList } from './(modules)/crops_list'

export default function Page() {
    const router = useRouter()
    const { setToast } = useNotification()
    const { admin } = useAdmin()

    const [propertyId, setPropertyId] = useState(0)
    const [harvestId, setHarvestId] = useState(0)
    const [city, setCity] = useState('')

    const debouncedCity = useDebounce(city, 1000)

    const { data: propertiesData, isLoading: propertiesLoading } = useSWR(`/api/properties/list/${admin.id}`, getFetch)
    const { data: harvestsData, isLoading: harvestsLoading } = useSWR(`/api/harvests/list`, getFetch)

    const addButtonFunction = useCallback(() => {
        router.push(`/dashboard/lavoura`)
    }, [])

    useSetupAddButton(addButtonFunction)

    async function reportFile(type: number) {
        try {
            setToast({ text: `Requisitando arquivo, isso pode demorar alguns minutos`, state: 'loading' })

            const response = await axios.get(
                `/api/reports/list/${admin.id}/crops?property_id=${propertyId}&city=${debouncedCity}&harvest_id=${harvestId}&export=true&export_type=${type}`,
            )

            if (response.data.status == 200 && response.data.file_dump) {
                // checkFile(response.data.file_dump);
                const fileUrl = response.data.file_dump
                setToast({ text: `O download será iniciado em instantes`, state: 'success' })

                if (typeof window != 'undefined') {
                    window.open(fileUrl, '_blank')
                }
            } else {
                setToast({ text: response.data.msg || 'Não foi possível iniciar o download', state: 'danger' })
            }
        } catch (error: any) {
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }

    if (propertiesLoading || harvestsLoading) {
        return <TableSkeleton />
    }

    return (
        <>
            <Suspense fallback={<TableSkeleton />}>
                <TableHeader
                    title='Lavouras'
                    description='Confira abaixo a sua lista completa de lavouras. Adicione novas lavouras clicando no botão acima à direita.'
                    titleIcon='ph:plant'
                    filter
                    buttonActionName={'+ Adicionar Lavoura'}
                    secondButtonActionName='Exportar PDF'
                    thirdButtonActionName='Exportar XLSX'
                    onButtonAction={() => router.push(`/dashboard/lavoura`)}
                    onSecondButtonAction={() => reportFile(2)}
                    onThirdButtonAction={() => reportFile(1)}
                    noButton>
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

                    <GeralInput
                        defaultValue={city}
                        label='Município'
                        name='city'
                        type='text'
                        placeholder='Digite aqui'
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            setCity(e.target.value)
                        }}
                    />
                </TableHeader>
            </Suspense>

            <CropsList propertyId={propertyId} harvestId={harvestId} debouncedCity={debouncedCity} />
        </>
    )
}
