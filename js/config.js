const host = window.location.hostname;

const BACKEND_URL = (host === 'localhost' || host === '127.0.0.1' || host === '172.20.10.4')
    ? `http://${host}:8080`
    : 'https://adrianocoffee-production.up.railway.app';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51TMnEoFwfJMaHGV5u1A2isJeUmy1i1gJkMSyY9swfOTSXGkaOqsqjqIAnWcRz0WaQbnsmtTT6reAkifiRfUz8Mph00j8dgQKd9'; 