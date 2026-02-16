const express = require('express');
const ytdl = require('@distube/ytdl-core'); // Updated stable module
const cors = require('cors');
const app = express();

app.use(cors());

// Frontend Interface
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PowerDownloader - YT Video Downloader</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
            body { font-family: 'Inter', sans-serif; background: #0f172a; color: white; }
        </style>
    </head>
    <body class="flex flex-col items-center justify-center min-h-screen p-4">
        <div class="max-w-2xl w-full bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700">
            <h1 class="text-3xl font-bold text-center mb-6 text-blue-400">YouTube Video Downloader</h1>
            
            <div class="flex flex-col gap-4">
                <input type="text" id="url" placeholder="Paste YouTube Link Here..." 
                    class="w-full p-4 rounded-lg bg-slate-900 border border-slate-600 focus:outline-none focus:border-blue-500 transition text-white">
                
                <button onclick="downloadVideo()" id="btn"
                    class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg transition transform active:scale-95">
                    Download Video (MP4)
                </button>
            </div>

            <div id="status" class="mt-6 text-center hidden">
                <div class="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-2"></div>
                <p id="status-text">Connecting to server...</p>
            </div>
        </div>

        <script>
            function downloadVideo() {
                const url = document.getElementById('url').value;
                const btn = document.getElementById('btn');
                const status = document.getElementById('status');

                if(!url || !url.includes('youtube.com') && !url.includes('youtu.be')) {
                    return alert('Please paste a valid YouTube URL');
                }

                status.classList.remove('hidden');
                btn.disabled = true;
                btn.classList.add('opacity-50');

                // Redirecting to the backend download route
                window.location.href = \`/download?url=\${encodeURIComponent(url)}\`;

                // Reset button after 10 seconds (enough time for download to start)
                setTimeout(() => {
                    status.classList.add('hidden');
                    btn.disabled = false;
                    btn.classList.remove('opacity-50');
                }, 10000);
            }
        </script>
    </body>
    </html>
    `);
});

// Download Logic
app.get('/download', async (req, res) => {
    try {
        const videoURL = req.query.url;

        if (!ytdl.validateURL(videoURL)) {
            return res.status(400).send('Invalid YouTube URL');
        }

        // Fetch video info
        const info = await ytdl.getInfo(videoURL);
        
        // Clean title for filename (remove special characters)
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, '') || 'video';

        // Set headers for file download
        res.header('Content-Disposition', `attachment; filename="${title}.mp4"`);
        res.header('Content-Type', 'video/mp4');

        // Stream the video
        // Note: 'highest' handles both audio and video for 720p and below
        ytdl(videoURL, {
            quality: 'highest',
            filter: 'audioandvideo'
        })
        .on('error', (err) => {
            console.error('Stream Error:', err);
            if (!res.headersSent) {
                res.status(500).send('Error during streaming');
            }
        })
        .pipe(res);

    } catch (err) {
        console.error('Server Error:', err);
        res.status(500).send('Server Error: ' + err.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 Server is flying at http://localhost:${PORT}`);
    console.log(`Press Ctrl+C to stop\n`);
});

