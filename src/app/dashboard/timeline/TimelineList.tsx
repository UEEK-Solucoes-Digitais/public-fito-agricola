import { DateTime } from 'luxon'
import { useEffect, useState } from 'react'
import styles from './styles.module.scss'

function LogItem(item: any) {
    function parseOperation(operation: number) {
        switch (operation) {
            case 1:
                return 'adicionou'
            case 2:
                return 'editou'
            case 3:
                return 'excluiu'
            default:
                return 'Desconhecida'
        }
    }

    function parsePreposition(operation: number, hasPropertyName: boolean) {
        if (!hasPropertyName) {
            switch (operation) {
                case 1:
                    return 'ao'
                case 2:
                    return 'no'
                case 3:
                    return 'do'
                default:
                    return 'ao'
            }
        } else {
            switch (operation) {
                case 1:
                    return 'à'
                case 2:
                    return 'na'
                case 3:
                    return 'da'
                default:
                    return 'à'
            }
        }
    }

    function formatDate(dateString: string) {
        const dateArr = dateString.split(' ')
        const string = dateArr[0]
        const date = DateTime.fromISO(string)
        const formattedDate = date.toFormat("cccc, dd 'de' MMMM", { locale: 'pt-BR' })

        return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)
    }

    const hasPropertyName = !!item.log?.property_name
    const preposition = parsePreposition(item.log.operation, hasPropertyName)
    const target = hasPropertyName ? item.log.property_name : 'sistema'

    function cropToHarvestSpecificMessage(log: any) {
        return (
            <>
                lavoura <span>{log.crop_name}</span> {preposition} safra {log.harvest_name} na propriedade{' '}
                <span>{log.property_name}</span>
            </>
        )
    }

    function renderMessage(log: any) {
        if (log.crop_to_harvest) {
            return cropToHarvestSpecificMessage(log)
        }

        return (
            <>
                {}
                {/* NOME DA TABELA */}
                <span>{log.formatted_table}</span>
                {/* NOME DO ITEM (SE EXISTIR) */}
                {log.specific_name && <span>{log.specific_name}</span>}
                {/* PREPOSIÇÃO */} {preposition} {/* LAVOURA (Caso de operações interna de lavoura) (SE EXISTIR) */}
                {log.crop_name && (
                    <>
                        lavoura <span>{log.crop_name},</span>
                    </>
                )}
                {/* ONDE FOI FEITA A OPERAÇÃO */}
                {target == 'sistema' ? (
                    target
                ) : (
                    <>
                        propriedade <span>{target},</span>
                    </>
                )}
                {/* SAFRA (se existir) */}
                {log.harvest_name && (
                    <>
                        safra <span>{log.harvest_name}</span>
                    </>
                )}
            </>
        )
    }

    return (
        <div className={styles.timelineItem}>
            <div className={styles.timelineItemDate}>
                {/* NOME DO ADMIN E OPERAÇÃO */}
                {item.log.admin.name} {parseOperation(item.log.operation)} {renderMessage(item.log)}
            </div>
            <div className={styles.timelineWeekDay}>{formatDate(item.log.created_at)}</div>
        </div>
    )
}

export function TimelineList(data: any) {
    const [groupedLogs, setGroupedLogs] = useState<any>([])
    const logs: any = Object.entries(data.data)

    function groupLogsByDate() {
        if (logs.length == 0) return { today: [], thisWeek: [], thisMonth: [], older: [] }

        const now = DateTime.now()
        const startOfToday = now.startOf('day')
        const startOfThisWeek = now.startOf('week')
        const startOfThisMonth = now.startOf('month')

        const groups: any = {
            today: [],
            thisWeek: [],
            thisMonth: [],
            older: [],
        }

        logs.forEach(([date, logs]: [string, any[]]) => {
            const logDate = DateTime.fromFormat(date, 'dd/MM/yyyy')

            logs.forEach((logItem: any) => {
                if (logDate >= startOfToday) {
                    groups.today.push(logItem)
                } else if (logDate >= startOfThisWeek) {
                    groups.thisWeek.push(logItem)
                } else if (logDate >= startOfThisMonth) {
                    groups.thisMonth.push(logItem)
                } else {
                    groups.older.push(logItem)
                }
            })
        })

        setGroupedLogs(groups)
    }

    useEffect(() => {
        groupLogsByDate()
    }, [data])

    if (groupedLogs.today && groupedLogs.thisWeek && groupedLogs.thisMonth && groupedLogs.older) {
        return (
            <div className={styles.timelineContainer}>
                <div className={styles.timelineBody}>
                    {groupedLogs.today.length > 0 && (
                        <div className={styles.timelineCategory}>
                            <span>Hoje</span>
                            {groupedLogs.today.map((item: any) => (
                                <LogItem key={item.id} log={item} />
                            ))}
                        </div>
                    )}
                    {groupedLogs.thisWeek.length > 0 && (
                        <div className={styles.timelineCategory}>
                            <span>Esta semana</span>
                            {groupedLogs.thisWeek.map((item: any) => (
                                <LogItem key={item.id} log={item} />
                            ))}
                        </div>
                    )}

                    {groupedLogs.thisMonth.length > 0 && (
                        <div className={styles.timelineCategory}>
                            <span>Este mês</span>
                            {groupedLogs.thisMonth.map((item: any) => (
                                <LogItem key={item.id} log={item} />
                            ))}
                        </div>
                    )}
                    {groupedLogs.older.length > 0 && (
                        <div className={styles.timelineCategory}>
                            <span>Antigos</span>
                            {groupedLogs.older.map((item: any) => (
                                <LogItem key={item.id} log={item} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )
    }
}
