import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';

import { responseEnhancer } from './middleware/responseEnhancer';

import userRouter from './routes/user.router';

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
});

const PORT = process.env.PORT || 8000;

// ───── Middlewares ─────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(responseEnhancer);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const uploadsDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir));

// ───── Routes ─────
app.use('/users', userRouter);


app.get('/ping', (req, res) => {
    res.status(200).json({ message: 'pong' });
});

// ───── Start Server ─────
const HOST = '192.168.0.157';
server.listen(Number(PORT), HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
});
