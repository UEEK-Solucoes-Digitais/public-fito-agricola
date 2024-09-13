'use client'

import styles from '@/app/dashboard/properties/styles.module.scss'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import { useAdmin } from '@/context/AdminContext'
import { formatNumberToBR } from '@/utils/formats'
import getFetch from '@/utils/getFetch'
import { getMetricUnity } from '@/utils/getMetricUnity'
import { FC, useState } from 'react'
import useSWR from 'swr'
import productivityStyles from './productivity.module.scss'
import { ReportTableProps } from './types.d'

export const ProductivityGraph: FC<ReportTableProps> = ({ currentQuery }) => {
    const { admin } = useAdmin()
    const { data, isLoading } = useSWR(`/api/reports/list/${admin.id}/productivity-graph${currentQuery}`, getFetch)

    const [keyToUse, setKeyToUse] = useState('productivity_per_hectare')
    const [textToUse, setTextToUse] = useState('kg')

    function getWidth(key: string, type: number, key_culture?: string) {
        if (data && data.reports?.cultures) {
            // Encontrar o máximo entre todas as culturas
            const cultureMax = Math.max.apply(
                null,
                Object.keys(data.reports.cultures).map((key: any) => data.reports.cultures[key][keyToUse]),
            )

            // Encontrar o máximo entre todos os códigos de cada cultura
            const codeMaxes = Object.keys(data.reports.cultures).map((key: any) => {
                const codes = data.reports.cultures[key].codes
                if (codes) {
                    return Math.max.apply(
                        null,
                        Object.keys(codes).map((codeKey: any) => codes[codeKey][keyToUse]),
                    )
                }
                return 0
            })

            // O máximo geral é o maior entre os maximos das culturas e dos códigos
            const max = Math.max(cultureMax, ...codeMaxes)

            // Calcula a largura com base no máximo geral
            if (type == 1) {
                return `${(data.reports.cultures[key][keyToUse] * 100) / max}%`
            } else if (type !== 1 && key_culture) {
                return `${(data.reports.cultures[key].codes[key_culture][keyToUse] * 100) / max}%`
            }
        }
    }

    return (
        <>
            <div className={`${styles.defaultBorderContentBox} ${styles.smaller}`} style={{ boxShadow: 'none' }}>
                {isLoading ? (
                    <IconifyIcon icon='line-md:loading-loop' />
                ) : (
                    <>
                        {Object.keys(data.reports.cultures).length > 0 ? (
                            <>
                                <div className={styles.toggleTypeFlex}>
                                    <h3>Média ponderada</h3>
                                    <div className={styles.toggleType}>
                                        <button
                                            className={keyToUse == 'productivity_per_hectare' ? styles.active : ''}
                                            onClick={() => {
                                                setKeyToUse('productivity_per_hectare')
                                                setTextToUse('kg')
                                            }}>
                                            kg/{getMetricUnity()}
                                        </button>
                                        <button
                                            className={keyToUse == 'productivity_per_hectare_sc' ? styles.active : ''}
                                            onClick={() => {
                                                setKeyToUse('productivity_per_hectare_sc')
                                                setTextToUse('sc')
                                            }}>
                                            sc/{getMetricUnity()}
                                        </button>
                                    </div>
                                </div>

                                <div className={productivityStyles.graphWrap}>
                                    <div className={productivityStyles.graphArea}>
                                        <div className={productivityStyles.graphBackground}>
                                            <div></div>
                                            <div className={productivityStyles.graphBackgroundGrid}>
                                                <div className={productivityStyles.graphBackgroundLine}></div>
                                                <div className={productivityStyles.graphBackgroundLine}></div>
                                                <div className={productivityStyles.graphBackgroundLine}></div>
                                                <div className={productivityStyles.graphBackgroundLine}></div>
                                                <div className={productivityStyles.graphBackgroundLine}></div>
                                                <div className={productivityStyles.graphBackgroundLine}></div>
                                            </div>
                                            <div></div>
                                        </div>
                                        {data && data.reports?.cultures ? (
                                            Object.keys(data.reports.cultures).map((key: any, index: number) => {
                                                // Você precisa declarar essas variáveis fora do JSX, dentro do escopo do map.
                                                let cultureValue = formatNumberToBR(
                                                    data.reports.cultures[key][keyToUse],
                                                )
                                                cultureValue = `${textToUse == 'kg' ? cultureValue.split(',')[0] : cultureValue} ${textToUse}/${getMetricUnity()}`

                                                return (
                                                    <>
                                                        <div className={productivityStyles.groupItems}>
                                                            <div
                                                                key={`index-graph${index}`}
                                                                className={productivityStyles.graphItem}>
                                                                <p>{key}</p>
                                                                <div
                                                                    className={productivityStyles.bar}
                                                                    style={{ width: getWidth(key, 1) }}
                                                                    title={cultureValue}></div>
                                                                <p>{cultureValue}</p>
                                                            </div>

                                                            {data.reports.cultures[key].codes &&
                                                                Object.keys(data.reports.cultures[key].codes).map(
                                                                    (codeKey: string, indexKey: number) => {
                                                                        // Declare aqui, antes de usar no JSX.

                                                                        let cultureCodeValue = formatNumberToBR(
                                                                            data.reports.cultures[key].codes[codeKey][
                                                                                keyToUse
                                                                            ],
                                                                        )
                                                                        cultureCodeValue = `${textToUse == 'kg' ? cultureCodeValue.split(',')[0] : cultureCodeValue} ${textToUse}/${getMetricUnity()}`
                                                                        return (
                                                                            <div
                                                                                key={`index-graph-key${indexKey}`}
                                                                                className={`${productivityStyles.graphItem} ${productivityStyles.cultureKey}`}>
                                                                                <p>{codeKey}</p>
                                                                                <div
                                                                                    className={productivityStyles.bar}
                                                                                    style={{
                                                                                        width: getWidth(
                                                                                            key,
                                                                                            2,
                                                                                            codeKey,
                                                                                        ),
                                                                                    }}
                                                                                    title={cultureCodeValue}></div>
                                                                                <p>{cultureCodeValue}</p>
                                                                            </div>
                                                                        )
                                                                    },
                                                                )}
                                                        </div>
                                                    </>
                                                )
                                            })
                                        ) : (
                                            <h3>Nada para exibir no momento</h3>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <h3>Nada para exibir no momento</h3>
                        )}
                    </>
                )}
            </div>
        </>
    )
}
