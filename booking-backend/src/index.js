require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());

// routes
const bookingsRouter = require('./routes/bookings');
const resourcesRouter = require('./routes/resources');
const adminRouter = require('./routes/admin');
const authRouter = require('./routes/auth');

app.use('/api/auth', authRouter);
app.use('/api/resources', resourcesRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/admin', adminRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server listening on ${port}`));
