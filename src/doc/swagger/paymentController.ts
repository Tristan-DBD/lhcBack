import {
  Body,
  Consumes,
  Get,
  Path,
  Post,
  Route,
  Tags,
  Security,
  Example,
} from 'tsoa'

class PaymentStatusSchema {
  jan!: boolean
  feb!: boolean
  mar!: boolean
  apr!: boolean
  may!: boolean
  jun!: boolean
  jul!: boolean
  aug!: boolean
  sep!: boolean
  oct!: boolean
  nov!: boolean
  dec!: boolean
}

class PaymentYearSchema {
  @Example(1)
  id!: number
  @Example(2024)
  year!: number
  status!: PaymentStatusSchema
  @Example(10)
  userId!: number
}

class TogglePaymentDto {
  @Example(10)
  userId!: number
  @Example(2024)
  year!: number
  @Example('jan')
  month!: string
}

@Route('payment')
@Tags('Paiement')
export class PaymentController {
  /**
   * Bascule le statut de paiement d'un mois spécifique
   */
  @Post('/toggle')
  @Security('BearerAuth')
  @Consumes('application/json')
  public async toggleMonth(
    @Body() body: TogglePaymentDto,
  ): Promise<PaymentYearSchema> {
    return {} as any
  }

  /**
   * Récupère l'historique des paiements d'un utilisateur
   */
  @Get('/{userId}')
  @Security('BearerAuth')
  public async getPaymentsByUser(
    @Path() userId: number,
  ): Promise<PaymentYearSchema[]> {
    return [] as any
  }
}
