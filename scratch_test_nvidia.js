const https = require('https');

const apiKey = "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";

function test(width, height) {
  const prompt = "LinkedIn banner style, professional business design, minimalist layout, modern gradients, no text on the image, high quality. Subject: A professional illustration for a LinkedIn post";
  
  const postData = JSON.stringify({
    prompt: prompt,
    width: width,
    height: height
  });

  const options = {
    hostname: 'ai.api.nvidia.com',
    path: '/v1/genai/black-forest-labs/flux.1-schnell',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log(`Sending request with ${width}x${height} to NVIDIA API...`);
  const req = https.request(options, (res) => {
    console.log("Response status:", res.statusCode);
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (res.statusCode === 200) {
          console.log("Success!");
        } else {
          console.log("Error JSON:", JSON.stringify(json, null, 2));
        }
      } catch (e) {
        console.log("Raw response:", data);
      }
    });
  });

  req.on('error', (e) => {
    console.error("Request error:", e);
  });

  req.write(postData);
  req.end();
}

test(1344, 768);
