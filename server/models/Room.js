const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  roomName: { type: String, required: true },
  admin: { type: String, required: true },
  visibility: { type: String, enum: ['public', 'private'], default: 'public' },
  password: { type: String, select: false },
  participants: [
    {
      username: String,
      socketId: String,
      isAdmin: Boolean,
      joinedAt: { type: Date, default: Date.now }
    }
  ],
  code: { type: String, default: "" },         // ✅ Add this
  language: { type: String, default: "javascript" }, // ✅ And this
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Room', RoomSchema);
