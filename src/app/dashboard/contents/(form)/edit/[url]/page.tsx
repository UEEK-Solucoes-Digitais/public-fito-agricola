'use client'

import Loading from '@/app/loading'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import ElementSkeleton from '@/components/loading/ElementSkeleton'
import { useAdmin } from '@/context/AdminContext'
import ErrorBoundary from '@/document/ErrorBoundary'
import getFetch from '@/utils/getFetch'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { useRouter } from 'nextjs-toploader/app'
import useSWR from 'swr'
import styles from '../../styles.module.scss'

const Form = dynamic(() => import('../../form'), {
    ssr: false,
    loading: () => <ElementSkeleton />,
})

export default function Page() {
    const pathname = usePathname()
    const splitPathname = pathname?.split('/')
    const contentUrl = splitPathname[splitPathname.length - 1]
    const { admin } = useAdmin()
    const router = useRouter()
    const { data, isLoading } = useSWR(`/api/contents/read/${admin.id}/${contentUrl}`, getFetch)

    if (isLoading) {
        return <Loading />
    }

    return (
        <div className={styles.wrapper}>
            <button
                onClick={() => {
                    router.push(`/dashboard/conteudos${pathname.includes('editar-ma') ? '-ma' : ''}`)
                }}
                className={styles.backButton}>
                <IconifyIcon icon='bi:arrow-left' className={styles.icon} />
                <h1 className={styles.title} title='Editar conteúdo' aria-label='Editar conteúdo'>
                    Editar conteúdo
                </h1>
            </button>

            <ErrorBoundary fallbackComponent={<strong className='error-strong'>Erro ao carregar conteudo</strong>}>
                <Form data={data} />
            </ErrorBoundary>
        </div>
    )
}
