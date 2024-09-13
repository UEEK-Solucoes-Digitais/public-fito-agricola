import { ChangeEvent, forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react'

import axios from 'axios'

import GeralInput from '@/components/inputs/GeralInput'
import { useAdmin } from '@/context/AdminContext'
import { useNotification } from '@/context/ToastContext'

import PropertyCropDisease from '@/@types/PropertyCropDisease'
import useSWR from 'swr'
import styles from './styles.module.scss'

import InterferenceFactorItemProps from '@/@types/InterferenceFactorItem'
import ElementSkeleton from '@/components/loading/ElementSkeleton'

import MonitoringImage from '@/@types/MonitoringImage'
import GeralButton from '@/components/buttons/GeralButton'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import GeralModal from '@/components/modal/GeralModal'
import { MapConst } from '@/consts/MapConst'
import deleteMonitoring from '@/utils/deleteMonitoring'
import getFetch from '@/utils/getFetch'
import WriteLog from '@/utils/logger'
import { GoogleMap, MarkerF, PolygonF, useLoadScript } from '@react-google-maps/api'
import ImageSelector from './ImageSelector'
import { IProps } from './types'

const Disease = forwardRef(
    (
        { diseases = [], cropId, selectedCrops, active, updateStatus, dataEdit, reset, dateTime, pathMap }: IProps,
        ref,
    ) => {
        const { data, isLoading, error } = useSWR(`/api/interference-factors/list/2`, getFetch)

        const { admin } = useAdmin()
        const { setToast } = useNotification()
        const [loading, setLoading] = useState(false)
        const [edited, setEdited] = useState(false)
        const [openMapDialog, setOpenMapDialog] = useState<boolean[]>([false])

        const { isLoaded } = useLoadScript({
            googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY as string,
        })

        const [defaultLat, defaultLng] =
            pathMap && pathMap.length > 0
                ? [pathMap[0].lat, pathMap[0].lng]
                : [MapConst.DEFAULT_LATITUDE, MapConst.DEFAULT_LONGITUDE]

        const [lat, setLat] = useState([defaultLat])
        const [lng, setLng] = useState([defaultLng])

        const [mapRefs, setMapRefs] = useState<Array<google.maps.Map | null>>([null])

        const onLoadMap = useCallback((index: number, map: google.maps.Map) => {
            setMapRefs((prev) => {
                const newRefs = [...prev]
                newRefs[index] = map
                return newRefs
            })
        }, [])

        const [formData, setFormData] = useState<PropertyCropDisease[]>([
            {
                id: 0,
                interference_factors_item_id: 0,
                incidency: 0,
                risk: 1,
                kml_file: '',
                properties_crops_id: 0,
                admin_id: admin.id,
                latitude: defaultLat,
                longitude: defaultLng,
            },
        ])

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
        const handleInputChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
            const { name, value } = e.target

            let fileValue: File | null = null

            if (e.target instanceof HTMLInputElement && e.target.type == 'file') {
                fileValue = e.target.files ? e.target.files[0] : null

                if (!fileValue) {
                    return
                }

                if (fileValue.name?.split('.')?.pop()?.toLowerCase() !== 'kml') {
                    setToast({ text: 'O arquivo deve ser um KML', state: 'danger' })
                    return
                }

                setFormData((prevData) =>
                    prevData.map((data, i) => (i == index ? { ...data, [name]: fileValue } : data)),
                )
            } else if (name.includes('risk') && ['1', '2', '3'].includes(value)) {
                const newName = 'risk'
                setFormData((prevData) =>
                    prevData.map((data, i) => (i == index ? { ...data, [newName]: parseInt(value) } : data)),
                )
            } else {
                setFormData((prevData) => prevData.map((data, i) => (i == index ? { ...data, [name]: value } : data)))
            }

            updateStatus(1)

            if (!edited) {
                setEdited(true)
            }
        }

        // * Add new form group
        const addNewForm = () => {
            setFormData((prevData) => [
                ...prevData,
                {
                    id: 0,
                    interference_factors_item_id: 0,
                    incidency: 0,
                    risk: 1,
                    kml_file: '',
                    properties_crops_id: 0,
                    admin_id: admin.id,
                    latitude: defaultLat,
                    longitude: defaultLng,
                },
            ])
            setLat((state) => [...state, defaultLat])
            setLng((state) => [...state, defaultLng])
            setOpenMapDialog((state) => [...state, false])
        }

        function removeFormData(index: number) {
            setFormData((prevData) => prevData.filter((_data, i) => i !== index))
            setSelectedFiles((prevData) => prevData.filter((_data, i) => i !== index))
            setLat((prevData) => prevData.filter((_data, i) => i !== index))
            setLng((prevData) => prevData.filter((_data, i) => i !== index))
            setOpenMapDialog((prevData) => prevData.filter((_data, i) => i !== index))
        }

        // * Make form data
        const convertToFormData = async (): Promise<FormData> => {
            const formFetch = new FormData()

            formFetch.append('admin_id', admin.id.toString())
            formFetch.append('crops', selectedCrops.join(','))
            formFetch.append('property_crop_join_id', cropId.toString())
            formFetch.append('open_date', dateTime?.toString() ?? '')
            formFetch.append('type', '2')
            formFetch.append('pathToUpload', 'property_crop_diseases')

            for (let i = 0; i < formData.length; i++) {
                const disease = formData[i]
                const images = await Promise.all(
                    selectedFiles
                        .filter((fileWrapper) => !fileWrapper.isFromDatabase)
                        .map(async (fileWrapper) => fileWrapper.file),
                )

                formFetch.append(`diseases[${i}][id]`, disease.id.toString())

                formFetch.append(
                    `diseases[${i}][interference_factors_item_id]`,
                    disease.interference_factors_item_id.toString(),
                )
                formFetch.append(`diseases[${i}][incidency]`, disease.incidency.toString())
                formFetch.append(`diseases[${i}][risk]`, disease.risk.toString())

                if (disease.latitude) {
                    formFetch.append(`diseases[${i}][latitude]`, disease.latitude.toString())
                }

                if (disease.longitude) {
                    formFetch.append(`diseases[${i}][longitude]`, disease.longitude.toString())
                }

                if (disease.kml_file instanceof File) {
                    formFetch.append(`diseases[${i}][kml_file]`, disease.kml_file, disease.kml_file.name)
                }

                if (i == 0) {
                    images.forEach((image: File | null, j: number) => {
                        if (image) {
                            formFetch.append(`diseases[${i}][images][${j}]`, image)
                        }
                    })
                }
            }

            return formFetch
        }

        // * Update center map
        const updateCenter = (index: number) => {
            const currentMap = mapRefs[index]
            if (currentMap) {
                const newCenter = currentMap.getCenter()
                if (newCenter) {
                    setLat((prevData) => prevData.map((data, i) => (i == index ? newCenter.lat() : data)))
                    setLng((prevData) => prevData.map((data, i) => (i == index ? newCenter.lng() : data)))
                }
            }
        }

        // * Update marker on map
        const onMapClick = useCallback((index: number, event: google.maps.MapMouseEvent) => {
            if (event.latLng) {
                const newLat = event.latLng.lat()
                const newLng = event.latLng.lng()

                setFormData((prevData) =>
                    prevData.map((data, i) => (i == index ? { ...data, latitude: newLat, longitude: newLng } : data)),
                )

                // setLat((prevData) => prevData.map((data, i) => (i == index ? newCenter.lat() : data)));
                // setLng((prevData) => prevData.map((data, i) => (i == index ? newCenter.lng() : data)));

                updateStatus(1)

                if (!edited) {
                    setEdited(true)
                }
            }
        }, [])

        // * Open modal by group
        const toggleMapModal = (index: number, show: boolean) => {
            setOpenMapDialog((state) => state.map((data, i) => (i == index ? show : data)))
        }

        // * Async submit
        useImperativeHandle(ref, () => ({
            formDisease: async () => {
                try {
                    if (!loading && edited) {
                        const validation = formData.some((disease) => disease.interference_factors_item_id == 0)
                        if (validation) {
                            setToast({ text: 'Doença precisa ser selecionada', state: 'warning' })
                            updateStatus(3)
                            return
                        }

                        updateStatus(2)
                        setLoading(true)

                        const update = formData.some((form) => form.id > 0)
                        setToast({ text: `${update ? 'Salvando' : 'Adicionando'} doenças`, state: 'loading' })
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
                                    // id_all.forEach((id, index) => {
                                    //     setFormData((prevData) =>
                                    //         prevData.map((data, i) => (i == index ? { ...data, ['id']: id } : data)),
                                    //     );
                                    // });

                                    // // Setar ids de imagens criadas no banco
                                    // setSelectedFiles(
                                    //     selectedFiles.map((file, index) => ({
                                    //         ...file,
                                    //         idDatabase: id_images[index] ? id_images[index].toString() : '',
                                    //     })),
                                    // );

                                    setToast({
                                        text: `Doenças ${update ? 'salvas' : 'adicionadas'} com sucesso`,
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
                } catch (error: any) {
                    WriteLog(error, 'error')
                    const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
                    updateStatus(3)
                    setToast({ text: message, state: 'danger' })
                } finally {
                    setLoading(false)
                }
            },
        }))

        // * Form reset
        useEffect(() => {
            setFormData([
                {
                    id: 0,
                    interference_factors_item_id: 0,
                    incidency: 0,
                    risk: 1,
                    kml_file: '',
                    properties_crops_id: 0,
                    admin_id: admin.id,
                    open_date: '',
                    latitude: defaultLat,
                    longitude: defaultLng,
                },
            ])
            setSelectedFiles([])
            setLat([defaultLat])
            setLng([defaultLng])
            setOpenMapDialog([false])
            updateStatus(0)
            setLoading(false)
            setEdited(false)
        }, [admin.id, reset])

        function deleteMonitoringFunction(id: number, type: string, index: number) {
            if (confirm('Deseja deletar esse item?')) {
                setToast({ text: 'Deletando item', state: 'loading' })

                deleteMonitoring(id, type, admin.id)
                    .then(() => {
                        // if (response.data.status == 200) {
                        setToast({ text: 'Item deletado com sucesso', state: 'success' })
                        // zerando apenas aquela posição do formdata
                        setFormData((prevData) => prevData.filter((_data, i) => i !== index))
                        setSelectedFiles([])
                        setLat([defaultLat])
                        setLng([defaultLng])
                        setOpenMapDialog([false])
                        setLoading(false)
                        setEdited(false)
                        updateStatus(0)
                        // } else {
                        //     setToast({ text: 'Erro ao deletar item', state: 'danger' });
                        // }
                    })
                    .catch((error) => {
                        WriteLog(error, 'error')
                        const message =
                            error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
                        setToast({ text: message, state: 'danger' })
                    })
            }
        }

        // * Content load
        useEffect(() => {
            if (dataEdit && dataEdit.length > 0) {
                const newFormData = dataEdit.map((disease: PropertyCropDisease) => ({
                    id: disease.id,
                    interference_factors_item_id: disease.interference_factors_item_id,
                    incidency: disease.incidency,
                    risk: disease.risk,
                    kml_file: disease.kml_file,
                    properties_crops_id: disease.properties_crops_id,
                    admin_id: disease.admin_id,
                    open_date: disease.open_date,
                    latitude: disease.coordinates?.coordinates[1]
                        ? Number(disease.coordinates?.coordinates[1])
                        : defaultLat,
                    longitude: disease.coordinates?.coordinates[1]
                        ? Number(disease.coordinates?.coordinates[0])
                        : defaultLng,
                }))

                setLat([])
                setLng([])

                dataEdit.map((disease: PropertyCropDisease) => {
                    setLat((state) => [...state, Number(disease.coordinates?.coordinates[1]) ?? defaultLat])
                    setLng((state) => [...state, Number(disease.coordinates?.coordinates[0]) ?? defaultLng])
                })

                setOpenMapDialog((state) => [...state, false])

                const loadedImages = dataEdit.flatMap((disease: PropertyCropDisease) =>
                    disease.images?.map((image) => ({
                        id: `${Date.now()}-${image.id}`,
                        idDatabase: image.id,
                        file: null,
                        preview: image.image,
                        isFromDatabase: true,
                        loading: true,
                    })),
                )

                if (newFormData) {
                    setFormData(newFormData)
                }

                if (loadedImages) {
                    setSelectedFiles(loadedImages)
                }
            }
        }, [dataEdit])

        // * Get error
        useEffect(() => {
            if (typeof error !== 'undefined') {
                WriteLog(error, 'error')

                if (process.env.NEXT_PUBLIC_SHOW_TOAST_FETCH_ERROR == 'true') {
                    setToast({ text: `Falha ao obter dados`, state: 'danger' })
                }
            }
        }, [error])

        // * When disabled
        if (!active) {
            return <></>
        }

        return (
            <div className={styles.container}>
                <div className={styles.group}>
                    {/* <h5 className={styles.title}>Informações gerais</h5> */}

                    {formData.map((dataItem, index) => (
                        <div key={`disease-form-${dataItem.id}-${index + 1}`} className={styles.content}>
                            {/* <div className={`${styles.flexTitleWithButton} ${styles.noMargin}`}>
                                <h5 className={styles.title}>Doença #{index + 1}</h5>
                            </div> */}
                            {/* {dataItem.id > 0 && ( */}
                            <button
                                className={styles.deleteButton}
                                type='button'
                                title='Remover item'
                                onClick={() =>
                                    dataItem.id > 0
                                        ? deleteMonitoringFunction(dataItem.id, 'disease', index)
                                        : removeFormData(index)
                                }>
                                <IconifyIcon icon='ph:trash' />
                            </button>
                            {/* )} */}
                            <div className={`${styles.grid} ${styles.column2}`}>
                                {isLoading && <ElementSkeleton />}
                                {!isLoading && (
                                    <GeralInput
                                        defaultValue={dataItem.interference_factors_item_id}
                                        label={`Doença #${index + 1}`}
                                        name='interference_factors_item_id'
                                        autoComplete='off'
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange(index, e)}
                                        readOnly={loading}
                                        required>
                                        <option value={0} disabled>
                                            Selecione
                                        </option>
                                        {diseases && diseases.length > 0
                                            ? diseases.map((disease: InterferenceFactorItemProps) => (
                                                  <option key={disease.id} value={disease.id}>
                                                      {disease.name}{' '}
                                                      {`${
                                                          disease.scientific_name ? `(${disease.scientific_name})` : ''
                                                      }`}
                                                  </option>
                                              ))
                                            : data?.interference_factors_items?.map(
                                                  (disease: InterferenceFactorItemProps) => (
                                                      <option key={disease.id} value={disease.id}>
                                                          {disease.name}{' '}
                                                          {`${
                                                              disease.scientific_name
                                                                  ? `(${disease.scientific_name})`
                                                                  : ''
                                                          }`}
                                                      </option>
                                                  ),
                                              )}
                                    </GeralInput>
                                )}

                                <GeralInput
                                    defaultValue={dataItem.incidency !== 0 ? dataItem.incidency : ''}
                                    label='Incidência (%)'
                                    name='incidency'
                                    placeholder='Digite'
                                    type='text'
                                    maxLength={6}
                                    autoComplete='off'
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange(index, e)}
                                    readOnly={loading}
                                    maskVariant='price'
                                    required
                                />
                            </div>

                            <div className={`${styles.grid} ${styles.space20}`}>
                                {/* <GeralInput
                                name='kml_file'
                                type='file'
                                label='Localização (.kml)'
                                placeholder='Nome do arquivo'
                                fileName={getFileName(dataItem.kml_file)}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange(index, e)}
                                accept='.kml'
                                readOnly={loading}
                            /> */}

                                <div className={styles.riskGroup}>
                                    <div className={styles.radioGroup}>
                                        <div className={styles.radioItemOption}>
                                            <input
                                                type='radio'
                                                name={`risk-${index}`}
                                                value={1}
                                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                    handleInputChange(index, e)
                                                }
                                                defaultChecked={dataItem.risk.toString() == '1'}
                                            />
                                            <label>Sem risco</label>
                                        </div>
                                        <div className={styles.radioItemOption}>
                                            <input
                                                type='radio'
                                                name={`risk-${index}`}
                                                value={2}
                                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                    handleInputChange(index, e)
                                                }
                                                defaultChecked={dataItem.risk.toString() == '2'}
                                            />
                                            <label>Atenção</label>
                                        </div>
                                        <div className={styles.radioItemOption}>
                                            <input
                                                type='radio'
                                                name={`risk-${index}`}
                                                value={3}
                                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                    handleInputChange(index, e)
                                                }
                                                defaultChecked={dataItem.risk.toString() == '3'}
                                            />
                                            <label>Urgência</label>
                                        </div>
                                    </div>
                                </div>

                                {/* <div className={`${styles.grid} ${styles.spaceBetween}`}> */}
                                <GeralButton
                                    smallIcon
                                    type='button'
                                    variant='inlineGreen'
                                    title='Abrir mapa'
                                    onClick={() => toggleMapModal(index, true)}>
                                    <IconifyIcon icon='icon-park-outline:world' />
                                </GeralButton>

                                {/* {dataItem.latitude != defaultLat && dataItem.longitude != defaultLng && (
                                        <div>
                                            <p>
                                                Latitude: <b>{dataItem.latitude}</b>
                                            </p>
                                            <p>
                                                Longitude: <b>{dataItem.longitude}</b>
                                            </p>
                                        </div>
                                    )} */}
                                {/* </div> */}
                            </div>

                            <GeralModal
                                show={openMapDialog[index]}
                                setShow={(state) => toggleMapModal(index, state)}
                                title='Selecionar mapa'>
                                <div className={`${styles.mapDialog} ${styles.small}`}>
                                    <div className={styles.dialogBody}>
                                        {isLoaded && (
                                            <GoogleMap
                                                key={`map-disease-${index + 1}`}
                                                zoom={15}
                                                center={{
                                                    lat: dataItem.latitude ?? defaultLat,
                                                    lng: dataItem.longitude ?? defaultLng,
                                                }}
                                                onLoad={(map) => onLoadMap(index, map)}
                                                mapTypeId='satellite'
                                                onClick={(e) => onMapClick(index, e)}
                                                onDragEnd={() => updateCenter(index)}
                                                mapContainerStyle={{ width: '100%', height: '100%' }}>
                                                <MarkerF
                                                    key={`map-disease-marker-${index + 1}`}
                                                    position={{
                                                        lat: dataItem.latitude ?? defaultLat,
                                                        lng: dataItem.longitude ?? defaultLng,
                                                    }}
                                                />

                                                <PolygonF
                                                    paths={pathMap}
                                                    onClick={(e) => onMapClick(index, e)}
                                                    options={{
                                                        strokeWeight: 4,
                                                        strokeOpacity: 1,
                                                        strokeColor: '#A468AD',
                                                        fillOpacity: 0.5,
                                                        fillColor: '#A468AD',
                                                    }}
                                                />
                                            </GoogleMap>
                                        )}
                                    </div>
                                </div>
                            </GeralModal>
                        </div>
                    ))}
                </div>

                <div className={`${styles.wrapper} ${styles.newOccurrenceWrapper}`}>
                    <GeralButton type='button' variant='primary' smaller onClick={addNewForm}>
                        Nova ocorrência
                    </GeralButton>

                    <ImageSelector
                        path='property_crop_diseases'
                        type='disease'
                        selectedFiles={selectedFiles}
                        setSelectedFiles={handleSetSelectedFiles}
                        loading={loading}
                    />
                </div>
            </div>
        )
    },
)

Disease.displayName = 'Disease Form'

export default Disease
