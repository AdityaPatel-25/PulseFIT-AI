const http = require('http');

function testLogin(label, username, password) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ username, password });
    const req = http.request({
      hostname: 'localhost',
      port: 8080,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`[${label}] Status: ${res.statusCode}`);
        try {
          const json = JSON.parse(body);
          if (json.token) {
            console.log(`  -> SUCCESS! User: ${json.username}, Role: ${json.role}, Email: ${json.email}, Token: ${json.token.substring(0, 20)}...`);
          } else {
            console.log(`  -> FAILED: ${json.message || body}`);
          }
        } catch (e) {
          console.log(`  -> Raw Response: ${body}`);
        }
        resolve();
      });
    });
    req.on('error', (err) => {
      console.log(`[${label}] Network Error:`, err.message);
      resolve();
    });
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('=== TESTING LOGINS VIA API GATEWAY (:8080) ===\n');
  await testLogin('ADMIN (admin123)', 'admin', 'admin123');
  await testLogin('STAFF with staff_john@pulsefit.com / staff123', 'staff_john@pulsefit.com', 'staff123');
  await testLogin('STAFF with staff@pulsefit.com / staff123', 'staff@pulsefit.com', 'staff123');
  await testLogin('STAFF with staff_john / staff123', 'staff_john', 'staff123');
  await testLogin('MEMBER with alex@pulsefit.com / alex123', 'alex@pulsefit.com', 'alex123');
  await testLogin('MEMBER with member_alex / alex123', 'member_alex', 'alex123');
  await testLogin('MEMBER with member_alex / member123', 'member_alex', 'member123');
  await testLogin('MEMBER with member_alex@pulsefit.com / member123', 'member_alex@pulsefit.com', 'member123');
  console.log('\n=== DONE ===');
}

run();
