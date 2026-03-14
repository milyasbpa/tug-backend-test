import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { ApiPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';

import { CreatePackageDto } from './dto/create-package.dto';
import { PackageResponseDto } from './dto/package-response.dto';
import { QueryPackageDto } from './dto/query-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { PackagesService } from './packages.service';

@ApiTags('admin / packages')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin/packages')
export class AdminPackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Get()
  @ApiOperation({ summary: 'List all wellness packages' })
  @ApiPaginatedResponse(PackageResponseDto)
  findAll(@Query() query: QueryPackageDto) {
    return this.packagesService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new wellness package' })
  @ApiCreatedResponse({ type: PackageResponseDto })
  create(@Body() dto: CreatePackageDto) {
    return this.packagesService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a wellness package' })
  @ApiOkResponse({ type: PackageResponseDto })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePackageDto) {
    return this.packagesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a wellness package' })
  @ApiOkResponse({ type: PackageResponseDto })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.packagesService.remove(id);
  }
}

@ApiTags('mobile / packages')
@ApiBearerAuth()
@Controller('mobile/packages')
export class MobilePackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Get()
  @ApiOperation({ summary: 'List all available wellness packages' })
  @ApiPaginatedResponse(PackageResponseDto)
  findAll(@Query() query: QueryPackageDto) {
    return this.packagesService.findAll(query);
  }
}
