import React, { HTMLAttributes } from 'react'
import IconifyIcon from '../iconify/IconifyIcon'
import styles from './styles.module.scss'

interface TableProps extends HTMLAttributes<HTMLDivElement> {
    headers: string[]
    headersIcons?: string[]
    gridColumns?: string
    children?: React.ReactNode
    width?: string
    customClasses?: string[]
}

const GeralTable: React.FC<TableProps> = ({
    headers,
    headersIcons,
    gridColumns,
    children,
    width = '',
    customClasses = [],
}) => {
    const inline = {
        gridTemplateColumns: gridColumns || `repeat(${headers.length}, 1fr)`,
    }

    const GetIcon = ({ index }: { index: number }) => {
        if (headersIcons) {
            const icon = headersIcons[index]

            if (icon) {
                return <IconifyIcon icon={icon} />
            }
        }

        return <></>
    }

    const GetLegend = ({ text }: { text: string }) => {
        let textLegend: string = ''

        if (text.includes('DAP')) {
            textLegend = 'Dias após plantio'
        }

        if (text.includes('DAE')) {
            textLegend = 'Dias após emergência'
        }

        if (text.includes('DAA')) {
            textLegend = 'Dias após aplicação'
        }

        if (text.includes('DEPPA')) {
            textLegend = 'Dias entre plantio e primeira aplicação'
        }

        if (text.includes('DEPUA')) {
            textLegend = 'Dias entre plantio e última aplicação'
        }

        if (text == 'Ca' || text == 'Al' || text == 'K' || text == 'Mg' || text == 'P') {
            textLegend = 'Valores em cmol/dm³'
        }

        if (textLegend !== '') {
            return (
                <div className={styles.legendTooltip}>
                    <IconifyIcon icon='ph:info' />
                    <div className={styles.tooltip}>{textLegend}</div>
                </div>
            )
        }

        return <></>
    }

    // TODO: Fazer paginação

    return (
        <div className={`${styles.geralTableWrapper} ${customClasses ? customClasses.join(' ') : ''}`}>
            <div className={`${styles.geralTable} `} style={width !== '' ? { width } : {}}>
                {headers.length > 0 && (
                    <div className={styles.tableHeaders} style={inline}>
                        {headers.map((headerName: string, index: number) => (
                            <div key={headerName ?? index} className={styles.header}>
                                <GetIcon index={index} />
                                {/* {headerName} */}
                                <span dangerouslySetInnerHTML={{ __html: headerName }}></span>

                                <GetLegend text={headerName} />
                            </div>
                        ))}
                    </div>
                )}

                <div className={styles.tableRows}>{children}</div>
            </div>
        </div>
    )
}

GeralTable.displayName = 'Geral Table'

export default GeralTable
