'use client'

import PageHeader from '@/components/header/PageHeader'
import GeralInput from '@/components/inputs/GeralInput'
import ElementSkeleton from '@/components/loading/ElementSkeleton'
import TableHeader from '@/components/tables/TableHeader'
import { useAdmin } from '@/context/AdminContext'
import { useNotification } from '@/context/ToastContext'
import api from '@/utils/api'
import getFetch from '@/utils/getFetch'
import WriteLog from '@/utils/logger'
import { ChangeEvent, useEffect, useState } from 'react'
import useSWR from 'swr'
import { AssetsList } from './(modules)/assets_list'

export default function Page() {
    const { setToast } = useNotification()
    const { admin } = useAdmin()
    const [property, setProperty] = useState('')
    const [showAssetForm, setShowAssetForm] = useState(false)

    const {
        data: propertiesData,
        error: propertiesError,
        isLoading: propertiesLoading,
    } = useSWR(`/api/properties/list/${admin.id}`, getFetch)

    async function reportFile(type: number) {
        try {
            setToast({ text: `Requisitando arquivo, isso pode demorar alguns minutos`, state: 'loading' })

            const response = await api.get(
                `/api/reports/list/${admin.id}/assets?property_id=${property}&export=true&export_type=${type}`,
            )

            if (response.data.status == 200 && response.data.file_dump) {
                // checkFile(response.data.file_dump);
                const fileUrl = response.data.file_dump
                setToast({ text: `O download será iniciado em instantes`, state: 'success' })

                if (typeof window !== 'undefined') {
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

    useEffect(() => {
        if (typeof propertiesError !== 'undefined') {
            WriteLog([propertiesError], 'error')

            if (process.env.NEXT_PUBLIC_SHOW_TOAST_FETCH_ERROR == 'true') {
                setToast({ text: `Falha ao obter dados`, state: 'danger' })
            }
        }
    }, [propertiesError])

    return (
        <>
            <PageHeader
                placeholder='Pesquisar em "bens"'
                buttonValue='+ Adicionar bem'
                onButtonClick={() => {
                    setShowAssetForm((state) => !state)
                }}
            />

            <div>
                <TableHeader
                    title='Bens'
                    filter
                    noButton
                    buttonActionName={`+ Adicionar bem`}
                    secondButtonActionName='Exportar PDF'
                    thirdButtonActionName='Exportar XLSX'
                    onButtonAction={() => setShowAssetForm((state) => !state)}
                    onSecondButtonAction={() => reportFile(2)}
                    onThirdButtonAction={() => reportFile(1)}>
                    {propertiesLoading && <ElementSkeleton />}
                    {!propertiesLoading && (
                        <GeralInput
                            defaultValue={property}
                            label='Propriedade'
                            name='property_id'
                            type='select'
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                                setProperty(e.target.value)
                            }}
                            required>
                            <option value={0}>Todos</option>

                            {propertiesData &&
                                propertiesData.properties &&
                                propertiesData.properties.map((property: any) => (
                                    <option key={property.id} value={property.id}>
                                        {property.name}
                                    </option>
                                ))}
                        </GeralInput>
                    )}
                </TableHeader>

                <AssetsList
                    showAssetForm={showAssetForm}
                    setShowAssetForm={setShowAssetForm}
                    propertiesData={propertiesData}
                    property={property}
                />
            </div>
        </>
    )
}
