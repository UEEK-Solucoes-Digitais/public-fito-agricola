'use client'

import PropertyCropDisease from '@/@types/PropertyCropDisease'
import PropertyCropObservation from '@/@types/PropertyCropObservation'
import PropertyCropPest from '@/@types/PropertyCropPest'
import PropertyCropStage from '@/@types/PropertyCropStage'
import PropertyCropWeed from '@/@types/PropertyCropWeed'
import { MapConst } from '@/consts/MapConst'
import { useAdmin } from '@/context/AdminContext'
import { useSearchProperty } from '@/context/SearchPropertyContext'
import { useNotification } from '@/context/ToastContext'
import { formatNumberToBR } from '@/utils/formats'
import getFetch from '@/utils/getFetch'
import { getMetricUnity } from '@/utils/getMetricUnity'
import { GoogleMap, MarkerF, PolygonF, useLoadScript } from '@react-google-maps/api'
import axios from 'axios'
import { useRouter } from 'nextjs-toploader/app'
import { FC, Fragment, useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import { LatLng } from 'use-places-autocomplete'
import styles from '../../styles.module.scss'
import { Crop, Product } from '../../types'

interface ManagementDataProps {
    diseases: PropertyCropDisease[]
    observations: PropertyCropObservation[]
    pests: PropertyCropPest[]
    stages: PropertyCropStage[]
    weeds: PropertyCropWeed[]
}

interface MapProps {
    crop: Crop | undefined
    crops?: any[]
    monitoringData?: ManagementDataProps
    fullScreen?: boolean
}

function GetCropMap(props: MapProps) {
    const [path, setPath] = useState<LatLng[]>([])
    const [lat, setLat] = useState(MapConst.DEFAULT_LATITUDE)
    const [lng, setLng] = useState(MapConst.DEFAULT_LONGITUDE)
    const mapCenter = useMemo(() => ({ lat, lng }), [lat, lng])
    const { crop, monitoringData, crops } = props
    const { setToast } = useNotification()
    const [dataSeeds, setDataSeeds] = useState<Product[]>([])
    const { admin } = useAdmin()

    const { data: seedOperation } = useSWR(`/api/inputs/cultures/list/${admin.id}`, getFetch)

    const router = useRouter()

    const [diseaseMarkers, setDiseaseMarkers] = useState<google.maps.Marker[]>([])
    const [pestMarkers, setPestMarkers] = useState<google.maps.Marker[]>([])
    const [weedMarkers, setWeedMarkers] = useState<google.maps.Marker[]>([])
    const [stageMarkers, setStageMarkers] = useState<google.maps.Marker[]>([])

    const [diseaseMarkersIcons, setDiseaseMarkersIcons] = useState<{ [key: number]: string }>({})
    const [pestMarkersIcons, setPestMarkersIcons] = useState<{ [key: number]: string }>({})
    const [weedMarkersIcons, setWeedMarkersIcons] = useState<{ [key: number]: string }>({})
    const [stageMarkersIcons, setStageMarkersIcons] = useState<{ [key: number]: string }>({})

    const [diseaseNames, setDiseaseNames] = useState<{ [key: string]: string }>({})
    const [pestNames, setPestNames] = useState<{ [key: string]: string }>({})
    const [weedNames, setWeedNames] = useState<{ [key: string]: string }>({})
    const [stageNames, setStageNames] = useState<{ [key: string]: string }>({})
    const { searchOptions, setSearchOptions } = useSearchProperty()

    const [showCropsNames, setShowCropsNames] = useState(true)

    const mapRef = useRef<google.maps.Map | null>(null)

    const [createdMapColors, setCreatedMapColors] = useState(false)
    const [userPosition, setUserPosition] = useState<LatLng | null>(null)

    const [mapColors, setMapColors] = useState([
        {
            color: '#A468AD',
            label: 'SEM PLANTIO',
        },
    ])

    const calculateCenter = (path: LatLng[]) => {
        let lat = 0
        let lng = 0
        path.forEach((coord) => {
            lat += coord.lat
            lng += coord.lng
        })
        lat /= path.length
        lng /= path.length
        return { lat, lng }
    }

    function searchLastCrop(cropId: number) {
        setToast({ text: `Buscando informações`, state: 'loading' })

        axios.get(`/api/properties/read-property-crop-join?crop_id=${cropId}&admin_id=${admin.id}`).then((response) => {
            if (response.data.property_crop_join) {
                setToast({ text: `Lavoura encontrada no último ano agrícola`, state: 'success' })

                router.push(`/dashboard/propriedades/lavoura/${response.data.property_crop_join.id}`)
            } else if (!response.data.property_crop_join) {
                setToast({ text: `Nenhuma informação encontrada`, state: 'warning' })
            } else {
                setToast({ text: `Nenhuma informação encontrada`, state: 'warning' })
            }
        })
    }

    useEffect(() => {
        setPath([])

        crop?.draw_area.split('|||').forEach((item) => {
            const [lat, lng] = item.split(',')

            setPath((prevPath) => [...prevPath, { lat: parseFloat(lat), lng: parseFloat(lng) }])
        })

        centerMap()

        // setando posição do showLoopText com nome da lavoura como false
        // setShowLoopText((prev: any) => ({
        //     ...prev,
        //     actual: false,
        // }))
    }, [crop])

    useEffect(() => {
        // if(crop && crop.color && crop.color != '' && !mapColors.find((color) => color.color == crop.color)){
        //     if(createdMapColors){
        //         return;
        //     }

        //     const cropMap: {color: string, label: string}[] = [];

        //     const culture = dataSeeds.find((seed) => seed.color == crop.color);

        //     if(culture){
        //         cropMap.push({color: crop.color, label: culture.name});
        //     }

        //     setMapColors((prevColors) => [
        //         ...prevColors,
        //         ...cropMap]);
        // }

        if (crops && crops.length > 0 && dataSeeds.length > 0) {
            if (createdMapColors) {
                return
            }

            setCreatedMapColors(true)

            const cropMap: { color: string; label: string }[] = []

            for (const cropLoop of crops) {
                // check if cropLoop.color is already in mapColors
                if (
                    cropLoop.color &&
                    cropLoop.color != '' &&
                    cropMap.findIndex((color) => color.color == cropLoop.color) == -1
                ) {
                    const culture = dataSeeds.find((seed) => seed.color == cropLoop.color)
                    if (culture) {
                        cropMap.push({ color: cropLoop.color, label: culture.name })
                    }
                }
            }

            setMapColors((prevColors) => [...prevColors, ...cropMap])
        }
    }, [crops, dataSeeds, crop])

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY as string,
    })

    useEffect(() => {
        if (isLoaded && monitoringData) {
            monitoringData.diseases.forEach((disease, index) => {
                if (disease.coordinates) {
                    const [lng, lat] = [disease.coordinates?.coordinates[0], disease.coordinates?.coordinates[1]]

                    setDiseaseMarkers((prevMarkers) => [
                        ...prevMarkers,
                        new google.maps.Marker({
                            position: { lat: parseFloat(lat), lng: parseFloat(lng) },
                            title: `Do${index}`,
                        }),
                    ])

                    let text = 'green'

                    switch (disease.risk) {
                        case 1:
                            text = 'red'
                            break
                        case 2:
                            text = 'yellow'
                            break
                        case 3:
                            text = 'green'
                            break
                    }

                    setDiseaseMarkersIcons((prevIcons) => ({
                        ...prevIcons,
                        [index]: text,
                    }))

                    setDiseaseNames((prevNames) => ({
                        ...prevNames,
                        [index]: disease.disease ? disease.disease?.name : '--',
                    }))
                }
            })

            monitoringData.pests.forEach((pest, index) => {
                if (pest.coordinates) {
                    const [lng, lat] = [pest.coordinates?.coordinates[0], pest.coordinates?.coordinates[1]]

                    setPestMarkers((prevMarkers) => [
                        ...prevMarkers,
                        new google.maps.Marker({
                            position: { lat: parseFloat(lat), lng: parseFloat(lng) },
                            title: `Pr${index}`,
                        }),
                    ])

                    let text = 'green'

                    switch (pest.risk) {
                        case 1:
                            text = 'red'
                            break
                        case 2:
                            text = 'yellow'
                            break
                        case 3:
                            text = 'green'
                            break
                    }

                    setPestMarkersIcons((prevIcons) => ({
                        ...prevIcons,
                        [index]: text,
                    }))

                    setPestNames((prevNames) => ({
                        ...prevNames,
                        [index]: pest.pest ? pest.pest?.name : '--',
                    }))
                }
            })

            monitoringData.weeds.forEach((weed, index) => {
                if (weed.coordinates) {
                    const [lng, lat] = [weed.coordinates?.coordinates[0], weed.coordinates?.coordinates[1]]

                    setWeedMarkers((prevMarkers) => [
                        ...prevMarkers,
                        new google.maps.Marker({
                            position: { lat: parseFloat(lat), lng: parseFloat(lng) },
                            title: `Er${index}`,
                        }),
                    ])

                    let text = 'green'

                    switch (weed.risk) {
                        case 1:
                            text = 'red'
                            break
                        case 2:
                            text = 'yellow'
                            break
                        case 3:
                            text = 'green'
                            break
                    }

                    setWeedMarkersIcons((prevIcons) => ({
                        ...prevIcons,
                        [index]: text,
                    }))

                    setWeedNames((prevNames) => ({
                        ...prevNames,
                        [index]: weed.weed ? weed.weed?.name : '--',
                    }))
                }
            })

            monitoringData.stages.map((stage, index) => {
                if (stage.coordinates) {
                    const [lng, lat] = [stage.coordinates?.coordinates[0], stage.coordinates?.coordinates[1]]

                    setStageMarkers((prevMarkers) => [
                        ...prevMarkers,
                        new google.maps.Marker({
                            position: { lat: parseFloat(lat), lng: parseFloat(lng) },
                            title: `E${index}`,
                        }),
                    ])

                    let text = 'green'

                    switch (stage.risk) {
                        case 1:
                            text = 'red'
                            break
                        case 2:
                            text = 'yellow'
                            break
                        case 3:
                            text = 'green'
                            break
                    }

                    setStageMarkersIcons((prevIcons) => ({
                        ...prevIcons,
                        [index]: text,
                    }))

                    setStageNames((prevNames) => ({
                        ...prevNames,
                        [index]: stage.vegetative_age_text ?? stage.reprodutive_age_text ?? '--',
                    }))
                }
            })
        }
    }, [isLoaded])

    const centerMap = async () => {
        if (crop && crop.draw_area && crop.draw_area.split('|||').length > 0) {
            let totalLat = 0
            let totalLng = 0
            const numPoints = crop!.draw_area.split('|||').length

            crop?.draw_area.split('|||').forEach((item) => {
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

    useEffect(() => {
        if (seedOperation && seedOperation.cultures) {
            setDataSeeds(seedOperation.cultures)
        }
    }, [seedOperation])

    return (
        <>
            {isLoaded && (
                <>
                    {/* {tooltipPositions && tooltipText && (
                        <div
                            className={styles.tooltipGeneral}
                            style={{ top: tooltipPositions.y, left: tooltipPositions.x }}>
                            {tooltipText}
                        </div>
                    )} */}

                    {crop && (
                        <div className={styles.cropHectare}>
                            <div className={styles.cropHectareText}>
                                {formatNumberToBR(crop?.area)} {getMetricUnity()}
                            </div>
                        </div>
                    )}

                    <div className={styles.colorLegend}>
                        {mapColors.map((color, index) => (
                            <div key={index} className={styles.legendItem}>
                                <div className={styles.legendColor} style={{ backgroundColor: color.color }} />
                                <div className={styles.legendLabel}>{color.label}</div>
                            </div>
                        ))}
                    </div>

                    <GoogleMap
                        center={!crop && crops && crops.length > 0 ? undefined : mapCenter}
                        mapTypeId='satellite'
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        options={{
                            fullscreenControl: false,
                            streetViewControl: false,
                            mapTypeControl: false,
                            mapTypeId: 'satellite',
                        }}
                        onZoomChanged={() => {
                            if (mapRef.current) {
                                const zoom = mapRef.current?.getZoom()
                                if (zoom && zoom <= 13) {
                                    setShowCropsNames(false)
                                } else {
                                    setShowCropsNames(true)
                                }
                            }
                        }}
                        onLoad={async (map) => {
                            mapRef.current = map

                            if (crop || !crops || (crops && crops.length == 0)) {
                                // await centerMap();
                                // map.setCenter(mapCenter);
                                map.setZoom(15)
                            } else if (crops && crops.length > 0) {
                                // Aqui você tem acesso ao objeto map do Google Maps API
                                const bounds = new google.maps.LatLngBounds()
                                path.forEach((coord) => {
                                    bounds.extend(coord)
                                })
                                // Se houver outros crops
                                crops?.forEach((cropLoop) => {
                                    const cropToUse = cropLoop.crop ?? cropLoop
                                    cropToUse.draw_area.split('|||').forEach((item: string) => {
                                        const [lat, lng] = item.split(',')
                                        if (!isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
                                            bounds.extend(new google.maps.LatLng(parseFloat(lat), parseFloat(lng)))
                                        }
                                    })
                                })
                                map.fitBounds(bounds)
                            }

                            if (navigator.geolocation) {
                                navigator.geolocation.getCurrentPosition((position: GeolocationPosition) => {
                                    const pos = {
                                        lat: position.coords.latitude,
                                        lng: position.coords.longitude,
                                    }

                                    setUserPosition(pos)

                                    if (!crop && (!crops || (crops && crops.length == 0))) {
                                        map.setCenter(pos)
                                    }
                                })
                            }
                        }}>
                        {crop && (
                            <PolygonF
                                paths={path}
                                options={{
                                    strokeWeight: 4,
                                    strokeOpacity: 1,
                                    strokeColor: crop && crop.color ? crop.color : '#A468AD',
                                    fillOpacity: 0.5,
                                    fillColor: crop && crop.color ? crop.color : '#A468AD',
                                }}
                            />
                        )}

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

                        {showCropsNames && (
                            <MarkerF
                                icon={{
                                    url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAA3NCSVQICAjb4U/gAAAACXBIWXMAAABIAAAASABGyWs+AAAAKFBMVEUAAAD///////////////////////////////////////////////////////////////////////////////9bF6XCAAAAAXRSTlMAQObYZgAAABBJREFUGNNjYGBgAAAUAAVzNVTCAAAAAElFTkSuQmCC', // Ícone transparente
                                    size: new google.maps.Size(1, 1),
                                    scaledSize: new google.maps.Size(1, 1),
                                }}
                                position={calculateCenter(path)}
                                label={{
                                    text: crop ? `${crop?.name}` : '',
                                    className: `${styles.markerLabel} `,
                                    color: '#fff',
                                }}
                            />
                        )}

                        {crops &&
                            crops.length > 0 &&
                            crops.map((cropLoop) => {
                                const cropToUse = cropLoop.crop ?? cropLoop
                                if (cropToUse.draw_area && cropToUse.id != crop?.id) {
                                    const pathLoop: LatLng[] = []

                                    cropToUse.draw_area.split('|||').map((item: any) => {
                                        const [lat, lng] = item.split(',')

                                        if (!isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
                                            pathLoop.push({ lat: parseFloat(lat), lng: parseFloat(lng) })
                                        }
                                    })

                                    if (pathLoop) {
                                        return (
                                            <Fragment key={cropToUse.id}>
                                                {showCropsNames && (
                                                    <MarkerF
                                                        icon={{
                                                            url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAA3NCSVQICAjb4U/gAAAACXBIWXMAAABIAAAASABGyWs+AAAAKFBMVEUAAAD///////////////////////////////////////////////////////////////////////////////9bF6XCAAAAAXRSTlMAQObYZgAAABBJREFUGNNjYGBgAAAUAAVzNVTCAAAAAElFTkSuQmCC', // Ícone transparente
                                                            size: new google.maps.Size(1, 1),
                                                            scaledSize: new google.maps.Size(1, 1),
                                                        }}
                                                        position={calculateCenter(pathLoop)}
                                                        label={{
                                                            text: cropToUse.name,
                                                            className: `${styles.markerLabel}`,
                                                            color: '#fff',
                                                        }}
                                                    />
                                                )}
                                                <PolygonF
                                                    paths={pathLoop}
                                                    onClick={
                                                        cropLoop.crop
                                                            ? () => {
                                                                  setSearchOptions({
                                                                      ...searchOptions,
                                                                      crop_id: cropLoop.id,
                                                                  })

                                                                  router.push(
                                                                      `/dashboard/propriedades/lavoura/${cropLoop.id}`,
                                                                  )
                                                              }
                                                            : () => searchLastCrop(cropToUse.id)
                                                    }
                                                    options={{
                                                        strokeWeight: 4,
                                                        strokeOpacity: 1,
                                                        strokeColor: cropLoop.color ?? '#A468AD',
                                                        fillOpacity: 0.5,
                                                        fillColor: cropLoop.color ?? '#A468AD',
                                                    }}
                                                />
                                            </Fragment>
                                        )
                                    }
                                    return null
                                }
                            })}

                        {diseaseMarkers.map((marker, index) => {
                            const position = marker.getPosition()
                            if (position) {
                                return (
                                    <MarkerF
                                        key={marker.getTitle()}
                                        position={position}
                                        title={diseaseNames[index]}
                                        icon={{
                                            url: `/images/map-markers/do-${index + 1}-${
                                                diseaseMarkersIcons[index]
                                            }.png`,
                                            scaledSize: new google.maps.Size(31, 38),
                                        }}
                                    />
                                )
                            }
                            return null
                        })}

                        {pestMarkers.map((marker, index) => {
                            const position = marker.getPosition()
                            if (position) {
                                return (
                                    <MarkerF
                                        key={marker.getTitle()}
                                        position={position}
                                        title={pestNames[index]}
                                        icon={{
                                            url: `/images/map-markers/p-${index + 1}-${pestMarkersIcons[index]}.png`,
                                            scaledSize: new google.maps.Size(31, 38),
                                        }}
                                    />
                                )
                            }
                            return null
                        })}

                        {weedMarkers.map((marker, index) => {
                            const position = marker.getPosition()
                            if (position) {
                                return (
                                    <MarkerF
                                        key={marker.getTitle()}
                                        position={position}
                                        title={weedNames[index]}
                                        icon={{
                                            url: `/images/map-markers/da-${index + 1}-${weedMarkersIcons[index]}.png`,
                                            scaledSize: new google.maps.Size(31, 38),
                                        }}
                                    />
                                )
                            }
                            return null
                        })}

                        {stageMarkers.map((marker, index) => {
                            const position = marker.getPosition()
                            if (position) {
                                return (
                                    <MarkerF
                                        key={marker.getTitle()}
                                        position={position}
                                        title={stageNames[index]}
                                        icon={{
                                            url: `/images/map-markers/e-${index + 1}-${stageMarkersIcons[index]}.png`,
                                            scaledSize: new google.maps.Size(31, 38),
                                        }}
                                    />
                                )
                            }
                            return null
                        })}
                    </GoogleMap>
                </>
            )}
        </>
    )
}

const MapCrop: FC<MapProps> = ({ crop, monitoringData = undefined, crops = [], fullScreen = false }) => {
    return (
        <div className={`${styles.fullMap} ${fullScreen ? styles.fullScreen : ''}`}>
            <GetCropMap crop={crop} monitoringData={monitoringData} crops={crops} />
        </div>
    )
}

export default MapCrop
