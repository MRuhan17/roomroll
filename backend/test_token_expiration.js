const { io } = require("socket.io-client");
const jwt = require("jsonwebtoken");

const jwtSecret = 'test_secret';

// create a token that expires in 5 seconds
const payload = {
    id: 999,
    email: 'test@example.com',
    role: 'authenticated',
    sub: '999'
};

const token = jwt.sign(payload, jwtSecret, { expiresIn: '5s' });

console.log('Created token, connecting to socket...');

const socket = io('http://localhost:5000', {
    auth: {
        token
    }
});

socket.on('connect', () => {
    console.log('Connected to socket with short-lived token! ID:', socket.id);
});

socket.on('disconnect', (reason) => {
    console.log('Socket disconnected! Reason:', reason);
    process.exit(0);
});

socket.on('connect_error', (err) => {
    console.log('Connection Error:', err.message);
    process.exit(1);
});

socket.on('ERROR', (data) => {
    console.log('Received ERROR event:', data.message);
});
