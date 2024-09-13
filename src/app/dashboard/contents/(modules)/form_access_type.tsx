'use client'

import AdminProps from '@/@types/Admin'
import GeralButton from '@/components/buttons/GeralButton'
import stylesReports from '@/components/forms/reports/styles.module.scss'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import GeralInput from '@/components/inputs/GeralInput'
import GeralModal from '@/components/modal/GeralModal'
import { useAdmin } from '@/context/AdminContext'
import { useNotification } from '@/context/ToastContext'
import getFetch from '@/utils/getFetch'
import axios from 'axios'
import { ChangeEvent, useEffect, useState } from 'react'
import useSWR from 'swr'
import styles from './form_access_type.module.scss'

interface IProps {
    contentType: number
}

export default function FormAccessType({ contentType }: IProps) {
    const { data, isLoading } = useSWR<{
        admins: AdminProps[]
        selected_admins: string[]
    }>(`/api/contents/list-access-type/${contentType}`, getFetch)

    const [searchUsersModal, setSearchUsersModal] = useState('')
    const { setToast } = useNotification()
    const { admin } = useAdmin()

    const [selectedAdmins, setSelectedAdmins] = useState<string[]>([])
    const [openFormModal, setOpenFormModal] = useState(false)

    const handleInputArrayChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const { value } = event.target
        if (value !== '0') {
            if (!selectedAdmins.includes(value)) {
                setSelectedAdmins([...selectedAdmins, value])
            }
        }
    }

    const removeItem = (item: string) => {
        setSelectedAdmins(selectedAdmins.filter((admin) => admin !== item))
    }

    const submit = async () => {
        if (setSelectedAdmins.length > 0) {
            setToast({ text: `Alterando acesso`, state: 'loading' })

            try {
                const response = await axios.post('/api/contents/form-access-type', {
                    admin_ids: selectedAdmins,
                    type: contentType,
                    admin_id: admin.id,
                })

                if (response.status == 200) {
                    setToast({ text: `Acesso alterado`, state: 'success' })
                    setOpenFormModal(false)
                } else {
                    setToast({ text: `Não foi possível completar a operação`, state: 'danger' })
                }
            } catch (error: any) {
                const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
                setToast({ text: message, state: 'danger' })
            }
        } else {
            setToast({ text: `Selecione pelo menos um usuário`, state: 'warning' })
        }
    }

    useEffect(() => {
        if (data && data.selected_admins) {
            setSelectedAdmins(data.selected_admins.map((admin_id) => admin_id.toString()))
        }
    }, [data])

    return (
        <>
            <GeralButton small value='Configurar acesso M.A' onClick={() => setOpenFormModal(true)}>
                <IconifyIcon icon={'mdi:lock'} />
            </GeralButton>

            {openFormModal && (
                <GeralModal title='Configurar acesso M.A' show={openFormModal} setShow={setOpenFormModal}>
                    {isLoading ? (
                        <IconifyIcon icon='line-md:loading-loop' />
                    ) : (
                        <div className={styles.formSettings}>
                            <h3>Selecione os usuários que podem acessar a área M.A</h3>

                            <div className={stylesReports.filterGroupGap}>
                                <GeralInput
                                    name='admins'
                                    label='Usuários'
                                    type='select'
                                    onChange={handleInputArrayChange}>
                                    <option value='0'>Selecione</option>

                                    {data &&
                                        data.admins.map((admin: any) => (
                                            <option key={admin.id} value={admin.id}>
                                                {admin.name}
                                            </option>
                                        ))}
                                </GeralInput>

                                <div className={styles.searchInput}>
                                    <GeralInput
                                        type='text'
                                        placeholder='Pesquisar usuários adicionados'
                                        icon='mdi:magnify'
                                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                            setSearchUsersModal(e.target.value)
                                        }
                                    />
                                </div>
                                <div className={`${stylesReports.filterOptions} ${stylesReports.withHeight}`}>
                                    {data &&
                                        selectedAdmins != null &&
                                        data.admins
                                            .filter((admin) => admin.name.toLowerCase().includes(searchUsersModal))
                                            .map(
                                                (admin: any) =>
                                                    selectedAdmins!.includes(admin.id.toString()) && (
                                                        <div key={admin.id} className={stylesReports.filterOptionItem}>
                                                            {admin.name}

                                                            <button
                                                                type='button'
                                                                onClick={() => removeItem(admin.id.toString())}>
                                                                <IconifyIcon icon='ph:x' />
                                                            </button>
                                                        </div>
                                                    ),
                                            )}
                                </div>
                            </div>

                            <div className={styles.actions}>
                                <GeralButton
                                    variant='tertiary'
                                    value='Cancelar'
                                    onClick={() => setOpenFormModal(false)}
                                />
                                <GeralButton
                                    variant='secondary'
                                    value='Alterar acesso'
                                    onClick={async () => submit()}
                                />
                            </div>
                        </div>
                    )}
                </GeralModal>
            )}
        </>
    )
}
