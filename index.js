const express = require('express');
const ytdl = require('@distube/ytdl-core');
const app = express();
const PORT = 3000;

app.use(express.json());

// --- Frontend HTML & Logic ---
const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Protube Downloader</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; background: #f4f4f9; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .container { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); width: 100%; max-width: 500px; text-align: center; }
        h1 { color: #ff0000; margin-bottom: 1.5rem; }
        input { width: 100%; padding: 12px; margin-bottom: 1rem; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; }
        button { background: #ff0000; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: bold; width: 100%; }
        button:hover { background: #cc0000; }
        #result { margin-top: 1.5rem; text-align: left; display: none; }
        .video-card { border: 1px solid #eee; padding: 10px; border-radius: 8px; }
        img { width: 100%; border-radius: 6px; }
        .download-btn { display: block; background: #28a745; color: white; text-align: center; text-decoration: none; padding: 10px; margin-top: 10px; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Protube Downloader</h1>
        <input type="text" id="videoUrl" placeholder="Paste YouTube URL here...">
        <button onclick="fetchVideo()">Get Download Link</button>
        
        <div id="result">
            <div class="video-card" id="videoDetails">
                </div>
        </div>
    </div>

    <script>
        async function fetchVideo() {
            const url = document.getElementById('videoUrl').value;
            const resultDiv = document.getElementById('result');
            const detailsDiv = document.getElementById('videoDetails');
            
            if(!url) return alert('Bhai, URL toh daalo!');
            
            detailsDiv.innerHTML = 'Fetching details...';
            resultDiv.style.display = 'block';

            try {
                const response = await fetch(\`/download?url=\${encodeURIComponent(url)}\`);
                const data = await response.json();

                if(data.success) {
                    detailsDiv.innerHTML = \`
                        <img src="\${data.thumbnail}" alt="thumbnail">
                        <h3>\${data.title}</h3>
                        <p>Duration: \${data.duration}s</p>
                        <a href="\${data.downloadUrl}" class="download-btn" target="_blank">Download Video (High Quality)</a>
                    \`;
                } else {
                    detailsDiv.innerHTML = '<p style="color:red">Error: ' + data.error + '</p>';
                }
            } catch (err) {
                detailsDiv.innerHTML = '<p style="color:red">Server error. Try again.</p>';
            }
        }
    </script>
</body>
</html>
`;

// --- API Implementation ---

// Serve the Frontend
app.get('/', (req, res) => {
    res.send(htmlContent);
});

// API Endpoint to fetch video link
app.get('/download', async (req, res) => {
    const videoURL = req.query.url;

    if (!videoURL || !ytdl.validateURL(videoURL)) {
        return res.status(400).json({ success: false, error: 'Invalid YouTube URL' });
    }

    try {
        const info = await ytdl.getInfo(videoURL);
        
        // Filter for formats that have both video and audio
        const format = ytdl.chooseFormat(info.formats, { quality: 'highestvideo', filter: 'audioandvideo' });

        res.json({
            success: true,
            title: info.videoDetails.title,
            thumbnail: info.videoDetails.thumbnails[0].url,
            duration: info.videoDetails.lengthSeconds,
            downloadUrl: format.url // This is the direct link to the video file
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Failed to fetch video. YouTube might be blocking the request.' });
    }
});

app.listen(PORT, () => {
    console.log(`Protube Downloader running at http://localhost:${PORT}`);
});
