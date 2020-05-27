import express from 'express';
import { MongoClient } from 'mongodb';
import path from 'path';

const app = express();
const PORT = 8000;

app.use(express.static(path.join(__dirname, '/build')));
app.use(express.json());

const withDB = async (operations, res) => {
  try {
    const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true, useUnifiedTopology: true });
    const db = client.db('my-blog');

    await operations(db);

    client.close();
  } catch (err) {
    res.status(500).json({ message: 'Error connecting to db', err });
  }
}

app.get('/api/articles/:name', async (req, res) => {
  const articleName = req.params.name;

  withDB(async (db) => {
    const articleInfo = await db.collection('articles').findOne({ name: articleName });
    res.status(200).json(articleInfo);
  }, res)

});

app.post('/api/articles/:name/upvotes', async (req, res) => {
  const articleName = req.params.name;

  withDB(async (db) => {
    const articleInfo = await db.collection('articles').findOne({ name: articleName });
    await db.collection('articles').updateOne(
      { name: articleName }, {
      '$set': {
        upvotes: articleInfo.upvotes + 1,
      }
    });

    const updateArticleInfo = await db.collection('articles').findOne({ name: articleName });

    res.status(200).json(updateArticleInfo);
  }, res)
});

app.post('/api/articles/:name/add-comment', async (req, res) => {
  const { username, text } = req.body;
  const articleName = req.params.name;

  withDB(async (db) => {
    const articleInfo = await db.collection('articles').findOne({ name: articleName });

    await db.collection('articles').updateOne(
      { name: articleName }, {
      '$set': {
        comments: articleInfo.comments.concat({username, text}),
      }
    });

    const updatedArticleInfo = await db.collection('articles').findOne({name: articleName});

    res.status(200).json(updatedArticleInfo);
  });
});

app.get('*', (req, res) => {
  res.sendfile(path.join(__dirname + 'build/index.html'));
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}!`));