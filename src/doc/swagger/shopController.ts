import {
  Body,
  Delete,
  Example,
  Get,
  Path,
  Post,
  Put,
  Route,
  Security,
  Tags,
  UploadedFile,
} from 'tsoa'

class CreateProductDto {
  @Example('T-Shirt LHC')
  name!: string

  @Example(['S', 'M', 'L', 'XL'])
  sizes!: string[]

  @Example(29.99)
  price!: number
}

class ProductResponse {
  id!: number
  name!: string
  sizes!: Array<{ size: string; stock: number }>
  price!: number
  imageUri?: string
  createdAt!: Date
  updatedAt!: Date
}

class UpdatePriceDto {
  @Example(39.99)
  price!: number
}

class UpdateStockDto {
  @Example(5)
  stock!: number
}

class AddSizeDto {
  @Example('XXL')
  size!: string

  @Example(10)
  stock!: number
}

@Route('shop')
@Tags('Boutique')
export class ShopController {
  @Post('/')
  @Security('BearerAuth')
  public async create(
    @UploadedFile() productImage?: any,
  ): Promise<ProductResponse> {
    return {} as any
  }

  @Put('/:id/price')
  @Security('BearerAuth')
  public async updatePrice(
    @Path() id: number,
    @Body() body: UpdatePriceDto,
  ): Promise<ProductResponse> {
    return {} as any
  }

  @Get('/')
  @Security('BearerAuth')
  public async getAll(): Promise<ProductResponse[]> {
    return [] as any
  }

  @Get('/:id')
  @Security('BearerAuth')
  public async getById(@Path() id: number): Promise<ProductResponse> {
    return {} as any
  }

  @Put('/:id/stock/:size')
  @Security('BearerAuth')
  public async updateStock(
    @Path() id: number,
    @Path() size: string,
    @Body() body: UpdateStockDto,
  ): Promise<ProductResponse> {
    return {} as any
  }

  @Post('/:id/size')
  @Security('BearerAuth')
  public async addSize(
    @Path() id: number,
    @Body() body: AddSizeDto,
  ): Promise<ProductResponse> {
    return {} as any
  }

  @Put('/:id/image')
  @Security('BearerAuth')
  public async updateImage(
    @Path() id: number,
    @UploadedFile() productImage: any,
  ): Promise<ProductResponse> {
    return {} as any
  }

  @Delete('/:id/stock/:size')
  @Security('BearerAuth')
  public async deleteSize(
    @Path() id: number,
    @Path() size: string,
  ): Promise<ProductResponse> {
    return {} as any
  }

  @Delete('/:id')
  @Security('BearerAuth')
  public async delete(@Path() id: number): Promise<any> {
    return {} as any
  }
}
