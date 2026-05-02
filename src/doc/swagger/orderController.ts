import {
  Body,
  Delete,
  Example,
  Get,
  Path,
  Post,
  Route,
  Security,
  Tags,
} from 'tsoa'

class OrderItemDto {
  @Example('uuid-prod')
  productId!: string

  @Example('L')
  size!: string

  @Example(2)
  quantity!: number
}

class CreateOrderDto {
  @Example([
    { productId: 'uuid-prod-1', size: 'L', quantity: 2 },
    { productId: 'uuid-prod-2', size: 'M', quantity: 1 }
  ])
  items!: OrderItemDto[]
}

class OrderResponse {
  id!: string
  userId!: string
  items!: OrderItemDto[]
  totalAmount!: number
  status!: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
  createdAt!: Date
  updatedAt!: Date
}

class OrderSummary {
  totalOrders!: number
  pendingOrders!: number
  confirmedOrders!: number
  cancelledOrders!: number
  totalRevenue!: number
}

@Route('order')
@Tags('Commandes')
export class OrderController {
  @Post('/')
  @Security('BearerAuth')
  public async create(@Body() body: CreateOrderDto): Promise<OrderResponse> {
    return {} as any
  }

  @Get('/')
  @Security('BearerAuth')
  public async getAll(): Promise<OrderResponse[]> {
    return [] as any
  }

  @Get('/my')
  @Security('BearerAuth')
  public async getMyOrders(): Promise<OrderResponse[]> {
    return [] as any
  }

  @Delete('/:id')
  @Security('BearerAuth')
  public async cancel(@Path() id: string): Promise<OrderResponse> {
    return {} as any
  }

  @Get('/summary')
  @Security('BearerAuth')
  public async getSummary(): Promise<OrderSummary> {
    return {} as any
  }
}
