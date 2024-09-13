import CropsSelector from '@/app/dashboard/properties/CropsSelector'
import { useAdmin } from '@/context/AdminContext'
import { useNotification } from '@/context/ToastContext'
import { getActualDate } from '@/utils/formats'
import getFetch from '@/utils/getFetch'
import { getMetricUnity } from '@/utils/getMetricUnity'
import WriteLog from '@/utils/logger'
import axios from 'axios'
import { useSearchParams } from 'next/navigation'
import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import useSWR, { mutate } from 'swr'
import GeralButton from '../buttons/GeralButton'
import IconifyIcon from '../iconify/IconifyIcon'
import GeralInput from '../inputs/GeralInput'
import { HarvestIcon } from './HarvestIcon'
import styles from './styles.module.scss'

const ActivitySteps = ({
    id,
    setShow,
    cropsData,
    debouncedSearch,
    harvest_id = 0,
}: {
    id: number
    setShow: (show: boolean) => void
    cropsData: any
    debouncedSearch: string
    harvest_id?: number
}) => {
    const [step, setStep] = useState(1)
    const [type, setType] = useState<number | undefined>()
    const [formData, setFormData] = useState<any>({})
    const [localAvailableCrops, setLocalAvailableCrops] = useState<any>([])
    const [localLinkedCrops, setLocalLinkedCrops] = useState<any>([])
    const [products, setProducts] = useState<any>([])

    const [isLoadingArea, setIsLoadingArea] = useState(false)

    const searchParams = useSearchParams()
    const filterHarvest = searchParams.get('safra')

    const { setToast } = useNotification()
    const { admin } = useAdmin()

    const {
        data: productsData,
        error: productsError,
        isLoading: productsLoading,
    } = useSWR(`/api/products/list/${admin.id}`, getFetch)

    const fetchArea = async () => {
        const crops = localLinkedCrops.map((crop: any) => crop.id).join(',')

        const response = await axios.get(`/api/properties/management-data/get-area?crops_ids=${crops}`)
        const data = response.data

        return data
    }

    const changeLocalCrops = (e: ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target

        if (checked) {
            const toLinked = localAvailableCrops.find((crop: any) => crop.id == value)
            setLocalAvailableCrops(localAvailableCrops.filter((crop: any) => crop.id !== value))

            setLocalLinkedCrops([...localLinkedCrops, toLinked])
        } else {
            const toAvailable = localLinkedCrops.find((crop: any) => crop.id == value)
            setLocalLinkedCrops(localLinkedCrops.filter((crop: any) => crop.id !== value))

            setLocalAvailableCrops([...localAvailableCrops, toAvailable])
        }
    }

    const handleUserInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target

        if (name == 'product_id') {
            setFormData((prevData: any) => ({ ...prevData, culture_code: '' }))
        }

        setFormData((prevData: any) => ({ ...prevData, [name]: value }))
    }

    const handleProductItemChange = (event: ChangeEvent<HTMLInputElement>, index: any) => {
        const { name, value } = event.target
        const values = formData[name as keyof any]

        values[index] = value
        setFormData((prevData: any) => ({ ...prevData, [name]: values }))
    }

    const handleAddInput = async (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>, index: number) => {
        const { name, value } = e.target

        const values = formData[name as keyof any]

        values[index] = value

        setFormData((prevData: any) => ({ ...prevData, [name]: values }))
    }

    function addRainGauge() {
        setFormData((prevData: any) => ({
            ...prevData,
            volumes: [...prevData.volumes, 0],
            dates: [...prevData.dates, getActualDate()],
        }))
    }

    function removeRainGaugeItem(index: number) {
        return () => {
            const volumes = formData.volumes
            const dates = formData.dates

            volumes.splice(index, 1)
            dates.splice(index, 1)

            setFormData((prevData: any) => ({
                ...prevData,
                volumes,
                dates,
            }))
        }
    }

    const submitActivity = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        try {
            // if (type == 1 && !isAreaValid()) {
            //     return;
            // }

            if (formData.spacing != null && formData.spacing > 1) {
                setToast({
                    text: `O espaçamento não pode ser maior que 1`,
                    state: 'info',
                })
                return
            }

            setToast({ text: `Registrando atividade`, state: 'loading' })

            if (localLinkedCrops.length > 0) {
                let newType
                switch (type) {
                    case 1:
                        newType = 'seed'
                        break
                    case 3:
                        newType = 'fertilizer'
                        break
                    case 2:
                        newType = 'defensive'
                        break
                    case 4:
                        newType = 'harvest'
                        break
                }

                const body = {
                    ...formData,
                    crops: localLinkedCrops,
                    type: newType,
                    admin_id: admin.id,
                    harvest_id: filterHarvest ?? harvest_id ?? 0,
                }

                await axios.post(
                    type && type < 5
                        ? '/api/properties/management-data/multiple-form'
                        : '/api/properties/rain-gauge/form',
                    body,
                )

                setToast({ text: `Atividade adicionada com sucesso`, state: 'success' })
                mutate(
                    `/api/properties/read/${id}?read_simple=true&filter=${debouncedSearch}${
                        filterHarvest || harvest_id ? `&harvest_id=${filterHarvest ?? harvest_id}` : ''
                    }`,
                )
                setType(undefined)
                setStep(1)
                setShow(false)
                setFormData({})
            } else {
                setToast({ text: 'Nenhuma lavoura selecionada', state: 'warning' })
            }
        } catch (error: any) {
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }

    const spacingOrLinearChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target

        const linear_meter_value = parseFloat(
            (name == 'seed_per_linear_meter' ? value : formData.seed_per_linear_meter).toString().replace(',', '.'),
        )
        const spacing = parseFloat((name == 'spacing' ? value : formData.spacing).toString().replace(',', '.'))

        setFormData((prevStates: any) => ({
            ...prevStates,
            [name]: parseInt(value),
            seed_per_square_meter:
                linear_meter_value > 0 && spacing > 0 ? (linear_meter_value / spacing).toFixed(2) : 0,
        }))

        setFormData((prevStates: any) => ({
            ...prevStates,
            [name]: parseInt(value),
            quantity_per_ha: (formData.seed_per_square_meter * 10000).toFixed(2),
        }))
    }

    const updateTotalArea = async () => {
        setIsLoadingArea(true)
        const data = await fetchArea()

        if (data) {
            setFormData((prevData: any) => ({ ...prevData, area: data.total_remaining_area }))
        } else {
            setFormData((prevData: any) => ({ ...prevData, area: 0 }))
        }
        setIsLoadingArea(false)
    }

    useEffect(() => {
        if (type == 1) {
            const initialFormState = {
                id: 0,
                product_id: 0,
                property_id: id,
                cost_per_kilogram: 0,
                kilogram_per_ha: 0,
                spacing: 0,
                seed_per_linear_meter: 0,
                seed_per_square_meter: 0,
                pms: 0,
                quantity_per_ha: 0,
                dosage: 0,
                date: getActualDate(),
                culture_code: '--',
                culture_name: '--',
                area: 0,
            }

            setFormData(initialFormState)
        }

        if (type == 3) {
            const initialFormState = {
                date: getActualDate(),
                products_id: [],
                dosages: [],
                property_id: id,
            }

            setFormData(initialFormState)
        }

        if (type == 2) {
            const initialFormState = {
                date: getActualDate(),
                products_id: [],
                dosages: [],
                defensive_name: [1],
                property_id: id,
            }

            setFormData(initialFormState)
        }

        if (type == 4) {
            const initialFormState = {
                date: getActualDate(),
                product_id: 0,
                dosage: 0,
                property_id: id,
            }

            setFormData(initialFormState)
        }

        if (type == 5) {
            const initialFormState = {
                volumes: [0],
                dates: [getActualDate()],
                property_id: id,
            }

            setFormData(initialFormState)
        }
    }, [type, id])

    useEffect(() => {
        if (productsData && !productsLoading && !productsError) {
            setProducts(Object.values(productsData.products))
        }
    }, [productsData, productsLoading, productsError])

    useEffect(() => {
        if (cropsData) {
            setLocalAvailableCrops(cropsData.linked_crops ? Object.values(cropsData.linked_crops) : cropsData || [])
        }
    }, [])

    useEffect(() => {
        updateTotalArea()
    }, [localLinkedCrops])

    useEffect(() => {
        if (typeof productsError !== 'undefined') {
            WriteLog([productsError], 'error')

            if (process.env.NEXT_PUBLIC_SHOW_TOAST_FETCH_ERROR == 'true') {
                setToast({ text: `Falha ao obter dados`, state: 'danger' })
            }
        }
    }, [productsError])

    const removeItem = (name: string, item: string) => {
        const values = formData[name as keyof any]

        if (Array.isArray(values)) {
            const index = values.indexOf(item.toString())

            if (index > -1) {
                values.splice(index, 1)
            }
        }

        setFormData((prevData: any) => ({ ...prevData, [name]: values }))
    }

    return (
        <>
            {step == 1 && (
                <div className={styles.selectorGrid}>
                    <button
                        type='button'
                        onClick={() => {
                            setType(1)
                            setStep(2)
                        }}>
                        <IconifyIcon icon='ph:plant' />

                        <span>Plantio</span>
                    </button>

                    <button
                        type='button'
                        onClick={() => {
                            setType(3)
                            setStep(2)
                        }}>
                        <svg width='46' height='37' viewBox='0 0 46 37' fill='none' xmlns='http://www.w3.org/2000/svg'>
                            <path
                                className={styles.applyFill}
                                d='M21.3849 31.0791C22.1313 31.0791 22.8609 30.8578 23.4815 30.4431C24.1021 30.0285 24.5858 29.4391 24.8715 28.7495C25.1571 28.0599 25.2318 27.3012 25.0862 26.5691C24.9406 25.8371 24.5812 25.1646 24.0534 24.6369C23.5256 24.1091 22.8532 23.7497 22.1212 23.604C21.3891 23.4584 20.6303 23.5332 19.9407 23.8188C19.2512 24.1044 18.6618 24.5881 18.2471 25.2087C17.8324 25.8293 17.6111 26.559 17.6111 27.3053C17.6111 28.3062 18.0087 29.2661 18.7164 29.9738C19.4242 30.6816 20.384 31.0791 21.3849 31.0791ZM13.8373 13.468C14.5837 13.468 15.3133 13.2467 15.9339 12.832C16.5545 12.4174 17.0382 11.828 17.3238 11.1384C17.6095 10.4488 17.6842 9.69004 17.5386 8.95799C17.393 8.22595 17.0336 7.55352 16.5058 7.02574C15.978 6.49797 15.3056 6.13855 14.5735 5.99293C13.8415 5.84732 13.0827 5.92205 12.3931 6.20768C11.7036 6.49331 11.1142 6.97701 10.6995 7.59761C10.2848 8.21821 10.0635 8.94784 10.0635 9.69423C10.0635 10.6951 10.4611 11.655 11.1688 12.3627C11.8765 13.0704 12.8364 13.468 13.8373 13.468ZM3.77381 36.1109C4.5202 36.1109 5.24983 35.8896 5.87042 35.4749C6.49102 35.0602 6.97472 34.4708 7.26035 33.7813C7.54599 33.0917 7.62072 32.3329 7.47511 31.6009C7.32949 30.8688 6.97007 30.1964 6.4423 29.6686C5.91452 29.1408 5.24209 28.7814 4.51004 28.6358C3.778 28.4902 3.01921 28.5649 2.32964 28.8505C1.64006 29.1362 1.05067 29.6199 0.636001 30.2405C0.221329 30.8611 0 31.5907 0 32.3371C0 33.338 0.397596 34.2978 1.10532 35.0056C1.81305 35.7133 2.77293 36.1109 3.77381 36.1109ZM33.9643 21.0157C34.7107 21.0157 35.4403 20.7943 36.0609 20.3797C36.6815 19.965 37.1652 19.3756 37.4508 18.686C37.7365 17.9964 37.8112 17.2377 37.6656 16.5056C37.52 15.7736 37.1605 15.1011 36.6328 14.5734C36.105 14.0456 35.4326 13.6862 34.7005 13.5406C33.9685 13.3949 33.2097 13.4697 32.5201 13.7553C31.8305 14.0409 31.2411 14.5246 30.8265 15.1452C30.4118 15.7658 30.1905 16.4955 30.1905 17.2418C30.1905 18.2427 30.5881 19.2026 31.2958 19.9103C32.0035 20.6181 32.9634 21.0157 33.9643 21.0157ZM41.5119 8.43629C42.2583 8.43629 42.9879 8.21496 43.6085 7.80029C44.2291 7.38562 44.7128 6.79623 44.9984 6.10666C45.2841 5.41708 45.3588 4.6583 45.2132 3.92625C45.0676 3.1942 44.7082 2.52177 44.1804 1.994C43.6526 1.46622 42.9802 1.1068 42.2481 0.961186C41.5161 0.815573 40.7573 0.890307 40.0677 1.17594C39.3782 1.46157 38.7888 1.94527 38.3741 2.56587C37.9594 3.18647 37.7381 3.91609 37.7381 4.66248C37.7381 5.66336 38.1357 6.62324 38.8434 7.33097C39.5511 8.0387 40.511 8.43629 41.5119 8.43629ZM35.2222 32.3371C35.2222 33.0835 35.4436 33.8131 35.8582 34.4337C36.2729 35.0543 36.8623 35.538 37.5519 35.8236C38.2414 36.1093 39.0002 36.184 39.7323 36.0384C40.4643 35.8928 41.1367 35.5333 41.6645 35.0056C42.1923 34.4778 42.5517 33.8054 42.6973 33.0733C42.8429 32.3413 42.7682 31.5825 42.4826 30.8929C42.1969 30.2033 41.7132 29.614 41.0926 29.1993C40.472 28.7846 39.7424 28.5633 38.996 28.5633C37.9952 28.5633 37.0353 28.9609 36.3275 29.6686C35.6198 30.3763 35.2222 31.3362 35.2222 32.3371Z'
                                fill='currentcolor'
                            />
                        </svg>

                        <span>Fertilizantes</span>
                    </button>

                    <button
                        type='button'
                        onClick={() => {
                            setType(2)
                            setStep(2)
                        }}>
                        <svg width='45' height='50' viewBox='0 0 45 50' fill='none' xmlns='http://www.w3.org/2000/svg'>
                            <path
                                className={styles.applyFill}
                                d='M3.81416 49.3126H20.4049C21.2457 49.3126 21.9653 49.0296 22.5636 48.4637C23.1619 47.8977 23.4772 47.1781 23.5095 46.305V46.2079C23.5095 45.4318 23.2993 44.7041 22.8789 44.0249L15.2142 33.7892V26.5611H16.2329C16.4916 26.5611 16.7342 26.4479 16.9606 26.2215C17.187 25.9951 17.3002 25.7525 17.3002 25.4938C17.3002 25.2351 17.187 25.0006 16.9606 24.7904C16.7342 24.5802 16.4916 24.4751 16.2329 24.4751H7.98609C7.72737 24.4751 7.48481 24.5802 7.25843 24.7904C7.03205 25.0006 6.91885 25.2351 6.91885 25.4938C6.91885 25.7525 7.03205 25.9951 7.25843 26.2215C7.48481 26.4479 7.72737 26.5611 7.98609 26.5611H9.00482V33.6921L1.43713 43.9279C1.01671 44.6071 0.806494 45.3024 0.806494 46.0139L0.709473 46.2079C0.741813 47.0811 1.06522 47.8169 1.67969 48.4152C2.29416 49.0135 3.00565 49.3126 3.81416 49.3126ZM9.00482 37.1849L9.53844 36.6028C10.3146 35.5032 10.8321 34.2581 11.0908 32.8675V26.5611H13.1282V32.7704C13.4193 34.2904 13.9367 35.5194 14.6806 36.4573L15.2142 37.0879L17.3002 39.9015H6.91885L9.00482 37.1849ZM3.0865 45.1892L5.90013 41.3569V42.0845H18.8525L21.1325 45.1892C21.1972 45.2539 21.2942 45.5611 21.4236 46.1109C21.4236 46.402 21.3185 46.6607 21.1083 46.8871C20.898 47.1135 20.6636 47.2267 20.4049 47.2267H3.81416C3.55544 47.2267 3.32097 47.1135 3.11076 46.8871C2.90054 46.6607 2.79544 46.402 2.79544 46.1109C2.79544 45.6905 2.89246 45.3832 3.0865 45.1892Z'
                                fill='currentcolor'
                            />
                            <path
                                className={styles.applyFill}
                                d='M32.452 0.81128C31.4067 0.810945 30.3748 1.04572 29.4325 1.49823C28.4902 1.95074 27.6618 2.60938 27.0086 3.42541C26.3553 4.24143 25.894 5.19394 25.6587 6.21241C25.4234 7.23087 25.4202 8.28922 25.6493 9.30909C24.6465 9.53471 23.7256 10.0331 22.9883 10.7493C22.2509 11.4654 21.7259 12.3715 21.4712 13.3673C21.2165 14.3631 21.242 15.4099 21.5448 16.3922C21.8477 17.3744 22.4162 18.2538 23.1875 18.9332C22.3381 19.6824 21.7369 20.6725 21.464 21.7718C21.1911 22.871 21.2594 24.0273 21.6599 25.0868C22.0604 26.1463 22.774 27.0587 23.7058 27.7026C24.6376 28.3464 25.7434 28.6913 26.876 28.6912H31.058V40.6601L22.287 31.8863C22.1574 31.7567 22.0035 31.6539 21.8342 31.5837C21.6648 31.5136 21.4833 31.4775 21.3001 31.4775C21.1168 31.4775 20.9353 31.5136 20.7659 31.5837C20.5966 31.6539 20.4427 31.7567 20.3131 31.8863C20.1835 32.0159 20.0807 32.1697 20.0105 32.3391C19.9404 32.5084 19.9043 32.6899 19.9043 32.8732C19.9043 33.0565 19.9404 33.238 20.0105 33.4074C20.0807 33.5767 20.1835 33.7306 20.3131 33.8602L31.058 44.6023V46.8132C31.058 47.1829 31.2049 47.5375 31.4663 47.7989C31.7278 48.0603 32.0823 48.2072 32.452 48.2072C32.8217 48.2072 33.1763 48.0603 33.4377 47.7989C33.6992 47.5375 33.846 47.1829 33.846 46.8132V44.6023L44.591 33.8602C44.8527 33.5984 44.9998 33.2434 44.9998 32.8732C44.9998 32.503 44.8527 32.148 44.591 31.8863C44.3292 31.6245 43.9742 31.4775 43.604 31.4775C43.2338 31.4775 42.8788 31.6245 42.6171 31.8863L33.846 40.6601V28.6912H38.028C39.1607 28.6913 40.2665 28.3464 41.1983 27.7026C42.1301 27.0587 42.8437 26.1463 43.2442 25.0868C43.6446 24.0273 43.713 22.871 43.4401 21.7718C43.1672 20.6725 42.566 19.6824 41.7165 18.9332C42.4878 18.2538 43.0563 17.3744 43.3592 16.3922C43.6621 15.4099 43.6876 14.3631 43.4329 13.3673C43.1782 12.3715 42.6531 11.4654 41.9158 10.7493C41.1785 10.0331 40.2576 9.53471 39.2547 9.30909C39.4839 8.28922 39.4807 7.23087 39.2454 6.21241C39.0101 5.19394 38.5488 4.24143 37.8955 3.42541C37.2423 2.60938 36.4138 1.95074 35.4716 1.49823C34.5293 1.04572 33.4973 0.810945 32.452 0.81128ZM38.028 25.9032H26.876C26.1366 25.9032 25.4275 25.6095 24.9046 25.0866C24.3818 24.5638 24.0881 23.8547 24.0881 23.1152C24.0881 22.3758 24.3818 21.6667 24.9046 21.1438C25.4275 20.621 26.1366 20.3272 26.876 20.3272C27.2458 20.3272 27.6003 20.1804 27.8618 19.919C28.1232 19.6575 28.27 19.303 28.27 18.9332C28.27 18.5635 28.1232 18.209 27.8618 17.9475C27.6003 17.6861 27.2458 17.5392 26.876 17.5392C26.1366 17.5392 25.4275 17.2455 24.9046 16.7227C24.3818 16.1998 24.0881 15.4907 24.0881 14.7513C24.0881 14.0118 24.3818 13.3027 24.9046 12.7798C25.4275 12.257 26.1366 11.9633 26.876 11.9633H27.6232C27.8677 11.9628 28.1077 11.898 28.3192 11.7754C28.5308 11.6529 28.7063 11.4769 28.8283 11.265C28.9504 11.0532 29.0145 10.813 29.0144 10.5686C29.0143 10.3241 28.9499 10.084 28.8276 9.87226C28.4616 9.23644 28.2693 8.51553 28.27 7.78189C28.2708 7.04825 28.4644 6.32771 28.8317 5.6926C29.1989 5.05748 29.7267 4.53015 30.3622 4.16354C30.9977 3.79692 31.7184 3.60393 32.452 3.60393C33.1857 3.60393 33.9064 3.79692 34.5419 4.16354C35.1773 4.53015 35.7052 5.05748 36.0724 5.6926C36.4396 6.32771 36.6333 7.04825 36.634 7.78189C36.6347 8.51553 36.4424 9.23644 36.0764 9.87226C35.9542 10.084 35.8898 10.3241 35.8897 10.5686C35.8895 10.813 35.9537 11.0532 36.0757 11.265C36.1977 11.4769 36.3733 11.6529 36.5848 11.7754C36.7964 11.898 37.0364 11.9628 37.2808 11.9633H38.028C38.7674 11.9633 39.4766 12.257 39.9994 12.7798C40.5223 13.3027 40.816 14.0118 40.816 14.7513C40.816 15.4907 40.5223 16.1998 39.9994 16.7227C39.4766 17.2455 38.7674 17.5392 38.028 17.5392C37.6583 17.5392 37.3037 17.6861 37.0423 17.9475C36.7809 18.209 36.634 18.5635 36.634 18.9332C36.634 19.303 36.7809 19.6575 37.0423 19.919C37.3037 20.1804 37.6583 20.3272 38.028 20.3272C38.7674 20.3272 39.4766 20.621 39.9994 21.1438C40.5223 21.6667 40.816 22.3758 40.816 23.1152C40.816 23.8547 40.5223 24.5638 39.9994 25.0866C39.4766 25.6095 38.7674 25.9032 38.028 25.9032Z'
                                fill='currentcolor'
                            />
                        </svg>

                        <span>Aplicação</span>
                    </button>

                    <button
                        type='button'
                        onClick={() => {
                            setType(4)
                            setStep(2)
                        }}>
                        <HarvestIcon />

                        <span>Colheita</span>
                    </button>

                    <button
                        type='button'
                        onClick={() => {
                            setType(5)
                            setStep(2)
                        }}>
                        <IconifyIcon icon='ph:cloud-rain' />
                        <span>Chuva</span>
                    </button>
                </div>
            )}

            {step == 2 && (
                <div className={styles.activityWrapper}>
                    <span>Selecione as área(s) para registro:</span>
                    <CropsSelector
                        added={localLinkedCrops}
                        available={localAvailableCrops}
                        multiple='first'
                        changeEvent={(e: ChangeEvent<HTMLInputElement>) => changeLocalCrops(e)}
                    />
                    <form onSubmit={submitActivity}>
                        {type == 1 && (
                            <>
                                <span className={styles.marginBottom}>
                                    Complete as informações sobre a semente utilizada
                                </span>

                                <div className={styles.plantFormGrid}>
                                    <GeralInput
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                            handleUserInputChange(e)
                                            // productChange(e);
                                        }}
                                        customClasses={[`${styles.lessPadding}`]}
                                        type='select'
                                        label='Cultura'
                                        placeholder='Selecione'
                                        defaultValue={formData.product_id}
                                        name='product_id'
                                        required>
                                        <option value={0}>Selecione</option>

                                        {products
                                            .filter((product: any) => product.type == 1)
                                            .map((product: any) => (
                                                <option key={product.id} value={product.id}>
                                                    {product.name}
                                                </option>
                                            ))}
                                    </GeralInput>
                                    <GeralInput
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                            handleUserInputChange(e)
                                            // productChange(e);
                                        }}
                                        customClasses={[`${styles.lessPadding}`]}
                                        type='select'
                                        label='Cultivar'
                                        placeholder='Selecione'
                                        defaultValue={formData.culture_code}
                                        name='culture_code'
                                        required>
                                        <option value={0}>Selecione</option>

                                        {products
                                            .filter((item: any) => item.id == parseFloat(formData.product_id))
                                            .map((item: any) =>
                                                item.extra_column
                                                    ?.split(',')
                                                    .sort()
                                                    .map((variety: string) => (
                                                        <option key={`${item.id}-${variety}`} value={variety}>
                                                            {variety}
                                                        </option>
                                                    )),
                                            )}
                                    </GeralInput>
                                    {/* <GeralInput
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleUserInputChange(e)}
                                        customClasses={[`${styles.lessPadding}`]}
                                        type='text'
                                        label='Dose'
                                        name='dosage'
                                        placeholder='Digite aqui'
                                        defaultValue={formData.dosage}
                                        required
                                    />
                                    <GeralInput
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleUserInputChange(e)}
                                        customClasses={[`${styles.lessPadding}`]}
                                        type='text'
                                        label='Cultura'
                                        name='culture_name'
                                        readOnly
                                        defaultValue={formData.culture_name}
                                        placeholder='Digite aqui'
                                        required
                                    /> */}
                                    {/* <GeralInput
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleUserInputChange(e)}
                                        customClasses={[`${styles.lessPadding}`]}
                                        type='text'
                                        label='Cultivar'
                                        name='culture_code'
                                        readOnly
                                        defaultValue={formData.culture_code}
                                        placeholder='Digite aqui'
                                        required
                                    /> */}
                                    <GeralInput
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleUserInputChange(e)}
                                        customClasses={[`${styles.lessPadding}`]}
                                        type='date'
                                        name='date'
                                        label='Data'
                                        defaultValue={formData.date}
                                        placeholder='00-00-0000'
                                        required
                                    />

                                    {isLoadingArea ? (
                                        <IconifyIcon icon='line-md:loading-loop' />
                                    ) : (
                                        <div>
                                            <GeralInput
                                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                    handleUserInputChange(e)
                                                }
                                                customClasses={[`${styles.lessPadding}`]}
                                                type='text'
                                                label='Área'
                                                name='area'
                                                maskVariant='price'
                                                defaultValue={formData.area}
                                                placeholder='00'
                                                required
                                                disabled={localLinkedCrops.length > 1}
                                            />
                                            {localLinkedCrops.length > 1 && (
                                                <p style={{ marginTop: '10px' }}>
                                                    O lançamento de plantio
                                                    <br />
                                                    utilizará a área disponível
                                                    <br />
                                                    de cada lavoura
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <GeralInput
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleUserInputChange(e)}
                                        customClasses={[`${styles.lessPadding}`]}
                                        type='text'
                                        label='Custo/Kg'
                                        name='cost_per_kilogram'
                                        maskVariant='price'
                                        defaultValue={formData.cost_per_kilogram}
                                        placeholder='00'
                                        required
                                    />
                                    <GeralInput
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleUserInputChange(e)}
                                        customClasses={[`${styles.lessPadding}`]}
                                        type='text'
                                        label={`Kg/${getMetricUnity()}`}
                                        name='kilogram_per_ha'
                                        maskVariant='price'
                                        defaultValue={formData.kilogram_per_ha}
                                        placeholder='00'
                                        required
                                    />
                                    <GeralInput
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                            handleUserInputChange(e)
                                            spacingOrLinearChange(e)
                                        }}
                                        customClasses={[`${styles.lessPadding}`]}
                                        type='text'
                                        label='Espaçamento (m)'
                                        name='spacing'
                                        maskVariant='price'
                                        placeholder='0'
                                        required
                                        defaultValue={formData.spacing}
                                    />
                                    <GeralInput
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                            handleUserInputChange(e)
                                            spacingOrLinearChange(e)
                                        }}
                                        customClasses={[`${styles.lessPadding}`]}
                                        type='text'
                                        label='Semente/m. linear'
                                        name='seed_per_linear_meter'
                                        maskVariant='price'
                                        placeholder='0'
                                        defaultValue={formData.seed_per_linear_meter}
                                        required
                                    />
                                    <GeralInput
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleUserInputChange(e)}
                                        customClasses={[`${styles.lessPadding}`]}
                                        type='text'
                                        label='PMS'
                                        name='pms'
                                        maskVariant='price'
                                        defaultValue={formData.pms}
                                        placeholder='0'
                                        required
                                    />
                                    <br />
                                    <GeralInput
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleUserInputChange(e)}
                                        customClasses={[`${styles.lessPadding}`]}
                                        type='text'
                                        label='Sementes por m2'
                                        name='seed_per_square_meter'
                                        readOnly
                                        maskVariant='price'
                                        placeholder='00'
                                        defaultValue={formData.seed_per_square_meter}
                                        required
                                    />
                                    <GeralInput
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleUserInputChange(e)}
                                        customClasses={[`${styles.lessPadding}`]}
                                        type='text'
                                        label={`Qtd/${getMetricUnity()}`}
                                        maskVariant='price'
                                        name='quantity_per_ha'
                                        readOnly
                                        placeholder='0'
                                        defaultValue={formData.quantity_per_ha}
                                        required
                                    />
                                </div>
                            </>
                        )}
                        {type == 3 && (
                            <>
                                <span className={styles.marginBottom}>
                                    Selecione os produtos e as respectivas doses e datas
                                </span>

                                <div className={styles.fertilizerFormGrid} style={{ marginBottom: '20px' }}>
                                    <GeralInput
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleUserInputChange(e)}
                                        customClasses={[`${styles.lessPadding}`]}
                                        type='date'
                                        label='Data'
                                        defaultValue={formData.date}
                                        name='date'
                                        placeholder='00-00-0000'
                                        required
                                    />
                                </div>
                                {formData.products_id &&
                                    formData.products_id
                                        .filter((item: any) => item !== '')
                                        .map((item: any, index: any) => (
                                            <div key={`product-${item}-${index}`} className={styles.flexItem}>
                                                <GeralInput
                                                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                        handleProductItemChange(e, index)
                                                    }
                                                    customClasses={[`${styles.lessPadding}`]}
                                                    type='select'
                                                    label='Selecione os produtos'
                                                    name='products_id'
                                                    placeholder='Selecione o produto'
                                                    defaultValue={formData.products_id[index]}
                                                    required>
                                                    <option value={0} selected disabled>
                                                        Selecione
                                                    </option>

                                                    {products
                                                        .filter((item: any) => item.type == 3)
                                                        .map((product: any) => (
                                                            <option key={product.id} value={product.id}>
                                                                {product.name}
                                                            </option>
                                                        ))}
                                                </GeralInput>
                                                <GeralInput
                                                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                        handleProductItemChange(e, index)
                                                    }
                                                    customClasses={[`${styles.lessPadding}`]}
                                                    type='text'
                                                    label={`Dose/${getMetricUnity()}`}
                                                    maskVariant='price'
                                                    placeholder='Informe a dose '
                                                    name='dosages'
                                                    decimalScale={3}
                                                    required
                                                />
                                                <button
                                                    type='button'
                                                    onClick={() => removeItem('products_id', item.toString())}
                                                    className={`${styles.deleteButton}`}>
                                                    <IconifyIcon icon='ph:trash' />
                                                </button>
                                            </div>
                                        ))}
                                <div style={{ marginTop: '15px' }}></div>
                                <GeralButton
                                    type='button'
                                    variant='inlineGreen'
                                    onClick={() => {
                                        setFormData((prev: any) => ({
                                            ...prev,
                                            products_id: [...prev.products_id, '0'],
                                        }))
                                    }}>
                                    + Adicionar entrada
                                </GeralButton>
                            </>
                        )}
                        {type == 2 && (
                            <>
                                <span className={styles.marginBottom}>
                                    Complete as informações sobre o defensivo utilizado
                                </span>

                                <div className={styles.applicationFormGrid}>
                                    <GeralInput
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleUserInputChange(e)}
                                        customClasses={[`${styles.lessPadding}`]}
                                        label='Data'
                                        defaultValue={formData.date}
                                        type='date'
                                        name='date'
                                        placeholder='00-00-0000'
                                        required
                                    />
                                </div>

                                {formData.products_id &&
                                    formData.products_id
                                        .filter((item: any) => item !== '')
                                        .map((item: any, index: any) => (
                                            <div key={`product-${item}-${index}`} className={styles.flexItem}>
                                                <GeralInput
                                                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                        handleProductItemChange(e, index)
                                                    }
                                                    customClasses={[`${styles.lessPadding}`]}
                                                    type='select'
                                                    label='Tipo de insumo'
                                                    defaultValue={formData.defensive_name[index]}
                                                    name='defensive_name'
                                                    placeholder='Selecione o produto'
                                                    required>
                                                    <option value='1'>Adjuvante</option>
                                                    <option value='2'>Biológico</option>
                                                    <option value='3'>Fertilizante foliar</option>
                                                    <option value='4'>Fungicida</option>
                                                    <option value='5'>Herbicida</option>
                                                    <option value='6'>Inseticida</option>
                                                </GeralInput>
                                                <GeralInput
                                                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                        handleProductItemChange(e, index)
                                                    }
                                                    customClasses={[`${styles.lessPadding}`]}
                                                    type='select'
                                                    label='Produto'
                                                    defaultValue={formData.products_id[index]}
                                                    name='products_id'
                                                    placeholder='Selecione o produto'
                                                    required>
                                                    {products
                                                        .filter(
                                                            (item: any) =>
                                                                item.object_type ==
                                                                parseFloat(formData.defensive_name[index]),
                                                        )
                                                        .map((item: any) => (
                                                            <option key={`${item.id}-${item.name}`} value={item.id}>
                                                                {item.name}
                                                            </option>
                                                        ))}
                                                </GeralInput>
                                                <GeralInput
                                                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                        handleProductItemChange(e, index)
                                                    }
                                                    customClasses={[`${styles.lessPadding}`]}
                                                    type='text'
                                                    label={`Dose/${getMetricUnity()}`}
                                                    maskVariant='price'
                                                    placeholder='Informe a dose '
                                                    name='dosages'
                                                    decimalScale={3}
                                                    required
                                                />

                                                <button
                                                    onClick={() => removeItem('products_id', item.toString())}
                                                    className={`${styles.deleteButton}`}>
                                                    <IconifyIcon icon='ph:trash' />
                                                </button>
                                            </div>
                                        ))}

                                <div style={{ marginTop: '15px' }}></div>
                                <GeralButton
                                    type='button'
                                    variant='inlineGreen'
                                    onClick={() => {
                                        setFormData((prev: any) => ({
                                            ...prev,
                                            products_id: [...prev.products_id, '0'],
                                        }))
                                    }}>
                                    + Adicionar entrada
                                </GeralButton>
                            </>
                        )}
                        {type == 4 && (
                            <>
                                <span className={styles.marginBottom}>Complete as informações sobre a colheita</span>

                                <div className={styles.harvestFormGrid}>
                                    <GeralInput
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleUserInputChange(e)}
                                        customClasses={[`${styles.lessPadding}`]}
                                        type='text'
                                        label='Produção total (kg)'
                                        name='total_production'
                                        placeholder='Digite aqui'
                                        required
                                    />
                                    <GeralInput
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleUserInputChange(e)}
                                        customClasses={[`${styles.lessPadding}`]}
                                        type='date'
                                        name='date'
                                        defaultValue={formData.date}
                                        label='Data'
                                        placeholder='00-00-0000'
                                        required
                                    />
                                </div>
                            </>
                        )}

                        {type == 5 && (
                            <>
                                <span className={styles.marginBottom}>Informe os volumes de chuva</span>

                                {formData.volumes &&
                                    formData.volumes.map((_volume: any, index: any) => (
                                        <div key={`volume-${index}`} className={styles.flexItem}>
                                            <GeralInput
                                                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                                    handleAddInput(e, index)
                                                }}
                                                customClasses={[`${styles.lessPadding}`]}
                                                type='date'
                                                label={`Data #${index + 1}`}
                                                name='dates'
                                                required
                                            />

                                            <GeralInput
                                                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                                    handleAddInput(e, index)
                                                }}
                                                customClasses={[`${styles.lessPadding}`]}
                                                type='text'
                                                label={`Volume #${index + 1}`}
                                                name='volumes'
                                                maskVariant='price'
                                                placeholder='0'
                                                required
                                            />

                                            <button
                                                onClick={removeRainGaugeItem(index)}
                                                className={`${styles.deleteButton}`}
                                                type='button'>
                                                <IconifyIcon icon='ph:trash' />
                                            </button>
                                        </div>
                                    ))}
                                <GeralButton
                                    type='button'
                                    value='+Adicionar chuva'
                                    variant='inlineGreen'
                                    onClick={addRainGauge}
                                />
                            </>
                        )}
                        <div className={styles.activityActions}>
                            <GeralButton
                                type='submit'
                                variant='secondary'
                                value='Registrar atividade'
                                customClasses={['toFill']}
                            />
                            <GeralButton
                                type='button'
                                variant='tertiary'
                                value='Cancelar'
                                customClasses={['toFill']}
                                onClick={() => {
                                    setShow(false)
                                    setStep(1)
                                    setType(0)
                                }}
                            />
                        </div>
                    </form>
                </div>
            )}
        </>
    )
}

export default ActivitySteps
