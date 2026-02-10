import express from 'express';
import accountRouter from './routes/accountRouter';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// mount the router on /users
app.use('/accounts', accountRouter);

app.get('/health', (_req, res) => {
  res.sendStatus(200);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
