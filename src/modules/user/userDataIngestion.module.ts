import { Module } from '@nestjs/common';
import { UserDataIngestionController } from '../../controllers/user/userDataIngestion.controller';
import { userDataIngestionService } from '../../services/user/userDataIngestion.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UserDataIngestionController],
  providers: [userDataIngestionService],
  exports: [userDataIngestionService],
})
export class UserDataIngestionModule {}
