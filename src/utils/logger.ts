export default function WriteLog(message: any, type: 'info' | 'warn' | 'error'): void {
    switch (type) {
        case 'info':
            if (process.env.NEXT_PUBLIC_SHOW_LOG_INFO) {
                console.log(message)
            }
            break
        case 'warn':
            if (process.env.NEXT_PUBLIC_SHOW_LOG_WARN) {
                console.warn(message)
            }
            break
        case 'error':
            if (process.env.NEXT_PUBLIC_SHOW_LOG_ERROR) {
                console.error(message)
            }
            break
    }
}
