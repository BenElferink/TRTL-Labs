const truncateStringInMiddle = (str: string, len = 6) => {
  const startStr = str.substring(0, len)
  const endStr = str.substring(str.length - len, str.length)

  const fullStr = `${startStr}...${endStr}`

  return fullStr
}

export default truncateStringInMiddle
