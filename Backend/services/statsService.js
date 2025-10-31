// services/statsService.js
const fs = require('fs');
const path = require('path');

const getStatsData = () => {
  return new Promise((resolve, reject) => {
    const filePath = path.join(process.cwd(), 'trending_stats.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading file:', err);
        return reject(new Error('Could not read stats file'));
      }

      try {
        const jsonData = JSON.parse(data);
        resolve(jsonData);
      } catch (parseError) {
        reject(new Error('Invalid JSON format in stats file'));
      }
    });
  });
};

module.exports = { getStatsData };
