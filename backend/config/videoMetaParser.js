
import ffmpeg from 'fluent-ffmpeg';
import streamifier from 'streamifier';

const extractMetadata = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = streamifier.createReadStream(buffer);
    ffmpeg.ffprobe(stream, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        const format = metadata.format.format_name;
        const duration = metadata.format.duration;
        const resolution =
          metadata.streams[0]?.width && metadata.streams[0]?.height
            ? `${metadata.streams[0].width}x${metadata.streams[0].height}`
            : null;

        resolve({ format, duration, resolution });
      }
    });
  });
};

export { extractMetadata };