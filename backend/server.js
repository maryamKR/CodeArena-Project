const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");


const startServer = async () => {
  try {
    await connectDB();

    //Create HTTP Server
    const server = http.createServer(app);

    // Start listening
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
