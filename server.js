const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const path = require('path');
const winston = require('winston');

const app = express();
const port = process.env.PORT || 3000;

// 로거 설정
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB 연결 설정
const url = process.env.MONGO_URL || 'mongodb+srv://supernewto:chltjddnr1@bull.te7td.mongodb.net/?retryWrites=true&w=majority&appName=BULL';
const dbName = 'bulletinboard';
let db;

async function connectToDatabase() {
  try {
    const client = await MongoClient.connect(url, { useUnifiedTopology: true });
    logger.info('Connected to MongoDB');
    db = client.db(dbName);
  } catch (err) {
    logger.error('Error connecting to MongoDB:', err);
    process.exit(1);
  }
}

// 데이터베이스 연결 확인 미들웨어
app.use((req, res, next) => {
  if (!db) {
    return res.status(500).json({ error: 'Database connection not established' });
  }
  next();
});

// 게시물 작성
app.post('/posts', async (req, res) => {
  try {
    const { author, password, content, timestamp, deleteTime, boardId } = req.body;
    if (!author || !content || !boardId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const post = { author, password, content, timestamp, deleteTime, boardId };
    const result = await db.collection('posts').insertOne(post);
    logger.info(`New post created with ID: ${result.insertedId}`);
    res.status(201).json({ id: result.insertedId, ...post });
  } catch (err) {
    logger.error('Error inserting post:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 게시물 조회
app.get('/posts', async (req, res) => {
  try {
    const results = await db.collection('posts').find().toArray();
    res.json(results);
  } catch (err) {
    logger.error('Error fetching posts:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 게시물 삭제
app.delete('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.collection('posts').deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    logger.info(`Post deleted with ID: ${id}`);
    res.json({ id });
  } catch (err) {
    logger.error('Error deleting post:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// SPA를 위한 라우팅
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 오류 처리 미들웨어
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 서버 시작
async function startServer() {
  await connectToDatabase();
  app.listen(port, '0.0.0.0', () => {
    logger.info(`Server running at http://0.0.0.0:${port}`);
    logger.info(`Public IP: 3.34.95.101`);
    logger.info(`Public DNS: ec2-3-34-95-101.ap-northeast-2.compute.amazonaws.com`);
  });
}

startServer().catch(err => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});