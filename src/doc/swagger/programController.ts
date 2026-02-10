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
    @Path() id: number,
    @UploadedFile() programFile: Express.Multer.File,
  ) {
    const filePath = `public/prog/${programFile.filename}`
    const name = filePath.split('/').pop()!.split('.').slice(0, -1).join('.')
    return ps.create(id, name, filePath)
  }

  @Delete('/:id')
  @Security('BearerAuth')
  public async delete(@Path() id: number, @Body() body: { name: string }) {
    const programs = await ps.findByUser(id)
    if (!programs[0]) {
      throw new Error('Aucun programme trouvé pour cette utilisateur')
    }

    const programToDelete = programs.find((p) => p.name === body.name)
    if (!programToDelete) {
      throw new Error('Aucun programme trouvé avec ce nom')
    }

    return ps.delete(programToDelete.id)
  }
}
