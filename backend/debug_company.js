const axios = require('axios');

async function test() {
    try {
        // 1. Login
        const loginRes = await axios.post('http://localhost:8080/api/auth/admin/login', {
            email: 'admin12',
            password: '1212'
            // Wait, I saw "Admin Credentials Synced: admin12 / 1212" in logs earlier.
        });

        // I will assume password is '1212' based on previous log output "Admin Credentials Synced: admin12 / 1212"
        const token = loginRes.data.accessToken;
        console.log("Got Token:", token ? "YES" : "NO");

        // 2. Add a Company directly (Mocking Diamond Create side-effect or direct Company create)
        // Let's try direct create first if route exists
        try {
            await axios.post('http://localhost:8080/api/companies', { name: "DebugCorp" }, {
                headers: { 'x-access-token': token }
            });
            console.log("Created DebugCorp");
        } catch (e) { console.log("Create Error or already exists:", e.message); }

        // 3. Fetch Companies
        const listRes = await axios.get('http://localhost:8080/api/companies', {
            headers: { 'x-access-token': token }
        });
        console.log("Companies List:", listRes.data);

    } catch (err) {
        console.error("Test Failed:", err.response ? err.response.data : err.message);

        // Retry login with just '1212' if needed, code said: 
        // "Admin Credentials Synced: admin12 / 1212"
    }
}

test();
