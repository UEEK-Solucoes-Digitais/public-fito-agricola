'use client'

import Property from '@/@types/Property'
import PageHeader from '@/components/header/PageHeader'
import GeralInput from '@/components/inputs/GeralInput'
import TableSkeleton from '@/components/loading/TableSkeleton'
import GeralTable from '@/components/tables/GeralTable'
import TableActions from '@/components/tables/TableActions'
import TableButton from '@/components/tables/TableButton'
import TableHeader from '@/components/tables/TableHeader'
import TablePagination from '@/components/tables/TablePagination'
import TableRow from '@/components/tables/TableRow'
import { useAdmin } from '@/context/AdminContext'
import { useNotification } from '@/context/ToastContext'
import { formatNumberToBR } from '@/utils/formats'
import getFetch from '@/utils/getFetch'
import { ChangeEvent, Suspense, useEffect, useState } from 'react'
import useSWR from 'swr'
import CropDeleteModal from '../(modal)/delete'
import CropFileFormModal from '../(modal)/form'
import CropFileVisualization from '../(modal)/visualization'
import { Crop } from '../../properties/types'
import { CropFile } from './types'

// cabeçalho da tabela

export default function GroundsList() {
    // estrutura da página
    const { admin } = useAdmin()
    const { setToast } = useNotification()
    const [pageNumbers, setPageNumbers] = useState(0)
    const [activePage, setActivePage] = useState(1)

    // modais de cadastro/edição e de visualização
    const [showCropFileModal, setShowCropFileModal] = useState(false)
    const [showCropFileSeeModal, setShowCropFileSeeModal] = useState(false)

    // opções do filtro
    const [selectedPropertyId, setSelectedPropertyId] = useState(0)
    const [selectedCropId, setSelectedCropId] = useState(0)

    // deletar
    const [showDeleteCropModal, setShowDeleteCropModal] = useState(false)
    const [deleteName, setDeleteName] = useState('')

    // variavel para armazenar o id do objeto a ser deletado, editado ou visualizado
    const [objectId, setObjectId] = useState(0)

    // cabeçalho e tamanho do cabeçalho
    const tableHeaders = [
        'Nome',
        'Lavoura',
        'Teor de argila (%)',
        'Sat. de Bases (%)',
        'Mat. Orgânica (%)',
        'Ca',
        'Al',
        'K',
        'Mg',
        'P',
        'Ações',
    ]
    const headerSize = '1fr 0.8fr repeat(3, 0.6fr) repeat(5, 0.3fr) 0.5fr'

    // consulta
    const { data, isLoading, error, mutate } = useSWR<{
        crops_files: CropFile[]
        properties: Property[]
        crops: Crop[]
        total: number
    }>(`/api/crops-ground/list/${admin.id}?&page=${activePage}&crop_id=${selectedCropId}`, getFetch)

    // função para mudar de página
    const handlePageChange = (index: number) => {
        const timeout = setTimeout(() => {
            setActivePage(index)
            clearTimeout(timeout)
        }, 100)
    }

    // notificação de erro
    useEffect(() => {
        if (typeof error != 'undefined') {
            if (process.env.NEXT_PUBLIC_SHOW_TOAST_FETCH_ERROR == 'true') {
                setToast({ text: `Falha ao obter dados de solos`, state: 'danger' })
            }
        }
    }, [error])

    // definição da paginação e seleciona propriedade caso só tenha 1
    useEffect(() => {
        if (data) {
            const total = data.total
            setPageNumbers(Math.ceil(total / 40))

            if (data.properties.length == 1) {
                setSelectedPropertyId(data.properties[0].id)
            }
        }
    }, [data])

    if (isLoading) {
        return <TableSkeleton />
    }

    if (!data) {
        return <p>Não foi possível carregar a página</p>
    }

    return (
        <>
            {/* cabeçalho da página */}
            <PageHeader placeholder={`Pesquisar em "solos"`} buttonValue={`+ Adicionar Laudo`} />

            {/* opções acima da tabela e filtro */}
            <TableHeader
                title='Solos'
                description='Confira abaixo a lista dos laudos de solos cadastrados no sistema. Utilize o obtão ao lado para adicionar um laudo novo'
                buttonActionName='+ Adicionar laudo'
                titleIcon='fluent:dust-20-regular'
                onButtonAction={() => {
                    setObjectId(0)
                    setShowCropFileModal(!showCropFileModal)
                }}
                filter>
                {/* campos do filtro */}

                <GeralInput
                    defaultValue={selectedPropertyId}
                    label='Propriedade'
                    name='property_id'
                    type='select'
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                        setSelectedPropertyId(Number(e.target.value))

                        if (Number(e.target.value) == 0) {
                            setSelectedCropId(0)
                        }
                    }}
                    required>
                    <option value={0}>Todos</option>

                    {data.properties.map((property) => (
                        <option key={property.id} value={property.id}>
                            {property.name}
                        </option>
                    ))}
                </GeralInput>

                {selectedPropertyId > 0 && (
                    <GeralInput
                        defaultValue={selectedCropId}
                        label='Lavoura'
                        name='crop_id'
                        type='select'
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                            setSelectedCropId(Number(e.target.value))
                        }}
                        required>
                        <option value={0}>Todos</option>

                        {data.crops
                            .filter((crop) => crop.property_id == selectedPropertyId)
                            .map((crop) => (
                                <option key={`crop-id-${crop.id}`} value={crop.id}>
                                    {crop.name}
                                </option>
                            ))}
                    </GeralInput>
                )}
            </TableHeader>

            {/* tabela de registros */}
            <GeralTable headers={tableHeaders} gridColumns={headerSize}>
                <Suspense fallback={<TableSkeleton />}>
                    {data.crops_files.map((cropFile) => (
                        <TableRow key={`crop-file-${cropFile.id}`} gridColumns={headerSize}>
                            <div data-type='content'>
                                <p title={cropFile.name}>{cropFile.name}</p>
                            </div>

                            <div data-type='content'>
                                <p title={cropFile.crop.name}>{cropFile.crop.name}</p>
                            </div>

                            <div data-type='content'>
                                <p title={formatNumberToBR(cropFile.clay, 0, 0)}>
                                    {formatNumberToBR(cropFile.clay, 0, 0)}
                                </p>
                            </div>
                            <div data-type='content'>
                                <p title={formatNumberToBR(cropFile.base_saturation, 1, 1)}>
                                    {formatNumberToBR(cropFile.base_saturation, 1, 1)}
                                </p>
                            </div>
                            <div data-type='content'>
                                <p title={formatNumberToBR(cropFile.organic_material, 1, 1)}>
                                    {formatNumberToBR(cropFile.organic_material, 1, 1)}
                                </p>
                            </div>
                            <div data-type='content'>
                                <p title={formatNumberToBR(cropFile.unit_ca, 1, 1)}>
                                    {formatNumberToBR(cropFile.unit_ca, 1, 1)}
                                </p>
                            </div>
                            <div data-type='content'>
                                <p title={formatNumberToBR(cropFile.unit_al)}>{formatNumberToBR(cropFile.unit_al)}</p>
                            </div>
                            <div data-type='content'>
                                <p title={formatNumberToBR(cropFile.unit_k, 1, 1)}>
                                    {formatNumberToBR(cropFile.unit_k, 1, 1)}
                                </p>
                            </div>
                            <div data-type='content'>
                                <p title={formatNumberToBR(cropFile.unit_mg, 1, 1)}>
                                    {formatNumberToBR(cropFile.unit_mg, 1, 1)}
                                </p>
                            </div>
                            <div data-type='content'>
                                <p title={formatNumberToBR(cropFile.unit_p, 1, 1)}>
                                    {formatNumberToBR(cropFile.unit_p, 1, 1)}
                                </p>
                            </div>

                            <div data-type='action'>
                                <TableActions>
                                    <TableButton
                                        onClick={() => {
                                            setObjectId(cropFile.id)
                                            setShowCropFileSeeModal(!showCropFileModal)
                                        }}
                                        variant='see'
                                    />

                                    <TableButton
                                        onClick={() => {
                                            setObjectId(cropFile.id)
                                            setShowCropFileModal(!showCropFileModal)
                                        }}
                                        variant='edit'
                                    />

                                    {admin.access_level == 1 && (
                                        <TableButton
                                            variant='delete'
                                            onClick={() => {
                                                setObjectId(cropFile.id)
                                                setDeleteName(cropFile.name)
                                                setShowDeleteCropModal(!showDeleteCropModal)
                                            }}
                                        />
                                    )}
                                </TableActions>
                            </div>
                        </TableRow>
                    ))}

                    {data.crops_files.length == 0 && (
                        <TableRow gridColumns={headerSize}>
                            <div
                                data-type='content'
                                style={{ gridColumn: `1/${tableHeaders.length}`, textAlign: 'center' }}>
                                <p>Nenhum laudo de solo cadastrado</p>
                            </div>
                        </TableRow>
                    )}

                    {/* paginação */}
                    <TablePagination pages={pageNumbers} onPageChange={handlePageChange} active={activePage} />
                </Suspense>
            </GeralTable>

            {/* modal de visualização */}
            {showCropFileSeeModal && (
                <CropFileVisualization
                    showModal={showCropFileSeeModal}
                    setShowModal={setShowCropFileSeeModal}
                    cropFileId={objectId}
                />
            )}

            {/* modal de remoção */}
            {showDeleteCropModal && (
                <CropDeleteModal
                    showModal={showDeleteCropModal}
                    setShowModal={setShowDeleteCropModal}
                    cropFileId={objectId}
                    mutate={mutate}
                    setToast={setToast}
                    adminId={admin.id}
                    deleteName={deleteName}
                />
            )}

            {/* modal de cadastro/edição */}
            {showCropFileModal && (
                <CropFileFormModal
                    showModal={showCropFileModal}
                    setShowModal={setShowCropFileModal}
                    mutate={mutate}
                    setToast={setToast}
                    adminId={admin.id}
                    cropFileId={objectId}
                    crops={data.crops}
                    properties={data.properties}
                />
            )}
        </>
    )
}
