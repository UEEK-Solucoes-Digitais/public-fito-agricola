import WriteLog from './logger'

export const getException = (error: unknown): Response => {
    if (error instanceof Error) {
        WriteLog(error.message, 'error')
    } else {
        WriteLog(error, 'error')
    }

    return new Response(JSON.stringify({ error: 'Ocorreu um erro interno.' }), {
        status: 500,
        headers: {
            'Content-Type': 'application/json',
        },
    })
}
