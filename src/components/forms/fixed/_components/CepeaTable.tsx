import { useEffect, useState } from 'react'
import '../cepea.scss'

const cepeaData = (url: any, revalidationInterval = 60000) => {
    const [data, setData] = useState<any>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<any>(null)

    const fetchData = async () => {
        try {
            const response = await fetch(url)
            const text = await response.text()
            const parser = new DOMParser()
            const doc = parser.parseFromString(text, 'text/html')
            const rows = doc.querySelectorAll('table.imagenet-widget-tabela tbody tr')

            const newData = Array.from(rows).map((row) => ({
                date: row.querySelector('td:nth-child(1)')?.textContent,
                product: row.querySelector('td:nth-child(2) .maior')?.textContent,
                unit: row.querySelector('td:nth-child(2) .unidade')?.textContent,
                value: row.querySelector('td:nth-child(3) .maior')?.textContent,
            }))

            setData(newData)
            localStorage.setItem('fitoCEPEAData', JSON.stringify(newData))
            setLoading(false)
        } catch (err) {
            setError(err)
            setLoading(false)
        }
    }

    useEffect(() => {
        const storedData = localStorage.getItem('tableData')
        if (storedData) {
            setData(JSON.parse(storedData))
            setLoading(false)
        }

        fetchData()

        const intervalId = setInterval(fetchData, revalidationInterval)

        return () => clearInterval(intervalId)
    }, [url, revalidationInterval])

    return { data, loading, error }
}

const CepeaTable = () => {
    //! IMPORTANT: CEPEA SCRIPT ENDPOINT. Caso alterados os produtos, deve-se pegar o URL do SOURCE do script fornecido pelo CEPEA
    //! e alterar abaixo. Dados sÃ£o tradizos dinamicamente.
    const url =
        'https://www.cepea.esalq.usp.br/br/widgetproduto.js.php?fonte=arial&tamanho=10&largura=400px&corfundo=dbd6b2&cortexto=333333&corlinha=ede7bf&id_indicador%5B%5D=91&id_indicador%5B%5D=77&id_indicador%5B%5D=12&id_indicador%5B%5D=92&id_indicador%5B%5D=179'
    const { data, loading, error } = cepeaData(url)

    if (loading) return <div>Carregando...</div>
    if (error) return <div>Erro...</div>

    return (
        <table className='imagenet-widget-tabela'>
            <thead>
                <tr>
                    <td colSpan={3}>
                        <img
                            src='https://www.cepea.esalq.usp.br/view/imagens/cepea-widget-titulo.png'
                            alt='Cepea'
                            title='Cepea'
                        />
                    </td>
                </tr>
            </thead>
            <thead>
                <tr>
                    <th>Data</th>
                    <th>Produto</th>
                    <th>Valor</th>
                </tr>
            </thead>
            <tfoot>
                <tr>
                    <td colSpan={2}>Fonte: Cepea</td>
                    <td>
                        <a href='http://www.cepea.esalq.usp.br/' target='_blank' rel='noreferrer'>
                            <img
                                src='https://www.cepea.esalq.usp.br/view/imagens/cepea-widget.png'
                                alt='Cepea'
                                title='Cepea'
                                loading='lazy'
                                decoding='async'
                            />
                        </a>
                    </td>
                </tr>
            </tfoot>
            <tbody>
                {data.map((row: any) => (
                    <tr key={row.unit}>
                        <td>{row.date}</td>
                        <td>
                            <span className='maior'>{row.product}</span>
                            <br /> <span className='unidade'>{row.unit}</span>
                        </td>
                        <td>
                            R$ <span className='maior'>{row.value}</span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

export default CepeaTable
