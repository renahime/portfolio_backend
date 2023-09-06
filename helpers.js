const fetch = require('node-fetch');

async function getGithubInfo(username, token) {
  // Set up headers with optional authentication token
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  try {
    // Fetch user information
    const userResponse = await fetch(`https://api.github.com/users/${username}`, { headers });
    const userData = await userResponse.json();

    // Fetch user's repositories
    const reposResponse = await fetch(`https://api.github.com/users/${username}/repos`, { headers });
    const reposData = await reposResponse.json();

    // Calculate the date one month ago
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Calculate the date one week ago
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    let latestCommitTimestamp = 0;
    let latestRepoName = null;
    let lastCommit = {};

    for (const repo of reposData) {
      const encodedUsername = encodeURIComponent(username);
      const encodedRepoName = encodeURIComponent(repo.name);

      const commitsResponse = await fetch(`https://api.github.com/repos/${encodedUsername}/${encodedRepoName}/commits`, {
        headers,
      });

      if (commitsResponse.status !== 200) {
        const errorMessage = `GitHub API returned an error (${commitsResponse.status}): ${await commitsResponse.text()}`;
        console.error(errorMessage);
        continue; // Skip this repository and move to the next one
      }

      const commitsData = await commitsResponse.json();

      if (commitsData.length > 0) {
        // Compare commit timestamps to find the latest one
        const commitTimestamp = new Date(commitsData[0].commit.author.date).getTime();

        if (commitTimestamp > latestCommitTimestamp) {
          latestCommitTimestamp = commitTimestamp;
          latestCommitMessage = commitsData[0].commit.message;
          latestRepoName = repo.name;
          lastCommit = {
            repoName: repo.name,
            commitMessage: commitsData[0].commit.message,
            repoUrl: repo.html_url,
            commitUrl: commitsData[0].html_url,
          };
        }
      }
    }

    // Calculate the number of commits in the last month and week
    let commitsInMonth = 0;
    let commitsInWeek = 0;

    for (const repo of reposData) {
      const encodedUsername = encodeURIComponent(username);
      const encodedRepoName = encodeURIComponent(repo.name);
      const encodedSince = encodeURIComponent(oneMonthAgo);
      const encodedUntil = encodeURIComponent(new Date().toISOString());

      const commitsResponse = await fetch(`https://api.github.com/repos/${encodedUsername}/${encodedRepoName}/commits?since=${encodedSince}&until=${encodedUntil}`, {
        headers,
      });


      const responseCode = commitsResponse.status;
      if (responseCode === 200) {
        const commitsData = await commitsResponse.json();

        // Check if there are commits within the specified timeframe
        if (commitsData.length > 0) {
          commitsInMonth += commitsData.length;
        }
      } else if (responseCode === 404) {
        console.error(`No commits found in the specified date range for repository: ${repo.name}`);
      } else {
        // Handle other HTTP response codes (e.g., 500 for internal server error) if needed
        const errorMessage = `GitHub API returned an error (${responseCode}): ${await commitsResponse.text()}`;
        return { error: errorMessage };
      }

      const encodedSinceWeek = encodeURIComponent(oneMonthAgo);
      const encodedUntilWeek = encodeURIComponent(new Date().toISOString());

      const commitsResponseWeek = await fetch(`https://api.github.com/repos/${encodedUsername}/${encodedRepoName}/commits?since=${encodedSinceWeek}&until=${encodedUntilWeek}`, {
        headers,
      });

      const responseCodeWeek = commitsResponseWeek.status;

      if (responseCodeWeek === 200) {
        // Parse the JSON response for commits by week
        const commitsDataWeek = await commitsResponseWeek.json();

        // Check if there are commits within the specified timeframe
        if (commitsDataWeek.length > 0) {
          commitsInWeek += commitsDataWeek.length;
        }
      } else if (responseCodeWeek === 404) {
        console.error(`No commits found in the specified date range for repository: ${repo.name}`);
      } else {
        // Handle other HTTP response codes (e.g., 500 for internal server error) if needed
        const errorMessage = `GitHub API returned an error (${responseCodeWeek}): ${await commitsResponseWeek.text()}`;
        return { error: errorMessage };
      }
    }

    const githubInfo = {
      username: username,
      lastRepo: latestRepoName,
      lastCommit: lastCommit,
      commitsInMonth: commitsInMonth,
      commitsInWeek: commitsInWeek,
    };

    return githubInfo;
  } catch (error) {
    return { error: error.message };
  }
}

const getOverwatchInfo = async () => {
  const overwatchApiUrl = `https://overfast-api.tekrop.fr/players/princess-14948`; // Replace 'your-battle-tag' with your actual BattleTag

  try {
    const response = await fetch(overwatchApiUrl);

    if (!response.ok) {
      throw new Error('Failed to fetch Overwatch stats');
    }

    let heroes = ['lifeweaver', 'zenyatta', 'moira', 'mercy', 'baptist', 'ana', 'illari', 'brigitte']

    const data = await response.json();

    const rank = data.summary.competitive.pc.support;
    const mostPlayedArr = data.stats.pc.competitive.heroes_comparisons.time_played.values;
    const winRate = data.stats.pc.competitive.heroes_comparisons.win_percentage.values;

    let mostPlayed = '';
    let highestPlayed = -1;

    for (const hero of mostPlayedArr) {
      if (hero.value > highestPlayed && heroes.includes(hero.hero)) {
        mostPlayed = hero.hero;
        highestPlayed = hero.value;
      }
    }
    let filteredWinRate = winRate.filter(heroData => heroes.includes(heroData.hero));

    // Step 2: Calculate the sum of the values for those heroes
    let sumOfValues = filteredWinRate.reduce((sum, heroData) => sum + heroData.value, 0);

    // Step 3: Calculate the average
    let averageValue = sumOfValues / filteredWinRate.length;

    mostPlayed = mostPlayed.charAt(0).toUpperCase() + mostPlayed.slice(1);


    return {
      rank: rank,
      mostPlayed: mostPlayed,
      winRate: averageValue,
    }; // Return the parsed JSON data, not the response object
  } catch (error) {
    console.error('Error fetching Overwatch stats:', error);
    throw error;
  }
};



module.exports = {
  getGithubInfo,
  getOverwatchInfo
};
