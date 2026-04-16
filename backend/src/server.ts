import app from "./app";

const PORT = 5000;
const HOST = '0.0.0.0'; // Listen on all network interfaces

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`Accessible at: http://192.168.1.15:${PORT}`);
});