import { FertilizantesIcon } from '@/assets/icons/Icons'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import { HarvestIcon } from '@/components/register-property-activity/HarvestIcon'
import Link from 'next/link'
import { MouseEvent } from 'react'
import styles from '../../styles.module.scss'

interface IProps {
    handleSetTab: (event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>, checkPath: boolean) => void
    handleMultipleTabs: (event: MouseEvent<HTMLButtonElement>) => void
    setOpenGround: (value: boolean) => void
}

const TabLinks = ({ handleSetTab, handleMultipleTabs, setOpenGround }: IProps) => {
    return (
        <div className={styles.groupLinks}>
            <div className={styles.groupItens}>
                <button
                    className={styles.item}
                    onClick={(e: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => handleSetTab(e, true)}
                    data-key='mapa-lavoura'>
                    <IconifyIcon icon='ph:map-pin' className={styles.icon} />
                    <span>Áreas</span>
                </button>
            </div>
            <div className={styles.groupItens}>
                <button className={styles.item} onClick={handleMultipleTabs} data-key='dados-manejo' data-id='sementes'>
                    <IconifyIcon icon='ph:circles-three' className={styles.icon} />
                    <span>Sementes</span>
                </button>
                <button
                    className={styles.item}
                    onClick={handleMultipleTabs}
                    data-key='dados-manejo'
                    data-id='populacao'>
                    <IconifyIcon icon='ph:tree-evergreen' className={styles.icon} />
                    <span>População</span>
                </button>
                <button
                    className={styles.item}
                    onClick={handleMultipleTabs}
                    data-key='dados-manejo'
                    data-id='fertilizantes'>
                    <FertilizantesIcon />
                    <span>Fertilizantes</span>
                </button>
                <button
                    className={styles.item}
                    onClick={handleMultipleTabs}
                    data-key='dados-manejo'
                    data-id='defensivos'>
                    <IconifyIcon icon='ph:shield-check' className={styles.icon} />
                    <span>Defensivos</span>
                </button>
                <button className={styles.item} onClick={handleMultipleTabs} data-key='dados-manejo' data-id='colheita'>
                    {/* <IconifyIcon icon='iconoir:square-dashed' className={styles.icon} /> */}
                    <HarvestIcon />

                    <span>Colheita</span>
                </button>
            </div>
            <div className={styles.groupItens}>
                <button
                    className={styles.item}
                    onClick={(e: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => handleSetTab(e, true)}
                    data-key='monitoramento'>
                    <IconifyIcon icon='ph:file-magnifying-glass' className={styles.icon} />
                    <span>Monitoramentos</span>
                </button>
            </div>
            <div className={styles.groupItens}>
                <button
                    className={styles.item}
                    onClick={handleMultipleTabs}
                    data-key='informacoes-safra'
                    data-id='chuva'>
                    <IconifyIcon icon='ph:cloud-rain' className={styles.icon} />
                    <span>Chuva</span>
                </button>
                <button
                    className={styles.item}
                    onClick={handleMultipleTabs}
                    data-key='informacoes-safra'
                    data-id='doenca'>
                    <IconifyIcon icon='mingcute:search-line' className={styles.icon} />
                    <span>Doenças</span>
                </button>
                <button
                    className={styles.item}
                    onClick={handleMultipleTabs}
                    data-key='informacoes-safra'
                    data-id='custos'>
                    <IconifyIcon icon='mynaui:dollar' className={styles.icon} />
                    <span>Custos</span>
                </button>
            </div>
            <div className={styles.groupItens}>
                <Link className={styles.item} href='/dashboard/solos'>
                    <IconifyIcon icon='fluent:dust-20-regular' className={styles.icon} />
                    <span>Solos</span>
                </Link>
            </div>
        </div>
    )
}

export default TabLinks
