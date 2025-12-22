/**
 *
 * @param type ['id', 'email', 'number','string', 'phoneNumber']
 * @param value string | number
 * @returns isNotOkay -> true
 */
export default function inputValidator(
  input: string,
  value: string | number,
): string {
  switch (input) {
    case 'id':
      if (typeof value !== 'number' || isNaN(value)) {
        return 'INVALID_ID: attendu un nombre'
      }
      return 'OK'

    case 'email':
      if (typeof value !== 'string') {
        return 'INVALID_EMAIL_TYPE: attendu une chaîne de caractères'
      }
      const emailDomain = ['gmail', 'outlook', 'hotmail', 'icloud']
      const emailExtension = ['.com', '.fr']
      const emailValid =
        value.includes('@') &&
        emailDomain.some((domain) => value.includes(domain)) &&
        emailExtension.some((ext) => value.endsWith(ext))
      if (!emailValid) {
        return "INVALID_EMAIL_FORMAT: l'email doit avoir un domaine et une extension autorisés"
      }
      return 'OK'
    case 'number':
      if (typeof value != 'number') {
        return 'INVALID_NUMBER_TYPE: attendu un nombre'
      }
      return 'OK'

    case 'string':
      if (typeof value !== 'string') {
        return 'INVALID_STRING_TYPE: attendu une chaîne de caractères'
      }
      if (/\d/.test(value)) {
        return 'INVALID_STRING_FORMAT: la chaîne ne doit pas contenir de chiffres'
      }
      return 'OK'

    case 'phoneNumber':
      if (typeof value !== 'string') {
        return 'INVALID_PHONENUMBER_TYPE: attendu une chaîne de caractères'
      }
      if (!/^\d+$/.test(value)) {
        // uniquement des chiffres
        return 'INVALID_PHONENUMBER_FORMAT: la chaîne ne doit contenir que des chiffres'
      }
      return 'OK'

    default:
      return 'UNKNOWN_FIELD: champ non reconnu'
  }
}

/**
 *
 * @param fields ['id', 'email', 'string', 'phoneNumber']
 * @returns
 */
export async function hundlerValidator(fieldsArray: Record<string, any>[]) {
  for (const fieldObj of fieldsArray) {
    for (const [key, value] of Object.entries(fieldObj)) {
      if (value === undefined || value === null) continue
      const message = inputValidator(key, value)
      if (message !== 'OK') {
        return [`Value : ${value}`, `Error : ${message}`]
      }
    }
  }
  return true
}
