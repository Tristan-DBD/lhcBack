import {
  Consumes,
  Delete,
  Post,
  Route,
  Security,
  Tags,
  UploadedFile,
  Path,
  Body,
} from 'tsoa'
import { ProgramService as ps } from '../../service/program'

@Route('user/program')
@Tags('Programmes')
export class ProgramController {
  @Post('/:id')
  @Security('BearerAuth')
  @Consumes('multipart/form-data')
  public async create(
    @Path() id: string,
    @UploadedFile() programFile: any,
  ): Promise<any> {
    return {} as any
  }

  @Delete('/:id')
  @Security('BearerAuth')
  public async delete(
    @Path() id: string,
    @Body() body: { name: string },
  ): Promise<any> {
    return {} as any
  }
}
