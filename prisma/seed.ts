import { UserService } from '../src/service/user'
import logger from '../src/config/logger'

async function main() {
  try {
    logger.info('🚀 Début du seeding des rôles...')
    await UserService.seedRoles()
    logger.info('✅ Roles seedés avec succès !')
  } catch (error) {
    logger.error('❌ Erreur lors du seeding :', error)
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

main()
