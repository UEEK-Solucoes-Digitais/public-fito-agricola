'use client'

import { ChangeEvent, MouseEvent, Suspense, useCallback, useEffect, useState } from 'react'

import GeralButton from '@/components/buttons/GeralButton'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import GeralInput from '@/components/inputs/GeralInput'
import ElementSkeleton from '@/components/loading/ElementSkeleton'
import TableSkeleton from '@/components/loading/TableSkeleton'
import GeralModal from '@/components/modal/GeralModal'
import GeralTable from '@/components/tables/GeralTable'
import tableStyles from '@/components/tables/styles.module.scss'
import TableActions from '@/components/tables/TableActions'
import TableButton from '@/components/tables/TableButton'
import TableHeader from '@/components/tables/TableHeader'
import TableRow from '@/components/tables/TableRow'
import { useAdmin } from '@/context/AdminContext'
import { useSearch } from '@/context/SearchContext'
import { useNotification } from '@/context/ToastContext'
import useSetupAddButton from '@/hooks/addButtonHook'
import getFetch from '@/utils/getFetch'
import { getMetricUnity } from '@/utils/getMetricUnity'
import WriteLog from '@/utils/logger'
import updateStatus from '@/utils/updateStatus'
import axios from 'axios'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import useSWR, { mutate } from 'swr'
import styles from './styles.module.scss'
import { HavestHistory, PropertyData } from './types'

const PropertiesForm = dynamic(() => import('./form'), {
    ssr: false,
    loading: () => <ElementSkeleton />,
})

const tableHeaders = ['Nome da propriedade', 'Município', 'Proprietário', 'Contato', 'Nº de lavouras', 'Área', 'Ações']
const deleteUrl = '/api/properties/delete'

const PropertiesRows = ({ searchPage }: { searchPage: string }) => {
    const { setToast } = useNotification()
    const { admin } = useAdmin()
    const { data, isLoading, error } = useSWR(`/api/properties/list/${admin.id}?filter=${searchPage}`, getFetch)

    const initialData = {
        id: 0,
        name: '',
        cep: '',
        uf: '',
        city: '',
        state_subscription: '',
        number: 0,
        street: '',
        neighborhood: '',
        complement: '',
        latitude: '',
        longitude: '',
        cnpj: '',
    }

    const [showDeletePropertyModal, setShowDeletePropertyModal] = useState(false)
    const [toggleInfoModal, setToggleInfoModal] = useState(false)
    const [deleteId, setDeleteId] = useState(0)
    const [infoId, setInfoId] = useState(0)
    const [deleteName, setDeleteName] = useState('')
    const [propertyData, setPropertyData] = useState<PropertyData>(initialData)
    const [harvestHistory, setHarvestHistory] = useState<HavestHistory[]>([])
    const [isEmptyHistory, setIsEmptyHistory] = useState(false)
    const [showEditPropertyModal, setShowEditPropertyModal] = useState(false)
    const [showHistoryModal, setShowHistoryModal] = useState(false)
    const tableHeadersHistory = ['Ano agrícola', 'Lavouras', 'Ações']

    const [searchUsersModal, setSearchUsersModal] = useState('')

    const [toggleAdminsModal, setToggleAdminsModal] = useState(false)
    const [propertyAdminId, setPropertyAdminId] = useState(0)
    const [admins, setAdmins] = useState<any[]>([])
    const [linkedAdmins, setLinkedAdmins] = useState<any[]>([])
    const [isLoadingAdmins, setIsLoadingAdmins] = useState(true)

    const deleteProperty = async () => {
        try {
            setToast({ text: `Excluindo propriedade ${deleteName}`, state: 'loading' })

            await updateStatus(deleteUrl, admin.id, deleteId, 0).then(() => {
                setShowDeletePropertyModal(false)

                setToast({ text: `Propriedade ${deleteName} excluída`, state: 'success' })
                mutate(`/api/properties/list/${admin.id}?filter=${searchPage}`)
            })
        } catch (error: any) {
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }

    useEffect(() => {
        if (toggleAdminsModal && propertyAdminId != 0) {
            axios.get(`/api/properties/read-linked-admins/${admin.id}/${propertyAdminId}`).then((response) => {
                setAdmins(response.data.admins)
                setLinkedAdmins(response.data.linked_admins)

                setIsLoadingAdmins(false)
            })
        } else {
            setAdmins([])
            setLinkedAdmins([])
            setIsLoadingAdmins(true)
        }
    }, [toggleAdminsModal, propertyAdminId])

    const changeAdmins = (e: ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target

        if (checked) {
            const toLinked = admins.find((crop: any) => crop.id == value)
            setAdmins(admins.filter((crop: any) => crop.id != value))

            setLinkedAdmins([...linkedAdmins, toLinked])
        } else {
            const toAvailable = linkedAdmins.find((crop: any) => crop.id == value)
            setLinkedAdmins(linkedAdmins.filter((crop: any) => crop.id != value))

            setAdmins([...admins, toAvailable])
        }
    }

    const linkAdmins = () => {
        setToast({ text: `Vinculando usuários`, state: 'loading' })

        const body = {
            admin_id: admin.id,
            property_id: propertyAdminId,
            admins: linkedAdmins.map((admin: any) => admin.id),
        }

        try {
            axios.post('/api/properties/link-admins', body).then((response) => {
                if (response.status == 200) {
                    setToast({ text: `Usuários vinculados`, state: 'success' })
                    setToggleAdminsModal(false)
                    mutate(`/api/properties/read-linked-admins/${admin.id}/${propertyAdminId}`)
                } else {
                    setToast({ text: `Não foi possível atualizar`, state: 'danger' })
                }
            })
        } catch (error: any) {
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }

    useEffect(() => {
        setPropertyData(initialData)
        if (toggleInfoModal) {
            axios.get(`/api/properties/read/${infoId}?read_simple=true`).then((response) => {
                const property = response.data.property

                setPropertyData({
                    id: property.id,
                    name: property.name,
                    cep: property.cep,
                    uf: property.uf,
                    city: property.city,
                    state_subscription: property.state_subscription,
                    number: property.number,
                    street: property.street,
                    neighborhood: property.neighborhood,
                    complement: property.complement,
                    latitude: `${property.coordinates?.coordinates[1] ?? ''}`,
                    longitude: `${property.coordinates?.coordinates[0] ?? ''}`,
                    cnpj: property.cnpj,
                })
            })
        }
    }, [toggleInfoModal])

    useEffect(() => {
        setHarvestHistory([])
        setIsEmptyHistory(false)

        if (showHistoryModal) {
            axios.get(`/api/properties/read-harvest-history/${infoId}`).then((response) => {
                if (response.data.harvests.length > 0) {
                    setHarvestHistory(response.data.harvests)
                } else {
                    setIsEmptyHistory(true)
                }
            })
        }
    }, [showHistoryModal])

    useEffect(() => {
        if (typeof error != 'undefined') {
            WriteLog(error, 'error')

            if (process.env.NEXT_PUBLIC_SHOW_TOAST_FETCH_ERROR == 'true') {
                setToast({ text: `Falha ao obter dados de propriedades`, state: 'danger' })
            }
        }
    }, [error])

    if (isLoading) {
        return <TableSkeleton />
    }

    return (
        <>
            <GeralTable
                headers={tableHeaders}
                gridColumns={`1.5fr 1fr 1fr 1fr 0.8fr 0.8fr 1fr`}
                customClasses={[tableStyles.clickableRow]}>
                <Suspense fallback={<TableSkeleton />}>
                    {data?.properties &&
                        data.properties.map((property: any) => (
                            <TableRow
                                key={property.id}
                                gridColumns='1.5fr 1fr 1fr 1fr 0.8fr 0.8fr 1fr'
                                href={`/dashboard/propriedades/${property?.id}`}>
                                <div data-type='content'>
                                    <p title={property?.name}>{property?.name}</p>
                                </div>

                                <div data-type='content'>
                                    <p title={property?.city}>{property?.city}</p>
                                </div>

                                <div data-type='content'>
                                    <p title={property?.admin.name}>{property?.admin.name}</p>
                                </div>

                                <div data-type='content'>
                                    <p title={property?.admin.phone}>{property?.admin.phone ?? '--'}</p>
                                </div>

                                <div data-type='content'>
                                    <p title={property?.crops.length}>{property?.crops.length}</p>
                                </div>

                                <div data-type='content' className={styles.totalAreaBox}>
                                    <p title={property?.total_area}>
                                        {property?.total_area} {getMetricUnity()}
                                    </p>
                                    {property.different_area && (
                                        <div className={styles.differentBoxProperty}>
                                            <IconifyIcon icon='lucide:triangle-alert' />

                                            <div className={styles.box}>
                                                A área total de plantio é maior que a área da lavoura
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div data-type='action'>
                                    <TableActions>
                                        {admin.access_level == 1 && (
                                            <TableButton
                                                variant='user'
                                                title='Usuários vinculados'
                                                onClick={(event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
                                                    event.stopPropagation()
                                                    setPropertyAdminId(property.id)
                                                    setToggleAdminsModal(true)
                                                }}
                                            />
                                        )}

                                        <TableButton
                                            variant='info'
                                            title='Informações gerais'
                                            onClick={(event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
                                                event.stopPropagation()
                                                setInfoId(property?.id)
                                                setToggleInfoModal(true)
                                            }}
                                        />

                                        <TableButton
                                            variant='history'
                                            title='Histórico de anos agrícolas'
                                            onClick={(event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
                                                event.stopPropagation()
                                                setInfoId(property.id)
                                                setShowHistoryModal(true)
                                            }}
                                        />

                                        <TableButton
                                            variant='edit'
                                            onClick={(event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
                                                event.stopPropagation()
                                                setInfoId(property.id)
                                                setShowEditPropertyModal(true)
                                            }}
                                        />

                                        {admin.access_level == 1 && (
                                            <TableButton
                                                variant='delete'
                                                onClick={(event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
                                                    event.stopPropagation()
                                                    setDeleteId(property.id)
                                                    setDeleteName(property.name)
                                                    setShowDeletePropertyModal(!showDeletePropertyModal)
                                                }}
                                            />
                                        )}
                                    </TableActions>
                                </div>
                            </TableRow>
                        ))}

                    {!data.properties ||
                        (data.properties.length == 0 && (
                            <TableRow emptyString='Nenhuma propriedade encontrada' columnsCount={1} />
                        ))}
                </Suspense>
            </GeralTable>

            <GeralModal
                small
                isDelete
                deleteName={deleteName}
                deleteFunction={deleteProperty}
                show={showDeletePropertyModal}
                setShow={setShowDeletePropertyModal}
                title='Excluir lavoura'
            />

            <GeralModal
                show={toggleInfoModal}
                setShow={setToggleInfoModal}
                title='Informações gerais'
                extraButton={
                    propertyData.id != 0 && (
                        <GeralButton
                            variant='gray'
                            round
                            small
                            smallIcon
                            onClick={() => {
                                setToggleInfoModal(false)
                                setInfoId(propertyData.id)
                                setShowEditPropertyModal(true)
                            }}>
                            <IconifyIcon icon='ph:pencil-simple' />
                        </GeralButton>
                    )
                }>
                <div className={styles.infoModalWrapper}>
                    {propertyData.id != 0 ? (
                        <div className={styles.infoGrid}>
                            <div className={styles.gridItem}>
                                <h4>Nome da propriedade</h4>
                                <span>{propertyData.name}</span>
                            </div>

                            <div className={styles.gridItem}>
                                <h4>CEP</h4>
                                <span>{propertyData.cep}</span>
                            </div>

                            <div className={styles.gridItem}>
                                <h4>Município, Estado</h4>
                                <span>
                                    {propertyData.city}, {propertyData.uf}
                                </span>
                            </div>

                            <div className={styles.gridItem}>
                                <h4>Inscrição Estadual</h4>
                                <span>
                                    {propertyData.state_subscription != '' ? propertyData.state_subscription : '--'}
                                </span>
                            </div>

                            <div className={styles.gridItem}>
                                <h4>Logradouro, n°</h4>
                                <span>
                                    {propertyData.street ? `${propertyData.street}, ${propertyData.number}` : '--'}
                                </span>
                            </div>

                            <div className={styles.gridItem}>
                                <h4>Bairro</h4>
                                <span>
                                    {propertyData.neighborhood && propertyData.neighborhood != ''
                                        ? propertyData.neighborhood
                                        : '--'}
                                </span>
                            </div>

                            <div className={styles.gridItem}>
                                <h4>Complemento</h4>
                                <span>
                                    {propertyData.complement && propertyData.complement != ''
                                        ? propertyData.complement
                                        : '--'}
                                </span>
                            </div>

                            <div className={styles.gridItem}>
                                <h4>Latitude — Longitude</h4>
                                <span>
                                    {propertyData.latitude
                                        ? `${propertyData.latitude} / ${propertyData.longitude}`
                                        : '--'}
                                </span>
                            </div>

                            <div className={styles.gridItem}>
                                <h4>CNPJ</h4>
                                <span>{propertyData.cnpj && propertyData.cnpj != '' ? propertyData.cnpj : '--'}</span>
                            </div>
                        </div>
                    ) : (
                        <IconifyIcon icon='line-md:loading-loop' />
                    )}
                </div>
            </GeralModal>

            <GeralModal show={showHistoryModal} setShow={setShowHistoryModal} title='Histórico de anos agrícolas '>
                {harvestHistory.length != 0 || isEmptyHistory ? (
                    isEmptyHistory ? (
                        <p style={{ marginTop: '20px' }}>Nenhum ano agrícola no histórico</p>
                    ) : (
                        <>
                            <div style={{ marginTop: '30px' }}>
                                <GeralTable
                                    headers={tableHeadersHistory}
                                    gridColumns={`1fr 4fr 1fr`}
                                    customClasses={[tableStyles.modalTable]}>
                                    <Suspense fallback={<TableSkeleton />}>
                                        {harvestHistory.map((history, index: number) => (
                                            <TableRow key={history.id ?? index + 1} gridColumns={`1fr 4fr 1fr`}>
                                                <div data-type='content'>
                                                    <p title={history?.name}>{history?.name}</p>
                                                </div>

                                                <div data-type='content' className={styles.propertyLinksGroup}>
                                                    {history?.crops_join.map((crop, j: number) => (
                                                        <>
                                                            <Link
                                                                href={`/dashboard/propriedades/lavoura/${crop?.id}`}
                                                                key={crop?.id ?? j + 1}
                                                                title={crop?.crop?.name}>
                                                                {crop?.crop?.name}
                                                            </Link>
                                                        </>
                                                    ))}
                                                </div>

                                                <div data-type='action'>
                                                    <TableActions>
                                                        <TableButton
                                                            variant='see'
                                                            href={`/dashboard/propriedades/${infoId}?safra=${history?.id}`}
                                                        />
                                                    </TableActions>
                                                </div>
                                            </TableRow>
                                        ))}
                                    </Suspense>
                                </GeralTable>
                            </div>
                        </>
                    )
                ) : (
                    <div className={styles.infoModalWrapper}>
                        <IconifyIcon icon='line-md:loading-loop' />
                    </div>
                )}
            </GeralModal>

            <GeralModal show={toggleAdminsModal} setShow={setToggleAdminsModal} title='Usuários vinculados'>
                {isLoadingAdmins ? (
                    <IconifyIcon icon='line-md:loading-loop' />
                ) : (
                    <>
                        <div className={styles.cropsWrapper}>
                            <h3>Administradores</h3>

                            <div className={styles.cropsInfo}>
                                <span>ADMINISTRADORES ADICIONADOS ({linkedAdmins.length})</span>
                            </div>

                            <div className={styles.cropsList}>
                                {linkedAdmins &&
                                    linkedAdmins.map((admin: any) => (
                                        <GeralInput
                                            key={admin.id}
                                            checked
                                            value={admin.id}
                                            variant='button'
                                            name={`admin-${admin.id}`}
                                            type='checkbox'
                                            on={1}
                                            label={admin.name}
                                            onChange={changeAdmins}
                                        />
                                    ))}
                            </div>
                        </div>

                        <div className={styles.cropsWrapper}>
                            <div className={styles.cropsInfo}>
                                <span>ADMINISTRADORES DISPONIVEIS ({admins.length})</span>

                                <GeralInput
                                    variant='inline'
                                    type='text'
                                    placeholder='Buscar usuários'
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchUsersModal(e.target.value)}
                                />
                            </div>

                            {searchUsersModal != '' ? (
                                <div className={styles.cropsList}>
                                    {admins &&
                                        admins
                                            .filter((admin) => admin.name.toLowerCase().includes(searchUsersModal))
                                            .map((admin: any) => (
                                                <GeralInput
                                                    key={admin.id}
                                                    value={admin.id}
                                                    variant='button'
                                                    name={`admin-not-linked${admin.id}`}
                                                    type='checkbox'
                                                    on={1}
                                                    label={admin.name}
                                                    onChange={changeAdmins}
                                                />
                                            ))}
                                </div>
                            ) : (
                                <p style={{ marginTop: '-30px' }}>Comece a buscar para exibir os usuários</p>
                            )}
                        </div>

                        <div className={styles.modalActions}>
                            <GeralButton
                                variant='secondary'
                                type='button'
                                small
                                value='Atualizar'
                                onClick={() => {
                                    linkAdmins()
                                }}
                            />
                            <GeralButton
                                variant='quaternary'
                                type='button'
                                small
                                value='Cancelar'
                                onClick={() => {
                                    setToggleAdminsModal(false)
                                }}
                            />
                        </div>
                    </>
                )}
            </GeralModal>

            {showEditPropertyModal && (
                <PropertiesForm
                    show={showEditPropertyModal}
                    setShow={setShowEditPropertyModal}
                    id={infoId}
                    searchPage={searchPage}
                />
            )}
        </>
    )
}

export default function Page() {
    const [showNewPropertyModal, setShowNewPropertyModal] = useState(false)
    const { searchPage } = useSearch()

    const toggleModal = useCallback(() => {
        setShowNewPropertyModal((prev) => !prev)
    }, [])

    useSetupAddButton(toggleModal)

    return (
        <>
            <TableHeader
                title='Propriedades'
                description='Todas as propriedades cadastradas no sistema estão listadas abaixo. Para ver os detalhes da propriedade, clique em qualquer lugar da linha (exceto nos botões de ação)'
                buttonActionName='+ Adicionar propriedade'
                onButtonAction={() => {
                    setShowNewPropertyModal(!showNewPropertyModal)
                }}
            />
            <PropertiesRows searchPage={searchPage} />

            {showNewPropertyModal && (
                <PropertiesForm show={showNewPropertyModal} setShow={setShowNewPropertyModal} searchPage={searchPage} />
            )}
        </>
    )
}
