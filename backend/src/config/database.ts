import { Sequelize } from 'sequelize-typescript';
import { Ticket } from '../models/ticket';
import { Queue } from '../models/queue';
import { Service } from '../models/service';

const sequelize = new Sequelize({
  database: process.env.DB_NAME,
  dialect: 'postgres',
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  models: [Ticket, Queue, Service],
});

export default sequelize;