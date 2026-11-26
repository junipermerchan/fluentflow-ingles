"""
FluentFlow Local Server + Native Neural TTS (Edge Neural Voices)
Serves static files and provides /api/tts with automatic local MP3 caching.
"""

import asyncio
import hashlib
import os
import urllib.parse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import edge_tts

APP_DIR = Path(__file__).resolve().parent
CACHE_DIR = APP_DIR / ".tts_cache"
CACHE_DIR.mkdir(exist_ok=True)

ALLOWED_VOICES = {
    "en-US-AvaNeural",
    "en-US-AndrewNeural",
    "en-GB-SoniaNeural",
    "en-GB-RyanNeural",
    "en-AU-NatashaNeural",
}
DEFAULT_VOICE = "en-US-AvaNeural"


async def synthesize_to_file(text: str, voice: str, rate_str: str, out_path: Path) -> None:
    communicate = edge_tts.Communicate(text=text, voice=voice, rate=rate_str)
    tmp_path = out_path.with_suffix(".tmp.mp3")
    await communicate.save(str(tmp_path))
    tmp_path.replace(out_path)


def format_rate(rate_float: float) -> str:
    # Convert 0.75 -> "-25%", 1.0 -> "+0%", 1.15 -> "+15%"
    clamped = max(0.5, min(1.5, rate_float))
    pct = int(round((clamped - 1.0) * 100))
    return f"+{pct}%" if pct >= 0 else f"{pct}%"


class FluentFlowHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(APP_DIR), **kwargs)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/tts":
            self.handle_tts(parsed.query)
            return
        if parsed.path == "/api/tts/status":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"neural": true}')
            return
        super().do_GET()

    def handle_tts(self, query_str: str):
        params = urllib.parse.parse_qs(query_str)
        text = (params.get("text", [""])[0]).strip()
        voice = params.get("voice", [DEFAULT_VOICE])[0]
        if voice not in ALLOWED_VOICES:
            voice = DEFAULT_VOICE

        try:
            rate_val = float(params.get("rate", ["1.0"])[0])
        except ValueError:
            rate_val = 1.0
        rate_str = format_rate(rate_val)

        if not text or len(text) > 1800:
            self.send_error(400, "Invalid text length")
            return

        cache_key = hashlib.sha256(f"{voice}|{rate_str}|{text}".encode("utf-8")).hexdigest()[:24]
        mp3_path = CACHE_DIR / f"{cache_key}.mp3"

        if not mp3_path.exists():
            try:
                asyncio.run(synthesize_to_file(text, voice, rate_str, mp3_path))
            except Exception as exc:
                self.send_response(502)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                msg = f'{{"error": "{str(exc).replace(chr(34), "")}"}}'.encode("utf-8")
                self.wfile.write(msg)
                return

        data = mp3_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", "audio/mpeg")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "public, max-age=86400")
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, format, *args):
        # Keep console clean
        pass


def main():
    port = int(os.environ.get("PORT", "8766"))
    server = ThreadingHTTPServer(("127.0.0.1", port), FluentFlowHandler)
    print(f"FluentFlow Neural Server running at http://localhost:{port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
