import { Command, CommandRunner } from 'nest-commander';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserEntity } from '@src/modules/user/entities/user.entity';
import bcrypt from 'bcrypt';
import { Role } from '@src/enums';
import { LoggerService } from '@src/logger/custom.logger';
import { BCRYPT_SALT } from '@src/configs';

@Command({ name: 'seed:user' })
export class UserCommander extends CommandRunner {
    constructor(@InjectDataSource() private readonly dataSource: DataSource) {
        super();
    }
    async run(passedParams: string[], options?: Record<string, any>): Promise<void> {
        try {
            await this.dataSource.transaction(async tran => {
                const userRepository = await tran.getRepository(UserEntity);
                const user = await userRepository.findOne({
                    where: {
                        email: 'nduylong9501@gmail.com',
                    },
                });
                if (user) {
                    await userRepository.save({
                        ...user,
                        password: bcrypt.hashSync('12345678', BCRYPT_SALT),
                        isActive: true,
                        role: Role.ADMIN,
                    });
                } else {
                    await userRepository.save({
                        email: 'nduylong9501@gmail.com',
                        password: bcrypt.hashSync('12345678', BCRYPT_SALT),
                        isActive: true,
                        role: Role.ADMIN,
                    });
                }
            });
        } catch (e) {
            LoggerService.error(e);
        }
    }
}
