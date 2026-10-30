#!/usr/bin/env python3
"""Extract one requested YouTube track and validate the resulting MP3."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
from urllib.parse import urlparse


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('url')
    parser.add_argument('output', type=Path, help='Destination .mp3 file')
    args = parser.parse_args()
    parsed = urlparse(args.url)
    if parsed.scheme != 'https' or parsed.hostname not in {'youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com'}:
        parser.error('Provide an HTTPS YouTube URL.')
    if args.output.suffix.lower() != '.mp3':
        parser.error('The output path must end in .mp3.')
    missing = [tool for tool in ('yt-dlp', 'ffmpeg', 'ffprobe', 'deno') if not shutil.which(tool)]
    if missing:
        parser.exit(1, 'Missing: ' + ', '.join(missing) + '\nInstall with: brew install yt-dlp ffmpeg deno\n')
    output = args.output.resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    if not output.exists():
        subprocess.run(['yt-dlp', '--no-playlist', '--no-overwrites', '--socket-timeout', '15',
                        '--retries', '1', '--extractor-retries', '1', '-x', '--audio-format', 'mp3',
                        '--audio-quality', '0', '-o', str(output.with_suffix('.%(ext)s')), args.url],
                       check=True, stdout=sys.stderr)
    probe = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries',
                        'format=duration:stream=codec_name,sample_rate,channels', '-of', 'json', str(output)], text=True))
    if not any(stream.get('codec_name') == 'mp3' for stream in probe.get('streams', [])) or float(probe['format']['duration']) <= 0:
        raise ValueError('The output is not a valid, non-empty MP3.')
    subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-xerror', '-i', str(output), '-f', 'null', '-'], check=True)
    print(json.dumps({'source_url': args.url, 'path': str(output), 'bytes': output.stat().st_size,
                      'sha256': hashlib.sha256(output.read_bytes()).hexdigest(), **probe}, indent=2))


if __name__ == '__main__':
    try:
        main()
    except (subprocess.CalledProcessError, OSError, ValueError, KeyError) as error:
        sys.exit(f'Import failed: {error}')
