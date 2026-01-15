import { Body, Controller, ForbiddenException, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import express from 'express';

import { JwtAuthGuard } from '../../services/auth/jwt.guard';
import { UserService } from '../../services/user/user.service';
import { IngestHealthDto } from '../../dtos/user/ingest-health.dto';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post(':userId/health-data')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ingest health data for a user' })
  @UseGuards(JwtAuthGuard)
  ingestHealth(
    @Param('userId') userId: string,
    @Body() dto: IngestHealthDto,
    @Req() req: express.Request,
  ) {
    const authUserId = (req as any).user?.userId; 
    if (!authUserId || authUserId !== userId) {
      throw new ForbiddenException('You can only ingest data for your own userId');
    }

    return this.userService.ingestHealthData(userId, dto);
  }
}
