import React, { FC, Suspense } from 'react'

// Components
import CardSkeleton from '@/components/loading/CardSkeleton'
import IconifyIcon from '@/components/iconify/IconifyIcon'

// Props
import props from './types'

// Styles
import styles from './styles.module.scss'

const Card: FC<props> = ({ type, title, value, data }) => {
    return (
        <div className={styles.card} data-type={type}>
            <div className={styles.content}>
                <Suspense fallback={<CardSkeleton />}>
                    {type == 'big-data' && (
                        <>
                            <span className={styles.bigNumber} title={`${value}`}>
                                {value}
                            </span>

                            <div className={styles.row}>
                                <h6 title={title}>{title}</h6>
                            </div>
                        </>
                    )}

                    {type == 'collection' && (
                        <>
                            <div className={styles.row}>
                                <h6 title={title}>{title}</h6>
                            </div>

                            <div className={`${styles.grid}`}>
                                {data &&
                                    data.map((data, index) => (
                                        <div key={index} className={styles.item}>
                                            <IconifyIcon icon={data.icon} />

                                            <div className={styles.content}>
                                                <h6 title={data.title}>{data.title}</h6>
                                                <p title={data.value}>{data.value}</p>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </>
                    )}
                </Suspense>
            </div>
        </div>
    )
}
export default Card
