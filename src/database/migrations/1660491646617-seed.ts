import { MigrationInterface, QueryRunner } from 'typeorm';

export class seed1660491646617 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
        INSERT INTO users (deleted, createdAt, updatedAt, id, email, firstName, lastName, password, role, isActive) VALUES ('0', '2022-07-27 10:48:38.866052', '2022-07-28 10:37:53.460672', '1', 'nduylong9501@gmail.com', 'Long', 'Nguyễn', '$2b$10$wQoJDvQiQGQn0sGTP5ue9etxrUJovLeMXUmDFjom/.8cIuKhogVuS', 'ADMIN', '1');
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
