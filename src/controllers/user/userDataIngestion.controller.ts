import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import express from 'express';

import { JwtAuthGuard } from '../../services/auth/jwt.guard';
import { userDataIngestionService } from '../../services/user/userDataIngestion.service';
import { IngestHealthDto } from '../../dtos/user/userDataIngestion.dto';
import { GetHealthDataQueryDto } from '../../dtos/user/getHealthDataQuery.dto';
import { GetSummaryQueryDto } from '../../dtos/user/getSummaryQuery.dto';

type AuthedRequest = express.Request & {
  user?: { userId?: string };
};

const getAuthUserId = (req: express.Request): string | undefined => {
  const r = req as unknown as AuthedRequest;
  return r.user?.userId;
};

@ApiTags('User Data Ingestion')
@Controller('users')
export class UserDataIngestionController {
  constructor(
    private readonly userDataIngestionService: userDataIngestionService,
  ) {}

  @Post(':userId/health-data')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ingest health data for a user' })
  @UseGuards(JwtAuthGuard)
  ingestHealth(
    @Param('userId') userId: string,
    @Body() dto: IngestHealthDto,
    @Req() req: express.Request,
  ) {
    const authUserId = getAuthUserId(req);
    if (!authUserId || authUserId !== userId) {
      throw new ForbiddenException(
        'You can only ingest data for your own userId',
      );
    }

    return this.userDataIngestionService.ingestHealthData(userId, dto);
  }

  @Get(':userId/health-data')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Retrieve merged health data for a user within a date range',
  })
  @UseGuards(JwtAuthGuard)
  getHealthData(
    @Param('userId') userId: string,
    @Query() query: GetHealthDataQueryDto,
    @Req() req: express.Request,
  ) {
    const authUserId = getAuthUserId(req);
    if (!authUserId || authUserId !== userId) {
      throw new ForbiddenException(
        'You can only retrieve data for your own userId',
      );
    }

    return this.userDataIngestionService.getHealthDataMergedByTimestamp(
      userId,
      query.start,
      query.end,
      query.page,
      query.limit,
    );
  }

  @Get(':userId/summary')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Basic aggregation summary for a user within a date range',
  })
  @UseGuards(JwtAuthGuard)
  getSummary(
    @Param('userId') userId: string,
    @Query() query: GetSummaryQueryDto,
    @Req() req: express.Request,
  ) {
    const authUserId = getAuthUserId(req);
    if (!authUserId || authUserId !== userId) {
      throw new ForbiddenException(
        'You can only retrieve summary for your own userId',
      );
    }

    return this.userDataIngestionService.getBasicSummary(
      userId,
      query.start,
      query.end,
    );
  }
}
