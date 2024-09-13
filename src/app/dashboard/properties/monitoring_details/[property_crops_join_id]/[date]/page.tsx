'use client'

import { useEffect, useState } from 'react'

import PropertyCropDisease from '@/@types/PropertyCropDisease'
import PropertyCropObservation from '@/@types/PropertyCropObservation'
import PropertyCropPest from '@/@types/PropertyCropPest'
import { default as PropertyCropStage, default as PropertyCropStageProps } from '@/@types/PropertyCropStage'
import PropertyCropWeed from '@/@types/PropertyCropWeed'
import Loading from '@/app/dashboard/loading'
import { Crop, Harvest, Property } from '@/app/dashboard/properties/types'
import GeralBox from '@/components/box/GeralBox'
import Breadcrumb from '@/components/breadcrumb/Breadcrumb'
import GeralButton from '@/components/buttons/GeralButton'
import LevelTarget from '@/components/elements/LevelTarget'
import Fancybox from '@/components/fancybox/Fancybox'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import ElementSkeleton from '@/components/loading/ElementSkeleton'
import GeralModal from '@/components/modal/GeralModal'
import GeralTable from '@/components/tables/GeralTable'
import TableRow from '@/components/tables/TableRow'
import GeralTab from '@/components/tabs/GeralTab'
import { useAdmin } from '@/context/AdminContext'
import { useNotification } from '@/context/ToastContext'
import { formatDateToDDMMYYYY, formatMinDateToDDMMYY, formatNumberToBR, getStageName } from '@/utils/formats'
import getFetch from '@/utils/getFetch'
import WriteLog from '@/utils/logger'
import updateStatus from '@/utils/updateStatus'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useRouter } from 'nextjs-toploader/app'
import useSWR from 'swr'
import styles from '../../../styles.module.scss'

const MapCrop = dynamic(() => import('../../../crop/[property_crop_join_id]/map_crop'), {
    ssr: false,
    loading: () => <ElementSkeleton />,
})

const tableHeaders = ['Data', 'Estádio', 'Doença', 'Praga', 'Daninha', 'Responsável', '']
const tableIcons = ['', 'ph:plant', 'fluent:briefcase-medical-32-regular', 'bx:bug', 'ci:leaf', '', '']

export default function MonitoringDetails() {
    const pathname = usePathname()
    const splitPathname = pathname.split('/')
    const cropId = parseInt(splitPathname[splitPathname.length - 2])
    const date = splitPathname[splitPathname.length - 1]
    const { setToast } = useNotification()
    const { data, isLoading, error } = useSWR(`/api/properties/monitoring/read/${cropId}/${date}`, getFetch)

    const { admin } = useAdmin()
    const [showDeleteCultureModal, setShowDeleteCultureModal] = useState(false)
    const router = useRouter()

    const [property, setProperty] = useState<Property>()
    const [harvest, setHarvest] = useState<Harvest>()
    const [crop, setCrop] = useState<Crop>()

    const deleteMonitoring = async () => {
        try {
            setToast({ text: `Excluindo monitoramentos`, state: 'loading' })

            await updateStatus(
                '/api/properties/monitoring/delete',
                admin.id,
                date,
                date,
                'date',
                'property_crop_join_id',
                cropId,
            ).then(() => {
                setShowDeleteCultureModal(false)

                setToast({ text: `Monitoramentos removidos`, state: 'success' })

                router.push(`/dashboard/propriedades/lavoura/${cropId}`)
            })
        } catch (error: any) {
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }

    useEffect(() => {
        if (data) {
            setProperty({
                id: data.property.id,
                name: data.property.name,
            })

            setHarvest({
                name: data.harvest.name,
                isLastHarvert: data.harvest.isLastHarvert,
            })

            setCrop({
                id: data.crop.id,
                name: data.crop.name,
                area: data.crop.area,
                city: data.crop.city,
                draw_area: data.crop.draw_area,
                kml_file: data.crop.kml_file,
            })
        }
    }, [data, isLoading])

    useEffect(() => {
        if (typeof error != 'undefined') {
            WriteLog(error, 'error')

            if (process.env.NEXT_PUBLIC_SHOW_TOAST_FETCH_ERROR == 'true') {
                setToast({ text: `Falha ao obter dados do monitoramento`, state: 'danger' })
            }
        }
    }, [error])

    if (isLoading) {
        return <Loading />
    }

    return (
        <div className={styles.cropContainer}>
            <Breadcrumb
                links={[
                    {
                        name: `Propriedades`,
                        url: `/dashboard/propriedades`,
                    },
                    {
                        name: `${property?.name} - Ano agrícola ${
                            harvest?.isLastHarvert ? `atual - ${harvest?.name}` : harvest?.name
                        }`,
                        url: `/dashboard/propriedades/${property?.id}`,
                    },
                    {
                        name: `Monitoramento`,
                        url: `/dashboard/propriedades/lavoura/${cropId}`,
                    },
                ]}
            />

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ease: 'easeIn' }}>
                <GeralBox variant='page'>
                    <div className={styles.boxHeader}>
                        <h1>Monitoramento #{formatDateToDDMMYYYY(date)}</h1>

                        <div className={styles.geralBoxButtons}>
                            <GeralButton
                                variant='delete'
                                round
                                small
                                smallIcon
                                onClick={() => {
                                    setShowDeleteCultureModal(!showDeleteCultureModal)
                                }}>
                                <IconifyIcon icon='prime:trash' />
                            </GeralButton>
                        </div>
                    </div>

                    <GeralTab
                        headers={[{ id: 'resumo-geral', name: 'Resumo geral' }]}
                        selectedId='resumo-geral'
                        onButtonClick={() => {}}
                    />

                    <GeralTable
                        headers={tableHeaders}
                        headersIcons={tableIcons}
                        gridColumns={`1fr 1fr 1fr 1fr 1fr 1fr 0.01fr`}>
                        {data ? (
                            <TableRow key={date} gridColumns={`1fr 1fr 1fr 1fr 1fr 1fr 0.01fr`}>
                                <div className='mb-auto' data-type='content'>
                                    <p>{formatMinDateToDDMMYY(date)}</p>
                                </div>

                                <div data-type='content'>
                                    <div className={styles.contentWrap}>
                                        {data.stages.map((stage: PropertyCropStageProps, index: number) => (
                                            <LevelTarget
                                                key={`stage-${stage.id}-${index}`}
                                                color={stage.risk}
                                                defaultLevel={false}
                                                text={getStageName(stage)}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div data-type='content'>
                                    <div className={styles.contentWrap}>
                                        {data.diseases.map((disease: PropertyCropDisease, index: number) => (
                                            <LevelTarget
                                                key={`disease-${disease.id}-risk-target`}
                                                color={disease.risk}
                                                defaultLevel={false}
                                                text={`Doença ${index + 1}`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div data-type='content'>
                                    <div className={styles.contentWrap}>
                                        {data.pests.map((pest: PropertyCropPest, index: number) => (
                                            <LevelTarget
                                                key={`pests-${pest.id}-risk-target`}
                                                color={pest.risk}
                                                defaultLevel={false}
                                                text={`Praga ${index + 1}`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div data-type='content'>
                                    <div className={styles.contentWrap}>
                                        {data.weeds.map((weed: PropertyCropWeed, index: number) => (
                                            <LevelTarget
                                                key={`weed-${weed.id}-risk-target`}
                                                color={weed.risk}
                                                defaultLevel={false}
                                                text={`Daninha ${index + 1}`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div data-type='content'>
                                    <p>{data.admin ? data.admin?.name : '--'}</p>
                                </div>
                            </TableRow>
                        ) : (
                            ''
                        )}

                        {(!data || data.length == 0) && (
                            <TableRow emptyString='Nenhum dado encontrado' columnsCount={1} />
                        )}
                    </GeralTable>

                    <h2 className={styles.titleFlex}>
                        <IconifyIcon icon='ph:map-trifold' />
                        Mapa
                    </h2>

                    {crop ? <MapCrop crop={crop} monitoringData={data} /> : 'Carregando mapa'}

                    <div className={styles.monitoringGroup}>
                        <GeralTab
                            customClasses={[styles.biggerFont]}
                            headers={[{ id: 'estadio', name: 'Estádio' }]}
                            selectedId='estadio'
                            onButtonClick={() => {}}
                        />

                        {data.stages?.length > 0
                            ? data.stages?.map((stage: PropertyCropStage, index: number) => (
                                  <div className={styles.monitoringGroupItem} key={`stage-${stage.id}`}>
                                      <h2 className={styles.titleFlex}>
                                          <IconifyIcon icon='ph:file' />
                                          Informações - Estádio #{index + 1}
                                      </h2>

                                      <div className={styles.monitoringGroupItemInfos}>
                                          <div className={styles.item}>
                                              <p>Idade vegetativa</p>
                                              <p>{stage.vegetative_age_value}</p>
                                          </div>

                                          <div className={styles.item}>
                                              <p>Idade reprodutiva</p>
                                              <p>{stage.reprodutive_age_value}</p>
                                          </div>

                                          <div className={styles.item}>
                                              <p>Nível de risco</p>
                                              <LevelTarget color={stage.risk} defaultLevel={true} />
                                          </div>
                                      </div>

                                      {stage.images?.length && stage.images.length > 0 && (
                                          <>
                                              <h2 className={styles.titleFlex}>
                                                  <IconifyIcon icon='ph:image' />
                                                  Imagens - Estádio #{index + 1}
                                              </h2>

                                              <Fancybox
                                                  options={{
                                                      Carousel: {
                                                          infinite: false,
                                                      },
                                                  }}>
                                                  <div className={styles.monitoringImages}>
                                                      {stage.images.map((image) => (
                                                          <div
                                                              key={`image-${image.id}`}
                                                              data-fancybox={`gallery-stage-${stage.id}`}
                                                              data-src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/property_crop_stages/${image.image}`}
                                                              className={styles.monitoringImage}>
                                                              <Image
                                                                  src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/property_crop_stages/${image.image}`}
                                                                  alt='Imagem'
                                                                  loading='lazy'
                                                                  quality={30}
                                                                  height={110}
                                                                  width={110}
                                                              />
                                                          </div>
                                                      ))}
                                                  </div>
                                              </Fancybox>
                                          </>
                                      )}

                                      {index != data.stages.length - 1 && <div className={styles.dashedDivider} />}
                                  </div>
                              ))
                            : 'Nenhum estádio'}
                    </div>

                    <div className={styles.monitoringGroup}>
                        <GeralTab
                            customClasses={[styles.biggerFont]}
                            headers={[{ id: 'doenca', name: 'Doença' }]}
                            selectedId='doenca'
                            onButtonClick={() => {}}
                        />

                        {data.diseases?.length > 0
                            ? data.diseases.map((disease: PropertyCropDisease, index: number) => (
                                  <div className={styles.monitoringGroupItem} key={`disease-${disease.id}`}>
                                      <h2 className={styles.titleFlex}>
                                          <IconifyIcon icon='ph:file' />
                                          Informações - Doença #{index + 1}
                                      </h2>

                                      <div className={styles.monitoringGroupItemInfos}>
                                          <div className={styles.item}>
                                              <p>Doença</p>
                                              <p>{disease.disease?.name}</p>
                                          </div>

                                          <div className={styles.item}>
                                              <p>Incidência</p>
                                              <p>{formatNumberToBR(disease.incidency)}%</p>
                                          </div>

                                          <div className={styles.item}>
                                              <p>Nível de risco</p>
                                              <LevelTarget color={disease.risk} defaultLevel={true} />
                                          </div>
                                      </div>

                                      {disease.images?.length && disease.images.length > 0 && (
                                          <>
                                              <h2 className={styles.titleFlex}>
                                                  <IconifyIcon icon='ph:image' />
                                                  Imagens - Doença #{index + 1}
                                              </h2>
                                              <Fancybox
                                                  options={{
                                                      Carousel: {
                                                          infinite: false,
                                                      },
                                                  }}>
                                                  <div className={styles.monitoringImages}>
                                                      {disease.images.map((image) => (
                                                          <div
                                                              key={`image-${image.id}`}
                                                              data-fancybox={`gallery-disease-${disease.id}`}
                                                              data-src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/property_crop_diseases/${image.image}`}
                                                              className={styles.monitoringImage}>
                                                              <Image
                                                                  src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/property_crop_diseases/${image.image}`}
                                                                  alt='Imagem'
                                                                  loading='lazy'
                                                                  quality={30}
                                                                  height={110}
                                                                  width={110}
                                                              />
                                                          </div>
                                                      ))}
                                                  </div>
                                              </Fancybox>
                                          </>
                                      )}

                                      {index != data.diseases.length - 1 && <div className={styles.dashedDivider} />}
                                  </div>
                              ))
                            : 'Nenhuma doença'}
                    </div>

                    <div className={styles.monitoringGroup}>
                        <GeralTab
                            customClasses={[styles.biggerFont]}
                            headers={[{ id: 'praga', name: 'Praga' }]}
                            selectedId='praga'
                            onButtonClick={() => {}}
                        />

                        {data.pests?.length > 0
                            ? data.pests.map((pest: PropertyCropPest, index: number) => (
                                  <div className={styles.monitoringGroupItem} key={`pest-${pest.id}`}>
                                      <h2 className={styles.titleFlex}>
                                          <IconifyIcon icon='ph:file' />
                                          Informações - Peste #{index + 1}
                                      </h2>

                                      <div className={styles.monitoringGroupItemInfos}>
                                          <div className={styles.item}>
                                              <p>Peste</p>
                                              <p>{pest.pest?.name}</p>
                                          </div>

                                          <div className={styles.item}>
                                              <p>Incidência</p>
                                              <p>{formatNumberToBR(pest.incidency)}%</p>
                                          </div>

                                          <div className={styles.item}>
                                              <p>Nível de risco</p>
                                              <LevelTarget color={pest.risk} defaultLevel={true} />
                                          </div>

                                          <div className={styles.item}>
                                              <p>Qtd. / m. linear</p>
                                              <p>{formatNumberToBR(pest.quantity_per_meter)}m</p>
                                          </div>

                                          <div className={styles.item}>
                                              <p>Qtd. / m2</p>
                                              <p>{formatNumberToBR(pest.quantity_per_square_meter)}m²</p>
                                          </div>
                                      </div>

                                      {pest.images?.length && pest.images.length > 0 && (
                                          <>
                                              <h2 className={styles.titleFlex}>
                                                  <IconifyIcon icon='ph:image' />
                                                  Imagens - Peste #{index + 1}
                                              </h2>

                                              <Fancybox
                                                  options={{
                                                      Carousel: {
                                                          infinite: false,
                                                      },
                                                  }}>
                                                  <div className={styles.monitoringImages}>
                                                      {pest.images.map((image) => (
                                                          <div
                                                              key={`image-${image.id}`}
                                                              data-fancybox={`gallery-pest-${pest.id}`}
                                                              data-src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/property_crop_pests/${image.image}`}
                                                              className={styles.monitoringImage}>
                                                              <Image
                                                                  src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/property_crop_pests/${image.image}`}
                                                                  alt='Imagem'
                                                                  loading='lazy'
                                                                  quality={30}
                                                                  height={110}
                                                                  width={110}
                                                              />
                                                          </div>
                                                      ))}
                                                  </div>
                                              </Fancybox>
                                          </>
                                      )}

                                      {index != data.pests.length - 1 && <div className={styles.dashedDivider} />}
                                  </div>
                              ))
                            : 'Nenhuma praga'}
                    </div>

                    <div className={styles.monitoringGroup}>
                        <GeralTab
                            customClasses={[styles.biggerFont]}
                            headers={[{ id: 'daninha', name: 'Daninha' }]}
                            selectedId='daninha'
                            onButtonClick={() => {}}
                        />

                        {data.weeds?.length > 0
                            ? data.weeds.map((weed: PropertyCropWeed, index: number) => (
                                  <div className={styles.monitoringGroupItem} key={`weed-${weed.id}`}>
                                      <h2 className={styles.titleFlex}>
                                          <IconifyIcon icon='ph:file' />
                                          Informações - Daninha #{index + 1}
                                      </h2>

                                      <div className={styles.monitoringGroupItemInfos}>
                                          <div className={styles.item}>
                                              <p>Daninha</p>
                                              <p>{weed.weed?.name}</p>
                                          </div>

                                          <div className={styles.item}>
                                              <p>Nível de risco</p>
                                              <LevelTarget color={weed.risk} defaultLevel={true} />
                                          </div>
                                      </div>

                                      {weed.images?.length && weed.images.length > 0 && (
                                          <>
                                              <h2 className={styles.titleFlex}>
                                                  <IconifyIcon icon='ph:image' />
                                                  Imagens - Daninha #{index + 1}
                                              </h2>

                                              <Fancybox
                                                  options={{
                                                      Carousel: {
                                                          infinite: false,
                                                      },
                                                  }}>
                                                  <div className={styles.monitoringImages}>
                                                      {weed.images.map((image) => (
                                                          <div
                                                              key={`image-${image.id}`}
                                                              data-fancybox={`gallery-weed-${weed.id}`}
                                                              data-src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/property_crop_weeds/${image.image}`}
                                                              className={styles.monitoringImage}>
                                                              <Image
                                                                  src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/property_crop_weeds/${image.image}`}
                                                                  alt='Imagem'
                                                                  loading='lazy'
                                                                  quality={30}
                                                                  height={110}
                                                                  width={110}
                                                              />
                                                          </div>
                                                      ))}
                                                  </div>
                                              </Fancybox>
                                          </>
                                      )}

                                      {index != data.weeds.length - 1 && <div className={styles.dashedDivider} />}
                                  </div>
                              ))
                            : 'Nenhuma daninha'}
                    </div>

                    <div className={styles.monitoringGroup}>
                        <GeralTab
                            customClasses={[styles.biggerFont]}
                            headers={[{ id: 'observacao', name: 'Observação' }]}
                            selectedId='observacao'
                            onButtonClick={() => {}}
                        />

                        {data.observations?.length > 0
                            ? data.observations.map((observation: PropertyCropObservation, index: number) => (
                                  <div className={styles.monitoringGroupItem} key={`observation-${observation.id}`}>
                                      <h2 className={styles.titleFlex}>
                                          <IconifyIcon icon='ph:file' />
                                          Informações - Observação #{index + 1}
                                      </h2>

                                      <div className={styles.monitoringGroupItemInfos}>
                                          <div className={styles.item}>
                                              <p>Nível de risco</p>
                                              <LevelTarget color={observation.risk} defaultLevel={true} />
                                          </div>
                                          <div className={styles.item}>
                                              <p>Observação</p>
                                              <p>{observation.observations}</p>
                                          </div>
                                      </div>

                                      {observation.images?.length && observation.images.length > 0 && (
                                          <>
                                              <h2 className={styles.titleFlex}>
                                                  <IconifyIcon icon='ph:image' />
                                                  Imagens - Observação #{index + 1}
                                              </h2>

                                              <Fancybox
                                                  options={{
                                                      Carousel: {
                                                          infinite: false,
                                                      },
                                                  }}>
                                                  <div className={styles.monitoringImages}>
                                                      {observation.images.map((image) => (
                                                          <div
                                                              key={`image-${image.id}`}
                                                              data-fancybox={`gallery-observation-${observation.id}`}
                                                              data-src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/property_crop_observations/${image.image}`}
                                                              className={styles.monitoringImage}>
                                                              <Image
                                                                  src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/property_crop_observations/${image.image}`}
                                                                  alt='Imagem'
                                                                  loading='lazy'
                                                                  quality={30}
                                                                  height={110}
                                                                  width={110}
                                                              />
                                                          </div>
                                                      ))}
                                                  </div>
                                              </Fancybox>
                                          </>
                                      )}

                                      {index != data.observations.length - 1 && (
                                          <div className={styles.dashedDivider} />
                                      )}
                                  </div>
                              ))
                            : 'Nenhuma observação'}
                    </div>
                </GeralBox>
            </motion.div>

            <GeralModal
                small
                isDelete
                deleteName={`todos os monitoramentos da data ${formatDateToDDMMYYYY(date)}?`}
                deleteFunction={deleteMonitoring}
                show={showDeleteCultureModal}
                setShow={setShowDeleteCultureModal}
                title='Excluir monitoramentos'
            />
        </div>
    )
}
