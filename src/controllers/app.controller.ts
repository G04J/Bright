// app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { AppService } from '../services/app.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

/**
 * Root controller for application health check and basic information.
 */
@ApiTags('Application')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Health check endpoint that returns a welcome message.
   *
   * @returns A greeting message indicating the API is running
   *
   * @example
   * GET /
   * Returns: "Hello World!"
   */
  @Get()
  @ApiOperation({ summary: 'Get application status' })
  @ApiResponse({ status: 200, description: 'Returns welcome message' })
  getHello(): string {
    return this.appService.getHello();
  }
}
