'use client'
import { CultureExport } from '@/components/graphs-export/CultureExport'
import GraphExport from '@/components/graphs-export/GraphExport'
import styles from '@/components/graphs-export/styles.module.scss'
import { useSearchParams } from 'next/navigation'

const WebviewGraph: React.FC = () => {
    const searchParams = useSearchParams()

    if (searchParams.get('culture-tab')) {
        const query = `/api/reports/list/${searchParams.get('admin_id')}/cultures?${window.location.href.split('query=').length > 1 ? window.location.href.split('query=')[1] : ''}`

        return (
            <div className={`${styles.chartExport} ${styles.exportCulture}`}>
                <CultureExport query={query} />
            </div>
        )
    } else {
        return <GraphExport typeGraph={2} />
    }
}

export default WebviewGraph
