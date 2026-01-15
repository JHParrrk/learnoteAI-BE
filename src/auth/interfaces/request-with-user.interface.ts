import { Request } from 'express';
import { User } from '../../common/entities/user.entity';

export interface ValidatedUser {
  userId: number;
  email: string;
}

export interface RequestWithUser extends Request {
  user: ValidatedUser;
}

export interface RequestWithUserEntity extends Request {
  user: User;
}
