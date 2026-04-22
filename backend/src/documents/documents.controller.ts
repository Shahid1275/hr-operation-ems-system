import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { mkdirSync } from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PermissionsRequired } from '../auth/decorators/permissions.decorator';
import { Permissions } from '../auth/constants/permissions';
import { DocumentsService } from './documents.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';

mkdirSync('uploads/documents', { recursive: true });

@Controller('documents')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @PermissionsRequired(Permissions.EMPLOYEE_MANAGE)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: 'uploads/documents',
        filename: (_req, file, cb) => {
          const safe = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
          cb(null, `${Date.now()}-${safe}${extname(file.originalname) ? '' : '.bin'}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (_req, file, cb) => {
        const allowed = [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        cb(null, allowed.includes(file.mimetype));
      },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('employeeId') employeeId: string,
    @Body('companyId') companyId: string,
    @Body('category') category: string,
    @CurrentUser() user: AuthUser,
  ) {
    if (!file) throw new BadRequestException('Valid file is required');
    if (!employeeId || !companyId || !category) {
      throw new BadRequestException('employeeId, companyId, and category are required');
    }
    return this.documentsService.create({
      employeeId,
      companyId,
      category,
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      storagePath: file.path.replace(/\\/g, '/'),
      uploadedById: user.id,
    });
  }

  @Get()
  @PermissionsRequired(Permissions.EMPLOYEE_READ)
  list(@Query('companyId') companyId: string, @Query('employeeId') employeeId?: string) {
    return this.documentsService.list(companyId, employeeId);
  }
}
