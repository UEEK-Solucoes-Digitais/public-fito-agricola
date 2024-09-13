'use client'

import GeralBox from '@/components/box/GeralBox'
import GeralButton from '@/components/buttons/GeralButton'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import GeralInput from '@/components/inputs/GeralInput'
import GeralModal from '@/components/modal/GeralModal'
import { MapConst } from '@/consts/MapConst'
import { useAdmin } from '@/context/AdminContext'
import { useNotification } from '@/context/ToastContext'
import { formatNumberToBR } from '@/utils/formats'
import getFetch from '@/utils/getFetch'
import { getMetricUnity } from '@/utils/getMetricUnity'
import WriteLog from '@/utils/logger'
import updateStatus from '@/utils/updateStatus'
import { DrawingManagerF, GoogleMap, MarkerF, PolygonF, useLoadScript } from '@react-google-maps/api'
import axios from 'axios'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'nextjs-toploader/app'
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete'
import Loading from '../../loading'
import styles from '../../users/[id]/styles.module.scss'
import { FileInput } from './custom-file-container/FileInput'
import { FileItem } from './custom-file-container/FileItem'
import { CropData, FormDataCustom, LatLng } from './types'

const FetchCrop = (id: string | null, admin_id: number) => {
    if (id == null || !id) {
        return {
            data: null as CropData | null,
            isLoading: false,
            isError: false,
        }
    }

    const { data, error, isLoading, mutate } = useSWR(`/api/crops/read/${id}?admin_id=${admin_id}`, getFetch)

    return {
        data,
        isLoading,
        isError: error,
        mutate,
    }
}

const getCurrentDate = () => {
    const today = new Date()
    const day = String(today.getDate()).padStart(2, '0')
    const month = String(today.getMonth() + 1).padStart(2, '0') // January is 0!
    const year = today.getFullYear()

    return `${day}/${month}/${year}`
}

interface PropertyOption {
    value: number
    label: string
}

interface CropFile {
    id: number
    name: string
    path: File | null | string
    clay: number
    base_saturation: number
    organic_material: number
    unit_ca: number
    unit_al: number
    unit_k: number
    unit_mg: number
    unit_p: number
}

export default function Page() {
    const { admin } = useAdmin()
    const { setToast } = useNotification()
    const searchParams = useSearchParams()
    const editing = searchParams.get('editing') == 'true' || searchParams.get('id') == null
    const [showKMFileModal, setShowKMLFileModal] = useState(false)
    const [showNewFileModal, setShowNewFileModal] = useState(false)
    const [fileFormState, setFileFormState] = useState<CropFile>({
        id: 0,
        name: ` - ${getCurrentDate()}`,
        path: null,
        clay: 0,
        base_saturation: 0,
        organic_material: 0,
        unit_ca: 0,
        unit_al: 0,
        unit_k: 0,
        unit_mg: 0,
        unit_p: 0,
    })
    const [isDrawingMap, setIsDrawingMap] = useState(false)
    const [userPosition, setUserPosition] = useState<LatLng | null>(null)

    const [showDeleteCropModal, setShowDeleteCropModal] = useState(false)
    const [deleteName, setDeleteName] = useState('')
    const [deleteId, setDeleteId] = useState(0)
    const router = useRouter()

    const [warnModalText, setWarnModalText] = useState('')
    const [showWarnModal, setShowWarnModal] = useState(false)

    // Report file list

    const [reportFiles, setReportFiles] = useState<CropFile[]>([])

    // Store Polygon path in state
    const [path, setPath] = useState<LatLng[]>([])
    const [editMode, setEditMode] = useState(editing)
    const [formData, setFormData] = useState<FormDataCustom>({
        id: 0,
        admin_id: admin.id,
        name: '',
        area: '',
        city: '',

        kml_file: undefined,
        draw_area: [],
        property_id: null,
    })

    const { data, isLoading, isError, mutate } = FetchCrop(searchParams.get('id'), admin.id)
    const {
        data: dataProperty,
        isLoading: isLoadingProperty,
        error,
    } = useSWR(`/api/properties/list/${admin.id}`, getFetch)
    const [propertyOptions, setPropertyOptions] = useState<PropertyOption[]>([])

    useEffect(() => {
        if (data && !isLoading && !isError && data.crop) {
            setFormData({
                id: data.crop.id,
                name: data.crop.name,
                city: data.crop.city,
                area: formatNumberToBR(data.crop.area),
                kml_file: data.crop.kml_file,
                property_id: data.crop.property_id,
                admin_id: admin.id,
                draw_area: data.crop.draw_area.split('|||'),
            })

            if (data.crop.files) {
                const files = data.crop.files.map((file: any) => {
                    return {
                        id: file.id,
                        name: file.name,
                        path: file.path,
                        clay: file.clay,
                        base_saturation: file.base_saturation,
                        organic_material: file.organic_material,
                        unit_ca: file.unit_ca,
                        unit_al: file.unit_al,
                        unit_k: file.unit_k,
                        unit_mg: file.unit_mg,
                        unit_p: file.unit_p,
                    }
                })

                setReportFiles(files)
            }
        } else if (isError && isError.response.status == 409) {
            setToast({ text: 'Você não tem permissão para acessar essa lavoura', state: 'danger' })

            setTimeout(() => {
                router.push('/dashboard/lavouras')
            }, 2000)
        }
    }, [data, isLoading, isError, admin.id])

    useEffect(() => {
        if (dataProperty) {
            const options = dataProperty.properties.map((property: any) => {
                return {
                    value: property.id,
                    label: property.name,
                }
            })

            setPropertyOptions(options)
        }
    }, [dataProperty])

    useEffect(() => {
        setPath([])

        formData.draw_area.forEach((item) => {
            const [lat, lng] = item.split(',')

            if (isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
                console.log(item, lat, lng)
            }

            if (isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
                return
            }

            setPath((prevPath) => [...prevPath, { lat: parseFloat(lat), lng: parseFloat(lng) }])
        })
        if (searchParams.get('id')) {
            centerMap()
        }
    }, [formData])

    useEffect(() => {
        if (typeof error !== 'undefined') {
            WriteLog([error, isError], 'error')

            if (process.env.NEXT_PUBLIC_SHOW_TOAST_FETCH_ERROR == 'true') {
                setToast({ text: `Falha ao obter dados`, state: 'danger' })
            }
        }
    }, [isError, error])

    const handleUserInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target

        let fileValue: File | null = null

        if (e.target instanceof HTMLInputElement && e.target.type == 'file') {
            fileValue = e.target.files ? e.target.files[0] : null

            if (!fileValue) {
                return
            }

            if (fileValue && fileValue?.name?.split('.')?.pop()?.toLowerCase() !== 'kml') {
                setToast({ text: 'O arquivo deve ser um KML', state: 'danger' })
                return
            }
        }

        // let finalValueInput = name == 'area' ? formatNumberToBR(value) : value;

        setFormData((prevData) => ({
            ...prevData,
            [name]: fileValue || value,
        }))
    }

    const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value, files } = e.target
        setFileFormState((prev) => ({
            ...prev,
            [name]: files ? files[0] : value,
        }))
    }

    const handleFileForm = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        const { name, path } = fileFormState

        if (name && path) {
            const files = reportFiles
            reportFiles.push(fileFormState)
            setReportFiles(files)

            setShowNewFileModal(false)
            setFileFormState({
                id: 0,
                name: ` - ${getCurrentDate()}`,
                path: null,
                clay: 0,
                base_saturation: 0,
                organic_material: 0,
                unit_ca: 0,
                unit_al: 0,
                unit_k: 0,
                unit_mg: 0,
                unit_p: 0,
            })
        } else {
            alert('Please provide both a name and a file.')
        }
    }

    const handleEditButtonClick = () => {
        if (!editMode) {
            setEditMode(true)
            return
        }

        setToast({ text: formData.id == 0 ? 'Criando lavoura' : `Atualizando lavoura`, state: 'loading' })

        if (formData.name == '') {
            setToast({ text: 'O campo nome é obrigatório', state: 'warning' })
            return
        }

        if (formData.area == '') {
            setToast({ text: 'O campo área é obrigatório', state: 'warning' })
            return
        }

        if (
            admin.access_level !== 1 &&
            (!formData.property_id || formData.property_id == 0 || formData.property_id == null)
        ) {
            setToast({ text: 'O campo propriedade é obrigatório', state: 'warning' })
            return
        }

        const formDataExample = new FormData()
        formDataExample.append('id', String(formData.id))
        formDataExample.append('name', formData.name)
        formDataExample.append('city', formData.city)
        formDataExample.append('area', formData.area)

        // formDataExample.append('clay', String(formData.clay));
        // formDataExample.append('organic_material', String(formData.organic_material));
        // formDataExample.append('base_saturation', String(formData.base_saturation));
        // formDataExample.append('unit_ca', String(formData.unit_ca));
        // formDataExample.append('unit_mg', String(formData.unit_mg));
        // formDataExample.append('unit_al', String(formData.unit_al));
        // formDataExample.append('unit_k', String(formData.unit_k));
        // formDataExample.append('unit_p', String(formData.unit_p));

        formDataExample.append('kml_file', formData.kml_file instanceof File ? (formData.kml_file as File) : '')
        formDataExample.append('admin_id', String(admin.id))
        formDataExample.append('pathToUpload', 'crops')

        // for(const file of Object.entries(reportFiles)){
        //     if(file[1] instanceof File){
        //         formDataExample.append(`report_files[${file[0]}]`, file[1]);
        //     }
        // }

        let index = 0

        for (const file of reportFiles) {
            if (file.path instanceof File) {
                formDataExample.append(`report_files_names[${index}]`, file.name)
                formDataExample.append(`report_files[${index}]`, file.path)
                formDataExample.append(`request_files_clay[${index}]`, file.clay.toString())
                formDataExample.append(`request_files_organic_material[${index}]`, file.organic_material.toString())
                formDataExample.append(`request_files_base_saturation[${index}]`, file.base_saturation.toString())
                formDataExample.append(`request_files_unit_ca[${index}]`, file.unit_ca.toString())
                formDataExample.append(`request_files_unit_mg[${index}]`, file.unit_mg.toString())
                formDataExample.append(`request_files_unit_al[${index}]`, file.unit_al.toString())
                formDataExample.append(`request_files_unit_k[${index}]`, file.unit_k.toString())
                formDataExample.append(`request_files_unit_p[${index}]`, file.unit_p.toString())
                index++
            }
        }

        if (data && data.crop) {
            if (data.crop.draw_area !== formData.draw_area.join('|||') && !(formData.kml_file instanceof File)) {
                formDataExample.append('draw_area', formData.draw_area.join('|||'))
            }
        } else if (formData.draw_area.length > 0) {
            formDataExample.append('draw_area', formData.draw_area.join('|||'))
        }
        formDataExample.append('property_id', String(formData.property_id))

        try {
            axios
                .post('/api/crops/form', formDataExample, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                })
                .then((res) => {
                    if (res.status == 200) {
                        setEditMode(false)

                        setToast({ text: 'Operação realizada com sucesso', state: 'success' })

                        if (formData.id == 0 || (!res.data.has_seed && formData.id !== 0)) {
                            setTimeout(() => {
                                router.push('/dashboard/lavouras')
                            }, 1500)
                        } else {
                            // if(){
                            //     setFormData({
                            //         id: res.data.crop.id,
                            //         name: res.data.crop.name,
                            //         city: res.data.crop.city,

                            //         clay: res.data.crop.clay,
                            //         organic_material: res.data.crop.organic_material,
                            //         base_saturation: res.data.crop.base_saturation,
                            //         unit_ca: res.data.crop.unit_ca,
                            //         unit_al: res.data.crop.unit_al,
                            //         unit_mg: res.data.crop.unit_mg,
                            //         unit_k: res.data.crop.unit_k,
                            //         unit_p: res.data.crop.unit_p,

                            //         area: formatNumberToBR(res.data.crop.area),
                            //         kml_file: res.data.crop.kml_file,
                            //         property_id: res.data.crop.property_id,
                            //         admin_id: admin.id,
                            //         draw_area: res.data.crop.draw_area ? res.data.crop.draw_area.split('|||') : [],
                            //     });
                            // }else{
                            if (mutate) {
                                mutate()
                            }
                            // }
                        }

                        if (res.data.has_seed) {
                            setWarnModalText(res.data.text_seeds)
                            setShowWarnModal(true)
                        }
                    } else {
                        setToast({ text: 'Não foi possível completar a operação no momento', state: 'danger' })
                    }
                })
                .catch((error: any) => {
                    throw error
                })
        } catch (error: any) {
            const message = error?.response?.data?.msg ?? 'Não foi possível completar a operação no momento'
            setToast({
                text: message,
                state: 'danger',
            })
        }
    }

    const libraries = useMemo(() => ['places', 'drawing'], [])

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY as string,
        libraries: libraries as any,
    })

    const [lat, setLat] = useState(MapConst.DEFAULT_LATITUDE)
    const [lng, setLng] = useState(MapConst.DEFAULT_LONGITUDE)

    const mapCenter = useMemo(() => ({ lat, lng }), [lat, lng])

    const mapOptions = useMemo<google.maps.MapOptions>(
        () => ({
            // disableDefaultUI: true,
            // clickableIcons: true,
            // scrollwheel: false,
            mapTypeControl: false,
            fullscreenControl: false,
            streetViewControl: false,
            mapTypeId: 'satellite',
        }),
        [],
    )

    const PlacesAutocomplete = ({ onAddressSelect }: { onAddressSelect?: (address: string) => void }) => {
        const {
            value,
            suggestions: { status, data },
            setValue,
            clearSuggestions,
        } = usePlacesAutocomplete({
            requestOptions: { componentRestrictions: { country: 'br' } },
            debounce: 300,
            cache: 86400,
        })

        const renderSuggestions = () => {
            return data.map((suggestion) => {
                const {
                    place_id,
                    structured_formatting: { main_text, secondary_text },
                    description,
                } = suggestion

                return (
                    <li
                        key={place_id}
                        onClick={() => {
                            setValue(description, false)
                            clearSuggestions()
                            onAddressSelect && onAddressSelect(description)
                        }}>
                        <strong>{main_text}</strong> <small>{secondary_text}</small>
                    </li>
                )
            })
        }

        return (
            <div className={styles.autocompleteWrapper}>
                <GeralInput
                    defaultValue={value}
                    type='text'
                    variant='inline'
                    label=''
                    customClasses={[`${styles.inputAddress}`]}
                    placeholder='Digite o endereço para pesquisar no mapa'
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
                />

                {status == 'OK' && <ul className={styles.suggestionWrapper}>{renderSuggestions()}</ul>}
            </div>
        )
    }

    const getFileString = (fileItem: string | File | undefined | null) => {
        if (fileItem == undefined || fileItem == null) return 'Nome do arquivo'

        if (typeof fileItem == 'string') {
            return fileItem
        } else {
            return fileItem.name
        }
    }

    const cleanMap = () => {
        setPath([])

        drawingManagerRef.current?.setDrawingMode(google.maps.drawing.OverlayType.POLYGON)
    }

    const coordinateFuncsToCoordinates = (coordinates: google.maps.LatLng[]) =>
        coordinates.map(({ lat, lng }) => ({
            lat: lat(),
            lng: lng(),
        }))

    const addPath = (evt: any) => {
        const { overlay } = evt

        if (overlay && window !== undefined) {
            window.google.maps.event.clearInstanceListeners(overlay)
            overlay.setMap(null)

            const typedOverlay = overlay as google.maps.Polygon
            const coordinateFuncs: google.maps.LatLng[] = typedOverlay.getPath().getArray()

            const coordinates = coordinateFuncsToCoordinates(coordinateFuncs)

            const coordinatesArray = coordinates.map((item) => [item.lat, item.lng])

            setFormData((prevData) => ({
                ...prevData,
                draw_area: coordinatesArray.map((item) => item.join(',')),
            }))

            drawingManagerRef.current?.setDrawingMode(null)

            setPath(coordinates)
        }
    }

    const centerMap = () => {
        if (formData.draw_area.length > 0) {
            let totalLat = 0
            let totalLng = 0
            const numPoints = formData.draw_area.length

            formData.draw_area.forEach((item) => {
                const [lat, lng] = item.split(',')

                if (isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
                    return
                }

                totalLat += parseFloat(lat)
                totalLng += parseFloat(lng)
            })

            const centerLat = totalLat / numPoints
            const centerLng = totalLng / numPoints

            setLat(centerLat)
            setLng(centerLng)
        }
    }

    // Define refs for Polygon instance and listeners
    const polygonRef = useRef<google.maps.Polygon | null>(null)
    const listenersRef = useRef<google.maps.MapsEventListener[]>([])
    const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null)

    const onEdit = useCallback(() => {
        const drawArea: number[][] = []
        if (polygonRef.current) {
            const nextPath = polygonRef.current
                .getPath()
                .getArray()
                .map((latLng) => {
                    drawArea.push([latLng.lat(), latLng.lng()])
                    return { lat: latLng.lat(), lng: latLng.lng() }
                })
            setPath(nextPath)
        }

        setFormData((prevData) => ({
            ...prevData,
            draw_area: drawArea.map((item) => item.join(',')),
        }))
    }, [setPath])

    const mapRef = useRef<google.maps.Map | null>(null)

    const onLoadMap = useCallback((map: google.maps.Map) => {
        mapRef.current = map

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((geoPos: GeolocationPosition) => {
                const pos = {
                    lat: geoPos.coords.latitude,
                    lng: geoPos.coords.longitude,
                }

                // if(!searchParams.get("id")){
                //     map.setCenter(pos);
                // }

                setUserPosition(pos)
            })
        }
    }, [])

    const onLoadPolygon = useCallback(
        (polygon: google.maps.Polygon) => {
            polygonRef.current = polygon
            const path = polygon.getPath()
            if (path) {
                listenersRef.current.push(
                    path.addListener('set_at', onEdit),
                    path.addListener('insert_at', onEdit),
                    path.addListener('remove_at', onEdit),
                )
            }
        },
        [onEdit],
    )

    const deleteCrop = async () => {
        try {
            setToast({ text: `Excluindo lavoura ${deleteName}`, state: 'loading' })

            await updateStatus('/api/crops/delete', admin.id, deleteId, 0).then(() => {
                setToast({
                    text: 'Lavoura excluida com sucesso. Você será redirecionado em alguns segundos',
                    state: 'success',
                })

                setTimeout(() => {
                    router.push('/dashboard/lavouras')
                }, 2000)
            })
        } catch (error: any) {
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }

    const deleteFile = async (name: string, file: File | string | null, id: number | null) => {
        if (confirm(`Têm certeza que deseja excluir o arquivo ${name}?`)) {
            if (!(file instanceof File) && id != null) {
                try {
                    setToast({ text: `Excluindo arquivo ${name}`, state: 'loading' })

                    await updateStatus('/api/crops/deleteFile', admin.id, id, 0)

                    setToast({
                        text: 'Arquivo excluido com sucesso.',
                        state: 'success',
                    })

                    if (mutate) {
                        mutate()
                    }
                } catch (error: any) {
                    WriteLog(error, 'error')
                    const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
                    setToast({ text: message, state: 'danger' })
                }
            } else {
                const files = reportFiles.filter((file) => file.name !== name)
                setReportFiles(files)
            }
        }
    }

    const updateCenter = () => {
        if (mapRef.current) {
            const newCenter = mapRef.current.getCenter()
            if (newCenter) {
                setLat(newCenter.lat())
                setLng(newCenter.lng())
            }
        }
    }

    if (isLoading || isLoadingProperty) return <Loading />

    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ease: 'easeIn' }}>
                <Link href='/dashboard/lavouras' className={styles.backBtn}>
                    <IconifyIcon icon='ph:arrow-left' />
                    Lavouras
                </Link>

                <GeralBox variant='page' customClasses={[styles.pageBox]}>
                    <div className={styles.userGridWrapper}>
                        <div className={styles.userGridHeader}>
                            <h1>{formData.name !== '' ? formData.name : 'Adicionar lavoura'}</h1>

                            <div className={styles.headerActions}>
                                <div className={styles.headerButtons}>
                                    <GeralButton
                                        variant={editMode ? 'secondary' : 'gray'}
                                        round
                                        small
                                        smallIcon
                                        onClick={handleEditButtonClick}>
                                        {editMode ? (
                                            <IconifyIcon icon='iconamoon:check-bold' />
                                        ) : (
                                            <IconifyIcon icon='ph:pencil-simple' />
                                        )}
                                    </GeralButton>

                                    {formData.id !== 0 ? (
                                        <GeralButton
                                            variant='delete'
                                            round
                                            small
                                            smallIcon
                                            onClick={() => {
                                                setDeleteName(formData.name)
                                                setDeleteId(formData.id)
                                                setShowDeleteCropModal(!showDeleteCropModal)
                                            }}>
                                            <IconifyIcon icon='prime:trash' />
                                        </GeralButton>
                                    ) : (
                                        ''
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className={`${styles.userGridContent} ${styles.cropContent} `}>
                            <div className={styles.geralInfo}>
                                <p>Informações gerais</p>

                                <div className={`${styles.geralInfoFrm} ${styles.noBorder} `}>
                                    <GeralInput
                                        readOnly={!editMode}
                                        name='name'
                                        type='text'
                                        variant='inline'
                                        label='Nome'
                                        defaultValue={formData.name}
                                        placeholder='Nome da lavoura'
                                        onChange={handleUserInputChange}
                                    />
                                    <div className={styles.withLegend}>
                                        <GeralInput
                                            readOnly={!editMode}
                                            name='area'
                                            type='text'
                                            variant='inline'
                                            label={`Área (${getMetricUnity()})`}
                                            defaultValue={formData.area}
                                            placeholder='00'
                                            onChange={handleUserInputChange}
                                            maskVariant='price'
                                        />
                                        <span>{getMetricUnity()}</span>
                                    </div>

                                    {propertyOptions.length == 0 ? (
                                        isLoadingProperty ? (
                                            <div>
                                                <IconifyIcon icon='line-md:loading-loop' />
                                            </div>
                                        ) : (
                                            <p>Nenhuma propriedade</p>
                                        )
                                    ) : (
                                        <GeralInput
                                            readOnly={!editMode}
                                            defaultValue={formData.property_id == null ? 0 : formData.property_id}
                                            label='Propriedade'
                                            variant='inline'
                                            name='property_id'
                                            type='select'
                                            onChange={handleUserInputChange}
                                            required
                                            filterInitialValue={true}>
                                            <option value='0'>Selecione</option>

                                            {propertyOptions.map((option) => (
                                                <option key={`option-${option.value}`} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </GeralInput>
                                    )}

                                    <GeralInput
                                        readOnly={!editMode}
                                        name='city'
                                        type='text'
                                        variant='inline'
                                        label='Município'
                                        defaultValue={formData.city}
                                        placeholder='Digite aqui'
                                        onChange={handleUserInputChange}
                                    />
                                </div>
                            </div>

                            <div className={styles.mapBox}>
                                <div className={styles.mapActions}>
                                    <p>Mapa</p>

                                    {editMode ? (
                                        <>
                                            {!isDrawingMap ? (
                                                <GeralButton
                                                    variant='secondary'
                                                    value={`${
                                                        formData.kml_file instanceof File
                                                            ? 'Alterar KML'
                                                            : 'Adicionar mapa'
                                                    }`}
                                                    type='button'
                                                    smaller
                                                    onClick={() => setShowKMLFileModal(!showKMFileModal)}
                                                />
                                            ) : (
                                                ''
                                            )}

                                            {formData.kml_file instanceof File ? (
                                                ''
                                            ) : (
                                                <>
                                                    {isDrawingMap ? (
                                                        <>
                                                            {/* {path.length == 0 ? (
                                                                // <GeralButton
                                                                //     variant='secondary'
                                                                //     value='Adicionar forma'
                                                                //     type='button'
                                                                //     smaller
                                                                //     onClick={() => addPath}
                                                                // />
                                                                ) : (
                                                                    ''
                                                                    )} */}
                                                            {/* <GeralButton
                                                                variant='secondary'
                                                                value='Parar de desenhar'
                                                                type='button'
                                                                smaller
                                                                onClick={() => {}}
                                                            /> */}

                                                            <GeralButton
                                                                variant='delete'
                                                                value='Limpar mapa'
                                                                type='button'
                                                                smaller
                                                                onClick={() => cleanMap()}
                                                            />
                                                        </>
                                                    ) : (
                                                        ''
                                                    )}
                                                    <GeralButton
                                                        variant='tertiary'
                                                        value={`${isDrawingMap ? 'Cancelar' : 'Desenhar mapa'}`}
                                                        type='button'
                                                        smaller
                                                        onClick={() => {
                                                            setIsDrawingMap(!isDrawingMap)
                                                            // setDrawingMode(
                                                            //     isDrawingMap
                                                            //         ? null
                                                            //         : google.maps.drawing.OverlayType.POLYGON,
                                                            // );

                                                            // drawingManagerRef.current?.setDrawingMode(
                                                            //     isDrawingMap
                                                            //         ? null
                                                            //         : google.maps.drawing.OverlayType.POLYGON,
                                                            // );
                                                        }}
                                                    />
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        ''
                                    )}
                                </div>

                                {formData.kml_file instanceof File && (
                                    <div className={styles.mapFilePreview}>
                                        <p>Arquivo KML inserido: {formData.kml_file?.name}</p>

                                        <GeralButton
                                            variant='delete'
                                            round
                                            small
                                            smallIcon
                                            onClick={() => {
                                                setFormData((prevData) => ({
                                                    ...prevData,
                                                    kml_file: undefined,
                                                }))
                                            }}>
                                            <IconifyIcon icon='prime:trash' />
                                        </GeralButton>
                                    </div>
                                )}

                                {(formData.draw_area.length == 0 && editMode && typeof formData.kml_file == 'string') ||
                                (typeof formData.kml_file == 'undefined' && formData.id == 0 && !isDrawingMap) ? (
                                    <>
                                        <p>
                                            Nenhum arquivo inserido ou coordenadas desenhadas. Clique no botão
                                            "adicionar mapa" para adicionar um KML, ou "desenhar mapa" para desenhar a
                                            área no mapa
                                        </p>
                                    </>
                                ) : (
                                    ''
                                )}

                                {isLoaded ? (
                                    <>
                                        {isDrawingMap && editMode ? (
                                            <PlacesAutocomplete
                                                onAddressSelect={(address) => {
                                                    getGeocode({ address }).then((results) => {
                                                        const { lat, lng } = getLatLng(results[0])

                                                        setLat(lat)
                                                        setLng(lng)
                                                    })
                                                }}
                                            />
                                        ) : (
                                            ''
                                        )}
                                        <div
                                            className={`${styles.mapWrapper} ${
                                                formData.kml_file instanceof File ||
                                                (typeof formData.kml_file == 'undefined' &&
                                                    formData.id == 0 &&
                                                    !isDrawingMap)
                                                    ? // !editMode &&
                                                      // formData.id == 0 &&
                                                      // (formData.kml_file instanceof File ||
                                                      //     typeof formData.kml_file == 'string' ||
                                                      //     (typeof formData.kml_file == 'undefined' &&
                                                      //         formData.id == 0 &&
                                                      //         !isDrawingMap))
                                                      styles.mapHidden
                                                    : ''
                                            }`}>
                                            <GoogleMap
                                                options={mapOptions}
                                                zoom={15}
                                                center={mapCenter}
                                                onLoad={onLoadMap}
                                                mapTypeId={google.maps.MapTypeId.SATELLITE}
                                                mapContainerStyle={{ width: '100%', height: '100%' }}
                                                onDragEnd={updateCenter}>
                                                {userPosition && (
                                                    <MarkerF
                                                        position={userPosition}
                                                        icon={{
                                                            fillColor: '#5282ED',
                                                            fillOpacity: 1,
                                                            path: google.maps.SymbolPath.CIRCLE,
                                                            scale: 8,
                                                            strokeColor: '#ffffff',
                                                            strokeWeight: 2,
                                                        }}
                                                    />
                                                )}
                                                <DrawingManagerF
                                                    onOverlayComplete={addPath}
                                                    onLoad={(drawingManager) => {
                                                        drawingManagerRef.current = drawingManager
                                                    }}
                                                    // onPolygonComplete={addPath}
                                                    drawingMode={
                                                        editMode && isDrawingMap
                                                            ? google.maps.drawing.OverlayType.POLYGON
                                                            : null
                                                    }
                                                    options={{
                                                        drawingControl: false,
                                                        polygonOptions: {
                                                            draggable: editMode && isDrawingMap,
                                                            editable: editMode && isDrawingMap,
                                                            strokeWeight: 4,
                                                            strokeOpacity: 1,
                                                            strokeColor: '#A468AD',
                                                            fillOpacity: 0.35,
                                                            fillColor: '#A468AD',
                                                        },
                                                    }}
                                                />

                                                {formData.draw_area.length > 0 && (
                                                    <PolygonF
                                                        editable={editMode && isDrawingMap}
                                                        draggable={editMode && isDrawingMap}
                                                        paths={path}
                                                        onMouseUp={onEdit}
                                                        onLoad={onLoadPolygon}
                                                        onDragEnd={onEdit}
                                                        options={{
                                                            strokeWeight: 4,
                                                            strokeOpacity: 1,
                                                            strokeColor: '#A468AD',
                                                            fillOpacity: 0.35,
                                                            fillColor: '#A468AD',
                                                        }}
                                                    />
                                                )}
                                            </GoogleMap>
                                        </div>
                                    </>
                                ) : (
                                    <Loading />
                                )}
                            </div>
                        </div>

                        <h3 className={styles.filesContainerTitle}>Laudos</h3>
                        <div className={styles.filesContainer}>
                            <FileInput
                                name='path'
                                onClick={() => setShowNewFileModal(true)}
                                text='Upload de documento de laudo'
                                disabled={!editMode}
                            />

                            {reportFiles.map((file, index) => (
                                <FileItem
                                    key={`file-${index}`}
                                    item={file}
                                    editMode={editMode}
                                    deleteFunction={() => deleteFile(file.name, file.path, file.id)}
                                />
                            ))}
                        </div>
                    </div>

                    <GeralModal show={showKMFileModal} setShow={setShowKMLFileModal} title='Adicionar mapa'>
                        <GeralInput
                            id='kml_file'
                            name='kml_file'
                            type='file'
                            label='Upload (kml)'
                            placeholder='Nome do arquivo'
                            fileName={getFileString(formData.kml_file)}
                            onChange={handleUserInputChange}
                            customClasses={[`${styles.my3}`]}
                            accept='.kml'
                        />

                        <GeralButton
                            variant='secondary'
                            value='Confirmar'
                            type='button'
                            onClick={() => setShowKMLFileModal(!showKMFileModal)}
                        />
                    </GeralModal>

                    <GeralModal
                        show={showNewFileModal}
                        setShow={setShowNewFileModal}
                        title='Upload de documento de laudo'>
                        <form onSubmit={handleFileForm}>
                            <GeralInput
                                name='name'
                                type='text'
                                label='Nome do laudo'
                                value={fileFormState.name}
                                onChange={handleFileInput}
                                customClasses={[`${styles.my3}`]}
                                required
                            />

                            <div className={styles.formGroup}>
                                <GeralInput
                                    lightLabel
                                    maskVariant='price'
                                    decimalScale={0}
                                    maxLength={2}
                                    name='clay'
                                    type='text'
                                    label='Teor de argila (%)'
                                    defaultValue={fileFormState.clay}
                                    onChange={handleFileInput}
                                />

                                <GeralInput
                                    lightLabel
                                    maskVariant='price'
                                    decimalScale={1}
                                    maxLength={4}
                                    name='organic_material'
                                    type='text'
                                    label='Matéria orgânica (%)'
                                    defaultValue={fileFormState.organic_material}
                                    onChange={handleFileInput}
                                />

                                <GeralInput
                                    lightLabel
                                    maskVariant='price'
                                    decimalScale={1}
                                    maxLength={4}
                                    name='base_saturation'
                                    type='text'
                                    label='Saturação de bases (%)'
                                    defaultValue={fileFormState.base_saturation}
                                    onChange={handleFileInput}
                                />

                                <GeralInput
                                    lightLabel
                                    maskVariant='price'
                                    decimalScale={1}
                                    maxLength={4}
                                    name='unit_ca'
                                    type='text'
                                    label='Ca (cmol/dm³)'
                                    defaultValue={fileFormState.unit_ca}
                                    onChange={handleFileInput}
                                />

                                <GeralInput
                                    lightLabel
                                    maskVariant='price'
                                    decimalScale={1}
                                    maxLength={4}
                                    name='unit_mg'
                                    type='text'
                                    label='Mg (cmol/dm³)'
                                    defaultValue={fileFormState.unit_mg}
                                    onChange={handleFileInput}
                                />

                                <GeralInput
                                    lightLabel
                                    maskVariant='price'
                                    maxLength={5}
                                    name='unit_al'
                                    type='text'
                                    label='Al (cmol/dm³)'
                                    defaultValue={fileFormState.unit_al}
                                    onChange={handleFileInput}
                                />

                                <GeralInput
                                    lightLabel
                                    maskVariant='price'
                                    decimalScale={1}
                                    maxLength={4}
                                    name='unit_k'
                                    type='text'
                                    label='K (mg/dm³)'
                                    defaultValue={fileFormState.unit_k}
                                    onChange={handleFileInput}
                                />

                                <GeralInput
                                    lightLabel
                                    maskVariant='price'
                                    decimalScale={1}
                                    maxLength={4}
                                    name='unit_p'
                                    type='text'
                                    label='P (mg/dm³)'
                                    defaultValue={fileFormState.unit_p}
                                    onChange={handleFileInput}
                                />
                            </div>
                            <GeralInput
                                id='path'
                                name='path'
                                type='file'
                                label='Documento de laudo'
                                placeholder='Nome do arquivo'
                                fileName={getFileString(fileFormState.path)}
                                onChange={handleFileInput}
                                customClasses={[`${styles.my3}`]}
                                required
                            />

                            <GeralButton variant='secondary' value={'Confirmar'} type='submit' />
                        </form>
                    </GeralModal>
                </GeralBox>
            </motion.div>

            <GeralModal show={showWarnModal} setShow={setShowWarnModal} title='Editar plantios'>
                <div className={styles.warnModalText} dangerouslySetInnerHTML={{ __html: warnModalText }} />

                <GeralButton variant='secondary' value='Fechar' type='button' onClick={() => setShowWarnModal(false)} />
            </GeralModal>

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
