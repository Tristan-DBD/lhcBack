import {
  Get,
  Route,
  Security,
  Tags,
} from 'tsoa'

@Route('metric')
@Tags('Métriques')
export class MetricController {
  @Get('/coverage')
  @Security('BearerAuth')
  public async getCoverage(): Promise<any> {
    return {} as any
  }
}
