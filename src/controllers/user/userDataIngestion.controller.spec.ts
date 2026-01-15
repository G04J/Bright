import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { UserDataIngestionController } from './userDataIngestion.controller';
import { userDataIngestionService } from '../../services/user/userDataIngestion.service';

describe('UserController - ingestHealth', () => {
  let controller: UserDataIngestionController;

  const userDataIngestionServiceMock = {
    ingestHealthData: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserDataIngestionController],
      providers: [
        {
          provide: userDataIngestionService,
          useValue: userDataIngestionServiceMock,
        },
      ],
    }).compile();

    controller = module.get<UserDataIngestionController>(
      UserDataIngestionController,
    );
    jest.clearAllMocks();
  });

  it('throws 403 when JWT userId does not match path userId', () => {
    const req: any = { user: { userId: 'jwt-user' } };

    expect(() =>
      controller.ingestHealth(
        'path-user',
        { activity: { steps: 10 } } as any,
        req,
      ),
    ).toThrow(ForbiddenException);

    expect(
      userDataIngestionServiceMock.ingestHealthData,
    ).not.toHaveBeenCalled();
  });

  it('calls userDataIngestionService when JWT userId matches path userId', async () => {
    const req: any = { user: { userId: 'same-user' } };

    userDataIngestionServiceMock.ingestHealthData.mockResolvedValueOnce({
      ok: true,
    });

    const res = await controller.ingestHealth(
      'same-user',
      { activity: { steps: 10 } } as any,
      req,
    );

    expect(userDataIngestionServiceMock.ingestHealthData).toHaveBeenCalledWith(
      'same-user',
      expect.any(Object),
    );
    expect(res).toEqual({ ok: true });
  });
});
