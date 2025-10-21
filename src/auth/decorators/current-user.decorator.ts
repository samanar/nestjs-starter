import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserDocument } from 'src/user/schemas/user.schema';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserDocument => {
    const request = ctx.switchToHttp().getRequest() as any;
    return request.user;
  },
);
