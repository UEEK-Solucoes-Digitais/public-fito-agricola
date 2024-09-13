'use client'
import React, { ChangeEvent, MouseEvent, Suspense, useEffect, useState } from 'react'
// import dynamic from 'next/dynamic';
import Loading from '@/app/dashboard/loading'
import GeralBox from '@/components/box/GeralBox'
import Breadcrumb from '@/components/breadcrumb/Breadcrumb'
import GeralButton from '@/components/buttons/GeralButton'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import GeralInput from '@/components/inputs/GeralInput'
import ElementSkeleton from '@/components/loading/ElementSkeleton'
import TableSkeleton from '@/components/loading/TableSkeleton'
import GeralModal from '@/components/modal/GeralModal'
import ActivitySteps from '@/components/register-property-activity/ActivitySteps'
import GeralTable from '@/components/tables/GeralTable'
import tableStyles from '@/components/tables/styles.module.scss'
import TableButton from '@/components/tables/TableButton'
import TableRow from '@/components/tables/TableRow'
import { useAdmin } from '@/context/AdminContext'
import { useNotification } from '@/context/ToastContext'
import useDebounce from '@/utils/debounce'
import getFetch from '@/utils/getFetch'
import WriteLog from '@/utils/logger'
import updateStatus from '@/utils/updateStatus'
import axios from 'axios'
import Cookies from 'js-cookie'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'nextjs-toploader/app'
import useSWR, { mutate } from 'swr'
import CropsSelector from '../CropsSelector'
import propertyStyles from '../styles.module.scss'
import styles from './styles.module.scss'

const tableHeaders = ['Cultura', 'Lavoura', 'Emergência', 'Plantio', 'Última aplicação', '']

const GetData = ({ id }: { id: number }) => {
    const searchParams = useSearchParams()
    const filterHarvest = searchParams.get('safra')

    const { setToast } = useNotification()
    const { admin } = useAdmin()
    const router = useRouter()

    const [disabled, setDisabled] = useState(false)
    const [toggleActivityModal, setToggleActivityModal] = useState(false)
    const [toggleCropsModal, setToggleCropsModal] = useState(false)
    const [toggleSubharvestModal, setToggleSubharvestModal] = useState(false)
    const [availableCrops, setAvailableCrops] = useState<any>([])
    const [linkedCrops, setLinkedCrops] = useState<any>([])
    const [subharvests, setSubharvests] = useState<any>([
        {
            id: 0,
            name: '',
        },
    ])
    const [showDeleteLinkModal, setShowDeleteLinkModal] = useState(false)
    const [deleteId, setDeleteId] = useState(0)
    const [deleteName, setDeleteName] = useState('')
    const [openSearch, setOpenSearch] = useState(false)

    const [openMobileActionsModal, setOpenMobileActionsModal] = useState(false)

    const [search, setSearch] = useState('')
    const debouncedSearch = useDebounce(search, 1000)
    const harvestCookie = Cookies.get('cookie_harvest')

    const { data, isLoading } = useSWR(
        `/api/properties/read/${id}?read_simple=true&admin_id=${admin.id}&filter=${debouncedSearch}${
            filterHarvest ? `&harvest_id=${filterHarvest}` : ''
        }`,
        getFetch,
        {
            suspense: true,
        },
    )

    const [cropsData, setCropsData] = useState<any>(null)
    const [isRunningCrops, setIsRunningCrops] = useState(false)

    const deleteLink = async () => {
        try {
            setToast({ text: `Desvinculando lavoura ${deleteName}`, state: 'loading' })
            await updateStatus(
                '/api/properties/unlink',
                admin.id,
                deleteId,
                0,
                'status',
                'property_crop_join_id',
                deleteId,
            ).then(() => {
                setShowDeleteLinkModal(false)

                setToast({ text: `Lavoura ${deleteName} desvinculada`, state: 'success' })
                mutate(
                    `/api/properties/read/${id}?read_simple=true&admin_id=${admin.id}&filter=${debouncedSearch}${
                        filterHarvest ? `&harvest_id=${filterHarvest}` : ''
                    }`,
                )
            })
        } catch (error: any) {
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }

    const changeCrops = (e: ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target

        if (checked) {
            const toLinked = availableCrops.find((crop: any) => crop.id == value)
            setAvailableCrops(availableCrops.filter((crop: any) => crop.id != value))

            setLinkedCrops([...linkedCrops, toLinked])
        } else {
            const toAvailable = linkedCrops.find((crop: any) => crop.id == value)
            setLinkedCrops(linkedCrops.filter((crop: any) => crop.id != value))

            setAvailableCrops([...availableCrops, toAvailable])
        }
    }

    const linkCrops = () => {
        setDisabled(true)
        setToast({ text: `Adicionando lavouras`, state: 'loading' })

        const body = {
            admin_id: admin.id,
            property_id: id,
            crops: linkedCrops.map((crop: any) => crop.id),
            harvest_id: filterHarvest ?? 0,
        }

        try {
            axios.post('/api/properties/link-crops', body).then((response) => {
                if (response.status == 200) {
                    setToast({ text: `Lavouras adicionadas`, state: 'success' })
                    mutate(
                        `/api/properties/read/${id}?read_simple=true&admin_id=${admin.id}&filter=${debouncedSearch}${
                            filterHarvest ? `&harvest_id=${filterHarvest}` : ''
                        }`,
                    )
                    setToggleCropsModal(false)
                } else {
                    setToast({ text: `Não foi possível atualizar`, state: 'danger' })
                }

                setDisabled(false)
            })
        } catch (error: any) {
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
            setDisabled(false)
        }
    }

    const linkSubharvest = () => {
        if (subharvests.length > 0) {
            setDisabled(true)
            setToast({ text: `Adicionando safra`, state: 'loading' })

            const body = {
                admin_id: admin.id,
                subharvests: JSON.stringify(subharvests),
            }

            try {
                axios.post('/api/properties/link-subharvest', body).then((response) => {
                    if (response.status == 200) {
                        setToast({ text: `Safras adicionadas`, state: 'success' })
                        mutate(
                            `/api/properties/read/${id}?read_simple=true&admin_id=${admin.id}&filter=${debouncedSearch}${
                                filterHarvest ? `&harvest_id=${filterHarvest}` : ''
                            }`,
                        )
                        setToggleSubharvestModal(false)
                    } else {
                        setToast({ text: `Não foi possível atualizar`, state: 'danger' })
                    }

                    setDisabled(false)
                })
            } catch (error: any) {
                WriteLog(error, 'error')
                const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
                setToast({ text: message, state: 'danger' })
                setDisabled(false)
            }
        } else {
            setToast({ text: `Nenhuma lavoura vinculada`, state: 'warning' })
        }
    }

    useEffect(() => {
        if (data && !isRunningCrops) {
            if (data.not_allowed) {
                setToast({ text: `Você não tem permissão para acessar essa página`, state: 'danger' })
                setTimeout(() => {
                    router.push('/dashboard/propriedades')
                }, 1500)
            }

            setIsRunningCrops(true)
            axios
                .get(`/api/properties/read-linked-crops/${id}${filterHarvest ? `?harvest_id=${filterHarvest}` : ''}`)
                .then((response) => {
                    setCropsData(response.data)
                    setIsRunningCrops(false)
                })
        } else if (!data) {
            setToast({ text: `Você não tem permissão para acessar essa página`, state: 'danger' })
            setTimeout(() => {
                router.push('/dashboard/propriedades')
            }, 2000)
        }
    }, [data])

    useEffect(() => {
        if (cropsData) {
            setAvailableCrops(Object.values(cropsData.available_crops))
            setLinkedCrops(Object.values(cropsData.linked_crops))
        }
    }, [cropsData])

    // useEffect(() => {
    //     if (typeof error != 'undefined' || typeof harvestError != 'undefined' || typeof cropsError != 'undefined') {
    //         WriteLog([error, harvestError, cropsError], 'error');

    //         if (process.env.NEXT_PUBLIC_SHOW_TOAST_FETCH_ERROR == 'true') {
    //             setToast({ text: `Falha ao obter dados`, state: 'danger' });
    //         }
    //     }
    // }, [error, harvestError, cropsError]);

    // data.property?.crops = useMemo(() => {
    //     return data.property?.crops.filter((crop: any) => crop.harvest_id == harvestData.harvest.id);
    // }, [harvestData]);

    // data.property?.crops = data.property?.crops.filter((crop: any) => crop.harvest_id == harvestData.harvest.id);

    if (isLoading) {
        return <Loading />
    }

    return (
        <>
            <GeralBox variant='page' customClasses={[`${styles.minBoxHeight}`]}>
                <div className={styles.boxHeader}>
                    <h1>
                        {/* {data.property?.name} — Ano agrícola atual {data.harvest.name} */}
                        {data.property?.name}
                        {(harvestCookie && harvestCookie == data.harvest.id.toString()) ||
                        (!harvestCookie && data?.isLastHarvert)
                            ? `- Ano agrícola atual ${data.harvest?.name}`
                            : `- Ano agrícola ${data.harvest?.name}`}
                    </h1>

                    {/* {data?.isLastHarvert && (
                        <div className={styles.headerButtons}>
                            <GeralButton
                                variant='gray'
                                round
                                small
                                smallIcon
                                onClick={() => setToggleCropsModal(true)}
                                disabled={disabled}>
                                <IconifyIcon icon='ph:pencil-simple' />
                            </GeralButton>

                            <GeralButton variant='delete' round small smallIcon disabled={disabled}>
                                <IconifyIcon icon='prime:trash' />
                            </GeralButton>
                        </div>
                    )} */}
                </div>

                <div className={styles.boxContentWrapper}>
                    {data.property?.crops.length > 0 || debouncedSearch != '' ? (
                        <div className={styles.cropsContainer}>
                            <div className={styles.divider}></div>

                            <div className={styles.cropsHeader}>
                                <h4>Lavouras ({data.property?.crops.length})</h4>

                                <div className={`${styles.cropsAction} ${styles.desktop}`}>
                                    <GeralInput
                                        defaultValue={search}
                                        type='text'
                                        placeholder='Pesquisar lavoura'
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                                    />
                                    <>
                                        <GeralButton
                                            variant='tertiary'
                                            smaller
                                            value='+ Registrar atividade'
                                            onClick={() => setToggleActivityModal(true)}
                                        />
                                        <GeralButton
                                            variant='primary'
                                            smaller
                                            value='+ Adicionar safra'
                                            onClick={() => setToggleSubharvestModal(true)}
                                        />

                                        <GeralButton
                                            variant='secondary'
                                            smaller
                                            value='+ Editar lavouras vinculadas'
                                            onClick={() => setToggleCropsModal(true)}
                                        />
                                    </>
                                </div>
                                <div className={`${styles.cropsAction} ${styles.mobile}`}>
                                    <GeralButton variant='noStyle' onClick={() => setOpenSearch(!openSearch)}>
                                        <IconifyIcon icon='iconoir:search' />
                                    </GeralButton>
                                    <GeralButton
                                        variant='secondary'
                                        round
                                        small
                                        smallIcon
                                        onClick={() => setOpenMobileActionsModal(true)}>
                                        <IconifyIcon icon='ph:plus' />
                                    </GeralButton>
                                </div>
                                <div className={`${styles.searchMobileWrapper} ${openSearch ? styles.open : ''}`}>
                                    <GeralInput
                                        defaultValue={search}
                                        type='text'
                                        placeholder='Pesquisar lavoura'
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            <GeralTable
                                headers={tableHeaders}
                                gridColumns={`0.4fr 1.2fr repeat(3, 1fr) 0.2fr`}
                                customClasses={[tableStyles.clickableRow, tableStyles.boxWidth]}>
                                <Suspense fallback={<TableSkeleton />}>
                                    {data.property?.crops.map((item: any) => (
                                        <TableRow
                                            key={item.id}
                                            gridColumns={`0.4fr 1.2fr repeat(3, 1fr) 0.2fr`}
                                            href={`/dashboard/propriedades/lavoura/${item.id}`}>
                                            <div data-type='content'>
                                                <p title=''>{item?.culture_table}</p>
                                            </div>
                                            <div data-type='content' className={propertyStyles.totalAreaBox}>
                                                <p title={item?.crop.name}>
                                                    {item?.crop.name} {item?.subharvest_name}
                                                </p>
                                                {item.different_area && (
                                                    <div className={propertyStyles.differentBoxProperty}>
                                                        <IconifyIcon icon='lucide:triangle-alert' />

                                                        <div className={propertyStyles.box}>
                                                            A área total de plantio é maior que a área da lavoura
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div data-type='content'>
                                                <p title=''>{item?.emergency_table}</p>
                                            </div>
                                            <div data-type='content'>
                                                <p title=''>{item?.plant_table}</p>
                                            </div>
                                            <div data-type='content'>
                                                <p title=''>{item?.application_table}</p>
                                            </div>

                                            <div data-type='action' className={styles.customTableActions}>
                                                {/* <GeralButton
                                                        smaller
                                                        variant='quaternary'
                                                        value='Ver lavoura'
                                                        href={`/dashboard/propriedades/lavoura/${item.id}`}
                                                    /> */}
                                                <TableButton
                                                    variant='delete'
                                                    onClick={(
                                                        event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
                                                    ) => {
                                                        event.stopPropagation()
                                                        setDeleteId(item.id)
                                                        setDeleteName(item.crop.name)
                                                        setShowDeleteLinkModal(!showDeleteLinkModal)
                                                    }}
                                                />
                                            </div>
                                        </TableRow>
                                    ))}
                                </Suspense>
                            </GeralTable>
                        </div>
                    ) : (
                        <div className={styles.contentAction}>
                            <h3>Dê inicio à seu ano agrícola agora</h3>
                            <GeralButton
                                variant='secondary'
                                smaller
                                value='Criar meu ano agrícola'
                                onClick={() => setToggleCropsModal(true)}
                            />
                        </div>
                    )}
                </div>
            </GeralBox>

            <GeralModal
                small
                isDelete
                deleteName={deleteName}
                deleteFunction={deleteLink}
                show={showDeleteLinkModal}
                setShow={setShowDeleteLinkModal}
                title='Excluir lavoura'
            />

            <GeralModal show={openMobileActionsModal} setShow={setOpenMobileActionsModal} title='Adicionar'>
                <div className={styles.mobileActionsModal}>
                    <GeralButton
                        variant='tertiary'
                        value='+ Registrar atividade'
                        onClick={() => setToggleActivityModal(true)}
                    />
                    <GeralButton
                        variant='primary'
                        value='+ Adicionar safra'
                        onClick={() => setToggleSubharvestModal(true)}
                    />

                    <GeralButton
                        variant='secondary'
                        value='+ Editar lavouras vinculadas'
                        onClick={() => setToggleCropsModal(true)}
                    />
                </div>
            </GeralModal>

            <GeralModal show={toggleCropsModal} setShow={setToggleCropsModal} title='Iniciar ano agrícola atual'>
                <div className={styles.modalDivider}></div>

                <CropsSelector
                    added={linkedCrops.filter((crop: any) => crop.is_subharvest == 0)}
                    available={availableCrops}
                    changeEvent={(e: ChangeEvent<HTMLInputElement>) => changeCrops(e)}
                />

                <div className={styles.modalActions}>
                    <GeralButton
                        variant='secondary'
                        type='button'
                        small
                        value='Adicionar'
                        onClick={() => {
                            linkCrops()
                        }}
                        disabled={disabled}
                    />
                    <GeralButton
                        variant='quaternary'
                        type='button'
                        small
                        value='Cancelar'
                        onClick={() => {
                            setToggleCropsModal(false)
                        }}
                    />
                </div>
            </GeralModal>

            <GeralModal show={toggleSubharvestModal} setShow={setToggleSubharvestModal} title='Adicionar safra'>
                <div className={styles.modalDivider}></div>

                <h3 style={{ margin: '20px 0' }}>Selecione quais das lavouras você deseja adicionar uma safra:</h3>

                {subharvests.map((item: any, index: number) => (
                    <div key={`subharvest-${index}-${item}`} className={styles.subharvestItem}>
                        <GeralInput
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                setSubharvests((prev: any) => {
                                    const newSubharvests = [...prev]
                                    newSubharvests[index].id = e.target.value
                                    return newSubharvests
                                })
                            }}
                            customClasses={[`${styles.lessPadding} ${styles.fullWidth}`]}
                            defaultValue={item.id}
                            type='select'
                            label='Lavoura'
                            name='subharvest_id'
                            required>
                            <option value='0'>Selecione</option>
                            {data &&
                                data.property?.crops
                                    .filter((item: any) => item.is_subharvest == 0)
                                    .map((crop: any) => (
                                        <option key={`crop-${crop.id}`} value={crop.id}>
                                            {crop.crop.name}
                                        </option>
                                    ))}
                        </GeralInput>

                        {/* <GeralInput
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                setSubharvests((prev: any) => {
                                    const newSubharvests = [...prev];
                                    newSubharvests[index].name = e.target.value;
                                    return newSubharvests;
                                });
                            }}
                            customClasses={[`${styles.lessPadding}`]}
                            defaultValue={item.name}
                            type='text'
                            label='Nome do safra'
                            name='subharvest_name'
                            placeholder='Digite aqui'
                            required
                        /> */}

                        <GeralButton
                            type='button'
                            variant='noStyle'
                            title='Remover safra'
                            onClick={() => {
                                setSubharvests(subharvests.filter((_: any, i: number) => i != index))
                            }}>
                            <IconifyIcon icon='ph:trash' />
                        </GeralButton>
                    </div>
                ))}
                <GeralButton
                    type='button'
                    variant='inlineGreen'
                    onClick={() => {
                        setSubharvests([...subharvests, { id: 0, name: '' }])
                    }}>
                    + Adicionar safra
                </GeralButton>

                <div className={styles.modalActions}>
                    <GeralButton
                        variant='secondary'
                        type='button'
                        small
                        value='Adicionar'
                        onClick={() => {
                            linkSubharvest()
                        }}
                        disabled={disabled}
                    />
                    <GeralButton
                        variant='quaternary'
                        type='button'
                        small
                        value='Cancelar'
                        onClick={() => {
                            setToggleSubharvestModal(false)
                        }}
                    />
                </div>
            </GeralModal>

            <GeralModal show={toggleActivityModal} setShow={setToggleActivityModal} title='Registrar atividade'>
                <ActivitySteps
                    id={id}
                    setShow={setToggleActivityModal}
                    cropsData={
                        cropsData
                            ? cropsData.linked_crops.map((crop: any) => ({
                                  id: crop.join_id,
                                  name: crop.name,
                                  area: crop.area,
                                  subharvest_name: crop.subharvest_name,
                              }))
                            : null
                    }
                    debouncedSearch={debouncedSearch}
                />
            </GeralModal>
        </>
    )
}

export default function Page({ params }: { params: { id: number } }) {
    return (
        <>
            <Breadcrumb
                links={[
                    {
                        name: `Propriedades`,
                        url: `/dashboard/propriedades`,
                    },
                ]}
            />

            <Suspense fallback={<ElementSkeleton />}>
                <GetData id={params.id} />
            </Suspense>
        </>
    )
}
