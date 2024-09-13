const getFileName = (fileItem: string | File | undefined): string => {
    if (fileItem == undefined || fileItem == '') return 'Nome do arquivo'

    if (typeof fileItem == 'string') {
        return fileItem
    } else {
        return fileItem.name
    }
}

export default getFileName
