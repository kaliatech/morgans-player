let AWS = require('aws-sdk');
AWS.config.update({ region: 'US-WEST-1' });

const listS3Objs = async(s3, params, out = []) => new Promise((resolve, reject) => {
  s3.listObjectsV2(params).promise()
    .then(({ Contents, IsTruncated, NextContinuationToken }) => {
      out.push(...Contents);

      //TODO: Test that continuation is working

      if (!IsTruncated) {
        let outFiltered = out.filter(a => !a.Key.endsWith('/'));
        resolve(outFiltered);
      }
      else {
        resolve(listS3Objs(s3, Object.assign(params, { ContinuationToken: NextContinuationToken }), out));
      }
    })
    .catch(reject);
});

function signUrl(s3Key) {

  const cfKeyPairId = process.env.CF_KEYPAIR_ID;
  const cfPrivateKey = process.env.CF_KEYPAIR_KEY.replace(/\\n/g, '\n');

  const cfSigner = new AWS.CloudFront.Signer(cfKeyPairId, cfPrivateKey);
  var options = {
    url: 'https://' + process.env.CF_DOMAIN + '/' + s3Key,
    expires: new Date().getTime() + 300000
  };
  return cfSigner.getSignedUrl(options);
}

exports.handler = async(event) => {
  const path = event.pathParameters.proxy
  const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

  let s3Objs = []
  let playlistJsonResp = ''
  try {

    s3Objs = await listS3Objs(s3, {
      Bucket: process.env.PLAYLIST_S3_BUCKET,
      Delimiter: "/",
      Prefix: path + "/"
    })

    playlistJsonResp = await s3.getObject({
      Bucket: process.env.PLAYLIST_S3_BUCKET,
      Key: path + '/playlist.json'
    }).promise();


  }
  catch (e) {
    throw new Error(`Could not retrieve playlist data from S3: ${e.message}`)
  }

  let playlist = JSON.parse(playlistJsonResp.Body.toString('utf-8'))
  //let playlistJson = event

  let body = {
    path: path,
    playlist: playlist,
    s3Objs: s3Objs.map(it => ({ key: it.Key, size: it.Size, signedUrl: signUrl(it.Key) }))
  }

  const response = {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "*"
    },
    body: JSON.stringify(body)
  };

  return response;
};
