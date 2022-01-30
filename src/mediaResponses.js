const fs = require('fs');
const path = require('path');

const connectStream = (stream, response) => {
  // on open, connect stream to response
  stream.on('open', () => {
    stream.pipe(response);
  });

  // on error, end response and return error
  stream.on('error', (streamErr) => {
    response.end(streamErr);
  });

  return stream;
};

const getFile = (request, response, file, fileType) => {
  fs.stat(file, (err, stats) => {
    // check for error
    if (err) {
      if (err.code === 'ENOENT') {
        response.writeHead(404);
      }
      return response.end(err);
    }

    // if client hasn't sent range header, start at beginning of file
    let { range } = request.headers;
    if (!range) {
      range = 'bytes=0-';
    }

    // extract byte range
    const positions = range.replace(/bytes=/, '').split('-');

    let start = parseInt(positions[0], 10);

    const total = stats.size;
    const end = positions[1] ? parseInt(positions[1], 10) : total - 1;

    if (start > end) {
      start = end - 1;
    }

    // determine chunk size
    const chunksize = (end - start) + 1;
    response.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${total}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': fileType,
    });

    // create and return file stream
    const stream = fs.createReadStream(file, { start, end });
    return connectStream(stream, response);
  });
};

// separated for readability
const party = path.resolve(__dirname, '../client/party.mp4');
const bird = path.resolve(__dirname, '../client/bird.mp4');
const bling = path.resolve(__dirname, '../client/bling.mp3');

const getParty = (request, response) => getFile(request, response, party, 'video/mp4');
const getBird = (request, response) => getFile(request, response, bird, 'video/mp4');
const getBling = (request, response) => getFile(request, response, bling, 'audio/mpeg');

module.exports = {
  getParty,
  getBird,
  getBling,
};
