import app from './server';

const port = process.env.CONTAINER_PORT || 8080;

app.listen(port, () => console.log(`service started on port ${port}`));
