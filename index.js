const { getGithubInfo, getOverwatchInfo } = require('./helpers.js');
const express = require('express');
const cors = require('cors');
require('dotenv').config();


const token = process.env.TOKEN;
const username = process.env.USERNAME;
const app = express();
const port = process.env.PORT || 3000;
app.use(cors());


app.get('/api/data', (req, res) => {
  // Your API logic here
  res.json({ message: 'Hello from your API!' });
});

app.get('/api/github', async (req, res) => {
  const githubInfo = await getGithubInfo(username, token);
  res.json(githubInfo);
})

app.get('/api/overwatch', async (req, res) => {
  try {
    const overwatchInfo = await getOverwatchInfo();
    res.json(overwatchInfo);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching Overwatch stats' });
  }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
