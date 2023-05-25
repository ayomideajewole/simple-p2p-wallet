import mongoose from "mongoose";

module.exports = function () {
  const database = process.env.DB;
  if (database) {
    mongoose.set("strictQuery", false);
    mongoose
      .connect(database, {
        autoIndex: false, // Don't build indexes
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        family: 4, // Use IPv4, skip trying IPv6
      })
      .then(() => console.log(`Connected to database...`));
  }
};
