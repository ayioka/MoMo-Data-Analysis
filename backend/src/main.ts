// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { enableAppConfig } from './configs/app.configs';
import { AppConfigService } from './configs/app-configs.service';
import { APP_NAME } from './common/constants/all-constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const { port, environment } = app.get(AppConfigService);

  await enableAppConfig(app);

  await app.listen(port, () => {
    console.warn(
      `${APP_NAME} is running on port => ${port} in ${environment} mode  🚀`,
    );
  });
}
bootstrap();
