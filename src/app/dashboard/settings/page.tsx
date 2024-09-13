'use client'

import IconifyIcon from '@/components/iconify/IconifyIcon'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useState } from 'react'
import styles from './styles.module.scss'

const FormSettings = dynamic(() => import('./_components/FormSettings'), {
    ssr: false,
})

export default function Page() {
    const [selectedTab, setSelectedTab] = useState('configuracoes')

    function handleTab(tab: string) {
        setSelectedTab(tab)
    }

    return (
        <div className={styles.settingsGrid}>
            <div className={styles.box}>
                <h3>Configurações</h3>

                <ul className={styles.linkList}>
                    <li>
                        <button
                            className={`${styles.linkItem} ${selectedTab == 'configuracoes' ? styles.active : ''}`}
                            onClick={() => handleTab('configuracoes')}>
                            <IconifyIcon icon='lucide:settings' />
                            Configurações
                        </button>
                    </li>
                    <li>
                        <Link href='/politica-de-privacidade' target='_blank' className={`${styles.linkItem} `}>
                            <IconifyIcon icon='lucide:lock' />
                            Política de privacidade
                        </Link>
                    </li>
                    <li>
                        <Link href='/termos-de-uso' target='_blank' className={`${styles.linkItem} `}>
                            <IconifyIcon icon='lucide:book' />
                            Termos de uso
                        </Link>
                    </li>
                </ul>
            </div>
            <div className={styles.box}>{selectedTab == 'configuracoes' && <FormSettings />}</div>
        </div>
    )
}
