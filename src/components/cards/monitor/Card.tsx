'use client'

import React, { FC, Suspense } from 'react'

// Components
import CardSkeleton from '@/components/loading/CardSkeleton'
import GeralButton from '@/components/buttons/GeralButton'
import IconifyIcon from '@/components/iconify/IconifyIcon'

// Props
import props from './types'

// Styles
import styles from './styles.module.scss'
import LevelTarget from '@/components/elements/LevelTarget'

const Card: FC<props> = ({
    propertyName,
    cityName,
    producerName,
    bugName,
    level,
    urlDetail,
    urlProperty,
    iconItem,
}) => {
    return (
        <div className={styles.card}>
            <div className={styles.content}>
                <Suspense fallback={<CardSkeleton />}>
                    <div className={styles.row}>
                        <span className={styles.title}>{propertyName}</span>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.flexInline}>
                            <IconifyIcon icon='icon-park-outline:local-two' />
                            <p title={cityName}>{cityName}</p>
                        </div>

                        <div className={styles.flexInline}>
                            <IconifyIcon icon='ph:user' />
                            <p title={producerName}>{producerName}</p>
                        </div>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.flexInline}>
                            <IconifyIcon icon='ph:siren' />

                            <div className={styles.flexInline}>
                                <p>Nível</p>
                                <LevelTarget color={level} defaultLevel={true} />
                            </div>
                        </div>

                        <div className={styles.flexInline}>
                            <IconifyIcon icon={iconItem} />
                            <p title={bugName}>{bugName}</p>
                        </div>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.flexInline}>
                            <GeralButton variant='primary' smaller={true} href={urlDetail}>
                                Detalhes
                            </GeralButton>
                            <GeralButton variant='tertiary' smaller={true} href={urlProperty}>
                                Ver lavoura
                            </GeralButton>
                        </div>
                    </div>
                </Suspense>
            </div>
        </div>
    )
}
export default Card
