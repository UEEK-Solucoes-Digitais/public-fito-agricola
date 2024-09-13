import TableSkeleton from '@/components/loading/TableSkeleton'
import GeralModal from '@/components/modal/GeralModal'
import GeralTable from '@/components/tables/GeralTable'
import tableStyles from '@/components/tables/styles.module.scss'
import TableActions from '@/components/tables/TableActions'
import TableButton from '@/components/tables/TableButton'
import TablePagination from '@/components/tables/TablePagination'
import TableRow from '@/components/tables/TableRow'
import TableSelect from '@/components/tables/TableSelect'
import { useAdmin } from '@/context/AdminContext'
import { useSearch } from '@/context/SearchContext'
import { useNotification } from '@/context/ToastContext'
import { formatNumberToBR } from '@/utils/formats'
import getFetch from '@/utils/getFetch'
import { getMetricUnity } from '@/utils/getMetricUnity'
import WriteLog from '@/utils/logger'
import updateStatus from '@/utils/updateStatus'
import { ChangeEvent, MouseEvent, Suspense, useEffect, useState } from 'react'
import useSWR, { mutate } from 'swr'

const tableHeaders = ['Nome', `Área (${getMetricUnity()})`, 'Propriedade', 'Município', 'Ações']

interface PropertyOption {
    value: number
    label: string
}

export const CropsList = ({
    propertyId,
    harvestId,
    debouncedCity,
}: {
    propertyId: number
    harvestId: number
    debouncedCity: string
}) => {
    const { admin } = useAdmin()
    const { setToast } = useNotification()
    const { searchPage } = useSearch()
    const [pageNumbers, setPageNumbers] = useState(0)
    const [activePage, setActivePage] = useState(1)
    const [propertyOptions, setPropertyOptions] = useState<PropertyOption[]>([])

    const { data, isLoading, error } = useSWR(
        `/api/crops/list/${admin.id}?filter=${searchPage}&page=${activePage}&property_id=${propertyId}&city=${debouncedCity}&harvest_id=${harvestId}`,
        getFetch,
    )

    useEffect(() => {
        if (data) {
            const total = data.total
            setPageNumbers(Math.ceil(total / 100))

            const options = []

            if (admin.access_level == 1) {
                options.push({
                    value: 0,
                    label: 'Selecione a propriedade',
                })
            }

            data.properties.forEach((property: any) => {
                options.push({
                    value: property.id,
                    label: property.name,
                })
            })

            setPropertyOptions(options)
        }
    }, [data])

    useEffect(() => {
        if (typeof error != 'undefined') {
            WriteLog(error, 'error')

            if (process.env.NEXT_PUBLIC_SHOW_TOAST_FETCH_ERROR == 'true') {
                setToast({ text: `Falha ao obter dados de lavouras`, state: 'danger' })
            }
        }
    }, [error])

    if (isLoading) {
        return <TableSkeleton />
    }

    return (
        <GeralTable
            headers={tableHeaders}
            gridColumns={`repeat(${tableHeaders.length}, 1fr)`}
            customClasses={[tableStyles.cropTable, tableStyles.clickableRow]}>
            <Suspense fallback={<TableSkeleton />}>
                <CropsRows
                    data={data}
                    propertyOptions={propertyOptions}
                    searchPage={searchPage}
                    pageNumbers={pageNumbers}
                    activePage={activePage}
                    setActivePage={setActivePage}
                />
            </Suspense>
        </GeralTable>
    )
}

const CropsRows = ({
    data,
    pageNumbers,
    activePage,
    setActivePage,
    searchPage,
    propertyOptions,
}: {
    data: any
    pageNumbers: number
    activePage: number
    setActivePage: any
    searchPage: string
    propertyOptions: any
}) => {
    const { admin } = useAdmin()
    const { setToast } = useNotification()

    const [showDeleteCropModal, setShowDeleteCropModal] = useState(false)
    const [deleteId, setDeleteId] = useState(0)
    const [deleteName, setDeleteName] = useState('')

    const handleSelectChange = async (e: ChangeEvent<HTMLSelectElement>) => {
        const { id, value } = e.target

        setToast({ text: `Alterando propriedade da lavoura`, state: 'loading' })

        await updateStatus('/api/crops/alter-property', admin.id, id, value, 'property_id').then(() => {
            setToast({ text: `Propriedade atualizada`, state: 'success' })
            mutate(`/api/crops/list/${admin.id}?filter=${searchPage}&page=${activePage}`)
        })
    }

    const handlePageChange = (index: number) => {
        const timeout = setTimeout(() => {
            setActivePage(index)
            clearTimeout(timeout)
        }, 100)
    }

    const deleteCrop = async () => {
        try {
            setToast({ text: `Excluindo lavoura ${deleteName}`, state: 'loading' })

            await updateStatus('/api/crops/delete', admin.id, deleteId, 0).then(() => {
                setShowDeleteCropModal(false)

                setToast({ text: `Lavoura ${deleteName} excluída`, state: 'success' })
                mutate(`/api/crops/list/${admin.id}?filter=${searchPage}&page=${activePage}`)
            })
        } catch (error: any) {
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }

    return (
        <>
            {data?.crops?.map((crop: any) => (
                <TableRow
                    key={crop.id}
                    gridColumns={`repeat(${tableHeaders.length}, 1fr)`}
                    href={`/dashboard/lavoura?id=${crop.id}`}>
                    <div data-type='content'>
                        <p>{crop.name}</p>
                    </div>

                    <div data-type='content'>
                        <p>{formatNumberToBR(crop.area)}</p>
                    </div>

                    <div data-type='content'>
                        <TableSelect
                            defaultValue={crop.property_id == null ? 0 : crop.property_id}
                            itemId={crop.id}
                            name='type'
                            options={propertyOptions}
                            onChange={(event: ChangeEvent<HTMLSelectElement>) => handleSelectChange(event)}
                        />
                    </div>

                    <div data-type='content'>
                        <p>{crop.city}</p>
                    </div>

                    <div data-type='action'>
                        <TableActions>
                            {/* <TableButton href={`/dashboard/lavoura?id=${crop.id}`} variant='edit' /> */}
                            {admin.access_level == 1 && (
                                <TableButton
                                    variant='delete'
                                    onClick={(event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
                                        event.stopPropagation()
                                        setDeleteId(crop.id)
                                        setDeleteName(crop.name)
                                        setShowDeleteCropModal(!showDeleteCropModal)
                                    }}
                                />
                            )}
                        </TableActions>
                    </div>
                </TableRow>
            ))}
            <TablePagination pages={pageNumbers} onPageChange={handlePageChange} active={activePage} />

            <GeralModal
                small
                isDelete
                deleteName={deleteName}
                deleteFunction={deleteCrop}
                show={showDeleteCropModal}
                setShow={setShowDeleteCropModal}
                title='Excluir lavoura'
            />
        </>
    )
}
