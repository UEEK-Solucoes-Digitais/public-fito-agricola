import {
    ChangeEvent,
    FormEvent,
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react'

import MonitoringImage from '@/@types/MonitoringImage'
import PropertyCropStageProps from '@/@types/PropertyCropStage'
import GeralButton from '@/components/buttons/GeralButton'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import GeralInput from '@/components/inputs/GeralInput'
import GeralModal from '@/components/modal/GeralModal'
import { MapConst } from '@/consts/MapConst'
import { useAdmin } from '@/context/AdminContext'
import { useNotification } from '@/context/ToastContext'
import deleteMonitoring from '@/utils/deleteMonitoring'
import WriteLog from '@/utils/logger'
import { GoogleMap, MarkerF, PolygonF, useLoadScript } from '@react-google-maps/api'
import axios from 'axios'
import ImageSelector from './ImageSelector'
import styles from './styles.module.scss'
import { IProps } from './types'

const Stadium = forwardRef(
    ({ cropId, selectedCrops, active, updateStatus, dataEdit, reset, dateTime, pathMap }: IProps, ref) => {
        const formRef = useRef<HTMLFormElement>(null)

        const { admin } = useAdmin()
        const { setToast } = useNotification()
        const [edited, setEdited] = useState(false)
        const [loading, setLoading] = useState(false)
        const [openMapDialog, setOpenMapDialog] = useState(false)

        const { isLoaded } = useLoadScript({
            googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY as string,
        })

        const [defaultLat, defaultLng] =
            pathMap && pathMap.length > 0
                ? [pathMap[0].lat, pathMap[0].lng]
                : [MapConst.DEFAULT_LATITUDE, MapConst.DEFAULT_LONGITUDE]

        const [lat, setLat] = useState(defaultLat)
        const [lng, setLng] = useState(defaultLng)

        const mapCenter = useMemo(() => ({ lat, lng }), [lat, lng])
        const mapRef = useRef<google.maps.Map | null>(null)

        const onLoadMap = useCallback((map: google.maps.Map) => {
            mapRef.current = map
        }, [])

        const [formData, setFormData] = useState<PropertyCropStageProps>({
            id: 0,
            vegetative_age_value: 0,
            vegetative_age_text: '',
            reprodutive_age_value: 0,
            reprodutive_age_text: '',
            risk: 1,
            kml_file: '',
            properties_crops_id: 0,
            admin_id: admin.id,
            latitude: defaultLat,
            longitude: defaultLng,
        })

        const [selectedFiles, setSelectedFiles] = useState<MonitoringImage[]>([])

        // * Input image
        const handleSetSelectedFiles = (newFiles: MonitoringImage[], removeImage = false) => {
            setSelectedFiles(newFiles)

            if (!removeImage) {
                updateStatus(1)

                if (!edited) {
                    setEdited(true)
                }
            }
        }

        // * Input field
        const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
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

            setFormData((prevData) => ({
                ...prevData,
                [name]: fileValue || value,
            }))

            updateStatus(1)

            if (!edited) {
                setEdited(true)
            }
        }

        // * Make form data
        const convertToFormData = async (): Promise<FormData> => {
            const formFetch = new FormData()
            const images = await Promise.all(
                selectedFiles
                    .filter((fileWrapper) => !fileWrapper.isFromDatabase)
                    .map(async (fileWrapper) => fileWrapper.file),
            )

            formFetch.append('admin_id', admin.id.toString())
            formFetch.append('crops', selectedCrops.join(','))
            formFetch.append('property_crop_join_id', cropId.toString())
            formFetch.append('type', '1')
            formFetch.append('open_date', dateTime?.toString() ?? '')

            formFetch.append(`stages[0][id]`, formData.id.toString())
            formFetch.append(`stages[0][vegetative_age_value]`, formData.vegetative_age_value.toString())
            formFetch.append(`stages[0][reprodutive_age_value]`, formData.reprodutive_age_value.toString())
            formFetch.append(`stages[0][risk]`, formData.risk.toString())
            formFetch.append('pathToUpload', 'property_crop_stages')

            if (formData.latitude) {
                formFetch.append(`stages[0][latitude]`, formData.latitude.toString())
            }

            if (formData.longitude) {
                formFetch.append(`stages[0][longitude]`, formData.longitude.toString())
            }

            if (formData.vegetative_age_text) {
                formFetch.append(`stages[0][vegetative_age_text]`, formData.vegetative_age_text.toString())
            }

            if (formData.reprodutive_age_text) {
                formFetch.append(`stages[0][reprodutive_age_text]`, formData.reprodutive_age_text.toString())
            }

            if (formData.kml_file instanceof File) {
                formFetch.append(`stages[0][kml_file]`, formData.kml_file, formData.kml_file.name)
            }

            images.forEach((image: File | null, j: number) => {
                if (image) {
                    formFetch.append(`stages[0][images][${j}]`, image)
                }
            })

            return formFetch
        }

        // * Update center map
        const updateCenter = () => {
            if (mapRef.current) {
                const newCenter = mapRef.current.getCenter()
                if (newCenter) {
                    setLat(newCenter.lat())
                    setLng(newCenter.lng())
                }
            }
        }

        // * Update marker on map
        const onMapClick = useCallback(async (event: google.maps.MapMouseEvent) => {
            if (event.latLng) {
                const newLat = event.latLng.lat()
                const newLng = event.latLng.lng()

                setFormData((prevData) => ({
                    ...prevData,
                    latitude: newLat,
                    longitude: newLng,
                }))

                updateStatus(1)

                if (!edited) {
                    setEdited(true)
                }
            }
        }, [])

        // * Async submit
        useImperativeHandle(ref, () => ({
            formStadium: async () => {
                try {
                    if (!loading && edited) {
                        updateStatus(2)
                        setLoading(true)

                        const update = formData.id > 0
                        setToast({ text: `${update ? 'Salvando' : 'Adicionando'} estádio`, state: 'loading' })
                        const buffer = await convertToFormData()

                        await axios
                            .post('/api/properties/monitoring/form', buffer, {
                                headers: {
                                    'Content-Type': 'multipart/form-data',
                                },
                            })
                            .then(async (response: any) => {
                                if (response.data.status == 200) {
                                    // const id_all: number[] = response.data.id_all;
                                    // const id_images: number[] = response.data.id_images;

                                    // // Setar ids de items criados no banco
                                    // id_all.forEach((id) => {
                                    //     setFormData((state) => ({
                                    //         ...state,
                                    //         ['id']: id,
                                    //     }));
                                    // });

                                    // // Setar ids de imagens criadas no banco
                                    // setSelectedFiles(
                                    //     selectedFiles.map((file, index) => ({
                                    //         ...file,
                                    //         idDatabase: id_images[index] ? id_images[index].toString() : '',
                                    //     })),
                                    // );

                                    setToast({
                                        text: `Estádio ${update ? 'salvo' : 'adicionado'} com sucesso`,
                                        state: 'success',
                                    })
                                    updateStatus(4)

                                    await new Promise((resolve) => setTimeout(resolve, 2000))
                                } else {
                                    setToast({ text: response.data.msg, state: 'danger' })
                                    updateStatus(0)
                                }
                            })
                            .catch((error) => {
                                throw error
                            })
                    }
                } catch (error) {
                    updateStatus(3)
                    WriteLog(error, 'error')
                    setToast({ text: 'Não foi possível completar a operação no momento', state: 'danger' })
                    throw error
                } finally {
                    setLoading(false)
                }
            },
        }))

        // * Form reset
        useEffect(() => {
            resetForm()
        }, [formRef, admin.id, reset])

        function resetForm() {
            formRef.current?.reset()
            setFormData({
                id: 0,
                vegetative_age_value: 0,
                vegetative_age_text: '',
                reprodutive_age_value: 0,
                reprodutive_age_text: '',
                risk: 1,
                kml_file: '',
                properties_crops_id: 0,
                admin_id: admin.id,
                latitude: defaultLat,
                longitude: defaultLng,
            })
            setSelectedFiles([])
            setOpenMapDialog(false)
            setLat(defaultLat)
            setLng(defaultLng)
            updateStatus(0)
            setLoading(false)
            setEdited(false)
        }

        function deleteMonitoringFunction(id: number, type: string) {
            if (confirm('Deseja deletar esse item?')) {
                setToast({ text: 'Deletando item', state: 'loading' })

                deleteMonitoring(id, type, admin.id)
                    .then((response: any) => {
                        // if (response.data.status == 200) {
                        setToast({ text: 'Item deletado com sucesso', state: 'success' })
                        updateStatus(0)
                        resetForm()
                        // } else {
                        //     setToast({ text: 'Erro ao deletar item', state: 'danger' });
                        // }
                    })
                    .catch((error) => {
                        console.error(error)
                        setToast({ text: 'Erro ao deletar item', state: 'danger' })
                        WriteLog(error, 'error')
                    })
            }
        }

        // * Content load
        useEffect(() => {
            if (dataEdit && dataEdit.length > 0) {
                const stage = dataEdit[0]

                setFormData({
                    id: stage.id,
                    vegetative_age_value: stage.vegetative_age_value,
                    vegetative_age_text: stage.vegetative_age_text,
                    reprodutive_age_value: stage.reprodutive_age_value,
                    reprodutive_age_text: stage.reprodutive_age_text,
                    risk: stage.risk,
                    kml_file: stage.kml_file,
                    properties_crops_id: stage.properties_crops_id,
                    admin_id: stage.admin_id,
                    open_date: stage.open_date,
                    latitude: Number(stage.coordinates?.coordinates[1]),
                    longitude: Number(stage.coordinates?.coordinates[0]),
                })

                setLat(Number(stage.coordinates?.coordinates[1]) ?? defaultLat)
                setLng(Number(stage.coordinates?.coordinates[0]) ?? defaultLng)

                const loadedImages = dataEdit.flatMap((stage: PropertyCropStageProps) =>
                    stage.images?.map((image) => ({
                        id: `${Date.now()}-${image.id}`,
                        idDatabase: image.id,
                        file: null,
                        preview: image.image,
                        isFromDatabase: true,
                        loading: true,
                    })),
                )

                if (loadedImages) {
                    setSelectedFiles(loadedImages)
                }
            }
        }, [dataEdit])

        // * When disabled
        if (!active) {
            return <></>
        }

        return (
            <form
                ref={formRef}
                className={styles.container}
                onSubmit={(e: FormEvent<HTMLFormElement>) => {
                    e.preventDefault()
                }}>
                <div className={styles.group}>
                    {/* <div className={styles.flexTitleWithButton}>
                    <h5 className={styles.title}>Informações gerais</h5>
                </div> */}

                    <div className={styles.content}>
                        {formData.id > 0 && (
                            <button
                                className={styles.deleteButton}
                                type='button'
                                title='Remover item'
                                onClick={() => deleteMonitoringFunction(formData.id, 'stage')}>
                                <IconifyIcon icon='ph:trash' />
                            </button>
                        )}
                        <div className={`${styles.grid} ${styles.column2}`}>
                            <div className={styles.littleRowStage}>
                                <GeralInput
                                    defaultValue={formData.vegetative_age_value.toString().replace('.0', '')}
                                    label='Idade vegetativa'
                                    name='vegetative_age_value'
                                    autoComplete='off'
                                    onChange={handleInputChange}
                                    readOnly={loading}
                                    required>
                                    <option value={0}>00</option>

                                    {Array.from({ length: 25 }, (_, index) => (
                                        <option key={index + 1} value={index + 1}>{`${index < 9 ? '0' : ''}${
                                            index + 1
                                        }`}</option>
                                    ))}
                                </GeralInput>

                                <GeralInput
                                    defaultValue={formData.vegetative_age_text}
                                    name='vegetative_age_text'
                                    placeholder='Digite aqui'
                                    type='text'
                                    maxLength={150}
                                    autoComplete='off'
                                    onChange={handleInputChange}
                                    readOnly={loading}
                                />

                                {/* <GeralInput
                                value={formData.vegetative_age_period}
                                name='vegetative_age_period'
                                autoComplete='off'
                                onChange={handleInputChange}
                                readOnly={loading}
                                required>
                                <option value={0} disabled>
                                    Selecione
                                </option>
                                <option value={1}>Dia</option>
                                <option value={2}>Semanas</option>
                                <option value={3}>Meses</option>
                                <option value={4}>Anos</option>
                            </GeralInput> */}
                            </div>

                            <div className={styles.littleRowStage}>
                                <GeralInput
                                    defaultValue={formData.reprodutive_age_value.toString().replace('.0', '')}
                                    label='Idade reprodutiva'
                                    name='reprodutive_age_value'
                                    autoComplete='off'
                                    onChange={handleInputChange}
                                    readOnly={loading}
                                    required>
                                    <option value={0}>00</option>

                                    {[1, 2, 3, 4, 5, 5.1, 5.2, 5.3, 5.4, 5.5, 6, 7, 8].map((item: number) => (
                                        <option key={item} value={item}>
                                            {item}
                                        </option>
                                    ))}
                                </GeralInput>

                                <GeralInput
                                    defaultValue={formData.reprodutive_age_text}
                                    name='reprodutive_age_text'
                                    placeholder='Digite aqui'
                                    type='text'
                                    maxLength={150}
                                    autoComplete='off'
                                    onChange={handleInputChange}
                                    readOnly={loading}
                                />

                                {/* <GeralInput
                                value={formData.reprodutive_age_period}
                                name='reprodutive_age_period'
                                autoComplete='off'
                                onChange={handleInputChange}
                                readOnly={loading}
                                required>
                                <option value={0} disabled>
                                    Selecione
                                </option>
                                <option value={1}>Dia</option>
                                <option value={2}>Semanas</option>
                                <option value={3}>Meses</option>
                                <option value={4}>Anos</option>
                            </GeralInput> */}
                            </div>
                        </div>

                        <div className={`${styles.grid} ${styles.space20}`}>
                            {/* <GeralInput
                            name='kml_file'
                            type='file'
                            label='Localização (.kml)'
                            placeholder='Nome do arquivo'
                            fileName={getFileName(formData.kml_file)}
                            onChange={handleInputChange}
                            accept='.kml'
                            readOnly={loading}
                        /> */}

                            <div className={styles.riskGroup}>
                                <div className={styles.radioGroup}>
                                    <div className={styles.radioItemOption}>
                                        <input
                                            type='radio'
                                            name='risk'
                                            value={1}
                                            onChange={handleInputChange}
                                            defaultChecked={formData.risk.toString() == '1'}
                                        />
                                        <label>Sem risco</label>
                                    </div>
                                    <div className={styles.radioItemOption}>
                                        <input
                                            type='radio'
                                            name='risk'
                                            value={2}
                                            onChange={handleInputChange}
                                            defaultChecked={formData.risk.toString() == '2'}
                                        />
                                        <label>Atenção</label>
                                    </div>
                                    <div className={styles.radioItemOption}>
                                        <input
                                            type='radio'
                                            name='risk'
                                            value={3}
                                            onChange={handleInputChange}
                                            defaultChecked={formData.risk.toString() == '3'}
                                        />
                                        <label>Urgência</label>
                                    </div>
                                </div>
                            </div>

                            {/* <div className={`${styles.grid} ${styles.spaceBetween}`}> */}
                            <GeralButton
                                smallIcon
                                type='button'
                                title='Abrir mapa'
                                variant='inlineGreen'
                                onClick={() => {
                                    setOpenMapDialog(true)
                                }}>
                                <IconifyIcon icon='icon-park-outline:world' />
                            </GeralButton>

                            {/* {formData.latitude != defaultLat && formData.longitude != defaultLat && (
                                <div>
                                    <p>
                                        Latitude: <b>{formData.latitude}</b>
                                    </p>
                                    <p>
                                        Longitude: <b>{formData.longitude}</b>
                                    </p>
                                </div>
                            )} */}
                            {/* </div> */}
                        </div>
                    </div>
                </div>

                <ImageSelector
                    path='property_crop_stages'
                    type='observation'
                    selectedFiles={selectedFiles}
                    setSelectedFiles={handleSetSelectedFiles}
                    loading={loading}
                />

                <GeralModal show={openMapDialog} setShow={setOpenMapDialog} title='Selecionar mapa'>
                    <div className={`${styles.mapDialog} ${styles.small}`}>
                        <div className={styles.dialogBody}>
                            {isLoaded && (
                                <GoogleMap
                                    key={`map-stadium-${0}`}
                                    zoom={15}
                                    center={mapCenter}
                                    // center={{ lat: lat, lng: lng }}
                                    onLoad={onLoadMap}
                                    mapTypeId='satellite'
                                    onClick={onMapClick}
                                    onDragEnd={updateCenter}
                                    mapContainerStyle={{ width: '100%', height: '100%' }}>
                                    <MarkerF
                                        key={`map-stadium-marker-${0}`}
                                        position={{
                                            lat: formData.latitude ?? defaultLat,
                                            lng: formData.longitude ?? defaultLng,
                                        }}
                                    />

                                    <PolygonF
                                        paths={pathMap}
                                        onClick={onMapClick}
                                        options={{
                                            strokeWeight: 4,
                                            strokeOpacity: 1,
                                            strokeColor: '#A468AD',
                                            fillOpacity: 0.5,
                                            fillColor: '#A468AD',
                                        }}></PolygonF>
                                </GoogleMap>
                            )}
                        </div>
                    </div>
                </GeralModal>
            </form>
        )
    },
)

Stadium.displayName = 'Stadium Form'

export default Stadium
