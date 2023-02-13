import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, MemoryHealthIndicator, TypeOrmHealthIndicator } from '@nestjs/terminus';

@ApiTags('v1/health')
@Controller('v1/health')
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private memory: MemoryHealthIndicator,
        private typeormHealthIndicator: TypeOrmHealthIndicator,
    ) {}

    @Get()
    @HealthCheck()
    check() {
        return this.health.check([
            () => this.typeormHealthIndicator.pingCheck('database'),
            () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024),
            () => this.memory.checkRSS('memory_rss', 3000 * 1024 * 1024),
        ]);
    }
}
