import Fancybox from '@/components/fancybox/Fancybox'
import TableSkeleton from '@/components/loading/TableSkeleton'
import GeralModal from '@/components/modal/GeralModal'
import GeralTable from '@/components/tables/GeralTable'
import TableActions from '@/components/tables/TableActions'
import TableButton from '@/components/tables/TableButton'
import TablePagination from '@/components/tables/TablePagination'
import TableRow from '@/components/tables/TableRow'
import { useAdmin } from '@/context/AdminContext'
import { useSearch } from '@/context/SearchContext'
import { useNotification } from '@/context/ToastContext'
import { formatNumberToReal } from '@/utils/formats'
import getFetch from '@/utils/getFetch'
import updateStatus from '@/utils/updateStatus'
import Image from 'next/image'
import { Suspense, useEffect, useState } from 'react'
import useSWR, { mutate } from 'swr'
import AssetsForm from '../(modal)/form'
import styles from '../styles.module.scss'

const tableHeaders = ['Nome do bem', 'Tipo', 'Valor aproximado', 'Observações', 'Cadastrado em', 'Alocado em', 'Ações']

const PropertiesRows = ({ property }: { property: string; propertiesData: any }) => {
    const { setToast } = useNotification()
    const { admin } = useAdmin()

    const [pageNumbers, setPageNumbers] = useState(0)
    const [activePage, setActivePage] = useState(1)

    const [showDeleteAssetModal, setShowDeleteAssetModal] = useState(false)
    const [deleteId, setDeleteId] = useState(0)
    const [deleteName, setDeleteName] = useState('')
    const [showEditAssetModal, setShowEditAssetModal] = useState(false)

    const { searchPage } = useSearch()

    const { data, isLoading } = useSWR(
        `/api/assets/list/${admin.id}?page=${activePage}${
            property ? '&property=' + property : ''
        }&filter=${searchPage}`,
        getFetch,
    )

    const deleteAsset = async () => {
        try {
            setToast({ text: `Excluindo bem ${deleteName}`, state: 'loading' })

            await updateStatus('/api/assets/delete', admin.id, deleteId, 0).then(() => {
                setShowDeleteAssetModal(false)

                setToast({ text: `Bem ${deleteName} excluída`, state: 'success' })
                mutate(
                    `/api/assets/list/${admin.id}?page=${activePage}${
                        property ? '&property=' + property : ''
                    }&filter=${searchPage}`,
                )
            })
        } catch (error: any) {
            const message = error?.response?.data?.msg ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const day = date.getDate().toString().padStart(2, '0')
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const year = date.getFullYear()
        return `${day}/${month}/${year}`
    }

    useEffect(() => {
        if (data) {
            const total = data.total
            setPageNumbers(Math.ceil(total / 10))
        }
    }, [data])

    const handlePageChange = (index: number) => {
        const timeout = setTimeout(() => {
            setActivePage(index)
            clearTimeout(timeout)
        }, 100)
    }

    if (isLoading) {
        return <TableSkeleton />
    }

    return (
        <>
            {data?.assets?.map((asset: any) => (
                <TableRow key={asset?.id} gridColumns={`repeat(${tableHeaders.length}, 1fr)`}>
                    <div data-type='content'>
                        <div className={styles.imageFlex}>
                            {asset.image && (
                                <div className={styles.image}>
                                    <Fancybox>
                                        <div
                                            data-src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/assets/${asset.image}`}
                                            data-fancybox>
                                            <Image
                                                src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/assets/${asset.image}`}
                                                alt='Imagem'
                                                width={100}
                                                height={100}
                                                loading='lazy'
                                            />
                                        </div>
                                    </Fancybox>
                                </div>
                            )}
                            <p title={asset?.name}>{asset?.name}</p>
                        </div>
                    </div>

                    <div data-type='content'>
                        <p title={asset?.type}>{asset?.type}</p>
                    </div>

                    <div data-type='content'>
                        <p title={formatNumberToReal(asset?.value)}>{formatNumberToReal(asset?.value)}</p>
                    </div>

                    <div data-type='content'>
                        <p title={asset?.observations !== 'null' ? asset?.observations : ''}>
                            {asset?.observations !== 'null' ? asset?.observations : ''}
                        </p>
                    </div>

                    <div data-type='content'>
                        <p title={formatDate(asset?.created_at)}>{formatDate(asset?.created_at)}</p>
                    </div>

                    <div className='content'>
                        {/* <TableSelect
                            defaultValue={asset?.property_id}
                            itemId={asset?.id}
                            options={propertiesOptions}
                            onChange={handleSelectChange}
                        /> */}
                        {asset?.properties_names}
                    </div>

                    <div data-type='action'>
                        <TableActions>
                            <TableButton
                                variant='edit'
                                onClick={() => {
                                    setDeleteId(asset.id)
                                    setShowEditAssetModal(true)
                                }}
                            />
                            <TableButton
                                variant='delete'
                                onClick={() => {
                                    setDeleteId(asset.id)
                                    setDeleteName(asset.name)
                                    setShowDeleteAssetModal(!showDeleteAssetModal)
                                }}
                            />
                        </TableActions>
                    </div>
                </TableRow>
            ))}

            <TablePagination pages={pageNumbers} onPageChange={handlePageChange} active={activePage} />

            {!data.assets ||
                (data.assets.length == 0 && <TableRow emptyString='Nenhum bem encontrado' columnsCount={1} />)}

            <GeralModal
                small
                isDelete
                deleteName={deleteName}
                deleteFunction={deleteAsset}
                show={showDeleteAssetModal}
                setShow={setShowDeleteAssetModal}
                title='Excluir bem'
            />

            <AssetsForm
                show={showEditAssetModal}
                setShow={setShowEditAssetModal}
                id={deleteId}
                activePage={activePage}
                property={property}
                searchPage={searchPage}
            />
        </>
    )
}

export const AssetsList = ({
    propertiesData,
    property,
    showAssetForm,
    setShowAssetForm,
}: {
    propertiesData: any
    property: any
    showAssetForm: any
    setShowAssetForm: any
}) => {
    return (
        <>
            <GeralTable headers={tableHeaders} gridColumns={`repeat(${tableHeaders.length}, 1fr)`}>
                <Suspense fallback={<TableSkeleton />}>
                    <PropertiesRows propertiesData={propertiesData} property={property} />
                </Suspense>
            </GeralTable>

            {showAssetForm && (
                <AssetsForm show={showAssetForm} setShow={setShowAssetForm} activePage={1} property='1' />
            )}
        </>
    )
}
