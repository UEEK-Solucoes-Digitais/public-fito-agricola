'use client'

import IconifyIcon from '@/components/iconify/IconifyIcon'
import { useAdmin } from '@/context/AdminContext'
import { useNotification } from '@/context/ToastContext'
import getFetch from '@/utils/getFetch'
import axios from 'axios'
import Cookies from 'js-cookie'
import { ChangeEvent, useState } from 'react'
import useSWR from 'swr'
import styles from '../styles.module.scss'

export default function FormSettings() {
    const [cookieHectare, setCookieHectare] = useState<string | undefined>(Cookies.get('fito_hectare'))
    const [cookieHarvest, setCookieHarvest] = useState<string | undefined>(Cookies.get('cookie_harvest'))
    const { admin, setAdmin } = useAdmin()

    const { setToast } = useNotification()

    const { data, isLoading } = useSWR(`/api/harvests/list`, getFetch)

    const changeCookie = (e: any) => {
        setCookieHectare(e.target.value)
        Cookies.set('fito_hectare', e.target.value, { expires: 365 })
        setToast({ text: `Alteração efetuada. Recarregando a página...`, state: 'success' })

        setTimeout(() => {
            window.location.reload()
        }, 2000)
    }

    const changeHarvest = async (e: any, isLastHarvest: number) => {
        setCookieHarvest(e.target.value)
        setToast({ text: `Atualizando registro`, state: 'loading' })

        await axios
            .post('/api/user/update-harvest', {
                harvest_id: isLastHarvest != 1 ? e.target.value : 'null',
                admin_id: admin.id,
            })
            .then(() => {
                if (isLastHarvest == 0) {
                    Cookies.set('cookie_harvest', e.target.value, { expires: 365 })
                } else {
                    Cookies.remove('cookie_harvest')
                }

                setToast({ text: `Alteração efetuada. Recarregando a página...`, state: 'success' })

                setTimeout(() => {
                    window.location.reload()
                }, 2000)
            })
    }

    const changeAttribute = async (e: any) => {
        setToast({ text: `Alteração em andamento`, state: 'loading' })
        try {
            const body = new FormData()
            body.append('admin_id', admin.id.toString())
            body.append('attribute', e.target.name)
            body.append('value', e.target.value)

            await axios
                .post('/api/user/update-attribute', body, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                })
                .then((response) => {
                    setAdmin(response.data.admin)
                })
                .catch((error) => {
                    throw error
                })

            setToast({ text: `Alteração efetuada com sucesso`, state: 'success' })
        } catch (error) {
            setToast({ text: `Erro ao alterar`, state: 'danger' })
        }
    }

    return (
        <div>
            <h3 className={styles.title}>
                <IconifyIcon icon='lucide:settings' />
                Configurações
            </h3>

            <div className={styles.riskGroup}>
                <p>Selecione o ano agrícola que você está trabalhando</p>
                {isLoading ? (
                    <IconifyIcon icon='line-md:loading-loop' />
                ) : (
                    <div className={styles.radioGroup}>
                        {data.harvests.map((harvest: any) => (
                            <div key={harvest.id} className={styles.radioItemOption}>
                                <input
                                    type='radio'
                                    name={`harvest_id`}
                                    value={harvest.id?.toString()}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                        changeHarvest(e, harvest.is_last_harvest)
                                    }
                                    defaultChecked={
                                        cookieHarvest == harvest.id?.toString() ||
                                        (cookieHarvest == null && harvest.is_last_harvest == 1)
                                    }
                                />
                                <label>{harvest.name}</label>
                            </div>
                        ))}
                    </div>
                )}

                <p>Selecione a forma de visualização das medidas de área.</p>
                <div className={styles.radioGroup}>
                    <div className={styles.radioItemOption}>
                        <input
                            type='radio'
                            name={`cookie`}
                            value={'ha'}
                            onChange={changeCookie}
                            defaultChecked={cookieHectare == 'ha' || !cookieHectare}
                        />
                        <label>Hectare (ha)</label>
                    </div>
                    <div className={styles.radioItemOption}>
                        <input
                            type='radio'
                            name={`cookie`}
                            value={'alq'}
                            onChange={changeCookie}
                            defaultChecked={cookieHectare == 'alq'}
                        />
                        <label>Alqueire (alq)</label>
                    </div>
                </div>
                <p>Selecione a moeda utilizada.</p>
                <div className={styles.radioGroup}>
                    <div className={styles.radioItemOption}>
                        <input
                            type='radio'
                            name={`currency_id`}
                            value={1}
                            onChange={changeAttribute}
                            defaultChecked={admin.currency_id == 1 || !admin.currency_id}
                        />
                        <label>BRL (R$)</label>
                    </div>
                    <div className={styles.radioItemOption}>
                        <input
                            type='radio'
                            name={`currency_id`}
                            value={2}
                            onChange={changeAttribute}
                            defaultChecked={admin.currency_id == 2}
                        />
                        <label>USD ($)</label>
                    </div>
                </div>
            </div>
        </div>
    )
}
