'use client'

import AdminProps from '@/@types/Admin'
import Property from '@/@types/Property'
import { Crop, CropJoin, Harvest } from '@/app/dashboard/properties/types'
import Loading from '@/app/loading'
import GeralButton from '@/components/buttons/GeralButton'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import GeralInput from '@/components/inputs/GeralInput'
import TableSkeleton from '@/components/loading/TableSkeleton'
import GeralModal from '@/components/modal/GeralModal'
import ActivitySteps from '@/components/register-property-activity/ActivitySteps'
import { useAdmin } from '@/context/AdminContext'
import { useSearch } from '@/context/SearchContext'
import { useSearchProperty } from '@/context/SearchPropertyContext'
import { useSubTab } from '@/context/SubtabContext'
import { useTab } from '@/context/TabContext'
import { useNotification } from '@/context/ToastContext'
import useOutsideClick from '@/hooks/useOutsideClick'
import useDebounce from '@/utils/debounce'
import getFetch from '@/utils/getFetch'
import axios from 'axios'
import Cookies from 'js-cookie'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useRouter } from 'nextjs-toploader/app'
import React, { ChangeEvent, FC, MouseEvent, Suspense, useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import cepeaIcon from '../../../../public/images/cepea.png'
import CepeaTable from './_components/CepeaTable'
import DropdownLinks from './_components/desktop/DropdownLinks'
import GridActions from './_components/desktop/GridActions'
import TabLinks from './_components/desktop/TabLinks'
import GridSelects from './_components/GridSelects'
import styles from './styles.module.scss'

interface FormProps {
    customClasses?: string[]
    placeholder?: string
    disabledFunctions?: boolean
}

const Form: FC<FormProps> = ({ customClasses = [], placeholder, disabledFunctions = false }) => {
    const { admin } = useAdmin()
    const currentPath = usePathname()

    const [open, setOpen] = useState(false)
    const [openCepea, setOpenCepea] = useState(false)
    const [openGround, setOpenGround] = useState(false)
    const [openSearch, setOpenSearch] = useState(false)

    const { data, isLoading } = useSWR(`/api/dashboard/get-itens/${admin.id}?filter=simple&with_join=true`, getFetch)

    const router = useRouter()

    const [properties, setProperties] = useState<Property[]>([])
    const [crops, setCrops] = useState<CropJoin[]>([])
    const [harvests, setHarvests] = useState<Harvest[]>([])
    const [admins, setAdmins] = useState<AdminProps[]>([])
    const [totalArea, setTotalArea] = useState(0)
    const [totalCrop, setTotalCrop] = useState(0)
    const { setToast } = useNotification()
    const [shouldPerformSearch, setShouldPerformSearch] = useState(false)
    const { searchOptions, setSearchOptions } = useSearchProperty()

    const [cropsGround, setCropsGround] = useState<Crop[]>([])
    const [isLoadingCropsGround, setIsLoadingCropsGround] = useState(false)
    const [propertyGroundId, setPropertyGroundId] = useState(0)

    const harvestCookie = Cookies.get('cookie_harvest')

    const [loadingCrops, setLoadingCrops] = useState(false)
    const [hideCrops, setHideCrops] = useState(true)

    const { setSelectedTab } = useTab()
    const { selectedSubTab, setSelectedSubTab } = useSubTab()

    const refInputSearch = useRef<HTMLInputElement>(null)

    const [search, setSearch] = useState('')
    const debouncedSearch = useDebounce(search, 500)
    const { setSearchPage } = useSearch()

    const [openRegister, setOpenRegister] = useState(false)

    const handleSubtab = async (e: MouseEvent<HTMLButtonElement>) => {
        if (currentPath.includes('dashboard/propriedades/lavoura')) {
            const tab = (e.target as HTMLButtonElement).getAttribute('data-id')

            if (tab && tab !== selectedSubTab) {
                setSelectedSubTab(tab)
            }
        }
    }

    const handleSetTab = async (
        event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
        checkPath: boolean = false,
    ) => {
        if (!checkPath || (checkPath && currentPath.includes('dashboard/propriedades/lavoura'))) {
            const key = (event.target as HTMLAnchorElement).getAttribute('data-key')
            setSelectedTab(key)
        }
    }

    const handleMultipleTabs = async (event: MouseEvent<HTMLButtonElement>) => {
        if (currentPath.includes('dashboard/propriedades/lavoura')) {
            await handleSubtab(event)
            await handleSetTab(event)
        }
    }

    function searchCrops() {
        setHideCrops(false)
        if (searchOptions.property_id !== 0 && searchOptions.harvest_id !== 0) {
            setLoadingCrops(true)
            axios
                .get(
                    `/api/properties/read-crops-by-property-and-harvest?property_id=${searchOptions.property_id}&harvest_id=${searchOptions.harvest_id}`,
                )
                .then((response) => {
                    if (response.data.joins) {
                        setCrops(response.data.joins)
                    }
                    setLoadingCrops(false)
                })
        } else if (searchOptions.property_id == 0 && searchOptions.harvest_id == 0) {
            searchCropItem()
        }
    }

    function searchCropsGround() {
        if (propertyGroundId == 0) {
            setCropsGround([])
            return
        }
        setIsLoadingCropsGround(true)
        axios
            .get(`/api/crops/list/${admin.id}?property_id=${propertyGroundId}`)
            .then((response) => {
                if (response.data.crops) {
                    setCropsGround(response.data.crops)
                }
                setIsLoadingCropsGround(false)
            })
            .catch(() => {
                alert('Erro ao buscar as lavouras')
                setIsLoadingCropsGround(false)
            })
    }

    function searchCropItem() {
        const pathExplode = currentPath.split('/')
        const propertyCropJoin = pathExplode[pathExplode.length - 1]

        if (
            propertyCropJoin !== 'lavoura' &&
            (propertyCropJoin !== searchOptions.crop_id || searchOptions.property_id == 0)
        ) {
            const propertyId = parseInt(propertyCropJoin)
            axios.get(`/api/properties/read-property-crop-join?join_id=${propertyId}`).then((response) => {
                if (response.data.property_crop_join) {
                    setShouldPerformSearch(true)
                    setSearchOptions({
                        ...searchOptions,
                        property_id: response.data.property_crop_join.property_id,
                        crop_id: response.data.property_crop_join.id,
                        harvest_id: response.data.property_crop_join.harvest_id,
                    })
                }
            })
        }
    }

    function containsString(exp: string) {
        const regex = /mapa-lavoura|informacoes-safra|dados-manejo|monitoramento/
        return regex.test(exp)
    }

    useEffect(() => {
        searchCropsGround()
    }, [propertyGroundId])

    useEffect(() => {
        setSearchPage(debouncedSearch)
    }, [debouncedSearch, setSearchPage])

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSearchOptions({
            ...searchOptions,
            [e.target.name]: e.target.value,
        })
        setShouldPerformSearch(true)
    }

    useEffect(() => {
        if (searchOptions.property_id !== 0 && searchOptions.property_id !== propertyGroundId) {
            setPropertyGroundId(searchOptions.property_id)
        }

        if (searchOptions.harvest_id == 0) {
            if (harvestCookie !== '' && harvestCookie !== undefined && harvestCookie != null) {
                setSearchOptions({
                    ...searchOptions,
                    harvest_id: parseInt(harvestCookie),
                })
            } else if (data && data.last_harvest_id) {
                setSearchOptions({
                    ...searchOptions,
                    harvest_id: data.last_harvest_id,
                })
            }
        }
        if (shouldPerformSearch) {
            if (
                searchOptions.property_id !== 0 &&
                searchOptions.crop_id !== 0 &&
                searchOptions.harvest_id !== 0 &&
                crops[0] &&
                crops[0].property_id == searchOptions.property_id &&
                !currentPath.includes(`/dashboard/propriedades/lavoura/${searchOptions.crop_id}`)
            ) {
                setToast({ text: `Buscando informações`, state: 'loading' })
                axios
                    .get(`/api/properties/read-property-crop-join?join_id=${searchOptions.crop_id}`)
                    .then((response) => {
                        if (response.data.property_crop_join) {
                            setToast({ text: `Informações encontradas`, state: 'success' })

                            const search = window.location.search
                            router.push(
                                `/dashboard/propriedades/lavoura/${response.data.property_crop_join.id}${
                                    containsString(search) ? `${search}` : ''
                                }`,
                            )
                        } else if (!response.data.property_crop_join) {
                            setToast({ text: `Nenhuma informação encontrada`, state: 'warning' })
                        } else {
                            setToast({ text: `Nenhuma informação encontrada`, state: 'warning' })
                        }
                    })
            } else {
                searchCrops()
            }
            // Redefina o flag após a busca
            setShouldPerformSearch(false)
        }
    }, [searchOptions])

    useEffect(() => {
        if (data) {
            setProperties(data.properties)
            // setCrops(data.crops);
            setHarvests(data.harvests)
            setAdmins(data.admins)
            setTotalArea(data.total_area)
            setTotalCrop(data.crops.length)

            if (searchOptions.harvest_id == 0) {
                if (harvestCookie !== '' && harvestCookie !== undefined && harvestCookie != null) {
                    setSearchOptions({
                        ...searchOptions,
                        harvest_id: parseInt(harvestCookie),
                    })
                } else if (data.last_harvest_id) {
                    setSearchOptions({
                        ...searchOptions,
                        harvest_id: data.last_harvest_id,
                    })
                }
            }

            if (searchOptions.property_id == 0 && data.properties.length == 1) {
                setSearchOptions({
                    ...searchOptions,
                    crop_id: 0,
                    property_id: data.properties[0].id,
                })
                setShouldPerformSearch(true)
            }
        }
    }, [data])

    const checkProperty = () => {
        if (!currentPath.includes('/dashboard/propriedades/lavoura/')) {
            if (!data || data.properties.length !== 1) {
                setCrops([])
            }

            if (currentPath.includes('/dashboard/propriedades/')) {
                const explodePath = currentPath.split('/')

                if (explodePath.length > 3) {
                    const propertyId = parseInt(explodePath[explodePath.length - 1])
                    if (searchOptions.property_id !== propertyId) {
                        setSearchOptions({
                            ...searchOptions,
                            property_id: propertyId,
                            crop_id: 0,
                        })

                        setShouldPerformSearch(true)
                    }
                }
            } else {
                if (!data || data.properties.length > 1 || data.properties.length == 0) {
                    setSearchOptions({
                        property_id: 0,
                        crop_id: 0,
                        harvest_id: 0,
                    })

                    setPropertyGroundId(0)
                } else if (data.properties.length == 1) {
                    setSearchOptions({
                        property_id: data.properties[0].id,
                        crop_id: 0,
                        harvest_id: 0,
                    })
                    setPropertyGroundId(data.properties[0].id)
                }
            }
        }
    }

    useEffect(() => {
        checkProperty()
        searchCrops()
        setShouldPerformSearch(false)
    }, [])

    useEffect(() => {
        if (currentPath.includes('/dashboard/propriedades/lavoura/')) {
            searchCropItem()
        }

        checkProperty()
    }, [currentPath])

    const ref = useOutsideClick(() => {
        setOpen(false)
    }, 'exceptionOutside')

    if (isLoading) {
        return <Loading />
    }

    return (
        <>
            <Suspense fallback={<TableSkeleton />}>
                <div
                    className={`${styles.form} ${styles.fixedFormGrid}  ${customClasses ? customClasses?.join(' ') : ''}`}>
                    <GridSelects
                        searchOptions={searchOptions}
                        handleInputChange={handleInputChange}
                        properties={properties}
                        harvests={harvests}
                        data={data}
                        loadingCrops={loadingCrops}
                        crops={crops}
                        hideCrops={hideCrops}
                    />

                    <div className={styles.gridActions}>
                        <div className={styles.buttonAction}>
                            <GeralButton
                                variant='tertiary'
                                small
                                value='+ Registrar atividade'
                                onClick={() => {
                                    if (searchOptions.property_id == 0 || searchOptions.harvest_id == 0) {
                                        setToast({
                                            text: `Selecione uma propriedade e um ano agrícola`,
                                            state: 'warning',
                                        })
                                    } else {
                                        setOpenRegister(true)
                                    }
                                }}
                            />
                        </div>

                        <div className={styles.buttonAction}>
                            <GeralButton
                                customClasses={[styles.cepeaButton]}
                                variant='primary'
                                small
                                onClick={() => {
                                    setOpenCepea(true)
                                }}>
                                <Image
                                    src={cepeaIcon}
                                    className={styles.cepeaIcon}
                                    alt='CEPEA'
                                    width={60}
                                    height={15}
                                />
                            </GeralButton>
                        </div>
                        {!disabledFunctions && (
                            <div className={styles.buttonAction}>
                                <div className={`${styles.button} ${openSearch ? styles.open : ''}`}>
                                    <GeralInput
                                        variant='inline'
                                        placeholder={placeholder ?? 'Pesquisar'}
                                        name='header_search_mobile'
                                        defaultValue={search}
                                        type='text'
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                                        ref={refInputSearch}
                                    />
                                    <button
                                        onClick={() => {
                                            setOpenSearch(!openSearch)
                                            if (refInputSearch && refInputSearch.current) {
                                                refInputSearch.current.focus()
                                            }
                                        }}>
                                        <IconifyIcon icon='mingcute:search-line' className={styles.icon} />
                                    </button>
                                </div>
                            </div>
                        )}
                        <div className={styles.buttonAction}>
                            <button
                                ref={ref}
                                className={`${styles.button} ${styles.buttonGreen}`}
                                onClick={() => {
                                    setOpen(!open)
                                }}>
                                <IconifyIcon icon='ph:plus' className={styles.icon} />
                            </button>

                            <DropdownLinks open={open} admin={admin} />
                        </div>
                    </div>
                </div>
                <div className={styles.formFooter}>
                    <TabLinks
                        handleMultipleTabs={handleMultipleTabs}
                        handleSetTab={handleSetTab}
                        setOpenGround={setOpenGround}
                    />

                    <GridActions
                        admins={admins}
                        totalArea={totalArea}
                        totalCrop={totalCrop}
                        properties={properties}
                        harvests={harvests}
                        data={data}
                        crops={crops}
                        searchOptions={searchOptions}
                        setSearchOptions={setSearchOptions}
                    />
                </div>

                {openRegister && (
                    <GeralModal show={openRegister} setShow={setOpenRegister} title='Registrar atividade'>
                        <ActivitySteps
                            id={searchOptions.property_id}
                            setShow={setOpenRegister}
                            harvest_id={searchOptions.harvest_id}
                            cropsData={crops
                                .filter((crop) => crop.property_id == searchOptions.property_id)
                                .map((crop) => ({
                                    id: crop.id,
                                    name: crop.crop.name,
                                    area: crop.crop.area,
                                    subharvest_name: crop.subharvest_name,
                                }))}
                            debouncedSearch={debouncedSearch}
                        />
                    </GeralModal>
                )}

                {openCepea && (
                    <GeralModal show={openCepea} setShow={setOpenCepea} title='CEPEA'>
                        <CepeaTable />
                    </GeralModal>
                )}

                {openGround && (
                    <GeralModal show={openGround} setShow={setOpenGround} title='Solos'>
                        <div className={`${styles.groundSelect} gridSelect`}>
                            <GeralInput
                                label='Propriedade'
                                name='property_id'
                                defaultValue={propertyGroundId}
                                selectPlaceholder='Selecione a propriedade'
                                onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                                    setPropertyGroundId(parseInt(e.target.value))
                                }}
                                filterInitialValue={true}>
                                <option value={0} selected={searchOptions.property_id == 0}>
                                    Selecione a propriedade
                                </option>

                                {properties.map((property) => (
                                    <option
                                        key={property.id}
                                        value={property.id}
                                        selected={property.id == searchOptions.property_id}>
                                        {property.name}
                                    </option>
                                ))}
                            </GeralInput>

                            {isLoadingCropsGround ? (
                                <div>
                                    <IconifyIcon icon='line-md:loading-loop' />
                                </div>
                            ) : cropsGround.length > 0 ? (
                                <GeralInput
                                    label='Lavoura'
                                    name='crop_id'
                                    selectPlaceholder='Selecione a lavoura'
                                    onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                                        router.push(`/dashboard/lavoura?id=${parseInt(e.target.value)}`)
                                    }}>
                                    <option value={0}>Selecione a lavoura</option>

                                    {cropsGround.map((crop) => (
                                        <option key={crop.id} value={crop.id}>
                                            {crop.name}
                                        </option>
                                    ))}
                                </GeralInput>
                            ) : (
                                propertyGroundId > 0 && <p>Não há lavouras para essa propriedade</p>
                            )}
                        </div>
                    </GeralModal>
                )}
            </Suspense>
        </>
    )
}

Form.displayName = 'Dashboard Form'

export default Form
