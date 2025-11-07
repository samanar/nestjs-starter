import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ClsModule } from 'nestjs-cls';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const uri = configService.getOrThrow<string>('MONGODB_URI');
        return {
          uri,
          user: configService.getOrThrow<string>('MONGODB_USERNAME'),
          pass: configService.getOrThrow<string>('MONGODB_PASSWORD'),
          dbName: configService.getOrThrow<string>('MONGODB_DATABASE'),
        };
      },
      inject: [ConfigService],
    }),
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        setup: (cls, req) => {
          // if (req.headers['x-auth-user']) {
          //   try {
          //     let userId = new Types.ObjectId(
          //       req.headers['x-auth-user'] as string,
          //     );
          //     cls.set('userId', userId);
          //   } catch (error) {}
          // }
        },
      },
    }),
    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'Logger',
      useValue: console,
    },
  ],
})
export class AppModule {}
