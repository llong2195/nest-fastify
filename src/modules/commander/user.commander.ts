import { Command, CommandRunner } from 'nest-commander';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserEntity } from '@src/modules/user/entities/user.entity';
import { RoleEnum } from '@src/enums';
import { LoggerService } from '@src/logger/custom.logger';
import { BCRYPT_SALT } from '@src/configs';
import { Hash } from '@utils/hash.util';

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
                        password: Hash.make('12345678', BCRYPT_SALT),
                        isActive: true,
                        role: RoleEnum.ADMIN,
                    });
                } else {
                    await userRepository.save({
                        email: 'nduylong9501@gmail.com',
                        password: Hash.make('12345678', BCRYPT_SALT),
                        isActive: true,
                        role: RoleEnum.ADMIN,
                    });
                }
            });
        } catch (e) {
            LoggerService.error(e);
        }
    }
}
