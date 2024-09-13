import PropertyCropDisease from '@/@types/PropertyCropDisease'
import PropertyCropObservationProps from '@/@types/PropertyCropObservation'
import PropertyCropPest from '@/@types/PropertyCropPest'
import PropertyCropStageProps from '@/@types/PropertyCropStage'
import PropertyCropWeed from '@/@types/PropertyCropWeed'
import styles from '@/app/dashboard/properties/styles.module.scss'
import LevelTarget from '@/components/elements/LevelTarget'
import Fancybox from '@/components/fancybox/Fancybox'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import GeralModal from '@/components/modal/GeralModal'
import GeralTable from '@/components/tables/GeralTable'
import tableStyles from '@/components/tables/styles.module.scss'
import TablePagination from '@/components/tables/TablePagination'
import TableRow from '@/components/tables/TableRow'
import { useAdmin } from '@/context/AdminContext'
import { formatNumberToBR, getActualDateWithHour, getNumber, getStageName } from '@/utils/formats'
import getFetch from '@/utils/getFetch'
import Image from 'next/image'
import { useRouter } from 'nextjs-toploader/app'
import { FC, useEffect, useState } from 'react'
import useSWR, { mutate } from 'swr'
import fitoBrand from '../../../../public/brand/new-logo.png'
import Loading from '../loading'
import dropdownStyles from '../styles.module.scss'
import { ReportTableProps } from './types.d'

export const MonitoringTable: FC<ReportTableProps> = ({ currentQuery, setUrl }) => {
    const headers = ['#', 'Propriedade', 'Lavoura', 'Cultura', 'Cultivar', 'Ano Agrícola', '']
    const style = `0.3fr 1.2fr 1fr 0.5fr 0.7fr 0.5fr  0.01fr`

    const headersMerged = ['Data', 'Estádio', 'Doenças', 'Pragas', 'Daninhas', 'Obs.', '']
    const styleMerged = `0.4fr 0.6fr repeat(4, 1fr) 0.01fr`
    const tableIcons = ['', 'ph:plant', 'fluent:briefcase-medical-32-regular', 'bx:bug', 'ci:leaf', 'ph:info', '']

    const [rowOpen, setRowOpen] = useState<{ [key: number]: boolean }>({})

    const { admin } = useAdmin()

    const [pageNumbers, setPageNumbers] = useState(0)
    const [activePage, setActivePage] = useState(1)
    const router = useRouter()

    const [textObservation, setTextObservation] = useState('')
    const [showObservationModal, setShowObservationModal] = useState(false)
    const [imagesObservation, setImageObservation] = useState<any[] | undefined>([])
    const [imagePath, setImagePath] = useState('')

    let pageParam = currentQuery.includes('?') ? `&page=${activePage}` : `?page=${activePage}`

    const { data, isLoading } = useSWR(`/api/reports/list/${admin.id}/monitoring${currentQuery}${pageParam}`, getFetch)

    const handlePageChange = (index: number) => {
        const timeout = setTimeout(() => {
            setActivePage(index)
            clearTimeout(timeout)
        }, 100)
    }

    useEffect(() => {
        setActivePage(1)
        pageParam = currentQuery.includes('?') ? `&page=${activePage}` : `?page=${activePage}`

        const url = `/api/reports/list/${admin.id}/monitoring${currentQuery}${pageParam}`
        setUrl(url)
        mutate(url)
    }, [currentQuery])

    useEffect(() => {
        if (data) {
            const total = data.total
            setPageNumbers(Math.ceil(total / 20))
        }
    }, [data])

    useEffect(() => {
        if (data && data.reports) {
            const initialEditState: { [key: number]: boolean } = {}

            data.reports.forEach((report: any) => {
                initialEditState[report.id] = rowOpen[report.id] ?? true
            })

            setRowOpen(initialEditState)
        }
    }, [data])

    const changeRowOpen = (id: number) => {
        setRowOpen((prevStates) => ({
            ...prevStates,
            [id]: !prevStates[id],
        }))
    }

    if (isLoading) {
        return <Loading />
    }

    return (
        <>
            <div className={`${styles.boxHeader} ${styles.pressBoxHeader}`}>
                <Image src={fitoBrand} height={50} width={126} alt='Logo Fito Agrícola' priority />
                <p>
                    {getActualDateWithHour()}
                    <br />
                    Fito Consultoria Agrícola Ltda. Av. Nívio Castelano, 849 - Centro.
                    <br />
                    Lagoa Vermelha - RS.
                </p>
            </div>
            <GeralTable headers={headers} gridColumns={style} customClasses={[tableStyles.reportTable]}>
                {data && data.reports ? (
                    data.reports.map((item: any, index: number) => (
                        <div
                            key={item.id}
                            className={`${dropdownStyles.withDropdown} ${
                                rowOpen[item.id] ? dropdownStyles.opened : ''
                            }`}>
                            <div
                                className={dropdownStyles.dropdownInfo}
                                style={{ cursor: 'pointer' }}
                                onClick={() => changeRowOpen(item.id)}>
                                <TableRow key={`parent-${item.id}-${index}`} gridColumns={style}>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <IconifyIcon icon='lucide:chevron-down' />
                                        <p>{activePage > 1 ? getNumber(index, activePage) : index + 1}</p>
                                    </div>
                                    <div data-type='content'>
                                        <p title={item.property?.name}>{item.property?.name}</p>
                                    </div>

                                    <div data-type='content'>
                                        <p
                                            title='Clique para ir para a página detalhes da lavoura'
                                            className={`${tableStyles.linkWrap} `}
                                            onClick={() => router.push(`/dashboard/propriedades/lavoura/${item?.id}`)}>
                                            <LevelTarget
                                                customClass='darker'
                                                color={1}
                                                defaultLevel={false}
                                                text={`${item.crop?.name} ${item.subharvest_name ?? ''}`}
                                            />
                                            {/* {item.crop?.name} */}
                                        </p>
                                    </div>
                                    <div data-type='content'>
                                        <div
                                            title={item.culture_table.replaceAll('<br>', '')}
                                            dangerouslySetInnerHTML={{ __html: item.culture_table }}></div>
                                    </div>

                                    <div data-type='content'>
                                        <div
                                            title={item.culture_code_table.replaceAll('<br>', '')}
                                            dangerouslySetInnerHTML={{ __html: item.culture_code_table }}></div>
                                    </div>
                                    <div data-type='content'>
                                        <p title={item.harvest.name}>{item.harvest.name}</p>
                                    </div>
                                </TableRow>
                            </div>
                            {rowOpen[item.id] && (
                                <div className={`${dropdownStyles.dropdownMenu} ${dropdownStyles.panelDropdown}`}>
                                    <GeralTable
                                        customClasses={[tableStyles.dropdownPanel]}
                                        headers={headersMerged}
                                        gridColumns={styleMerged}
                                        headersIcons={tableIcons}>
                                        {Object.keys(item.management_data).map((itemNested: any) => (
                                            <TableRow key={`nested-${item.id}-${itemNested}`} gridColumns={styleMerged}>
                                                <div data-type='content'>
                                                    <p title={itemNested.replaceAll('-', '/')}>
                                                        {itemNested.replaceAll('-', '/')}
                                                    </p>
                                                </div>

                                                <div data-type='content' className={tableStyles.flexContent}>
                                                    {item.management_data[itemNested].stages.map(
                                                        (stage: PropertyCropStageProps, index: number) => (
                                                            <button
                                                                key={stage.id}
                                                                style={{ background: 'none', border: 'none' }}
                                                                type='button'
                                                                onClick={() => {
                                                                    setTextObservation(`
                                                                        ${getStageName(stage)}
                                                                        ${
                                                                            stage.vegetative_age_text
                                                                                ? ` - ${stage.vegetative_age_text}`
                                                                                : ''
                                                                        }
                                                                        ${
                                                                            stage.reprodutive_age_text
                                                                                ? ` - ${stage.reprodutive_age_text}`
                                                                                : ''
                                                                        }
                                                                    `)
                                                                    setShowObservationModal(true)
                                                                    setImagePath('property_crop_stages')
                                                                    setImageObservation(stage.images)
                                                                }}
                                                                title='Clique para visualizar o estádio'>
                                                                <LevelTarget
                                                                    key={`${itemNested}-stage-${stage.id}-${index}`}
                                                                    galleryIndex={`${itemNested}-stage-${stage.id}-${index}`}
                                                                    color={stage.risk}
                                                                    defaultLevel={false}
                                                                    text={getStageName(stage)}
                                                                    images={stage.images}
                                                                    stage={stage}
                                                                    imagePath='property_crop_stages'
                                                                />
                                                            </button>
                                                        ),
                                                    )}
                                                </div>

                                                <div data-type='content' className={tableStyles.flexContent}>
                                                    {item.management_data[itemNested].diseases.map(
                                                        (disease: PropertyCropDisease, index: number) => (
                                                            <LevelTarget
                                                                key={`${disease.disease?.name}-${disease.id}-${index}`}
                                                                color={disease.risk}
                                                                defaultLevel={false}
                                                                text={`${disease.disease?.name}${
                                                                    disease.incidency > 0
                                                                        ? ` - ${formatNumberToBR(disease.incidency)}%`
                                                                        : ''
                                                                }`}
                                                                images={disease.images}
                                                                imagePath='property_crop_diseases'
                                                            />
                                                        ),
                                                    )}
                                                </div>
                                                <div data-type='content' className={tableStyles.flexContent}>
                                                    {item.management_data[itemNested].pests.map(
                                                        (pest: PropertyCropPest, index: number) => (
                                                            <LevelTarget
                                                                key={`${pest.pest?.name}-${pest.id}-${index}`}
                                                                color={pest.risk}
                                                                defaultLevel={false}
                                                                text={`${pest.pest?.name} ${
                                                                    pest.incidency > 0
                                                                        ? ` - ${formatNumberToBR(pest.incidency)}%`
                                                                        : ''
                                                                }
                                                                ${
                                                                    pest.quantity_per_meter > 0
                                                                        ? `<br>${formatNumberToBR(
                                                                              pest.quantity_per_meter,
                                                                          )}/m`
                                                                        : ''
                                                                }${
                                                                    pest.quantity_per_square_meter > 0
                                                                        ? `<br>${formatNumberToBR(
                                                                              pest.quantity_per_square_meter,
                                                                          )}/m2`
                                                                        : ''
                                                                }`}
                                                                images={pest.images}
                                                                imagePath='property_crop_pests'
                                                            />
                                                        ),
                                                    )}
                                                </div>
                                                <div data-type='content' className={tableStyles.flexContent}>
                                                    {item.management_data[itemNested].weeds.map(
                                                        (weed: PropertyCropWeed, index: number) => (
                                                            <LevelTarget
                                                                key={`${weed.weed?.name}-${weed.id}-${index}`}
                                                                color={weed.risk}
                                                                defaultLevel={false}
                                                                text={weed.weed?.name}
                                                                images={weed.images}
                                                                imagePath='property_crop_weeds'
                                                            />
                                                        ),
                                                    )}
                                                </div>

                                                <div data-type='content' className={tableStyles.flexContent}>
                                                    {item.management_data[itemNested].observations.map(
                                                        (observation: PropertyCropObservationProps, index: number) => (
                                                            <button
                                                                key={observation.id}
                                                                style={{ background: 'none', border: 'none' }}
                                                                type='button'
                                                                onClick={() => {
                                                                    setTextObservation(observation.observations)
                                                                    setShowObservationModal(true)
                                                                    setImagePath('property_crop_observations')
                                                                    setImageObservation(observation.images)
                                                                }}
                                                                title='Clique para visualizar a observação'>
                                                                <LevelTarget
                                                                    key={`${itemNested}-observation-${observation.id}-${index}`}
                                                                    galleryIndex={`${itemNested}-observation-${observation.id}-${index}`}
                                                                    color={observation.risk}
                                                                    defaultLevel={false}
                                                                    text={
                                                                        observation.risk == 1
                                                                            ? 'Sem risco'
                                                                            : observation.risk == 2
                                                                              ? 'Atenção'
                                                                              : 'Urgência'
                                                                    }
                                                                    images={observation.images}
                                                                    imagePath='property_crop_observations'
                                                                />
                                                            </button>
                                                        ),
                                                    )}
                                                </div>
                                            </TableRow>
                                        ))}
                                    </GeralTable>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <p>Nenhum dado encontrado</p>
                )}

                <TablePagination
                    alignLeft={true}
                    pages={pageNumbers}
                    onPageChange={handlePageChange}
                    active={activePage}
                />
            </GeralTable>

            <GeralModal
                title={`Visualizar item`}
                show={showObservationModal}
                setShow={() => {
                    setShowObservationModal(false)
                    setTextObservation('')
                }}>
                <div style={{ marginTop: '10px' }}>
                    <hr />
                    <h3 dangerouslySetInnerHTML={{ __html: textObservation }} />

                    <Fancybox>
                        <div className={styles.imagesObservation}>
                            {imagesObservation?.map((image: any, index: number) => (
                                <a
                                    key={`observation-image-${index + 1}`}
                                    data-fancybox='gallery'
                                    href={`${process.env.NEXT_PUBLIC_IMAGE_URL}/${imagePath}/${image.image}`}>
                                    <Image
                                        src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/${imagePath}/${image.image}`}
                                        alt={`Imagem ${index}`}
                                        loading='lazy'
                                        fill
                                        style={{ width: '100%', height: 'auto', marginBottom: '10px' }}
                                    />
                                </a>
                            ))}
                        </div>
                    </Fancybox>
                </div>
            </GeralModal>
        </>
    )
}
