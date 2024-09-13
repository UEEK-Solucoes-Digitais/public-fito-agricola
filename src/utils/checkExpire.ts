export const checkExpire = (expireCookie: any) => {
    const expire = expireCookie

    let tokenExpired = false

    if (!expire) {
        tokenExpired = true
    } else if (new Date(expire) < new Date()) {
        tokenExpired = true
    }

    return tokenExpired
}
