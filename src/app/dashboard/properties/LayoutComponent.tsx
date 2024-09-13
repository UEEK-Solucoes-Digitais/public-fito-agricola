'use client'

import PageHeader from '@/components/header/PageHeader'
import ElementSkeleton from '@/components/loading/ElementSkeleton'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { ReactNode, useEffect, useRef, useState } from 'react'
import styles from './styles.module.scss'

const PropertiesForm = dynamic(() => import('./form'), {
    ssr: false,
    loading: () => <ElementSkeleton />,
})

export default function LayoutComponent({ children }: { children: ReactNode }) {
    const [showNewPropertyModal, setShowNewPropertyModal] = useState(false)
    const formRef = useRef<HTMLFormElement>(null)
    const pathName = usePathname()

    useEffect(() => {
        if (!showNewPropertyModal && formRef?.current) {
            formRef.current.reset()
        }
    }, [showNewPropertyModal])

    return (
        <>
            {!pathName.includes('exportar-graficos') && !pathName.includes('webview-graph') && (
                <>
                    <PageHeader
                        disabledFunctions={pathName.split('/')[pathName.split('/').length - 1] !== 'propriedades'}
                        placeholder={'Pesquisar em "propriedades"'}
                        // buttonValue='+ Adicionar propriedade'
                        // onButtonClick={() => {
                        //     setShowNewPropertyModal(!showNewPropertyModal);
                        // }}
                    />
                    {showNewPropertyModal && (
                        <PropertiesForm show={showNewPropertyModal} setShow={setShowNewPropertyModal} />
                    )}
                </>
            )}

            <div className={`${styles.childrenWrapper} ${pathName.includes('webview-graph') ? styles.exportPage : ''}`}>
                {children}
            </div>
        </>
    )
}
